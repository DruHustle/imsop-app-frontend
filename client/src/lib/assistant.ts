import { Source } from "@/contexts/DataContext";
import {
  Shipment,
  OperationalOrder,
  Mode,
  formatTime,
  DEMO_AS_OF,
  isException,
} from "./workspace";
export interface Answer {
  text: string;
  links: { label: string; href: string }[];
  source: string;
}
export function answerQuestion(
  question: string,
  shipments: Source<Shipment>,
  orders: Source<OperationalOrder>,
  mode: Mode
): Answer {
  const prefix = mode === "demo" ? "Demonstration response. " : "";
  const source =
    mode === "demo"
      ? `Deterministic demo dataset · As of ${DEMO_AS_OF}`
      : "Authorized Node operational database snapshot · Scope: newest 500 records";
  const result = (text: string, links: Answer["links"] = []): Answer => ({
    text: prefix + text,
    links,
    source,
  });
  const tokens = question.match(/\b(?:SHP-[\w-]+|ORD-[\w-]+)\b/gi) ?? [];
  const s = shipments.items.find(s =>
    question.toLowerCase().includes(s.trackingNumber.toLowerCase())
  );
  const o =
    orders.status === "ready"
      ? orders.items.find(o =>
          question.toLowerCase().includes(o.orderNumber.toLowerCase())
        )
      : undefined;
  if (s)
    return result(
      `${s.trackingNumber}: ${s.status}. ${s.origin} → ${s.destination}. Carrier: ${s.carrier}; mode: ${s.transportMode}. ETA: ${formatTime(s.estimatedArrival)}. Latest event observation: ${formatTime(s.observedAt)}. Provider: ${s.provider ?? "not supplied"}. Received: ${formatTime(s.receivedAt)}. The source does not establish the cause of delays or current provider connectivity.`,
      [
        {
          label: `Open ${s.trackingNumber}`,
          href: `/supply-chain/shipments/${s.id}`,
        },
      ]
    );
  if (o)
    return result(
      `${o.orderNumber}: ${o.status}. Node operational order ID ${o.id}. Customer ID: ${o.customerId ?? "not supplied"}. Amount: ${o.totalAmount ?? "not supplied"}; currency not supplied. Created: ${formatTime(o.createdAt)}. Line items, supplier and shipment associations are unavailable.`,
      [{ label: `Open ${o.orderNumber}`, href: `/supply-chain/orders/${o.id}` }]
    );
  if (/order|\bORD-/i.test(question) && orders.status !== "ready")
    return result(
      orders.status === "forbidden"
        ? "Orders are unavailable for your role."
        : "The order source is unavailable. Retry the source read before asking about orders."
    );
  if (shipments.status !== "ready")
    return result(
      shipments.status === "forbidden"
        ? "Shipment access is forbidden for this session."
        : shipments.status === "loading"
          ? "The shipment source is still loading. Try again when the read completes."
          : "The shipment source is unavailable. Retry the source read; no demo data has been substituted."
    );
  if (tokens.length)
    return result(
      `${tokens.join(", ")} was not found in the selected authorized record scope. I cannot infer its status or location.`,
      [{ label: "Search shipments", href: "/supply-chain/shipments" }]
    );
  if (/delayed|exception|attention/i.test(question)) {
    const affected = shipments.items.filter(isException);
    return result(
      `${affected.length} of ${shipments.items.length} shipments have a recorded delayed or exception status. No cause, financial impact or live weather evidence is available.`,
      affected.slice(0, 5).map(s => ({
        label: `${s.trackingNumber} · ${s.status}`,
        href: `/supply-chain/shipments/${s.id}`,
      }))
    );
  }
  if (/summary|how many|shipments|overview/i.test(question))
    return result(
      `${shipments.items.length} shipments in the selected scope: ${shipments.items.filter(s => s.status === "In transit").length} in transit, ${shipments.items.filter(s => s.status === "Delivered").length} delivered, ${shipments.items.filter(isException).length} needing attention. These are database counts, not real-time tracking.`,
      [{ label: "Review shipment list", href: "/supply-chain/shipments" }]
    );
  return result(
    "I can look up a tracking/order number, count shipments, or list delayed and exception records. A model provider is not configured. I cannot predict demand, verify weather, book shipments, change inventory or run infrastructure actions."
  );
}

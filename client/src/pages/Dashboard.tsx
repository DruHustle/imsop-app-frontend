import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import {
  PageHeader,
  Panel,
  Metric,
  SourceNote,
  SourceState,
  StatusBadge,
  EmptyState,
} from "@/components/Workspace";
import { StatusDistribution, EvidenceTimeline } from "@/components/Board";
import { isException } from "@/lib/workspace";
import { extractIdentifiers } from "@/lib/assistant";
export default function Dashboard() {
  const { shipments, orders } = useData();
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const ready = shipments.status === "ready",
    attention = shipments.items.filter(isException),
    active = shipments.items.filter(
      s => !["Delivered", "Cancelled"].includes(s.status)
    );
  const ids = extractIdentifiers(
    query,
    shipments.items.map(s => s.trackingNumber)
  );
  const context =
    ids.length === 1
      ? shipments.items.find(
          s => s.trackingNumber.toLowerCase() === ids[0].toLowerCase()
        )
      : undefined;
  const recent = [
    ...shipments.items
      .filter(s => s.observedAt)
      .map(s => ({
        id: "shipment:" + s.id,
        title: `${s.trackingNumber} · ${s.status}`,
        date: s.observedAt,
        detail: "Recorded shipment observation",
      })),
    ...orders.items
      .filter(o => o.createdAt)
      .map(o => ({
        id: "order:" + o.id,
        title: `Order ${o.orderNumber}`,
        date: o.createdAt,
        detail: "Order created",
      })),
  ]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 4);
  return (
    <>
      <PageHeader
        title="Operational overview"
        description="Your supply chain at a glance"
      />
      <SourceNote
        count={ready ? shipments.items.length : undefined}
        total={shipments.total}
      />
      <div className="metric-grid">
        <Metric
          kind="shipments"
          label="Shipments in scope"
          value={ready ? shipments.items.length : "—"}
          description="Matching workspace shipments"
          href="/supply-chain/shipments"
        />
        <Metric
          kind="active"
          label="Active shipments"
          value={ready ? active.length : "—"}
          description="Excludes delivered and cancelled"
          href="/supply-chain/shipments?status=active"
        />
        <Metric
          kind="attention"
          label="Needs attention"
          value={ready ? attention.length : "—"}
          description="Delayed or exception"
          href="/supply-chain/shipments?status=attention"
        />
        <Metric
          kind="orders"
          label="Pending orders"
          value={
            orders.status === "ready"
              ? orders.items.filter(o => o.status === "Pending").length
              : "—"
          }
          description={
            orders.status === "forbidden"
              ? "Unavailable for your role"
              : "Pending workspace orders"
          }
          href={
            orders.status === "ready"
              ? "/supply-chain/orders?status=Pending"
              : undefined
          }
        />
      </div>
      <div className="overview-layout">
        <div className="board-column">
          <Panel
            title="Needs attention"
            actions={
              <Link
                href="/supply-chain/shipments?status=attention"
                className="record-link text-xs"
              >
                View all
              </Link>
            }
          >
            {!ready || !shipments.items.length ? (
              <SourceState source={shipments} />
            ) : !attention.length ? (
              <EmptyState
                title="No recorded exceptions"
                description="No delayed or exception shipments in this selection."
              />
            ) : (
              <div className="compact-table-wrap">
                <table className="data-table compact-table">
                  <thead>
                    <tr>
                      <th>Shipment</th>
                      <th>Route</th>
                      <th>Status</th>
                      <th>
                        <span className="sr-only">Action</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {attention.slice(0, 4).map(s => (
                      <tr key={s.id}>
                        <td>
                          <Link
                            className="record-link"
                            href={`/supply-chain/shipments/${s.id}`}
                          >
                            {s.trackingNumber}
                          </Link>
                        </td>
                        <td>
                          {s.origin} → {s.destination}
                        </td>
                        <td>
                          <StatusBadge value={s.status} />
                        </td>
                        <td>
                          <Link
                            className="record-link"
                            href={`/supply-chain/shipments/${s.id}`}
                          >
                            Review shipment →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
          {ready && shipments.items.length > 0 && (
            <Panel
              title="Shipment status"
              actions={
                <span className="muted text-xs">
                  {shipments.items.length} shipments
                </span>
              }
            >
              <StatusDistribution items={shipments.items} stacked />
            </Panel>
          )}
        </div>
        <div className="board-column">
          <Panel title="Ask your data">
            <form
              className="query-box"
              onSubmit={e => {
                e.preventDefault();
                if (query.trim())
                  navigate(
                    `/insights/assistant?q=${encodeURIComponent(query)}${context ? "&item=shipment:" + context.id : ""}`
                  );
              }}
            >
              <label className="sr-only" htmlFor="overview-query">
                Ask Assistant
              </label>
              <input
                id="overview-query"
                className="query-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ask about a shipment…"
              />
              <Button
                type="submit"
                aria-label="Open Assistant with query"
                disabled={!query.trim()}
              >
                <ArrowRight size={18} />
              </Button>
            </form>
            <p className="muted text-xs mt-3">
              Review your query before sending.
            </p>
          </Panel>
          <Panel
            title="Recent activity"
            actions={
              <Link
                className="record-link text-xs"
                href="/supply-chain/shipments"
              >
                View all
              </Link>
            }
          >
            {recent.length ? (
              <EvidenceTimeline items={recent} />
            ) : (
              <p className="muted text-sm">
                No timestamped activity is available in this selection.
              </p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

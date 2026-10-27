import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import {
  PageHeader,
  Panel,
  Metric,
  SourceNote,
  SourceState,
  EmptyState,
} from "@/components/Workspace";
import { filterShipments, emptyFilters, performance } from "@/lib/workspace";
import { ExportActions } from "@/components/ExportActions";
export default function AnalyticsPage() {
  const { shipments } = useData();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [carrier, setCarrier] = useState("");
  const items = filterShipments(shipments.items, {
    ...emptyFilters,
    from,
    to,
    carrier,
  });
  const metrics = performance(items);
  const ready = shipments.status === "ready";
  const statuses = Array.from(new Set(items.map(s => s.status)))
    .sort()
    .map(status => ({
      status,
      shipments: items.filter(s => s.status === status).length,
    }));
  const rows = items.map(s => ({
    trackingNumber: s.trackingNumber,
    createdAt: s.createdAt,
    status: s.status,
    carrier: s.carrier,
    estimatedArrival: s.estimatedArrival,
    promisedArrival: s.promisedArrival,
    actualArrival: s.actualArrival,
    observedAt: s.observedAt,
    provider: s.provider,
  }));
  return (
    <>
      <PageHeader
        eyebrow="Insights / descriptive reporting"
        title="Analytics"
        description="Explore recorded shipment performance. Date and carrier filters apply to every metric, chart and exported record."
      />
      <SourceNote
        count={
          shipments.status === "ready" ? shipments.items.length : undefined
        }
        total={shipments.total}
      />
      <Panel>
        <div className="filter-toolbar">
          <label className="field">
            Created from
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={e => setFrom(e.target.value)}
            />
          </label>
          <label className="field">
            Created through
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={e => setTo(e.target.value)}
            />
          </label>
          <label className="field">
            Carrier
            <select value={carrier} onChange={e => setCarrier(e.target.value)}>
              <option value="">All carriers</option>
              {Array.from(new Set(shipments.items.map(s => s.carrier)))
                .sort()
                .map(s => (
                  <option key={s}>{s}</option>
                ))}
            </select>
          </label>
          <button
            className="record-link text-xs self-end p-2"
            onClick={() => {
              setFrom("");
              setTo("");
              setCarrier("");
            }}
          >
            Reset scope
          </button>
        </div>
      </Panel>
      <div className="metric-grid">
        <Metric
          label="Filtered shipments"
          value={ready ? items.length : "—"}
          description="Created within selected dates"
        />
        <Metric
          label="Delivered"
          value={
            ready ? items.filter(s => s.status === "Delivered").length : "—"
          }
          description="Recorded delivered status"
        />
        <Metric
          label="On-time deliveries"
          value={
            ready && metrics.rate !== null
              ? `${metrics.rate.toFixed(1)}%`
              : "Not available"
          }
          description={`${metrics.onTime} / ${metrics.denominator} eligible deliveries`}
        />
        <Metric
          label="Financial performance"
          value="Not available"
          description="No cost, revenue or currency evidence"
        />
      </div>
      {!ready || !shipments.items.length ? (
        <Panel>
          <SourceState source={shipments} />
        </Panel>
      ) : !items.length ? (
        <Panel>
          <EmptyState
            title="No matching shipments"
            description="Change the dates or carrier to explore another scope."
          />
        </Panel>
      ) : (
        <div className="two-column">
          <Panel
            title="Shipment status distribution"
            description={`${items.length} filtered records; counts include every record in scope.`}
          >
            <div
              role="img"
              aria-label={statuses
                .map(s => `${s.status}: ${s.shipments}`)
                .join("; ")}
              className="space-y-4"
            >
              {statuses.map(s => (
                <div key={s.status}>
                  <div className="flex justify-between text-xs mb-2">
                    <span>{s.status}</span>
                    <strong>{s.shipments}</strong>
                  </div>
                  <div className="h-2 rounded bg-muted">
                    <div
                      className="h-2 rounded bg-primary"
                      style={{
                        width: `${(s.shipments / items.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="How on-time performance is calculated">
            <p className="muted text-xs">
              Denominator: delivered shipments with both the original promise and actual
              arrival timestamps. Numerator: eligible shipments whose actual
              arrival is at or before the earliest retained provider estimate. Rate = numerator ÷
              denominator. Missing dates are excluded; percentages are never
              averaged.
            </p>
            <p className="muted text-xs mt-4">
              Filters use shipment creation dates (UTC), not event occurrence
              dates. Current source status is a snapshot; it is not a historical
              status series.
            </p>
          </Panel>
        </div>
      )}
      <div className="actions">
        <ExportActions
          items={ready ? rows : []}
          name="shipment-analytics"
          columns={[
            { key: "trackingNumber", label: "Tracking number" },
            { key: "createdAt", label: "Created at (UTC)" },
            { key: "status", label: "Recorded status" },
            { key: "carrier", label: "Carrier" },
            { key: "estimatedArrival", label: "Current ETA" },
            { key: "promisedArrival", label: "Original promise" },
            { key: "actualArrival", label: "Actual arrival" },
            { key: "observedAt", label: "Observed at" },
            { key: "provider", label: "Observation provider" },
          ]}
          scope={`Filtered records: ${items.length}; created ${from || "any date"} through ${to || "any date"} UTC; carrier ${carrier || "all"}; on-time ${metrics.onTime}/${metrics.denominator}; within ${shipments.items.length} matching shipments`}
        />
      </div>
    </>
  );
}

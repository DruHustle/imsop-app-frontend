import { Link } from "wouter";
import { useData } from "@/contexts/DataContext";
import {
  PageHeader,
  Panel,
  SourceNote,
  SourceState,
  EmptyState,
  StatusBadge,
} from "@/components/Workspace";
import { isException } from "@/lib/workspace";
export default function Intelligence() {
  const { mode, shipments } = useData();
  const examples = shipments.items.filter(isException);
  return (
    <>
      <PageHeader
        eyebrow="Insights / decision support"
        title="Recommendations & forecasts"
        description="Review evidence before making a decision. Predictive models and inventory adjustments are not configured."
      />
      <SourceNote />
      <Panel title="Prediction capability">
        <StatusBadge value="Not configured" />
        <p className="muted text-sm mt-4">
          No configured prediction, weather, demand or risk-model provider
          exists in this application. Model accuracy, savings and live risk
          scores are unavailable. This workspace cannot apply recommendations or
          change inventory.
        </p>
      </Panel>
      {mode === "demo" ? (
        <Panel
          title="Demo review scenarios"
          description="Deterministic examples derived from exception statuses in the demonstration shipment dataset."
        >
          {shipments.status !== "ready" ? (
            <SourceState source={shipments} />
          ) : (
            examples.map(s => (
              <article className="attention-row" key={s.id}>
                <div>
                  <p className="eyebrow">Demonstration · review required</p>
                  <h3>Review {s.trackingNumber}</h3>
                  <p className="muted">
                    Recorded {s.status.toLowerCase()} status. Inspect the latest
                    provider event before contacting your operations team. No
                    cause or impact is inferred.
                  </p>
                  <Link
                    className="record-link text-xs inline-block mt-3"
                    href={`/supply-chain/shipments/${s.id}/tracking`}
                  >
                    Review event evidence ↗
                  </Link>
                </div>
                <StatusBadge value={s.status} />
              </article>
            ))
          )}
        </Panel>
      ) : (
        <Panel>
          <EmptyState
            title="Live forecasts not configured"
            description="Descriptive shipment data is available in Analytics. Switch the global data mode to Demo to inspect clearly labelled review scenarios."
          />
        </Panel>
      )}
    </>
  );
}

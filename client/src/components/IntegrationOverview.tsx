import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { useData, readSource } from "@/contexts/DataContext";
import { Panel, StatusBadge } from "./Workspace";
import { IntegrationCard } from "./Board";
import { formatTime } from "@/lib/workspace";
export function IntegrationOverview() {
  const [version, setVersion] = useState(0);
  const [mailAvailable, setMailAvailable] = useState(false),
    [forecastsConfigured, setForecastsConfigured] = useState(false);
  const { mode, shipments } = useData(),
    [registry, setRegistry] = useState<any[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(mode === "live");
  useEffect(() => {
    if (mode === "demo") return;
    let disposed = false;
    setLoading(true);
    const c = new AbortController(),
      timer = setTimeout(() => c.abort(), 10000);
    readSource("/api/operations/integrations", c.signal)
      .then(r => {
        setRegistry(r.items);
        setMailAvailable(r.externalNotifications === true);
      })
      .catch(e => {
        if (!disposed)
          setError(
            c.signal.aborted
              ? "Source configuration read timed out. Retry the source read."
              : e.message
          );
      })
      .finally(() => {
        clearTimeout(timer);
        setLoading(false);
      });
    readSource("/api/operations/forecasts", c.signal)
      .then(r => {
        if (!disposed) setForecastsConfigured(r.configured === true);
      })
      .catch(() => {
        if (!disposed) setForecastsConfigured(false);
      });
    return () => {
      disposed = true;
      clearTimeout(timer);
      c.abort();
    };
  }, [mode, version]);
  const recent =
    shipments.status === "ready"
      ? shipments.items
          .filter(s => s.receivedAt)
          .sort((a, b) => b.receivedAt!.localeCompare(a.receivedAt!))
          .slice(0, 5)
      : [];
  return (
    <>
      {mode === "live" && (
        <div className="actions">
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => {
              setError("");
              setVersion(v => v + 1);
            }}
          >
            Refresh sources
          </Button>
        </div>
      )}
      {loading && <p role="status">Loading source configuration…</p>}
      {error && (
        <p role="alert" className="source-note">
          {error}
        </p>
      )}
      <div className="integration-grid">
        {mode === "demo" ? (
          <IntegrationCard
            kind="carrier"
            title="Carrier webhooks"
            state="Demo feed"
            description={`Last demonstration receipt: ${formatTime(recent[0]?.receivedAt ?? null)}`}
          >
            <details>
              <summary>View requirements</summary>
              <p>
                Live intake requires a signed event contract, provisioned
                workspace and server-managed connector key. Demo observations do
                not establish a carrier connection.
              </p>
            </details>
          </IntegrationCard>
        ) : registry.length ? (
          registry.map(item => (
            <IntegrationCard
              key={item.provider}
              kind="carrier"
              title={item.provider}
              state={
                item.enabled && item.signatureConfigured
                  ? "Configured"
                  : "Not configured"
              }
              description={`Last receipt: ${formatTime(item.lastReceivedAt)}`}
            >
              <p className="muted text-xs">
                Signature {item.signatureConfigured ? "configured" : "missing"}{" "}
                · Intake {item.enabled ? "enabled" : "disabled"} · Connectivity
                unverified
              </p>
              <details>
                <summary>Source details</summary>
                <p>
                  Provider observation: {formatTime(item.lastObservedAt)}. A
                  stored receipt is evidence of past intake, not a current
                  connectivity or sync probe.
                </p>
              </details>
            </IntegrationCard>
          ))
        ) : (
          !loading &&
          !error && (
            <IntegrationCard
              kind="carrier"
              title="Carrier webhooks"
              state="Not configured"
              description="No sources provisioned in this workspace."
            >
              <details>
                <summary>View requirements</summary>
                <p>
                  Ask your administrator to provision a provider alias,
                  workspace binding and signing secret using the documented
                  logistics contract.
                </p>
              </details>
            </IntegrationCard>
          )
        )}
        <IntegrationCard
          kind="source"
          title="SAP"
          state="Not configured"
          description="No connection configured"
        >
          <details>
            <summary>View requirements</summary>
            <p>
              A SAP connector and authorized tenant mapping are not implemented.
              No provider account can be connected from this screen.
            </p>
          </details>
        </IntegrationCard>
        <IntegrationCard
          kind="mail"
          title="Email notifications"
          state={
            mode === "live" && mailAvailable ? "Configured" : "Not configured"
          }
          description="Opt in through Preferences when delivery is enabled"
        >
          <details>
            <summary>View requirements</summary>
            <p>
              Operational review emails use a durable queue, bounded retries and
              per-workspace opt-in. The administrator must enable operational
              email delivery and configure a mail provider. Password-recovery
              email is separate.
            </p>
          </details>
        </IntegrationCard>
        <IntegrationCard
          kind="forecast"
          title="Forecast provider"
          state={
            mode === "live" && forecastsConfigured
              ? "Configured"
              : "Not configured"
          }
          description="Optional forecast capability"
        >
          <details>
            <summary>View requirements</summary>
            <p>
              The validated server adapter requires a provider URL/name and
              source observations. Responses must match products, dates, units
              and snapshot. Configure credentials on the server, then supply
              observations and request a forecast in Recommendations.
            </p>
          </details>
        </IntegrationCard>
      </div>
      <Panel
        title="Latest received observations"
        description="Most recent stored observation for each shipment in the selected scope"
      >
        {recent.length ? (
          <div className="compact-table-wrap">
            <table className="data-table compact-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Recorded status</th>
                  <th>Received</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(s => (
                  <tr key={s.id}>
                    <td>{s.trackingNumber}</td>
                    <td>
                      <StatusBadge value={s.status} />
                    </td>
                    <td>{formatTime(s.receivedAt)}</td>
                    <td>{s.provider ?? "Not supplied"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">
            No receipt evidence is available in this selection.
          </p>
        )}
      </Panel>
    </>
  );
}

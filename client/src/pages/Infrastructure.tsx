import { IntegrationRegistry } from "@/components/OperationalReview";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useData } from "@/contexts/DataContext";
import { API_ORIGIN } from "@/lib/api-origin";
import {
  PageHeader,
  Panel,
  SourceNote,
  StatusBadge,
  EmptyState,
} from "@/components/Workspace";
import { Button } from "@/components/ui/button";
import { aggregateHealth, Health } from "@/lib/health";
import { DEMO_AS_OF, formatTime } from "@/lib/workspace";
interface Probe {
  name: string;
  status: Health;
  evidence: string;
  checkedAt: string | null;
}
export default function Infrastructure() {
  const { mode } = useData();
  return <HealthWorkspace key={mode} />;
}
function HealthWorkspace() {
  const { mode } = useData();
  const [path] = useLocation();
  const integrations = path.endsWith("/integrations");
  const [probes, setProbes] = useState<Probe[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const [clock, setClock] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const c = new AbortController();
    let disposed = false;
    const timeout = setTimeout(() => c.abort(), 7000);
    setProbes([]);
    if (integrations) {
      clearTimeout(timeout);
      return () => c.abort();
    }
    if (mode === "demo") {
      setProbes([
        {
          name: "Demo API process",
          status: "Healthy",
          evidence: "Deterministic liveness example; no network probe",
          checkedAt: DEMO_AS_OF,
        },
        {
          name: "Demo dependency readiness",
          status: "Degraded",
          evidence:
            "Example: one dependency unavailable; not a production diagnosis",
          checkedAt: DEMO_AS_OF,
        },
      ]);
      setLoading(false);
      clearTimeout(timeout);
      return () => c.abort();
    }
    setLoading(true);
    const read = async (endpoint: string, name: string): Promise<Probe> => {
      try {
        const r = await fetch(`${API_ORIGIN}${endpoint}`, {
          signal: c.signal,
          credentials: "include",
        });
        const body = await r.json();
        const valid = body.status === (endpoint === "/health" ? "ok" : "ready");
        return {
          name,
          status: !r.ok ? "Unavailable" : valid ? "Healthy" : "Unknown",
          evidence: `GET ${endpoint} · HTTP ${r.status} · ${endpoint === "/health" ? "Process liveness only" : "Readiness of configured API dependencies; not provider connectivity"}`,
          checkedAt: new Date().toISOString(),
        };
      } catch {
        return {
          name,
          status: "Unavailable",
          evidence: `GET ${endpoint} did not yield readable probe evidence`,
          checkedAt: new Date().toISOString(),
        };
      }
    };
    void Promise.all([
      read("/health", "API process liveness"),
      read("/ready", "API dependency readiness"),
    ])
      .then(values => {
        if (!disposed) {
          setProbes(values);
          setLoading(false);
          setClock(Date.now());
        }
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      disposed = true;
      clearTimeout(timeout);
      c.abort();
    };
  }, [mode, version, integrations]);
  const scoped = probes.map(p => ({
    ...p,
    status:
      mode === "live" && p.checkedAt && clock - Date.parse(p.checkedAt) > 60000
        ? ("Stale" as Health)
        : p.status,
  }));
  return (
    <>
      <PageHeader
        eyebrow="Infrastructure"
        title={integrations ? "Integrations" : "Service health"}
        description={
          integrations
            ? "Configuration availability is separate from shipment events and infrastructure liveness."
            : "Scoped observations from the API liveness and readiness endpoints. Checks become stale after 60 seconds."
        }
        actions={
          !integrations && (
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setVersion(v => v + 1)}
            >
              Refresh health checks
            </Button>
          )
        }
      />
      <SourceNote />
      {integrations ? (
        <>
          {mode === "live" && <IntegrationRegistry />}
          {mode === "demo" && <Panel title="Connector configuration">
            <EmptyState
              title={
                mode === "demo"
                  ? "Demonstration connector examples"
                  : "Connector status not configured"
              }
              description={
                mode === "demo"
                  ? "SAP, carrier and notification connectors are examples only. No accounts are connected by this screen."
                  : "This application exposes no authorized connector-status endpoint. Provider connectivity and last successful sync are unknown."
              }
            />
          </Panel>
          }
          <Panel title="Logistics event ingestion">
            <StatusBadge value="Unknown" />
            <p className="muted text-sm mt-4">
              The backend supports signed logistics webhooks. A stored event
              proves that an event was received at its receipt timestamp; it
              does not prove that the carrier is currently connected. Configure
              providers outside this read-only workspace.
            </p>
          </Panel>
        </>
      ) : (
        <>
          <Panel
            title="Aggregate of observed checks"
            description="Unavailable dependencies make the aggregate degraded. Unknown and stale evidence never becomes an operational declaration."
          >
            <StatusBadge
              value={
                loading ? "Unknown" : aggregateHealth(scoped.map(p => p.status))
              }
            />
            <p className="muted text-xs mt-3">
              {mode === "demo"
                ? "Demo examples are fixed at the dataset as-of time."
                : `Probe target: ${API_ORIGIN || "same-origin API proxy"}. A successful /health read proves process liveness. /ready checks database readiness on Node and configured service dependencies on the gateway.`}
            </p>
          </Panel>
          <Panel title="Known API checks">
            {loading ? (
              <p role="status">
                Checking process liveness and dependency readiness…
              </p>
            ) : (
              scoped.map(p => (
                <article key={p.name} className="attention-row">
                  <div>
                    <h3>{p.name}</h3>
                    <p className="muted">{p.evidence}</p>
                    <span className="freshness">
                      Probe observed: {formatTime(p.checkedAt)}
                    </span>
                  </div>
                  <StatusBadge value={p.status} />
                </article>
              ))
            )}
          </Panel>
          <Panel title="Provider and cloud resource health">
            <StatusBadge value="Unknown" />
            <p className="muted text-sm mt-4">
              No evidence source verifies SAP, payment gateways, messaging
              providers, cloud resources or carrier connectivity. Random
              performance metrics and whole-platform availability claims are not
              displayed.
            </p>
          </Panel>
        </>
      )}
    </>
  );
}

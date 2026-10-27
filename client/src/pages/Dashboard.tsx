import { useState } from "react";
import { Link, useLocation } from "wouter";
import { AlertTriangle, ArrowUpRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import {
  PageHeader,
  Panel,
  Metric,
  SourceNote,
  SourceState,
  StatusBadge,
  Freshness,
  EmptyState,
} from "@/components/Workspace";
import { isException } from "@/lib/workspace";
import { useAuth } from "@/contexts/AuthContext";
import { routes, permitted } from "@/lib/routes";
export default function Dashboard() {
  const { shipments, orders, refresh } = useData();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const ready = shipments.status === "ready";
  const attention = shipments.items.filter(isException);
  const active = shipments.items.filter(
    s => !["Delivered", "Cancelled"].includes(s.status)
  );
  const queryContext = shipments.items.find(s =>
    query.toLowerCase().includes(s.trackingNumber.toLowerCase())
  );
  return (
    <>
      <PageHeader
        eyebrow="Your operations workspace"
        title="Operational overview"
        description="Start with the work that needs attention. Every total below uses the same authorized record scope."
        actions={
          <Button variant="outline" onClick={refresh}>
            Refresh reads
          </Button>
        }
      />
      <SourceNote
        count={
          shipments.status === "ready" ? shipments.items.length : undefined
        }
        total={shipments.total}
      />
      <div className="metric-grid">
        <Metric
          label="Shipments in scope"
          value={ready ? shipments.items.length : "—"}
          description="Matching workspace shipments"
          href="/supply-chain/shipments"
        />
        <Metric
          label="Active shipments"
          value={ready ? active.length : "—"}
          description="Excludes delivered and cancelled"
          href="/supply-chain/shipments?status=active"
        />
        <Metric
          label="Needs attention"
          value={ready ? attention.length : "—"}
          description="Status is delayed or exception"
          href="/supply-chain/shipments?status=attention"
        />
        <Metric
          label="Pending orders"
          value={
            orders.status === "ready"
              ? orders.items.filter(o => o.status === "Pending").length
              : "Unknown"
          }
          description={
            orders.status === "forbidden"
              ? "Orders unavailable for your role"
              : "Pending workspace orders"
          }
          href={
            orders.status === "ready"
              ? "/supply-chain/orders?status=Pending"
              : undefined
          }
        />
      </div>
      <div className="two-column">
        <Panel
          title="Needs attention"
          description="Recorded shipment exceptions, separate from infrastructure health."
          actions={
            <Link
              href="/supply-chain/shipments?status=attention"
              className="record-link text-xs"
            >
              View all ↗
            </Link>
          }
        >
          {!ready || !shipments.items.length ? (
            <SourceState source={shipments} />
          ) : !attention.length ? (
            <EmptyState
              title="No recorded exceptions"
              description="No delayed or exception statuses in this scope. This does not establish provider connectivity."
            />
          ) : (
            attention.slice(0, 4).map(s => (
              <article className="attention-row" key={s.id}>
                <span className="attention-icon">
                  <AlertTriangle size={17} />
                </span>
                <div>
                  <Link
                    className="record-link"
                    href={`/supply-chain/shipments/${s.id}`}
                  >
                    {s.trackingNumber}
                  </Link>
                  <p className="muted">
                    {s.origin} → {s.destination}
                  </p>
                  <Freshness shipment={s} />
                </div>
                <StatusBadge value={s.status} />
              </article>
            ))
          )}
        </Panel>
        <div className="space-y-5">
          <Panel
            title="Ask your data assistant"
            description="Look up records and summarize the selected dataset. No model provider is configured."
          >
            <MessageSquare className="text-primary" size={22} />
            <form
              className="query-box"
              onSubmit={e => {
                e.preventDefault();
                if (query.trim())
                  navigate(
                    `/insights/assistant?q=${encodeURIComponent(query)}${queryContext ? "&item=shipment:" + queryContext.id : ""}`
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
                placeholder="Ask about a tracking number…"
              />
              <Button
                type="submit"
                aria-label="Open Assistant with query"
                disabled={!query.trim()}
              >
                <ArrowUpRight size={17} />
              </Button>
            </form>
            <p className="muted text-xs mt-3">
              Your query opens for review before sending.
            </p>
          </Panel>
          <Panel title="Continue your work">
            {routes
              .filter(
                r =>
                  ["shipments", "orders", "analytics", "health"].includes(
                    r.id
                  ) && permitted(r, user)
              )
              .map(r => (
                <Link key={r.id} href={r.href} className="quick-link">
                  <span className="flex items-center gap-2">
                    <r.icon size={16} />
                    {r.label}
                  </span>
                  <ArrowUpRight size={14} />
                </Link>
              ))}
          </Panel>
        </div>
      </div>
      <p className="muted text-xs">
        Metrics describe this database snapshot. Counts are not whole-platform
        totals. Unknown values indicate unavailable or unauthorized sources.
      </p>
    </>
  );
}

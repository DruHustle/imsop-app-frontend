import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { useData, Source } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { routes, permitted, routeFor } from "@/lib/routes";
import { DEMO_AS_OF, formatTime, isStale, Shipment } from "@/lib/workspace";
import { AlertCircle, ArrowUpRight, Database, RefreshCw } from "lucide-react";
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  );
}
export function Panel({
  title,
  description,
  children,
  actions,
  className = "",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-header">
          <div>
            <h2>{title}</h2>
            {description && <p className="muted text-sm">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}
export function Metric({
  label,
  value,
  description,
  href,
}: {
  label: string;
  value: ReactNode;
  description: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <span className="muted text-xs">{description}</span>
      {href && <ArrowUpRight className="metric-arrow" size={16} />}
    </>
  );
  return href ? (
    <Link href={href} className="metric">
      {content}
    </Link>
  ) : (
    <div className="metric">{content}</div>
  );
}
export function StatusBadge({ value }: { value: string }) {
  const tone = ["Healthy", "Delivered", "Completed"].includes(value)
    ? "good"
    : ["Delayed", "Exception", "Unavailable", "Degraded"].includes(value)
      ? "bad"
      : ["Pending", "Stale", "Unknown", "Not configured"].includes(value)
        ? "warn"
        : "neutral";
  return (
    <span className={`status-badge ${tone}`}>
      <span aria-hidden="true" />
      {value}
    </span>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <AlertCircle size={24} aria-hidden="true" />
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      {action}
    </div>
  );
}
export function SourceState<T>({
  source,
  empty = "No records in this source",
}: {
  source: Source<T>;
  empty?: string;
}) {
  const { refresh } = useData();
  if (source.status === "loading")
    return (
      <div className="empty-state" role="status">
        <RefreshCw className="animate-spin" />
        <p>Loading authorized records…</p>
      </div>
    );
  if (source.status === "forbidden")
    return (
      <EmptyState
        title="Access denied"
        description="Your role cannot read this source. The API enforces this permission."
      />
    );
  if (source.status === "unavailable")
    return (
      <div role="alert">
        <EmptyState
          title="Source unavailable"
          description={source.error ?? "No records could be read."}
          action={
            <Button variant="outline" onClick={refresh}>
              Retry read
            </Button>
          }
        />
      </div>
    );
  if (!source.items.length)
    return (
      <EmptyState
        title={empty}
        description="The source returned zero records. No demonstration records have been substituted."
      />
    );
  return null;
}
export function SourceNote({
  count,
  total,
}: {
  count?: number;
  total?: number;
}) {
  const { mode } = useData();
  return (
    <div className={`source-note ${mode === "demo" ? "demo-note" : ""}`}>
      <Database size={14} aria-hidden="true" />
      <span>
        {mode === "demo"
          ? `Demo dataset · As of ${formatTime(DEMO_AS_OF)}`
          : "Live · Node operational database snapshot"}
        {count !== undefined &&
          ` · ${count} records in scope${total !== undefined ? ` of ${total}` : ""}`}
        {mode === "live" &&
          " · Scope: newest 500 records · Provider connectivity unknown"}
      </span>
    </div>
  );
}
export function SectionNav() {
  const [path] = useLocation();
  const { user } = useAuth();
  const current = routeFor(path);
  if (!current || ["Account", "Workspace"].includes(current.group)) return null;
  return (
    <nav className="section-nav" aria-label={`${current.group} sections`}>
      {routes
        .filter(r => r.group === current.group && permitted(r, user))
        .map(r => (
          <Link
            key={r.id}
            href={r.href}
            aria-current={current.id === r.id ? "page" : undefined}
          >
            {r.label}
          </Link>
        ))}
    </nav>
  );
}
export function Freshness({ shipment }: { shipment: Shipment }) {
  const { mode } = useData();
  return (
    <span className="freshness">
      {shipment.observedAt
        ? `${isStale(shipment, mode === "demo" ? DEMO_AS_OF : Date.now()) ? "Stale · " : ""}Observed ${formatTime(shipment.observedAt)}`
        : "Observation time unknown"}
    </span>
  );
}

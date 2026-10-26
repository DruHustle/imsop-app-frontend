# IMSOP frontend

React, TypeScript, Tailwind and Radix workspace for authorized shipment and operational-order reads. The Node API, .NET services, database, and infrastructure remain in the independent [backend repository](https://github.com/DruHustle/imsop-app-backend).

## Workspace

- **Overview:** counts and exception links from the same authorized shipment/order scope.
- **Supply chain:** shipment search, status/carrier/mode/creation-date filters, sorting, pagination, coordinate view, stable-ID details and provider event history. Orders are Node operational records with their own numeric identities.
- **Insights:** descriptive analytics with a valid on-time denominator, evidence-review scenarios in Demo mode, and a deterministic data assistant. No model provider or predictive accuracy is claimed.
- **Infrastructure:** observed API liveness/readiness, explicit freshness, and connector availability. These checks do not establish carrier, SAP, messaging, cloud-resource or whole-platform health.
- **Account menu:** profile and persisted preferences. The header includes Notifications, global Live/Demo selection and Light/Dark/System selection.

Routes and role requirements are defined in `client/src/lib/routes.ts`; Wouter remains the single hash router. Legacy `/operations`, `/analytics`, `/intelligence`, `/assistant`, `/infrastructure`, `/settings` and `/profile` hash destinations are retained. Password reset keeps its existing outer `?token=…#/reset-password` handling. Filters and return destinations use hash query parameters.

| Capability | admin | engineer | analyst | user |
|---|---|---|---|---|
| Shipments, Overview, Assistant | Yes | Yes | Yes | Yes |
| Node operational Orders | Yes | Yes | Yes | No |
| Analytics / reports | Yes | No | Yes | No |
| Recommendations | Yes | Yes | Yes | No |
| Infrastructure | Yes | Yes | No | No |

The API enforces read and report permissions independently of navigation. Live client exports also check `/api/operations/reports/access` before generating a file or report window.

## Source contracts and limits

The workspace reads the **newest 500 authorized records by database ID**, then filters/paginates that explicit scope. Source totals are reported separately; counts are not whole-platform totals. This intentional bound avoids unbounded queries and per-row requests. Older records can be opened by a known stable detail URL, but are outside list, analytic and Assistant scope.

Bounded list APIs require the accompanying backend changes:

- `GET /api/operations/shipments?limit=500&offset=0`
- `GET /api/operations/orders?limit=500&offset=0`
- `GET /api/operations/shipments/:id`
- `GET /api/operations/shipments/:id/events?limit=50&offset=0`
- `GET /api/operations/orders/:id`

Lists return `{ items, total, limit, offset, source, scope }`. Missing or older contracts produce an unavailable state, never fixture fallback. The typed adapter deliberately maps provider statuses and transport modes, preserves zero values, and separates stable IDs from tracking numbers. `observedAt`, `receivedAt`, and `provider` describe the latest stored event ordered by occurrence time and event ID; they do not timestamp every field of the shipment snapshot. No shipment/order/document associations are invented.

Node `orders` are distinct from .NET `PurchaseOrder` GUIDs, organization/supplier relationships and `ApiResponse<T>` envelopes. Currency, line items, supplier details, and shipment associations absent from Node's contract are shown as unavailable. There is no production shipment-creation workflow or complete purchase-order form. The visible New shipment action explains the integration prerequisite.

## Live and Demo

Real accounts start with loading states and Live reads. Demo identities use deterministic fixtures, explicitly as of **26 October 2026 at 09:00 UTC**. Real users may deliberately select Demo, with their role restrictions retained. Mode applies across every workspace page, map, notification, Assistant answer and export. A demo token or local mode flag never authenticates a production request.

Mode and local preferences are scoped by user identity. Notification read/dismissal state is scoped by user and mode and cleared on logout/account changes. Production notification delivery/preferences are unavailable; live accounts receive no seeded demo notifications. The Assistant keeps conversations only in memory and resets on user/mode changes. It supports known tracking/order numbers, counts and exception summaries; it does not execute actions or invent causes/forecasts. Overview/detail queries open for review and require one explicit send.

On-time rate counts delivered records with both actual and estimated arrival timestamps. Numerator is actual arrival at or before the estimate; denominator is all eligible deliveries. No costs, revenue, savings or model accuracy are inferred.

The map is secondary to List. Only valid supplied coordinates become markers. Google Maps remains optional; unavailable/keyless operation uses an explicitly schematic longitude/latitude plot and linked coordinate list. Marker updates and listeners are cleaned up as the selected scope changes. Missing coordinates remain inspectable in List.

## Appearance and accessibility

Light and dark palettes cover the shell, operational pages, auth, menus and dialogs. System theme changes are observed. Reduced-motion and contrast preferences persist; operating-system reduced motion is always respected. The mobile drawer supports keyboard use, Escape and destination closing, and restores focus to the selected page. Mobile advanced filters use a disclosure to keep shipment cards near the search field.

Reports export the filtered scope with data mode, source, date/filter scope and generation time. HTML values/titles are escaped; CSV formula prefixes are neutralized. Browser reports use the label **Print / Save as PDF**. Empty scopes, permission failures and blocked report windows have explicit behavior; browser download completion cannot be verified, so the UI only reports that a download was requested.

## Local development and validation

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm exec tsc --noEmit
pnpm test
pnpm build
pnpm e2e
pnpm audit --prod --audit-level=moderate
```

`pnpm build` includes retired-endpoint verification across lazy chunks. E2E starts its own preview on **4188** with server reuse disabled, preventing accidental tests of unrelated applications. Every production API response and provider failure is isolated in fixtures; no production writes or provider contacts are required.

`VITE_BASE_PATH=/` builds for Vercel; the default `/imsop-app-frontend/` supports GitHub Pages. `VITE_API_URL` and the existing unified `api-origin.ts` resolution preserve first-party production proxy behavior. Brand URLs use Vite's base path. Optional Google Maps configuration remains `VITE_GOOGLE_MAPS_API_KEY`.

[Verification evidence and measurements](verification/RESULTS.md) records exact local checks, screenshots, known limits and hosted-navigation reproduction. Local verification does not deploy either repository. Historical architecture/design documents describe earlier aspirations and must not be treated as integration evidence.

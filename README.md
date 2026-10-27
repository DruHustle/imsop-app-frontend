# IMSOP frontend

React/TypeScript workspace for shipment operations, descriptive analytics, deterministic record assistance and durable exception review. The independent [backend repository](https://github.com/DruHustle/imsop-app-backend) owns the Node API, .NET gateway/services, PostgreSQL and deployment.

Use the [current capability/architecture inventory](https://github.com/DruHustle/imsop-app-backend/blob/main/docs/CURRENT_PLATFORM.md), [API](https://github.com/DruHustle/imsop-app-backend/blob/main/docs/API.md), [deployment](https://github.com/DruHustle/imsop-app-backend/blob/main/docs/DEPLOYMENT.md) and [recovery](https://github.com/DruHustle/imsop-app-backend/blob/main/docs/RECOVERY.md). During coordinated remediation review, use the matching backend branch/PR. Historical public designs are retired and obsolete generated PDFs are removed.

The existing grouped navigation, responsive cards, navy/slate/cyan identity, themes, role restrictions, shared Live/Demo state, hash routes, stable details and first-party Vercel API proxy remain. New public accounts require explicit workspace provisioning; they cannot read existing operations automatically. Demo identities never authenticate a live request.

Shipment selection uses authorized server filters and bounded stable-ID pages, then loads the complete matching selection up to 10,000 records. Above that the UI requires narrower filters rather than showing misleading partial totals. Table pages only change presentation; metrics, map and exports use the complete matching selection. Manual refresh, last successful source-read time and independent provider observation time are visible. No fast idle source polling is added. A known older record can be opened/retrieved by its scoped stable ID; Assistant exact-identifier reads are checked when sent.

On-time performance requires explicit actual arrival and a retained original promise. Current ETA revisions do not replace that baseline. Unknown legacy promises/currency remain unknown; amounts are exact source strings, never inferred USD/EUR or mixed-currency totals. HTML is escaped and CSV formula-neutralized. Browser reports remain labelled **Print / Save as PDF** and report only requested downloads, not confirmed browser completion.

Recommendations includes a real exception-review cycle: signed intake creates a workspace case; admin/engineer can acknowledge, assign a permitted operator, add a note, resolve or reopen it. Actions persist with audit history, survive reload and appear in per-user in-app notifications. Resolution does not change carrier status. Integrations shows sanitized configuration and last receipt/observation evidence; old events never establish current connectivity. Forecasts and external notifications remain optional/unavailable. Purchasing intake is an API capability with a durable outbox; an incomplete purchasing form is not activated. Node operational IDs and .NET GUID entities are not merged.

Recovery accepts both previously used link formats, rejects ambiguous duplicate tokens, scrubs the URL and retains the credential only in document memory. Failed submissions can retry; reload requires reopening the mail link. Recovery deliberately uses the real API even during a live/demo session. Registration/reset/change guidance follows the real 12–128 policy. Expired/revoked sessions clear sensitive state and offer reauthentication to the previous route. Unconfirmed server logout blocks local automatic session restoration and is retried before login.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm exec tsc --noEmit
pnpm test
VITE_BASE_PATH=/ pnpm build
pnpm e2e
pnpm audit --prod --audit-level=moderate
```

`pnpm build` includes retired-endpoint verification over lazy chunks. Root-base builds retain first-party Vercel calls; default `/imsop-app-frontend/` supports Pages. Existing `VITE_API_URL`, unified API-origin logic and optional `VITE_GOOGLE_MAPS_API_KEY` remain. Maps stay secondary and missing coordinates remain inspectable.

Ordinary E2E uses isolated browser fixtures and preview port 4188. Actual system/browser tests are separate:

```sh
# First run the companion backend's documented isolated Compose/PostgreSQL/gateway suites.
pnpm exec playwright test --config playwright.system.config.ts
```

The system suite uses real PostgreSQL, Node, YARP, .NET and memory-only SMTP/transport sinks. It contains no API route fulfillment. It verifies emitted links, identity modes, persistence, notifications, exact Assistant context and replay; only disposable test passwords/data change. The preview proxy on 4189 is enabled only for the exact local system API URL and does not alter production routing.

[Current review and closure](docs/remediation/CLOSURE.md) · [Current verification](verification/remediation/RESULTS.md) · [Historical verification](verification/RESULTS.md). No production merge/deployment/provider connection is performed by this remediation.

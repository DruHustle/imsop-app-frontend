# IMSOP visual reference and implemented layouts

The two IMSOP board sheets supplied by the user on 27 October 2026 are the design reference. Layouts retain the navy sidebar, cyan active tab/accent, compact sans typography, light bordered panels, grouped navigation and consistent spacing. Sidebar route identity is exact; only the current tab is highlighted. Group disclosure buttons, mobile drawer, theme/mode selectors, profile/preferences and notifications are functional.

Eight shared-component workspaces:

1. Overview: four calculated metrics, exception table/cards, calculated status distribution, query handoff and timestamped recent observations.
2. Shipments: filters, list/map, stable record links and a closeable record preview; mobile cards retain visible actions.
3. Orders: source-precise amounts, filters/pagination and a selected-order preview. Unknown currencies remain explicit.
4. Analytics: three calculated metrics, status bars and actual-arrival delivery chart; original-promise rate definition is expandable. No illustrative series is copied.
5. Recommendations: review queue beside a case workspace, ownership, notes, acknowledgement/resolution and audit. Live actions persist in PostgreSQL; labelled demo actions persist only on this device.
6. Assistant: reviewed queries, deterministic exact record retrieval, multi-record comparison table, source time and explicit missing context. No automatic send or operational execution.
7. Service health: observed readiness/check count/time, current service table and the bounded history of checks actually performed. Carrier health remains unknown.
8. Integrations: sanitized source cards, working requirement disclosures and recent stored observations. Configuration never becomes an unsupported connectivity claim.

Reusable components include PageHeader, Panel, Metric, StatusBadge, SourceNote/SourceState, Notice, RecordPreview, StatusDistribution, EvidenceTimeline, DeliveryTrend and IntegrationCard. All business figures derive from the selected authorized dataset or clearly labelled demo records. Schema/provenance explanations are contextual Source details.

Current screenshots and the visual-inspection record are in `verification/remediation/RESULTS.md`; historical screenshot files remain untouched. Desktop, narrow desktop and mobile are checked in both themes, including long-label fixtures kept in tests.

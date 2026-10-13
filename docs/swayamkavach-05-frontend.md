# SwayamKavach — 05 Frontend

Next.js operator dashboard routes, information architecture, live-state contracts, model comparison and safe canary/rollback interactions.

## Dashboard information architecture

# 05 · Frontend and Operator Experience

**Goal:** make the IDS lifecycle inspectable without turning the dashboard into an alternative deployment controller. Next.js/TypeScript/Tailwind consume the API in 04; actual state stays in the backend. This is a UI specification, not a built interface.

## Pages and required content
| Route | Main panels | Primary questions |
|---|---|---|
| `/overview` | Sensor/pipeline health, active release, labelled quality, drift, lifecycle, current rollout | Is traffic arriving? Which model serves? What is known versus unknown? |
| `/alerts` | Filterable alert table and detail drawer | What was flagged, by which release, and has it been reviewed? |
| `/monitoring` | Feature drift, quality checks, label coverage, model-quality timelines | Is this a data problem, a distribution change or measured degradation? |
| `/workflows` | Job list and four-role graph/timeline | What triggered action, what is running, why did it stop? |
| `/models` | Versions, lineage, deployment history and comparison | What changed and what evidence supports it? |
| `/deployments` | Desired/applied routing, slot identities, canary evidence and controls | What is actually receiving traffic and can we revert? |
| `/settings` | Read-only effective policy, authorized policy proposals, sensor status | Which thresholds/modes are active and who changed them? |

### Overview layout
Top strip: environment badge (replay/staging/live pilot), mode (full-auto/supervised), last update and connection state. Then independent cards for operational health, feature drift and **labelled** quality. A single green 'model healthy' badge must not conceal unknown recall.

Middle: traffic/prediction volume and queue-age timeline beside a lifecycle summary. Bottom: recent alerts, decisions and rollout changes. Link to Grafana for detailed infrastructure diagnostics rather than rebuilding every monitoring panel.

## Intrusion alert detail
Show event/capture/sensor identifiers, event and feature-ready times, score, applied threshold, predicted class, exact release/model/schema, quality flags and any independent adjudication. Raw endpoints/IPs are role-protected. Confidence is a model score—not an attack probability unless calibration supports that interpretation. Distinguish `unreviewed`, `confirmed`, `false_positive`, `inconclusive` and `superseded_label`.

An 'acknowledge alert' action changes workflow status only. A 'label event' action requires provenance and labeler permission. Do not let acknowledgement silently become ground truth.

## Visualizing evidence and decisions

## Drift, damage and quality views
For each feature display method, statistic/distance, configured threshold and direction, sample count, reference ID and missingness. KS p-values and PSI distances have different semantics; never put them on one unlabeled 'drift severity' scale. Show reference/current distributions with compatible bins and window times. Correlated features mean 'share of columns drifted' is not a share of information changed.

### DARI Diagnosis & Repair Ladder Panel
Provide a dedicated widget displaying the **7-dimensional Damage Fingerprint**:
- **Radar / Triad Chart:** Visual breakdown of $D_X$ (distribution damage), $D_Y$ (performance degradation), and $D_B$ (boundary uncertainty margin).
- **Repair Status Badge:** Explicit tier indicator displaying:
  - `A0: MONITORING (Covariate shift, zero repair needed)`
  - `A1: CALIBRATED (Threshold re-tuned in <1s)`
  - `A2: ADAPTED (Targeted subspace update)`
  - `A3: RETRAINED (Full DVC snapshot & retraining)`
- **Utility & Savings Card:** Displays net utility score $U(A_i) = R(A_i) - \lambda C(A_i) - \gamma G(A_i)$ and cumulative hours of training compute and labels saved compared to a naive "always retrain" policy.

Show separately:
- Schema validity, invalid/missing features, capture drops and sensor freshness ($Q$).
- Unlabelled feature/prediction distribution drift ($D_X$).
- Unlabelled decision boundary uncertainty and entropy ($D_B$).
- Label coverage, delay, class support, and measured degradation ($L, S, D_Y$).
- Precision/recall/F1/AP only for labelled, eligible cohorts.
- Training/evaluation intervals versus stream time, so future labels cannot appear as immediate knowledge.

Empty, stale and insufficient data are different states. Use an em dash and explanatory text for undefined metrics, not zero.

## Workflow view
Four role lanes: Monitor, ML Engineer, Evaluator, Deployment Coordinator. Expand a lane into deterministic steps (quality check, label eligibility, snapshot, training, paired evaluation, approval, staging, canary, promotion/rollback). The role model remains consistent with the project slides without requiring four independent chat agents.

Each event displays timestamp, trigger, evidence references, concise rationale, tool action, input/output summary, actor/policy and error classification. Support statuses such as `queued`, `running`, `awaiting_labels`, `awaiting_approval`, `rejected`, `inconclusive`, `cancel_requested`, `failed`, `canary`, `promoted`, `rolled_back`.

Do not fabricate conversational agent activity or expose hidden chain-of-thought. A deterministic rule result is useful evidence; an LLM explanation is labeled as a generated interpretation with source links.

## Model comparison view
Side-by-side champion/candidate cards include dataset, label cutoff, split manifest, feature/extractor version, code/lock hash, MLflow run, model checksum and resource cost. The metric table shows both scores, paired differences, uncertainty interval, class support, non-regression policy and gate outcome. A higher weighted-F1 does not hide worse rare-attack recall. Highlight non-comparable runs rather than ranking them blindly.

Version history separates **registered**, **evaluated**, **staged**, **serving**, **retained predecessor** and **archived**. MLflow aliases are display metadata; observed deployment state comes from the controller.

## Rollout controls and frontend implementation

## Safe canary and rollback interactions
The deployment screen must show:
- Desired versus applied generation and configuration hash.
- Slot A/B exact release, readiness and retained predecessor availability.
- Nominal weights versus measured request share and flow share.
- Candidate sample counts and clean evaluation interval.
- Operational metrics, labelled quality where available, watchdog heartbeat.
- Current gate, stop reason, approval identity and expiry.

**Approve:** open a review panel containing the candidate, predecessor, evidence hash and policy. Send the approval for those exact values. On 409, discard stale local state and force a new review; never auto-retry an approval against different evidence.

**Rollback:** confirm the target release and operational impact, submit expected generation, receive 202/operation ID, then show 'rollback requested' → 'applying' → 'observed rolled back' or 'failed'. Do not show a success toast when the request was merely accepted. Disabling a button is usability, not authorization; the API enforces permissions.

**Cancel training ≠ rollback.** Explain that a cancellation stops at a safe checkpoint and does not undo already applied serving changes. Autonomy mode/policy changes require administrator permissions and audit; no casual switch that bypasses evaluator gates.

## Suggested project structure
```text
app/(console)/overview/page.tsx
app/(console)/alerts/page.tsx
app/(console)/monitoring/page.tsx
app/(console)/workflows/[id]/page.tsx
app/(console)/models/[version]/page.tsx
app/(console)/deployments/page.tsx
components/health/StatusWithFreshness.tsx
components/evidence/MetricWithSupport.tsx
components/workflows/DecisionTimeline.tsx
components/deployments/RoutingState.tsx
lib/api/generated-types.ts
lib/api/client.ts
lib/events/useEventStream.ts
```

These are proposed local file names. Use server components for initial authenticated snapshots where convenient and client components for filters, charts and live controls. Generated OpenAPI types reduce drift; validate event payloads at runtime as TypeScript types vanish in the browser.

Polling is an acceptable first implementation. SSE adds one-way notifications and event-cursor replay; fetch authoritative snapshots after consequential events. Reconnect with backoff, handle history expiration/reset, bound event history in memory and expose stale data. UI disconnect must not interrupt a lifecycle job. Same-origin cookie authentication avoids putting secrets in EventSource URLs. Nginx disables buffering on the SSE route. [1–2]

Use accessible labels, keyboard focus, status text as well as colors, virtualized/paginated alert lists and downsampled chart points. Keep raw event IDs out of chart labels when the cardinality is high.

## Acceptance, scope and sources

## UI acceptance scenarios
1. Replay/live environment is unmistakable; no simulation screenshot is labeled production.
2. With zero labels, quality is 'unknown' while drift/operational health can still display.
3. Sensor silence becomes stale/no-data, not a falling attack rate interpreted as improvement.
4. A candidate with better average F1 but a failed class-recall gate shows rejection evidence.
5. An expired or stale approval cannot be submitted successfully.
6. A canary request displays desired/applied divergence until routing is observed.
7. Successful rollback includes exact predecessor identity and observed generation.
8. Reconnect restores status without duplicating timeline events.
9. Viewer cannot mutate; labeler cannot promote; malicious report text is escaped/sandboxed.
10. No fake precision: chart sample counts, timestamp zones and unavailable metric states are visible.

**Six-week minimum:** overview, alerts, workflow detail and rollout controls, with model/evidence details in drawers and links. Dedicated polished analytics pages are optional. Grafana can supply operational charts early, but the application must still show deployment authority, evidence and actions.

### Sources and design basis
1. [FastAPI SSE](https://fastapi.tiangolo.com/tutorial/server-sent-events/).
2. [Nginx proxy buffering and timeouts](https://nginx.org/en/docs/http/ngx_http_proxy_module.html).
3. [Evidently drift customization](https://docs.evidentlyai.com/metrics/customize_data_drift).
4. [MLflow registry workflow](https://mlflow.org/docs/latest/ml/model-registry/workflow/).
5. [Prometheus metric naming/cardinality](https://prometheus.io/docs/practices/naming/).

Page layouts, component names and interactions are project-specific design recommendations; they are not claims that the cited tools supply this dashboard. See 04 for endpoints, 08 for comparison evidence and 09 for rollout states.

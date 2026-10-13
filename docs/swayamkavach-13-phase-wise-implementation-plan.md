# SwayamKavach — 13 Phase-wise Implementation Plan

Step-by-step six-week implementation roadmap for four teammates, with dependencies, deliverables, acceptance gates, parallel workstreams and next-semester phases.

## How to use this plan

# SwayamKavach: phase-wise, step-by-step implementation plan

**Purpose:** turn research documents 01–12 into an ordered build plan for a four-person, six-week B.Tech MVP. This is a proposed roadmap, not a statement that implementation is complete. Week numbers are relative to the team's agreed start date, not calendar commitments.

## Target MVP
Build one reproducible path:

**IoT flow replay/capture → validated ingestion → versioned prediction → monitoring → eligible retraining → paired evaluation → guarded canary → verified promotion or rollback.**

Use TON_IoT network data, binary classification first, one external feature contract, a single-host deployment and two serving slots. These remain recommendations to confirm in Phase 0. A supervised authorized live pilot is conditional; a labelled replay lifecycle is the core reproducible demonstration.

## Four workstreams
| Role | Primary ownership | Required pairing |
|---|---|---|
| A — ML & Data | Dataset, feature contract, model, labels, drift calibration, evaluation | B on snapshot/label APIs; C on serving parity |
| B — Backend & Agents | FastAPI, database, durable jobs, LangGraph, policies | A on training/evaluation tools; C on deployment intents |
| C — Platform & Observability | Docker, Nginx, MLflow infrastructure, metrics, controller, CI/CD | B on durability/permissions; A on model bundles |
| D — Frontend & Integration | Next.js dashboard, API types, workflow/rollout views, E2E demo | B on contracts; C on observed deployment status |

Assign actual teammate names together; this plan does not silently change the earlier named-team responsibilities. Each task has a lead, but service boundaries require joint acceptance.

## Non-negotiable rules
- Build deterministic tools and safety gates before adding optional LLM planning.
- Keep prediction and training in separate processes.
- Independent labels arrive with provenance and availability timestamps; model predictions are not new ground truth.
- A registry alias change is not a serving deployment.
- Keep champion/candidate external feature schemas compatible during a model-only canary.
- 'Accepted', 'applied', 'observed' and 'fully drained' are different states.
- A phase is complete only when its exit test passes and evidence is saved.

Tasks below are proposed repository artifacts and local commands to implement, not files already present. Source-backed technical rationale remains in documents 01–12; this document supplies build order and acceptance criteria.

## Phase map and six-week schedule

## Dependency map
```text
P0 Scope/contracts/feasibility
 ├─ P1 Dataset + feature pipeline + baseline
 └─ P2 API/DB/UI infrastructure skeleton
P1 + P2 → first end-to-end prediction slice
P1 + P2 → P3 DVC/MLflow reproducibility
P2 + P3 → P4 Monitoring + label eligibility
P3 + P4 → P5 Durable LangGraph retraining
P3 + P5 → P6 Candidate evaluation/approval
P2 + P3 → P7 controller development with mock/known releases
P6 + P7 → real guarded model rollout
P1–P7 → P8 integrated experiments + conditional live pilot
P8 → P9 release freeze, restore and academic handoff
```
The controller can be developed against safe test releases before evaluator completion, but **real candidate promotion cannot bypass P6**. UI, tests and CI run in parallel throughout—not as a final phase.

| Week | Main phases | A: ML/Data | B: Backend/Agents | C: Platform | D: UI/Integration | Weekly demonstration |
|---|---|---|---|---|---|---|
| 1 | P0, P1, P2 skeleton | Verify subset/features, train small baseline | Contracts, migrations, ingestion/job skeleton | Compose, serving, two-slot feasibility spike | Mock-backed overview/alerts, API types | Thin flow → prediction → stored row/UI; identify any unfinished gate |
| 2 | Complete P2, P3, P4 | Reproducible data, delayed labels, build `damage/` ($D_X, D_Y, D_B$) | Durable inference, label APIs, damage calculators | MLflow/DVC storage, metrics, initial controller | Real alerts/health and damage evidence views | Restorable baseline with $D_X, D_Y, D_B$ diagnosis |
| 3 | P5, start P6/P7 | Level A1 calibrator, snapshot builder, bounded fit | DARI selector ($A0–A3$), LangGraph branching, utility logic | Two-slot staging/controller, hot threshold route | DARI repair ladder panel, candidate details | Shift scenario → DARI selects $A0/A1/A3$, executes repair |
| 4 | Complete P6/P7 | Paired evaluator, non-regression gates | Approval, threshold deployment intent vs slot canary | Canary/watchdog/rollback and CI deploy controls | Evidence approval and rollout/calibration state | A1 hot threshold apply; A3 candidate canary and rollback |
| 5 | P8 | DARI comparative baselines vs Static/Periodic/Retrain | Failure injection, duplicate/crash fixes | Load/restore/pilot tests | E2E validation, cost-savings dashboard | Full matrix: unnecessary A3 rate, compute saved, recovery times |
| 6 | P9 | Freeze results and limitations | Critical fixes, no new architecture | Fresh restore and release rehearsal | Report, demonstration/video, operator guide | Fresh-start reproducible final demo |

**Critical path:** feature parity → reproducible baseline → trusted snapshots → evaluator → verified rollout. If this slips, reduce optional scope rather than compressing away evaluation or recovery tests.

Week 1 is an intentionally thin integration target; it is not permission to call a mocked or non-durable prototype the finished Phase 2 system.

## Phase 0 — Scope, contracts and feasibility

**Window:** start of Week 1. **Lead:** all four, B coordinates. **Prerequisite:** agreed project research baseline. **References:** 01 PRD, 02 Architecture, 03 Stack, 12 Deployment.

### Steps
**0.1 — Freeze the MVP decision sheet.** Confirm primary dataset/release, binary versus required multiclass, feature-extraction path, replay label source, available host and capture permissions. Record undecided items with owner and deadline. Recommend binary TON_IoT network + Zeek connection features; do not assume all TON modalities are interchangeable.

**0.2 — Define operating modes.** Specify local fixture, labelled replay and authorized live pilot. Define full-auto replay versus supervised pilot behavior. Explicitly exclude autonomous firewall changes and untrusted pseudo-label promotion.

**0.3 — Record architecture decisions.** Agree Postgres queue versus an already-familiar Celery stack, artifact remote, host versus containerized Nginx, LLM provider/privacy budget, authentication approach, and Python toolchain standard (`uv` for fast, deterministic dependency resolution and virtual environments). Use the reference architecture unless a measured constraint justifies an alternative.

**0.4 — Create the monorepo skeleton and contribution rules.** Initialize Python environment and dependencies using `uv` (`.python-version` pinning runtime, `pyproject.toml` workspace specification, and deterministic cross-platform `uv.lock`). Configure `uv sync` for local virtual environments, `uv run` for executing linters/tests, and Node version files for the frontend. Define formatting/lint/unit-test commands (`ruff`, `pytest`), ignored data/secrets (`.gitignore`), `.env.example`, PR review rules, and CI workflow using `astral-sh/setup-uv` and `uv sync --frozen`. Do not install every optional service before proving a vertical slice.

**0.5 — Define shared contracts.** Version `FlowEvent`, `Prediction`, `LabelRecord`, `MonitorResult`, `LifecycleState`, `EvaluationResult`, `ReleaseManifest` and `DeploymentIntent`. Agree globally unique event IDs, UTC timestamps, ordered feature columns, score/class semantics and API error/status vocabulary. D begins UI fixtures from these types.

**0.6 — Run three early risk spikes.** A/C: small PCAP → Zeek features and baseline model load. B: Postgres-backed job claim/retry fixture. C: two test servers → Nginx route switch → predecessor restoration under concurrent requests. These spikes reveal feasibility; they are not the production controller.

**0.7 — Define limits to calibrate.** Create policy fields for dataset/window support, labels, retries, training time/RAM/threads, cooldown, canary evidence and retention. Mandatory unset safety values must prevent full-auto mode rather than defaulting to unlimited.

**Artifacts:** `docs/decisions/`, `schemas/`, `policies/`, `tests/contracts/`, repository skeleton, feasible host/network notes.

**Exit gate G0:** all four can explain the same event/model/deployment contract; risk spikes have recorded outcomes; blockers have an explicit fallback. No live capture starts without authorization.

## Phase 1 — Data, feature pipeline and baseline IDS

**Window:** Week 1, with reproducibility hardening in Week 2. **Lead:** A; pair C for extractor/serving. **Prerequisite:** G0. **Reference:** 07 ML Model.

### Steps
**1.1 — Acquire and inventory a bounded primary subset.** Verify official release, archive checksum, exact columns, capture provenance, labels, class counts, licence/access terms and storage footprint. Keep sampled CSV and original chronological PCAP provenance distinct.

**1.2 — Implement the canonical adapter.** Map Zeek originator/responder fields to the approved TON connection schema. Specify seconds versus other duration units, payload versus IP bytes, null handling, direction, timeouts and capture-quality flags. Exclude labels/IDs/IPs from default predictors.

**1.3 — Build parity fixtures.** Use a small known PCAP and expected outputs to test feature order, types, missing values, protocol categories and byte semantics. Verify the historical training representation or re-extract a documented derived dataset. Matching names alone is not a parity test.

**1.4 — Freeze the initial split policy.** Preserve event/capture/session grouping and chronology. Create training, development/calibration, promotion-evidence and sealed-final-test memberships with overlap checks. Small smoke fixtures are not scientific evaluation data.

**1.5 — Implement a fitted preprocessing pipeline.** Fit imputation/encoding/feature selection only on training data. Handle unknown categories explicitly. For tree baselines, do not add scaling merely by habit. Store class ordering and positive-class meaning.

**1.6 — Train compact baselines.** Compare a small Decision Tree/Random Forest or HistGradientBoosting baseline with LightGBM under bounded comparable search budgets. Record AP, thresholded precision/recall/F1/FPR, support, fit time, memory and inference time. Select the operating threshold on development evidence, not the final test.

**1.7 — Package baseline R1.** Bundle fitted preprocessing, estimator, feature schema, class map and threshold. Include code/environment and data/split identifiers. Test save/load score equivalence within a declared numerical tolerance.

**1.8 — Implement replay with a separate label clock.** Emit only features to inference. Keep labels in an independent fixture/service, releasing them at documented availability times. Preserve both source-event and processing timestamps.

**Artifacts:** `src/swayamkavach/features/`, `training/`, `replay/`, feature fixtures, split manifest, local R1 bundle and baseline report.

**Exit gate G1:** a fresh run reproduces the declared feature representation and loads R1 correctly; no label/identifier leakage; the sealed test is not used for model selection. Full DVC remote restoration is completed in P3.

**If blocked:** a clearly marked CSV replay baseline can unblock API work, but the live-deployability gate remains open until extractor parity is established.

## Phase 2 — Durable inference vertical slice and first dashboard

**Window:** Week 1 skeleton → Week 2 completion. **Lead:** B; C owns runtime; D owns UI. **Prerequisite:** G0; real-model exit requires G1. **References:** 02, 04, 05, 10.

### Steps
**2.1 — Bootstrap runtime and migrations.** Start API, Postgres, one model slot and frontend. Define durable tables for sensors, batches, events, predictions, alerts and jobs. Use separate least-privilege credentials; keep services private except the intended gateway.

**2.2 — Build private model serving.** Implement `/predict`, `/identity`, `/readyz`, `/livez` and `/metrics`. Load R1 once, verify checksum/schema and warm it before readiness. Return actual release/model/slot identity with every score; an error must never become a benign label.

**2.3 — Implement authenticated ingestion.** `POST /api/v1/ingestion/batches` validates sensor scope, batch size and schema. Commit required feature bytes or verified durable blob references with work records before returning 202. Implement stable idempotency keys/body hashes, admission limits and bounded sensor retry/spooling.

**2.4 — Implement the inference consumer.** Claim work with a short transaction/lease, run prediction outside the transaction, then commit prediction + alert + outbox event atomically. Keep inference independent of the later CPU training worker.

**2.5 — Make duplicate behavior explicit.** Use first valid committed production result wins under current lease ownership; store attempt attribution separately. Retries may hit another slot later, so record actual release/generation. Quarantine poison events; bound transient retries. Promise unique DB/UI alerts, not exactly-once external notifications.

**2.6 — Expose minimal read APIs and UI.** Build overview, alerts and alert detail with environment badge, exact release, timestamps and stale/no-data states. Start with polling; do not block integration on SSE or chart polish. API authorization—not disabled buttons—enforces roles.

**2.7 — Add integration fixtures.** Valid batch, duplicated batch, malformed feature, model timeout and DB-unavailable receipt. Verify counts and states directly in the DB and through the UI.

**Artifacts:** `api/`, `serving/`, `inference_consumer.py`, `db/migrations/`, `frontend/`, `compose.dev.yaml`, `tests/integration/test_ingest_predict.py`.

**Exit gate G2:** replayed features reach R1 and a durable visible prediction/alert; duplicate submissions produce no duplicate committed alerts; process restart recovers queued work; inability to commit receipt returns an error rather than a false 202.

## Phase 3 — DVC, MLflow and immutable release lineage

**Window:** Week 2. **Lead:** A/C; B integrates identifiers. **Prerequisite:** G1 and the P2 persistence contracts. **References:** 03, 08, 12.

### Steps
**3.1 — Provision private MLflow.** Separate tracking metadata from artifact bytes and application operational state. Configure authentication/access boundary, persistent storage and backup target; inference must not gain registry-write credentials.

**3.2 — Configure DVC and its remote.** Track selected raw/curated data, label revisions, split manifests and references. Keep secret remote credentials outside Git. Decide data-repository/worktree isolation so automation cannot alter the serving directory or production code branch.

**3.3 — Encode data transformations.** Add `dvc.yaml` stages for curation/splitting/training where useful, and commit generated lock metadata. Make all command entry points real and testable; do not copy pseudocode into a runnable pipeline without implementation.

**3.4 — Implement snapshot publication.** Freeze event IDs and labels available by cutoff; materialize and verify Parquet/manifests; upload DVC objects; publish exact Git metadata revision; verify restoration before marking the snapshot available. Incomplete publication stays pending/failed.

**3.5 — Log/register R1 through an idempotent publish adapter.** Link run, dataset revision, code SHA, environment lock, class map and threshold. Handle lost registration responses using operation IDs rather than blindly creating new versions.

**3.6 — Generate a release manifest.** Pin serving image digest, explicit model version, bundle checksum, preprocessing/schema/extractor identity and evaluation reference. A mutable `champion` alias is a display/registry pointer, not serving truth.

**3.7 — Run clean restoration and round-trip tests.** Fresh checkout/worktree + DVC pull + environment setup + MLflow model load must recover required inputs and matching predictions. Verify the exact sklearn/LightGBM serialization path.

**Artifacts:** `dvc.yaml`, `dvc.lock`, `snapshots/`, `manifests/`, `registry.py`, `releases/`, `tests/integration/test_lineage_restore.py`.

**Exit gate G3:** R1 is traceable from served result to model artifact, code/environment, dataset/labels/splits; a clean environment restores the referenced bytes. Changing an MLflow alias alone does not change the running slot.

## Phase 4 — Monitoring, drift and trusted-label eligibility

**Window:** Week 2 → early Week 3. **Lead:** A/B; C metrics; D evidence UI. **Prerequisite:** G2/G3. **References:** 07, 09, 10.

### Steps
**4.1 — Add operational metrics first.** Instrument ingest rejection, queue age, inference attempts/commits, latency, capture quality and worker/sensor freshness. Keep labels bounded; store per-event identifiers in the database rather than Prometheus series.

**4.2 — Implement label ingestion and revisioning.** Record event ID, source, evidence, availability time and adjudication status. Separate acknowledgement from labelling. Validate replay label delay and keep unknown labels unknown.

**4.3 — Build an immutable monitoring-window selector.** Apply event-time boundaries, watermark/late-data policy, release/schema/cohort compatibility and a label cutoff. Record sampling and excluded events. Freeze the vetted reference per release/cohort.

**4.4 — Integrate Evidently through an adapter.** Produce quality checks and feature/prediction drift separately. Export raw reports and a stable normalized `MonitorResult`; regression-test the API and JSON parsing against the pinned version.

**4.5 — Implement the DARI Damage Calculator (`src/damage/`).** Compute the 7-dimensional Damage Fingerprint $F_t = [D_X, D_Y, D_B, Q, L, S, R]$:
- $D_X$: Kolmogorov-Smirnov / Wasserstein statistics on connection features.
- $D_Y$: Ground-truth attack recall degradation and FPR inflation on available delayed labels ($D_Y = \text{None}$ if unlabelled).
- $D_B$: Decision boundary margin ambiguity ($\pm 0.10$ around $\theta$) and Shannon prediction entropy.
- $Q, L, S, R$: Schema quality, label reliability, sample sufficiency, and persistence.

**4.6 — Calibrate signal and damage policy.** Use stable and controlled-change development episodes to calibrate $D_X, D_Y, D_B$ thresholds, minimum sample floors, and persistence rules. Record choices in versioned configuration.

**4.7 — Implement evidence and feasibility checking.** Evaluate $Q, L, S, R$ against hard safety gates. Missing labels ($L < L_{\min}$) routes to an `awaiting_labels` state; sensor faults ($Q < Q_{\min}$) quarantine the window without retraining.

**4.8 — Connect the UI and Grafana.** D exposes the DARI Damage Fingerprint radar/breakdown, operational status, and labelled metrics; C supplies Prometheus gauges for `sk_damage_dx_score`, `sk_damage_dy_score`, and `sk_damage_db_score`.

**Artifacts:** `src/damage/calculator.py`, `monitoring/windows.py`, `evidently_adapter.py`, `labels/`, `policies/dari_policy.py`, fixtures.

**Exit gate G4:** controlled shift produces reproducible $D_X, D_Y, D_B$ values; benign covariate shift shows high $D_X$ with zero $D_Y$; missing labels cleanly yields $D_Y = \text{None}$ and pauses repair.

## Phase 5 — DARI Decision Engine, LangGraph Orchestration and Tiered Remediation

**Window:** Week 3. **Lead:** B/A; C enforces subprocess limits; D workflow view. **Prerequisite:** G3/G4. **Reference:** 06 Agents, 09 Self-Healing.

### Steps
**5.1 — Implement DARI tool contracts before agent reasoning.** Provide typed tools for:
- `compute_damage_fingerprint(window_id, reference_id)`
- `select_dari_repair(fingerprint, policy_revision)`
- `calibrate_threshold(window_id, champion_id, objective)`
- `freeze_snapshot(plan_id, label_cutoff)`
- `train_candidate(snapshot_id, repair_level, resource_budget)`

**5.2 — Complete the durable lifecycle queue.** Add job state, lease/heartbeat, attempts, cancellation, operation effects, and terminal reasons. Reconcile external side effects after ambiguous failures.

**5.3 — Implement the DARI Selector (`src/dari/selector.py`).**
1. Filter infeasible actions based on hard constraints ($Q, L, S, R$ and security bounds).
2. Compute expected net utility:
   $$U(A_i) = R(A_i) - \lambda C(A_i) - \gamma G(A_i)$$
3. Output optimal action $A^* = \arg\max U(A_i)$ among $\{A0, A1, A2, A3\}$. Build **only** the selected candidate.

**5.4 — Build the DARI-branching LangGraph workflow.**
- Connect: `Trigger → Validate Q → Compute Damage (Dx, Dy, Db) → Evidence Gate → DARI Selector`.
- Conditional branch on $A^*$:
  - **A0:** Direct transition to `AuditNode` (log compute/labels saved; finish).
  - **A1:** Transition to `CalibrateThresholdNode` (optimize $\theta^*$; validate against safety constraints; stage hot threshold update).
  - **A2:** Transition to `LocalAdaptationNode` (subspace re-weighting / targeted update).
  - **A3:** Transition to `FreezeSnapshotNode` $\to$ `FullRetrainNode` (replay + recent data).
- Route passing A2/A3 candidates to paired evaluation and dual-slot canary deployment.

**5.5 — Implement Level A1 threshold search.** Use calibration methods (Youden's J statistic, ROC curve search, or Platt scaling) on the development calibration window. Test sub-second execution without container or Nginx rebuild.

**5.6 — Assemble eligible training snapshots for A2/A3.** Join verified labels available by cutoff, combine approved recent and historical replay blocks, and publish an immutable DVC snapshot before training starts.

**5.7 — Execute bounded subprocess retraining for A3.** Run allowlisted LightGBM/RF fit in an isolated subprocess with hard time, memory, and thread limits. Log bundle, parameters, and operation ID to MLflow.

**5.8 — Add cross-job guardrails & bounded LLM explainer.** Cooldown, budget limits, and failed-candidate quarantine. Behind an optional flag, allow the LLM to generate natural language explanations of the DARI utility decision for operator review; deny LLM authority over deterministic safety gates.

**5.9 — Expose DARI workflow evidence in UI.** Show damage fingerprint ($D_X, D_Y, D_B$), selected repair tier ($A0–A3$), utility breakdown, and cumulative compute/label savings.

**Artifacts:** `src/dari/selector.py`, `src/dari/calibration.py`, `agents/graph.py`, `tools/`, `training/runner.py`, DARI workflow views.

**Exit gate G5:** an eligible shift scenario causes DARI to select the correct repair tier ($A0, A1, \text{or } A3$); $A1$ executes hot calibration without retraining; $A3$ produces exactly one reproducible DVC/MLflow candidate. Worker restarts recover safely.

## Phase 6 — Candidate evaluation and approval gates

**Window:** late Week 3 → Week 4. **Lead:** A/B; D review interface. **Prerequisite:** G3 and a candidate from G5. **References:** 07, 08.

### Steps
**6.1 — Freeze comparison policy before inspecting outcomes.** Agree primary objective, non-regression constraints, class-support requirements, uncertainty method, resource budgets and practical margins with the advisor/team. Version those choices.

**6.2 — Construct governed promotion evidence.** Preserve event/label revision and availability cutoff; exclude training/preprocessing-selection events. Include a historical regression suite. Keep the sealed scientific test out of recurring candidate selection.

**6.3 — Score both releases on the same events.** Store paired scores/predictions, thresholds, class ordering and release identities. Reject mismatched feature/target definitions rather than compare unrelated MLflow run metrics.

**6.4 — Compute quality and uncertainty.** Report class support, AP, recall, FPR, F1 and relevant per-class metrics. Use defensible capture/scenario clusters or temporal blocks for paired uncertainty; document assumptions and sparse evidence. Repeated seeds do not create independent network samples.

**6.5 — Implement PASS/FAIL/INCONCLUSIVE.** Check provenance, contamination, quality, resource budget and bundle validity. Insufficient evidence is not a pass. Bound repeated candidate testing against the same evidence to avoid adaptive holdout overfitting.

**6.6 — Create immutable evaluation evidence.** Bind candidate checksum, predecessor release, snapshot/split IDs, policy revision, metrics and gate outcomes into a report hash.

**6.7 — Implement approval/resume.** In supervised mode, an authenticated approval binds that hash, exact candidate, predecessor generation and expiry. Recheck on resume. Full-auto replay still passes the same deterministic tests; it only omits the human wait when policy allows.

**6.8 — Test the failure matrix.** Worse candidate, better average but failed guarded class, insufficient labels, artifact mismatch, stale approval and changed predecessor must all stop correctly. The UI displays the actual reason.

**Artifacts:** `evaluation/compare.py`, `statistics.py`, `gates.py`, `approvals/`, immutable reports, model-comparison UI.

**Exit gate G6:** pass, reject and inconclusive are reproducible outcomes; no proposal reaches the deployment controller without valid evidence and authorization. A scientific uncertainty limitation cannot be erased by human approval.

## Phase 7 — Canary controller and verified rollback

**Window:** prototype in Week 2/3; real gated rollout complete Week 4. **Lead:** C/B; A validates bundle compatibility; D controls/status. **Prerequisite:** G2/G3 for controller development; G6 before real candidate promotion. **References:** 09, 12.

### Steps
**7.1 — Prepare two fixed serving slots.** Pin exact images/bundles; implement readiness, identity and warm-up probes. Keep the same external feature contract. Staging B must not restart A.

**7.2 — Implement deployment records.** Store expected, desired and observed generations, slot identities, evidence/approval references, weights, predecessor and operation state. Return 202 on intent acceptance—not 'deployment successful'.

**7.3 — Build one narrowly privileged controller.** All routing writers share a host lock, current lease/fence checks and a local mutation journal. No Docker socket or arbitrary command execution in the API or LLM tools.

**7.4 — Validate the private network path.** Host Nginx reaches loopback-published slots; container consumers reach a verified private host bridge listener with firewall/service authentication. Test actual addresses; container localhost is not host localhost.

**7.5 — Implement apply-and-observe.** Render configuration from fixed templates, validate, atomically install, reload, probe fresh connections and record generation plus actual release. Reconcile crashes between preparation, application and acknowledgement.

**7.6 — Add optional shadow then bounded canary.** Shadow outputs have separate purpose and never create production alerts. Canary weights are approximate request shares; record actual flow/request share and retries. Apply calibrated sample/dwell/support rules before progression.

**7.7 — Run an independent watcher.** Observe readiness, errors, latency/resources, telemetry freshness and applicable labelled quality. Missing metrics pauses progression. Confidence changes alone are not proof the new detector is worse.

**7.8 — Implement deterministic warm rollback.** Validate the predecessor is still loaded/ready, apply a new routing generation, verify actual restoration and quarantine the failed release. Record fault→detect→decision→new-route→drain timings separately.

**7.9 — Enforce draining and slot retention.** A new-generation probe does not prove old workers have stopped. Bound request/connection lifetimes; retain slots until drain criteria pass or an explicit forced deadline records interruptions. Do not overwrite the predecessor with the next candidate during stabilization.

**7.10 — Define outage behavior.** DB outage blocks normal transitions while applied routing persists. Either implement and test a restricted local emergency rollback with a journal/hold marker and later reconciliation, or document that rollback is unavailable in that failure. Never silently reapply a failed canary after recovery.

**7.11 — Integrate protected UI actions and CI/CD.** Display desired/applied/drained state, slot identity and watchdog freshness. Use digest-pinned application releases and trusted deployment workflows serialized with the controller; model-only updates do not rebuild images unnecessarily.

**Exit gate G7:** stage, canary, promotion and warm rollback are observed under concurrent traffic; stale/duplicate mutations fail safely; restart-after-reload reconciles correctly; drain behavior and failure limits are measured, not called 'zero downtime' by assumption.

## Phase 8 — Integrated experiments and conditional live pilot

**Window:** Week 5; begin fixtures earlier. **Lead:** all four. **Prerequisite:** G1–G7. **References:** 10 Monitoring, 11 Application Flow.

### Steps
**8.1 — Automate the full replay scenario.** Start from R1; replay stable traffic; enter a declared change scenario; release labels independently; monitor; retrain; evaluate; stage; canary; promote or roll back. Record all event/data/release/policy IDs and source versus wall-clock time.

**8.2 — Build mandatory negative scenarios.** No labels, harmless distribution change, sensor/schema fault, rejected candidate, insufficient class support, duplicate trigger, interrupted training, stale approval, missing watcher metrics and unavailable predecessor.

**8.3 — Compare DARI against honest baselines.** Evaluate four distinct strategies on identical traffic streams, label delay schedules, and seed sets:
1. *Static Champion:* No adaptation (measures raw degradation under drift).
2. *Periodic Retraining:* Scheduled time-based adaptation (measures blind cost).
3. *Drift $\to$ Full Retrain (EGA-v2):* Re-trains full candidate whenever drift is detected and labels pass (measures reactive churn).
4. *DARI (Proposed):* Damage fingerprint $F_t \to$ repair ladder $A0–A3 \to$ utility maximization.
*Key DARI Evaluation Metrics:* Unnecessary A3 rate, decision regret vs oracle, cumulative compute hours saved, label savings, recovery time, and attack recall non-regression.

**8.4 — Measure resources and reliability.** Load the host with capture/replay, queued inference, two loaded models and training. Measure queue age, capture loss, errors, latency components, training cost and rollback outcomes. Apply backpressure; do not hide dropped work.

**8.5 — Perform recovery drills.** Restart each worker at effect boundaries, interrupt registration, crash controller after reload, restart DB and restore a backup to a clean environment. Inspect journal/DB/route reconciliation rather than trusting status text alone.

**8.6 — Run the conditional live pilot.** Only after authorization, sensor visibility, extractor parity, resource and operator-access checks pass. Capture real traffic through the same adapter; show advisory detections and operational evidence. Without independently verified labels, report no live F1/recall claims and hold autonomous quality-based promotion.

**8.7 — Freeze experiment evidence.** Save snapshot/split/label revisions, seeds/scenarios, model/evaluation manifests, policy, metrics and all pass/hold/reject/fail results. Choose replication count with the advisor according to independent scenarios and cost; do not report one successful run as general reliability.

**Artifacts:** `tests/e2e/`, `experiments/scenarios/`, experiment index, load/fault reports, authorized-pilot notes, demo script.

**Exit gate G8:** successful and failed paths are reproducible; the report distinguishes engineering functionality, model-quality evidence and remaining limitations. If live access fails, deliver an explicitly replay-based demonstration and keep the live-pilot gate open.

## Phase 9 — Stabilization, reproducible release and academic handoff

**Window:** Week 6. **Lead:** all four. **Prerequisite:** G8 or an explicit reduced-scope report.

### Steps
**9.1 — Freeze architecture and scope.** No new datasets, brokers, deployment platforms or agent roles. Fix critical bugs and documentation mismatches only; defer enhancements.

**9.2 — Pin and retain the release.** Record Git tag/SHA, dependency locks (`uv.lock`), image digests, dataset/model artifacts and effective policy. Retain predecessor and restoration data; verify registry/DVC retention does not delete referenced objects.

**9.3 — Rehearse from a clean environment.** Follow the setup guide, pull required data/artifacts, migrate DB, start services, validate identity/readiness and run the deterministic demo. Document manual prerequisites and actual setup effort.

**9.4 — Complete operational runbooks.** Start/stop, sensor permissions, quotas, label review, approve/reject, rollback, restore, rotate credentials and clear a demo safely. Ordinary deployment scripts must not delete persistent volumes.

**9.5 — Prepare the faculty report.** State problem, architecture, data/label protocol, baselines, measured outcomes, failure cases, cost and limitations. Frame novelty as the evaluated contribution; do not infer that nobody has built a similar system.

**9.6 — Prepare two presentations of the demo.** A live script with reset-to-known-good procedure and a recorded backup from the same identified release. Screenshots must show replay/live mode and unavailable metrics honestly.

**9.7 — Hold a team acceptance review.** Walk through the gate checklist, assign owners to unresolved issues, and separate defects from next-semester enhancements. Capture advisor feedback in the roadmap.

**Final MVP acceptance:** a reviewer can reconstruct R1 and a candidate; observe a complete eligible lifecycle; see no-label abstention and candidate rejection; verify actual rollback identity; inspect data/evaluation lineage; and understand exactly what the live pilot did or did not establish.

A working supervised lifecycle is a valid reduced-scope outcome, but must not be described as a completed full-auto MVP if autonomous promotion remains unfinished.

## First-week execution sequence and repository map

## First-week starting sequence
These are sequencing anchors, not hourly estimates. A later item may start against fixtures, but it cannot claim completion without its real dependency.

| Working day | Shared objective | Parallel work |
|---|---|---|
| 1 | Agree scope and contracts | A inventories data; B defines schemas/migrations; C initializes `uv` toolchain (`pyproject.toml`, `uv.lock`, `.python-version`) & verifies Linux/runtime/network; D builds typed UI fixtures |
| 2 | Prove feature and serving feasibility | A/C extract known PCAP and load a small model; B implements receipt/job path; D builds overview/alerts |
| 3 | Connect the first vertical slice | A supplies R1/feature fixtures; B/C wire inference and persistence; D renders real API results |
| 4 | Make the slice fail honestly | Test duplicates, invalid features, model/DB errors and restart; start DVC/MLflow round-trip spike |
| 5 | Demonstrate and close Week 1 risks | Show stored prediction with actual release; record unfinished gates; settle Week 2 lineage/monitoring tasks |

Do not spend all of Week 1 polishing model accuracy or installing the entire observability stack. Prove the feature→prediction contract and major infrastructure risks early.

## Suggested monorepo
```text
swayamkavach/
  .python-version
  pyproject.toml
  uv.lock
  docs/decisions/
  schemas/
  policies/
  src/swayamkavach/
    api/
    db/migrations/
    features/
    replay/
    labels/
    monitoring/
    training/
    evaluation/
    agents/
    jobs/
    serving/
    deployment/
    inference_consumer.py
  frontend/
  infra/
    compose/
    nginx/
    prometheus/
    grafana/
  manifests/
  releases/
  experiments/scenarios/
  tests/
    unit/
    contracts/
    integration/
    e2e/
  .github/workflows/
  dvc.yaml
  params.yaml
```

Use these names as an initial convention, not a reason to reorganize existing code without inspection. Bulk datasets/model artifacts belong in governed storage, not Git. Deployment privileges belong in the narrow controller even if its source sits in this monorepo.

## Task completion template
For every numbered step create a ticket containing: phase/step ID; owner and reviewer; dependencies; implementation scope; expected file/API/schema changes; test command/fixture; expected result; evidence link; failure/rollback behavior; unresolved decisions. 'Done' means merged, tested and demonstrated—not merely that code exists.

## Acceptance matrix and scope-cut rules

## Minimum acceptance matrix
| Test | Gate | Required observation |
|---|---|---|
| Feature fixture/parity | G1 | Correct schema, units, direction and preprocessing |
| Duplicate batch | G2 | One authoritative committed prediction/alert; attempts visible |
| DB unavailable at receipt | G2 | No false durable-acceptance response |
| Fresh DVC/MLflow restore | G3 | Exact referenced data/model available and loadable |
| Labels unavailable | G4/G5 | Hold with reason; no fabricated quality |
| Sensor/schema fault | G4 | Incident/quarantine rather than blind retraining |
| Worker dies during an external effect | G5 | Reconciliation without duplicate logical side effect |
| Candidate fails guardrail | G6 | Reject despite attractive aggregate metric |
| Evidence/approval becomes stale | G6/G7 | Conflict; no mutation |
| Controller crashes after reload | G7 | Observed route reconciled against journal/DB |
| Canary health breach | G7 | Exact healthy predecessor restored or explicit failure |
| New route active, old workers still alive | G7 | Not falsely labeled fully drained |
| Training competes with inference | G8 | Limits/backpressure work; measured degradation reported |
| Fresh host/backup restore | G9 | Repeatable documented recovery |

## Scope cuts if behind schedule
**Remove first:** extra datasets, multiclass, fancy charting, SSE when polling suffices, extensive tuning, multiple LLM agents, optional shadow phase if resources do not permit, external notification integrations and publication-paper polish.

**Simplify carefully:** use one estimator family for the recovery loop after baseline comparison; one worker and one model namespace; smaller representative data snapshots; a simple supervised pilot; basic account roles rather than elaborate tenancy. Record the resulting limitations.

**Do not remove while keeping the original claims:** feature validity, trusted label provenance, immutable lineage, held-out evaluation, deterministic safety gates, known serving identity, actual rollback verification or disclosure of missing data.

**End-of-Week-2 checkpoint:** if the baseline cannot be restored/served reliably, stop LLM/UI expansion and fix the core. **End-of-Week-4 checkpoint:** if canary/rollback is not verified, freeze optional work; demonstrate a supervised/reduced-scope system honestly rather than faking automatic deployment. **Week 6:** no new architecture.

## Review cadence
Use short daily blocker/integration checks and a weekly shared demo against a gate. Keep shared contract changes reviewed by both producer and consumer owners. Schedule advisor reviews around data/split decisions, promotion criteria and final experiment interpretation—not only final slides.

## Next-semester extension phases and technical references

## Extension Phase E1 — Better labels and detection quality
1. Analyze MVP failure cases and label-selection bias.
2. Add an independent adjudication/sample-review process and evaluate realistic label delays.
3. Extend to multiclass only with adequate support and explicit unknown-family limitations.
4. Evaluate rare-attack recall, calibration and device/scenario generalization.
**Gate:** improvement on independently held-out evidence without unacceptable false-alert burden.

## Extension Phase E2 — External validity and earlier detection
1. Re-extract a suitable second dataset through a common feature contract; do not rename incompatible CSV fields.
2. Evaluate train-A/test-B transfer separately from retraining on B.
3. Explore partial-flow/fixed-window features for faster alerts and retrain accordingly.
4. Measure capture loss, encrypted-traffic limitations and unseen-device behavior in an authorized longer pilot.
**Gate:** documented schema parity and credible external-validation/latency evidence.

## Extension Phase E3 — Adaptive planning and learning
1. Compare deterministic decisions with bounded LLM plan selection under equal data/budget.
2. Measure proposal correctness, unsafe proposals blocked, cost and actual operator-review effort.
3. Consider active learning, replay selection or online learners only after labels/evaluation are trustworthy.
4. Add adversarial telemetry/prompt-injection and poisoning-resistance tests.
**Gate:** measurable benefit over the simpler baseline without weakening safety.

## Extension Phase E4 — Operational resilience
1. Resolve single-host bottlenecks and measured recovery failures first.
2. Add off-host training or additional warm rollback capacity if justified.
3. Evaluate durable broker/multi-host deployment only when scale or availability requirements demand it.
4. Strengthen independent audit anchoring, secret management and recovery testing.
**Gate:** tested recovery objectives and costs, not an architecture diagram claiming HA.

## Technical reference map
This roadmap derives from the twelve SwayamKavach research documents already produced; consult them for full rationale and citations. Key implementation references:
- [TON_IoT dataset](https://research.unsw.edu.au/projects/toniot-datasets) and [Zeek conn.log](https://docs.zeek.org/en/current/logs/conn.html): P1/P8 feature and capture work.
- [FastAPI background-work caveat](https://fastapi.tiangolo.com/tutorial/background-tasks/): P2/P5 process separation.
- [DVC pipeline metadata](https://doc.dvc.org/user-guide/project-structure/dvcyaml-files) and [MLflow registry workflow](https://mlflow.org/docs/latest/ml/model-registry/workflow/): P3/P6 lineage and release identity.
- [Evidently migration](https://docs.evidentlyai.com/faq/migration) and [drift customization](https://docs.evidentlyai.com/metrics/customize_data_drift): P4 version-specific monitoring.
- [LangGraph interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts): P5/P6 durable approval and restart semantics.
- [Nginx upstreams](https://nginx.org/en/docs/http/ngx_http_upstream_module.html) and [reload control](https://nginx.org/en/docs/control.html): P7 routing/draining.
- [Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/) and [GitHub Actions security](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions): P0/P7/P9 infrastructure.

All new thresholds, hardware budgets and estimator results must come from the implementation's own calibration and measurements. Approval of this plan authorizes preparation of the roadmap, not external infrastructure changes or collection of network traffic.

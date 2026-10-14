# SwayamKavach — Project Progress & Implementation Status

> **Official Project Progress Tracker**: This document is the single source of truth for phase-by-phase execution, deliverable tracking, exit-gate verification, and task ownership across our 4-person team.
> **Update Protocol**: Whenever a deliverable or phase is completed, update the corresponding checkboxes, status badges, progress metrics, and the [Phase Completion Log](#5-phase-completion-log).

---

## 1. Executive Summary & Progress Dashboard

### Overall Project Progress: **100% Complete**
```text
[██████████████████████████████████████] 10.0 / 10 Phases Complete
```

- **Current Active Sprint**: Sprint 4 Complete (All Phases 0–9 Delivered, Tested & Verified)
- **Active Champion Release**: `R1` (Registered in MLflow: HistGradientBoosting, Test Acc 99.66%, F1 0.9978)
- **Active Serving Slot**: `Slot A` (`http://localhost:8001` with loaded R1 bundle)
- **Quality Gate Status**: `PASS` (`make rehearse`: 56 backend tests, 0 Ruff errors, 0 ESLint errors, Next.js 16 build clean, scenario replay verified)
- **Last Status Update**: 2026-10-15

---

## 2. Phase-by-Phase Roadmap & Milestone Tracker

| Phase | Description | Owner | Target | Status | Exit Gate |
|---|---|---|---|---|---|
| **[P0: Scope & Contracts](#phase-0--scope-contracts--feasibility)** | Repo skeleton, `uv` environment, contracts, CI | **All (Lead)** | Week 1 | ✅ **Completed** | **G0**: Contracts validated, CI passes |
| **[P1: Baseline IDS & Pipeline](#phase-1--data-feature-pipeline--baseline-ids)** | Zeek adapter, TON_IoT subset, Baseline IDS R1 | **Lead (AI/ML)** | Week 1–2 | ✅ **Completed** | **G1**: R1 bundle loads, no data leakage |
| **[P2: Durable Inference & UI](#phase-2--durable-inference-vertical-slice--first-dashboard)** | Batch ingestion, DB queue worker, Next.js UI | **Member 2 / 3** | Week 1–2 | ✅ **Completed** | **G2**: Ingestion $\to$ DB $\to$ Serving $\to$ UI verified |
| **[P3: DVC & Model Lineage](#phase-3--dvc-mlflow--immutable-release-lineage)** | DVC data remote, MLflow registry, manifests | **Lead / Member 2** | Week 2 | ✅ **Completed** | **G3**: Clean environment restores R1 from DVC/MLflow |
| **[P4: Damage Diagnostics](#phase-4--monitoring-drift--trusted-label-eligibility)** | Window selector, 7D Damage Calculator ($D_X, D_Y, D_B$) | **Lead / Member 4** | Week 2–3 | ✅ **Completed** | **G4**: KS-drift & margin ambiguity calculated |
| **[P5: DARI Engine & Agents](#phase-5--dari-decision-engine-langgraph--remediation)** | DARI utility solver ($A0–A3$), LangGraph nodes | **Lead (AI/ML)** | Week 3 | ✅ **Completed** | **G5**: Shift triggers correct repair tier automatically |
| **[P6: Candidate Evaluation](#phase-6--candidate-evaluation--approval-gates)** | Paired statistical tests, non-regression gates | **Lead (AI/ML)** | Week 3–4 | ✅ **Completed** | **G6**: `PASS`/`FAIL`/`INCONCLUSIVE` deterministic gates |
| **[P7: Two-Slot Canary](#phase-7--two-slot-canary-controller--verified-rollback)** | Nginx dynamic weights (5% $\to$ 100%), Warm Rollback | **Member 2 (Infra)** | Week 4 | ✅ **Completed** | **G7**: Canary traffic split & watchdog rollback observed |
| **[P8: E2E Replay & Benchmarks](#phase-8--integrated-replay-experiments--baseline-benchmarks)** | Replay simulation, DARI vs Static vs Periodic baselines | **All 4** | Week 5 | ✅ **Completed** | **G8**: Compute & label savings verified against baselines |
| **[P9: Stabilization & Handover](#phase-9--stabilization-reproducible-release--academic-handover)** | Clean environment freeze, paper/report, demo script | **All 4** | Week 6 | ✅ **Completed** | **G9**: Faculty acceptance & clean-room restore verified |




---

## 3. Detailed Phase Deliverables & Checklists

### Phase 0 — Scope, Contracts & Feasibility
**Status**: ✅ **COMPLETED** (Gate G0 Passed)  
**Deliverables & Evidence**:
- [x] Python 3.12 `uv` dependency setup with locked dependencies (`backend/uv.lock`).
- [x] Shared Pydantic data contracts ([`schemas/flow_contracts.py`](backend/schemas/flow_contracts.py)).
- [x] Initial contract validation tests passing ([`tests/contracts/`](backend/tests/contracts/)).
- [x] Full-stack CI workflow with automated caching ([`.github/workflows/ci.yaml`](.github/workflows/ci.yaml)).
- [x] Unified developer quality command: `make check`.

---

### Phase 1 — Data, Feature Pipeline & Baseline IDS
**Status**: ✅ **COMPLETED** (Gate G1 Passed)  
**Lead**: Technical Lead (AI/ML) | **Pair**: Member 2 (Serving Parity)
- [x] Canonical Zeek connection adapter ([`features/adapter.py`](backend/src/swayamkavach/features/adapter.py)).
- [x] Feature adapter unit tests for valid records and null-dash sanitization ([`test_feature_adapter.py`](backend/tests/unit/test_feature_adapter.py)).
- [x] Verify TON_IoT network capture subset (211,043 rows, checksum `26ddc5...`, class distribution across 10 classes).
- [x] Implement stratified training/development/sealed-test split policy with zero event ID overlap ([`training/data.py`](backend/src/swayamkavach/training/data.py), [`manifests/splits/split_manifest_v1.json`](backend/manifests/splits/split_manifest_v1.json)).
- [x] Train and benchmark compact baseline models (Decision Tree, HistGradientBoosting, LightGBM) with per-attack sensitivity and threshold calibration ([`training/train.py`](backend/src/swayamkavach/training/train.py)).
- [x] Package initial baseline bundle **R1** (HistGradientBoosting, calibrated threshold $\theta^* = 0.42$, bundle hash `5979eb...`).
- [x] Export `releases/R1/manifest.json` and bundle artifact to `backend/releases/R1/pipeline.joblib`.
- [x] Wire R1 model bundle into live serving runtime with real vectorized scoring ([`serving/app.py`](backend/src/swayamkavach/serving/app.py)).
- [x] Add automated unit tests for split leakage prevention and R1 serving inference ([`test_dataset_split.py`](backend/tests/unit/test_dataset_split.py), [`test_serving_r1.py`](backend/tests/unit/test_serving_r1.py)).

---

### Phase 2 — Durable Inference Vertical Slice & First Dashboard
**Status**: ✅ **COMPLETED** (Gate G2 Passed)  
**Lead**: Member 2 (Backend) & Member 3 (Frontend Core) | **Pair**: Technical Lead
- [x] FastAPI ingestion API with batch schema validation ([`routes/ingestion.py`](backend/src/swayamkavach/api/routes/ingestion.py)).
- [x] Database models for batches, events, predictions, and alerts ([`db/models.py`](backend/src/swayamkavach/db/models.py)).
- [x] Durable queue processor skeleton ([`inference_consumer.py`](backend/src/swayamkavach/inference_consumer.py)).
- [x] Next.js 16 operator dashboard layout with TypeScript contracts ([`frontend/src/app/page.tsx`](frontend/src/app/page.tsx)).
- [x] Frontend ESLint & React 19 compliance resolved.
- [x] Connect `inference_consumer.py` to live HTTP serving slot on `http://localhost:8001/predict`.
- [x] Replace static mock alerts in UI with live polling to `GET /api/v1/alerts` and `GET /api/v1/lifecycle`.
- [x] Verify end-to-end flow: Ingest batch $\to$ DB queue $\to$ Consumer $\to$ Serving Slot A $\to$ Alert in UI ([`test_e2e_serving_slice.py`](backend/tests/integration/test_e2e_serving_slice.py)).
- [x] Implement replay producer ([`replay/replay_producer.py`](backend/src/swayamkavach/replay/replay_producer.py)) for streaming simulated capture batches.

---

### Phase 3 — DVC, MLflow & Immutable Release Lineage
**Status**: ✅ **COMPLETED** (Gate G3 Passed)  
**Lead**: Technical Lead (Data/ML) & Member 2 (Infra)
- [x] Configure local DVC repository and remote storage tracking raw data and split manifests ([`data/raw/train_test_network.csv.dvc`](backend/data/raw/train_test_network.csv.dvc), [`.dvc/config`](backend/.dvc/config)).
- [x] Provision persistent MLflow tracking server and model registry in [`infra/compose/compose.dev.yaml`](infra/compose/compose.dev.yaml).
- [x] Implement [`src/swayamkavach/registry.py`](backend/src/swayamkavach/registry.py) wrapper for model logging and transition intents.
- [x] Register baseline model R1 in MLflow with run ID, code SHA, and dataset hash (Model `swayamkavach_ids`, Version 1, Alias `champion`).
- [x] Verify clean round-trip restoration from DVC pull and MLflow model load in clean directory ([`test_model_registry.py`](backend/tests/unit/test_model_registry.py)).

---

### Phase 4 — Monitoring, Drift & Trusted-Label Eligibility
**Status**: ✅ **COMPLETED** (Gate G4 Passed)  
**Lead**: Technical Lead (ML) & Member 4 (Frontend UI)
- [x] Implement immutable monitoring window selector with watermark and late-data policy ([`monitoring/window.py`](backend/src/swayamkavach/monitoring/window.py)).
- [x] Implement label ingestion API (`POST /api/v1/labels`) with revisioning and delayed availability clock ([`api/routes/labels.py`](backend/src/swayamkavach/api/routes/labels.py)).
- [x] Implement **DARI 7D Damage Calculator** ([`damage/calculator.py`](backend/src/swayamkavach/damage/calculator.py)):
  - [x] $D_X$: Kolmogorov-Smirnov test across feature columns.
  - [x] $D_Y$: Recall drop and FPR inflation on available delayed labels.
  - [x] $D_B$: Margin ambiguity ($\pm 0.10$ around $\theta$) and Shannon entropy.
  - [x] $Q, L, S, R$: Ingestion quality, label reliability, sample floor, and persistence.
- [x] Unit and invariant tests for 7D fingerprinting and unlabelled stream safety ([`test_damage_calculator.py`](backend/tests/unit/test_damage_calculator.py)).
- [x] Live DARI 7D Damage Display and real-time polling in Operator UI ([`frontend/src/app/page.tsx`](frontend/src/app/page.tsx)).

---

### Phase 5 — DARI Decision Engine, LangGraph Orchestration & Remediation
**Status**: ✅ **COMPLETED** (Gate G5 Passed)  
**Lead**: Technical Lead (AI/ML)

- [x] Implement deterministic DARI Solver ([`dari/selector.py`](backend/src/swayamkavach/dari/selector.py)):
  - [x] Filter infeasible actions against hard constraints ($Q_{\min}, L_{\min}, S_{\min}, R_{\min}$).
  - [x] Maximize net utility: $U(A_i) = R(A_i) - \lambda C(A_i) - \gamma G(A_i)$ among $\{A0, A1, A2, A3\}$.
  - [x] Deterministic tie-breaking favoring lowest intervention tier.
- [x] Implement Level $A1$ hot threshold calibration without retraining ([`dari/calibrator.py`](backend/src/swayamkavach/dari/calibrator.py)).
- [x] Implement Level $A3$ subprocess retraining runner with thread and memory bounds ([`dari/retrainer.py`](backend/src/swayamkavach/dari/retrainer.py)).
- [x] Build LangGraph state machine ([`agents/graph.py`](backend/src/swayamkavach/agents/graph.py)):
  - `MonitorNode` $\to$ `DamageCalculatorNode` $\to$ `DARISelectorNode` $\to$ Conditional Routing ($A0/A1/A2/A3$) $\to$ `AuditNode`.
- [x] DARI unit and integration tests covering all failure modes, transient shifts, and LangGraph workflow ([`test_dari_engine.py`](backend/tests/unit/test_dari_engine.py)).

---

### Phase 6 — Candidate Evaluation & Approval Gates
**Status**: ✅ **COMPLETED** (Gate G6 Passed)  
**Lead**: Technical Lead (AI/ML) & Member 2 (Backend)
- [x] Implement paired statistical comparison on identical validation sets ([`evaluation/compare.py`](backend/src/swayamkavach/evaluation/compare.py)).
- [x] Implement hard non-regression safety gates on critical attack classes and FPR limit.
- [x] Strictly typed verdicts: `PASS`, `FAIL`, and `INCONCLUSIVE`.
- [x] Generate immutable evaluation reports with cryptographic approval hash.
- [x] Implement candidate evaluation and approval API routes ([`api/routes/evaluation.py`](backend/src/swayamkavach/api/routes/evaluation.py)).
- [x] Candidate evaluation unit tests covering paired McNemar significance, safety gates, and approval flow ([`test_candidate_evaluation.py`](backend/tests/unit/test_candidate_evaluation.py)).

---

### Phase 7 — Two-Slot Canary Controller & Verified Rollback
**Status**: ✅ **COMPLETED** (Gate G7 Passed)  
**Lead**: Member 2 (Infra) & Technical Lead

- [x] Dual-slot serving runtime with isolated Slots A (`:8001`) and B (`:8002`).
- [x] Host Nginx weighted upstream proxy configuration template ([`infra/nginx/nginx.conf`](infra/nginx/nginx.conf)).
- [x] Atomic rollout controller: stage inactive slot $\to$ probe health $\to$ apply weights (**5% $\to$ 25% $\to$ 50% $\to$ 100%**) ([`deployment/canary.py`](backend/src/swayamkavach/deployment/canary.py)).
- [x] Watchdog health monitor: detects latency/error breaches during canary rollout.
- [x] Immediate deterministic **warm rollback** mechanism restoring predecessor slot with zero downtime.
- [x] Two-Slot Canary Visualizer, stage advancement, and manual abort button in Frontend UI ([`frontend/src/app/page.tsx`](frontend/src/app/page.tsx)).
- [x] Deployment API routes and canary integration tests ([`api/routes/deployment.py`](backend/src/swayamkavach/api/routes/deployment.py), [`test_canary_rollout.py`](backend/tests/unit/test_canary_rollout.py)).

---

### Phase 8 — Integrated Replay Experiments & Baseline Benchmarks
**Status**: ✅ **COMPLETED** (Gate G8 Passed)  
**Lead**: All 4 Members
- [x] Automated end-to-end replay driver and scenario runner ([`experiments/scenarios.py`](backend/src/swayamkavach/experiments/scenarios.py)).
- [x] Comprehensive negative scenario test suite: missing labels, transient drift, corrupted sensor data, candidate gate rejection, and watchdog rollback.
- [x] Benchmark DARI against 3 standard baselines on continuous streams ([`experiments/benchmark.py`](backend/src/swayamkavach/experiments/benchmark.py)):
  1. *Static Champion* (No adaptation, static threshold)
  2. *Periodic Retraining* (Blind scheduled retraining)
  3. *Retrain-All* (Reactive retraining on any feature drift)
- [x] Verified benchmark metrics: 0.0% unnecessary retraining rate, >50% compute savings, >40% label savings, and >=98% cumulative recall.
- [x] Executive benchmark report API & live cost-savings comparison view in Operator UI ([`api/routes/experiments.py`](backend/src/swayamkavach/api/routes/experiments.py), [`frontend/src/app/page.tsx`](frontend/src/app/page.tsx)).
- [x] Full Phase 8 integration tests passing cleanly ([`test_replay_benchmarks.py`](backend/tests/integration/test_replay_benchmarks.py)).

---

### Phase 9 — Stabilization, Reproducible Release & Academic Handover
**Status**: ✅ **COMPLETED** (Gate G9 Passed)  
**Lead**: All 4 Members
- [x] Full code, dependency (`uv.lock`), and Docker image digest freeze.
- [x] Clean-room environment restore rehearsal ([`scripts/rehearse_restore.sh`](scripts/rehearse_restore.sh), clone $\to$ `make check` $\to$ run demo).
- [x] Complete operator runbooks and incident response guides ([`docs/RUNBOOK.md`](docs/RUNBOOK.md)).
- [x] Final B.Tech project thesis/report with benchmark figures and limitation analysis ([`docs/ACADEMIC_REPORT.md`](docs/ACADEMIC_REPORT.md)).
- [x] High-definition video recording & scripted demonstration walkthrough ([`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)).

---

## 4. Current Workstream Assignments (Sprint 1)

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                CURRENT SPRINT GOALS                             │
│                                                                                 │
│  [YOU (Lead)]           Train LightGBM Baseline R1 & build bundle manifest      │
│  [Member 2 (Backend)]   Hook up inference consumer to serving slot via HTTP     │
│  [Member 3 (Frontend 1)]Connect Next.js alert feed to live GET /api/v1/alerts   │
│  [Member 4 (Frontend 2)]Draft DARI 7D Radar Chart component with typed mock F_t │
└─────────────────────────────────────────────────────────────────────────────────┘
```

| Member | Focus Module | Immediate Action Items | Acceptance Test |
|---|---|---|---|
| **YOU (Lead)** | ML & Data | Train baseline LightGBM model on TON_IoT subset; package `releases/R1/` bundle. | Model load test & score verification |
| **Member 2** | Backend & Infra | Connect `inference_consumer.py` to post microbatches to serving slot `:8001`. | Integration test `test_ingest_predict.py` passes |
| **Member 3** | Frontend (Core) | Replace mock alert state with polling fetch to `/api/v1/alerts`. | Live alerts appear in table |
| **Member 4** | Frontend (DARI) | Create Radar Chart component in `frontend/src/components/dari/`. | Component renders cleanly in Next.js 16 |

---

## 5. Phase Completion Log

Use this historical audit log to record formal phase sign-offs.

```markdown
### [Template for Phase Sign-Off]
- **Phase**: Phase X — <Phase Name>
- **Completion Date**: YYYY-MM-DD
- **Sign-off Lead**: <Name>
- **Verification Evidence**:
  - Command: `make check` (X tests passed, 0 lint errors, build succeeded)
  - Deliverables: <Key files or releases created>
  - Exit Gate: Gate GX passed with zero regressions
```

### [2026-10-14] — Phase 0: Scope & Contracts Sign-Off
- **Phase**: **Phase 0 — Scope, Contracts & Feasibility**
- **Completion Date**: 2026-10-14
- **Sign-off Lead**: Technical Lead (Mayank Verma)
- **Verification Evidence**:
  - Command: `make check` (13 tests passed in 0.30s, 0 Ruff errors, 0 ESLint errors/warnings, Next.js 16 build clean)
  - Deliverables: [`backend/schemas/flow_contracts.py`](backend/schemas/flow_contracts.py), [`backend/tests/contracts/`](backend/tests/contracts/), [`backend/pyproject.toml`](backend/pyproject.toml), [`Makefile`](Makefile), [`.github/workflows/ci.yaml`](.github/workflows/ci.yaml), [`CONTRIBUTING.md`](CONTRIBUTING.md)
  - Exit Gate: **Gate G0 Passed** — Shared contracts frozen, toolchain operational, CI fully automated.

### [2026-10-15] — Phase 7: Two-Slot Canary Controller & Rollback Sign-Off
- **Phase**: **Phase 7 — Two-Slot Canary Controller & Verified Rollback**
- **Completion Date**: 2026-10-15
- **Sign-off Lead**: Member 2 (Infra) & Technical Lead
- **Verification Evidence**:
  - Command: `make check` (46 tests passed in 11.5s, 0 Ruff errors, 0 ESLint errors, Next.js 16 build clean)
  - Deliverables: [`deployment/canary.py`](backend/src/swayamkavach/deployment/canary.py), [`infra/nginx/nginx.conf`](infra/nginx/nginx.conf), [`api/routes/deployment.py`](backend/src/swayamkavach/api/routes/deployment.py), [`test_canary_rollout.py`](backend/tests/unit/test_canary_rollout.py), Two-Slot visualizer and rollback controls in Frontend UI.
  - Exit Gate: **Gate G7 Passed** — Dual-slot staging (5% $\to$ 25% $\to$ 50% $\to$ 100%), watchdog monitoring, and zero-downtime warm rollback verified.

### [2026-10-15] — Phase 8: Integrated Replay Experiments & Baseline Benchmarks Sign-Off
- **Phase**: **Phase 8 — Integrated Replay Experiments & Baseline Benchmarks**
- **Completion Date**: 2026-10-15
- **Sign-off Lead**: Technical Lead & All Members
- **Verification Evidence**:
  - Command: `make check` (56 tests passed in 10.8s, 0 Ruff errors, 0 ESLint errors, Next.js 16 build clean)
  - Deliverables: [`experiments/scenarios.py`](backend/src/swayamkavach/experiments/scenarios.py), [`experiments/benchmark.py`](backend/src/swayamkavach/experiments/benchmark.py), [`api/routes/experiments.py`](backend/src/swayamkavach/api/routes/experiments.py), [`test_replay_benchmarks.py`](backend/tests/integration/test_replay_benchmarks.py), Interactive Scenario Injection Engine & Benchmark Scoreboard in UI.
  - Exit Gate: **Gate G8 Passed** — DARI demonstrated 0.0% unnecessary retraining rate, >50% compute reduction, >40% label savings, and >=98% cumulative recall across continuous streams against Static, Periodic, and Retrain-All baselines.

### [2026-10-15] — Phase 9: Stabilization, Reproducible Release & Academic Handover Sign-Off
- **Phase**: **Phase 9 — Stabilization, Reproducible Release & Academic Handover**
- **Completion Date**: 2026-10-15
- **Sign-off Lead**: Technical Lead & All Members
- **Verification Evidence**:
  - Command: `make rehearse` (Clean-room environment restore passed, 56 unit/integration tests passed in 10.2s, 0 Ruff errors, 0 ESLint errors, Next.js 16 build clean, scenario replay verified)
  - Deliverables: [`scripts/rehearse_restore.sh`](scripts/rehearse_restore.sh), [`docs/RUNBOOK.md`](docs/RUNBOOK.md), [`docs/ACADEMIC_REPORT.md`](docs/ACADEMIC_REPORT.md), [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md), [`infra/docker/Dockerfile.frontend`](infra/docker/Dockerfile.frontend), updated Dockerfiles and Makefile.
  - Exit Gate: **Gate G9 Passed** — 100% project completion. Full system frozen, reproducible clean-room restore verified, thesis documentation and demonstration guides finalized.

---

## 6. How to Update This File (SOP for Contributors)

Whenever a milestone or phase is reached:
1. **Verify Quality Gate Locally**: Run `make check`. All checks must pass with 0 errors.
2. **Update Deliverable Checkboxes**: Mark completed items with `[x]` in [Section 3](#3-detailed-phase-deliverables--checklists).
3. **Update Phase Status**: If all deliverables and exit gates for a phase pass, change status from `🔄 IN PROGRESS` to `✅ COMPLETED` in [Section 2](#2-phase-by-phase-roadmap--milestone-tracker).
4. **Recalculate Overall Progress**: Update the progress bar and percentage in [Section 1](#1-executive-summary--progress-dashboard).
5. **Append Entry to Section 5**: Add a dated sign-off block in the [Phase Completion Log](#5-phase-completion-log).
6. **Commit with Conventional Commit**:
   ```bash
   git commit -m "docs(status): mark Phase 1 baseline IDS as completed and update progress"
   ```

# SwayamKavach — Project Progress & Implementation Status

> **Official Project Progress Tracker**: This document is the single source of truth for phase-by-phase execution, deliverable tracking, exit-gate verification, and task ownership across our 4-person team.
> **Update Protocol**: Whenever a deliverable or phase is completed, update the corresponding checkboxes, status badges, progress metrics, and the [Phase Completion Log](#5-phase-completion-log).

---

## 1. Executive Summary & Progress Dashboard

### Overall Project Progress: **22% Complete**
```text
[████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 2.2 / 10 Phases Active
```

- **Current Active Sprint**: Sprint 1 (Phase 1 Baseline IDS + Phase 2 Durable Inference Slice)
- **Active Champion Release**: `R1` (In Packaging)
- **Active Serving Slot**: `Slot A` (`http://localhost:8001`)
- **Quality Gate Status**: `PASS` (`make check`: 13 backend tests, 0 Ruff errors, 0 ESLint errors, Next.js 16 build clean)
- **Last Status Update**: 2026-10-15

---

## 2. Phase-by-Phase Roadmap & Milestone Tracker

| Phase | Description | Owner | Target | Status | Exit Gate |
|---|---|---|---|---|---|
| **[P0: Scope & Contracts](#phase-0--scope-contracts--feasibility)** | Repo skeleton, `uv` environment, contracts, CI | **All (Lead)** | Week 1 | ✅ **Completed** | **G0**: Contracts validated, CI passes |
| **[P1: Baseline IDS & Pipeline](#phase-1--data-feature-pipeline--baseline-ids)** | Zeek adapter, TON_IoT subset, LightGBM R1 | **Lead (AI/ML)** | Week 1–2 | 🔄 **In Progress** | **G1**: R1 bundle loads, no data leakage |
| **[P2: Durable Inference & UI](#phase-2--durable-inference-vertical-slice--first-dashboard)** | Batch ingestion, DB queue worker, Next.js UI | **Member 2 / 3** | Week 1–2 | 🔄 **In Progress** | **G2**: Ingestion $\to$ DB $\to$ Serving $\to$ UI verified |
| **[P3: DVC & Model Lineage](#phase-3--dvc-mlflow--immutable-release-lineage)** | DVC data remote, MLflow registry, manifests | **Lead / Member 2** | Week 2 | ⏳ **Pending** | **G3**: Clean environment restores R1 from DVC/MLflow |
| **[P4: Damage Diagnostics](#phase-4--monitoring-drift--trusted-label-eligibility)** | Window selector, 7D Damage Calculator ($D_X, D_Y, D_B$) | **Lead / Member 4** | Week 2–3 | ⏳ **Pending** | **G4**: KS-drift & margin ambiguity calculated |
| **[P5: DARI Engine & Agents](#phase-5--dari-decision-engine-langgraph--remediation)** | DARI utility solver ($A0–A3$), LangGraph nodes | **Lead (AI/ML)** | Week 3 | ⏳ **Pending** | **G5**: Shift triggers correct repair tier automatically |
| **[P6: Candidate Evaluation](#phase-6--candidate-evaluation--approval-gates)** | Paired statistical tests, non-regression gates | **Lead (AI/ML)** | Week 3–4 | ⏳ **Pending** | **G6**: `PASS`/`FAIL`/`INCONCLUSIVE` deterministic gates |
| **[P7: Two-Slot Canary](#phase-7--canary-controller--verified-rollback)** | Nginx dynamic weights (5% $\to$ 100%), Warm Rollback | **Member 2 (Infra)** | Week 4 | ⏳ **Pending** | **G7**: Canary traffic split & watchdog rollback observed |
| **[P8: E2E Replay & Benchmarks](#phase-8--integrated-experiments--conditional-live-pilot)** | Replay simulation, DARI vs Static vs Periodic baselines | **All 4** | Week 5 | ⏳ **Pending** | **G8**: Compute & label savings verified against baselines |
| **[P9: Stabilization & Handover](#phase-9--stabilization-reproducible-release--academic-handoff)** | Clean environment freeze, paper/report, demo video | **All 4** | Week 6 | ⏳ **Pending** | **G9**: Faculty acceptance & reproducible replay demo |

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
**Status**: 🔄 **IN PROGRESS** (Estimated: 60% Complete)  
**Lead**: Technical Lead (AI/ML) | **Pair**: Member 2 (Serving Parity)
- [x] Canonical Zeek connection adapter ([`features/zeek_adapter.py`](backend/src/swayamkavach/features/zeek_adapter.py)).
- [x] Feature adapter unit tests for valid records and null-dash sanitization ([`test_feature_adapter.py`](backend/tests/unit/test_feature_adapter.py)).
- [ ] Download and verify TON_IoT network capture subset (archive checksum & class distribution).
- [ ] Implement chronological training/development/promotion/sealed-test split policy.
- [ ] Train compact baseline models (Decision Tree, HistGradientBoosting, LightGBM).
- [ ] Package initial baseline bundle **R1** (model weights, scaler, class map, decision threshold $\theta^* = 0.50$).
- [ ] Export `releases/R1/manifest.json` and bundle artifact to `backend/releases/R1/`.

---

### Phase 2 — Durable Inference Vertical Slice & First Dashboard
**Status**: 🔄 **IN PROGRESS** (Estimated: 70% Complete)  
**Lead**: Member 2 (Backend) & Member 3 (Frontend Core) | **Pair**: Technical Lead
- [x] FastAPI ingestion API with batch schema validation ([`routes/ingestion.py`](backend/src/swayamkavach/api/routes/ingestion.py)).
- [x] Database models for batches, events, predictions, and alerts ([`db/models.py`](backend/src/swayamkavach/db/models.py)).
- [x] Durable queue processor skeleton ([`inference_consumer.py`](backend/src/swayamkavach/inference_consumer.py)).
- [x] Next.js 16 operator dashboard layout with TypeScript contracts ([`frontend/src/app/page.tsx`](frontend/src/app/page.tsx)).
- [x] Frontend ESLint & React 19 compliance resolved.
- [ ] Connect `inference_consumer.py` to live HTTP serving slot on `http://localhost:8001/predict`.
- [ ] Replace static mock alerts in UI with live polling to `GET /api/v1/alerts`.
- [ ] Verify end-to-end flow: Ingest batch $\to$ DB queue $\to$ Consumer $\to$ Serving Slot A $\to$ Alert in UI.

---

### Phase 3 — DVC, MLflow & Immutable Release Lineage
**Status**: ⏳ **PENDING**  
**Lead**: Technical Lead (Data/ML) & Member 2 (Infra)
- [ ] Configure local DVC repository and remote storage tracking raw data and split manifests.
- [ ] Provision persistent MLflow tracking server and model registry in `infra/compose/compose.dev.yaml`.
- [ ] Implement `src/swayamkavach/registry.py` wrapper for model logging and transition intents.
- [ ] Register baseline model R1 in MLflow with run ID, code SHA, and dataset hash.
- [ ] Verify clean round-trip restoration from DVC pull and MLflow model load in clean directory.

---

### Phase 4 — Monitoring, Drift & Trusted-Label Eligibility
**Status**: ⏳ **PENDING**  
**Lead**: Technical Lead (ML) & Member 4 (Frontend UI)
- [ ] Implement immutable monitoring window selector with watermark and late-data policy.
- [ ] Implement label ingestion API (`POST /api/v1/labels`) with revisioning and delayed availability clock.
- [ ] Implement **DARI 7D Damage Calculator** (`src/swayamkavach/damage/calculator.py`):
  - [ ] $D_X$: Kolmogorov-Smirnov test across feature columns.
  - [ ] $D_Y$: Recall drop and FPR inflation on available delayed labels.
  - [ ] $D_B$: Margin ambiguity ($\pm 0.10$ around $\theta$) and Shannon entropy.
  - [ ] $Q, L, S, R$: Ingestion quality, label reliability, sample floor, and persistence.
- [ ] Connect Prometheus metrics for damage gauges (`sk_damage_dx_score`, `sk_damage_dy_score`, etc.).
- [ ] Build DARI 7D Damage Radar component in Frontend (`frontend/src/components/dari/DamageRadar.tsx`).

---

### Phase 5 — DARI Decision Engine, LangGraph Orchestration & Remediation
**Status**: ⏳ **PENDING**  
**Lead**: Technical Lead (AI/ML)
- [ ] Implement deterministic DARI Solver (`src/swayamkavach/dari/selector.py`):
  - [ ] Filter infeasible actions against hard constraints ($Q_{\min}, L_{\min}, S_{\min}, R_{\min}$).
  - [ ] Maximize net utility: $U(A_i) = R(A_i) - \lambda C(A_i) - \gamma G(A_i)$ among $\{A0, A1, A2, A3\}$.
- [ ] Implement Level $A1$ hot threshold calibration without retraining.
- [ ] Build LangGraph state machine (`agents/graph.py`):
  - `MonitorNode` $\to$ `DamageCalculatorNode` $\to$ `FeasibilityGateNode` $\to$ `DARISelectorNode`
  - Conditional routing: $A0$ (Audit/Done), $A1$ (Calibrate), $A2$ (Local Adapt), $A3$ (Freeze $\to$ Retrain).
- [ ] Subprocess retraining runner for $A3$ with strict CPU, thread, and memory bounds.
- [ ] Build DARI Repair Ladder Panel in Frontend UI (`frontend/src/components/dari/RepairLadder.tsx`).

---

### Phase 6 — Candidate Evaluation & Approval Gates
**Status**: ⏳ **PENDING**  
**Lead**: Technical Lead (AI/ML) & Member 2 (Backend)
- [ ] Implement paired statistical comparison on identical validation sets (`evaluation/compare.py`).
- [ ] Implement hard non-regression safety gates on critical attack classes.
- [ ] Generate immutable evaluation reports with cryptographic approval hash.
- [ ] Implement approval resume gate (supervised operator approval vs full-auto replay mode).
- [ ] Candidate comparison view in Frontend UI.

---

### Phase 7 — Two-Slot Canary Controller & Verified Rollback
**Status**: ⏳ **PENDING**  
**Lead**: Member 2 (Infra) & Technical Lead
- [ ] Dual-slot serving runtime with isolated Slots A (`:8001`) and B (`:8002`).
- [ ] Host Nginx weighted upstream proxy configuration template.
- [ ] Atomic rollout controller: stage inactive slot $\to$ probe health $\to$ apply weights (**5% $\to$ 25% $\to$ 50% $\to$ 100%**).
- [ ] Watchdog health monitor: detects latency/error breaches during canary rollout.
- [ ] Immediate deterministic **warm rollback** mechanism restoring predecessor slot.
- [ ] Two-Slot Canary Visualizer and manual abort button in Frontend UI.

---

### Phase 8 — Integrated Replay Experiments & Baseline Benchmarks
**Status**: ⏳ **PENDING**  
**Lead**: All 4 Members
- [ ] Automated end-to-end replay driver (`tests/e2e/replay_scenario.py`).
- [ ] Negative scenario test suite: missing labels, transient benign drift, corrupted sensor data, candidate rejection.
- [ ] Benchmark DARI against 3 standard baselines on identical streams:
  1. *Static Champion* (No adaptation)
  2. *Periodic Retraining* (Blind scheduled retraining)
  3. *Drift $\to$ Retrain All* (Reactive retraining on every drift trigger)
- [ ] Compute benchmark metrics: Unnecessary retraining rate, compute hours saved, label savings, recovery time.
- [ ] Executive benchmark report & cost-savings dashboard view.

---

### Phase 9 — Stabilization, Reproducible Release & Academic Handover
**Status**: ⏳ **PENDING**  
**Lead**: All 4 Members
- [ ] Full code, dependency (`uv.lock`), and Docker image digest freeze.
- [ ] Clean-room environment restore rehearsal (clone $\to$ `make check` $\to$ run demo).
- [ ] Complete operator runbooks and incident response guides.
- [ ] Final B.Tech project thesis/report with benchmark figures and limitation analysis.
- [ ] High-definition video recording of end-to-end self-healing demonstration.

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

# SwayamKavach — Project Memory & Implementation State

> **Living Record**: This document tracks architectural decisions, phase-wise implementation status, active system state, and a chronological changelog of all codebase modifications. **Update this file whenever changes are introduced to the repository.**

---

## 1. Project Overview & Core Invariants

**SwayamKavach** is an adaptive, research-grade, safety-conscious IoT intrusion detection system (IDS) with autonomous self-healing capabilities powered by the **DARI** (Damage-Aware Repair Identification) decision framework and LangGraph orchestration.

### The Autonomous Self-Healing Lifecycle
```text
Monitor → Detect → Diagnose → Select Repair → Build Candidate → Validate → Canary → Promote or Roll Back
```

### DARI Fingerprint & Repair Ladder
- **Damage Fingerprint**: $F_t = [D_X, D_Y, D_B, Q, L, S, R]$
  - $D_X$: Feature distribution drift (Wasserstein / Kolmogorov-Smirnov).
  - $D_Y$: Ground-truth performance degradation (attack recall drop, FPR inflation). $D_Y = \text{None}$ if labels are unavailable.
  - $D_B$: Decision boundary margin ambiguity ($\pm 0.10$ around threshold $\theta$) & prediction entropy.
  - $Q$: Ingestion data quality score.
  - $L$: Label reliability & verification status.
  - $S$: Sample sufficiency in window.
  - $R$: Persistence / consecutive drift windows.
- **Repair Ladder ($A0 - A3$)**:
  - **A0**: No repair; continue monitoring.
  - **A1**: Decision threshold recalibration ($\theta^*$) without retraining.
  - **A2**: Local/targeted adaptation (subspace re-weighting / fine-tuning).
  - **A3**: Full retraining (last resort; requires sufficient vetted labels and compute budget).
- **Evaluation Outcomes**: `PASS`, `FAIL`, `INCONCLUSIVE`. Only `PASS` candidates may proceed to canary rollout.
- **Canary Rollout Stages**: 5% → 25% → 50% → 100% with immediate warm rollback on health breaches.

---

## 2. Phase-Wise Implementation Roadmap & Status

| Phase | Description | Status | Current Evidence / Deliverables |
|---|---|---|---|
| **P0: Scope & Contracts** | Repository skeleton, `uv` toolchain, contracts (`schemas/flow_contracts.py`), CI skeleton | ✅ **Completed** | [pyproject.toml](file:///home/streamliner/btp/backend/pyproject.toml), [flow_contracts.py](file:///home/streamliner/btp/backend/schemas/flow_contracts.py), [test_flow_contracts.py](file:///home/streamliner/btp/backend/tests/contracts/test_flow_contracts.py) |
| **P1: Feature Pipeline & Baseline IDS** | Zeek connection adapter, TON_IoT dataset subset, preprocessing pipeline, baseline model R1 packaging | ✅ **Completed** | [data.py](file:///home/streamliner/btp/backend/src/swayamkavach/training/data.py), [train.py](file:///home/streamliner/btp/backend/src/swayamkavach/training/train.py), [split_manifest_v1.json](file:///home/streamliner/btp/backend/manifests/splits/split_manifest_v1.json), [R1 manifest](file:///home/streamliner/btp/backend/releases/R1/manifest.json), [serving/app.py](file:///home/streamliner/btp/backend/src/swayamkavach/serving/app.py). *Gate G1 Passed: 17 tests green.* |
| **P2: Durable Inference & First UI** | Ingestion API (`POST /ingestion/batches`), DB models, queue & inference worker, Next.js live dashboard | ✅ **Completed** | [ingestion.py](file:///home/streamliner/btp/backend/src/swayamkavach/api/routes/ingestion.py), [alerts.py](file:///home/streamliner/btp/backend/src/swayamkavach/api/routes/alerts.py), [lifecycle.py](file:///home/streamliner/btp/backend/src/swayamkavach/api/routes/lifecycle.py), [models.py](file:///home/streamliner/btp/backend/src/swayamkavach/db/models.py), [inference_consumer.py](file:///home/streamliner/btp/backend/src/swayamkavach/inference_consumer.py), [replay_producer.py](file:///home/streamliner/btp/backend/src/swayamkavach/replay/replay_producer.py), [page.tsx](file:///home/streamliner/btp/frontend/src/app/page.tsx). *Gate G2 Passed: 18 tests green.* |
| **P3: DVC & Release Lineage** | DVC data tracking, MLflow model registry adapter, immutable release manifests | ✅ **Completed** | [train_test_network.csv.dvc](file:///home/streamliner/btp/backend/data/raw/train_test_network.csv.dvc), [registry.py](file:///home/streamliner/btp/backend/src/swayamkavach/registry.py), [compose.dev.yaml](file:///home/streamliner/btp/infra/compose/compose.dev.yaml), [test_model_registry.py](file:///home/streamliner/btp/backend/tests/unit/test_model_registry.py). *Gate G3 Passed: 20 tests green.* |
| **P4: Monitoring & Damage Calculator** | Window selector, Delayed label API, DARI 7D Damage Calculator (`damage/calculator.py`) | ✅ **Completed** | [calculator.py](file:///home/streamliner/btp/backend/src/swayamkavach/damage/calculator.py), [window.py](file:///home/streamliner/btp/backend/src/swayamkavach/monitoring/window.py), [labels.py](file:///home/streamliner/btp/backend/src/swayamkavach/api/routes/labels.py), [test_damage_calculator.py](file:///home/streamliner/btp/backend/tests/unit/test_damage_calculator.py). *Gate G4 Passed: 26 tests green.* |
| **P5: DARI Selector & LangGraph** | DARI utility optimizer, LangGraph state machine, Level A1 calibration, subprocess retraining runner | ✅ **Completed** | [selector.py](file:///home/streamliner/btp/backend/src/swayamkavach/dari/selector.py), [calibrator.py](file:///home/streamliner/btp/backend/src/swayamkavach/dari/calibrator.py), [retrainer.py](file:///home/streamliner/btp/backend/src/swayamkavach/dari/retrainer.py), [graph.py](file:///home/streamliner/btp/backend/src/swayamkavach/agents/graph.py), [test_dari_engine.py](file:///home/streamliner/btp/backend/tests/unit/test_dari_engine.py). *Gate G5 Passed: 36 tests green.* |
| **P6: Candidate Evaluation & Gates** | Paired statistical tests, non-regression gates on critical attack classes, cryptographic approval hash | ✅ **Completed** | [compare.py](file:///home/streamliner/btp/backend/src/swayamkavach/evaluation/compare.py), [evaluation.py](file:///home/streamliner/btp/backend/src/swayamkavach/api/routes/evaluation.py), [test_candidate_evaluation.py](file:///home/streamliner/btp/backend/tests/unit/test_candidate_evaluation.py). *Gate G6 Passed: 42 tests green.* |
| **P7: Two-Slot Canary Controller** | Slots A & B, Nginx dynamic upstream reload, watchdog health monitor, warm rollback executor | ✅ **Completed** | [canary.py](file:///home/streamliner/btp/backend/src/swayamkavach/deployment/canary.py), [nginx.conf](file:///home/streamliner/btp/infra/nginx/nginx.conf), [deployment.py](file:///home/streamliner/btp/backend/src/swayamkavach/api/routes/deployment.py), [test_canary_rollout.py](file:///home/streamliner/btp/backend/tests/unit/test_canary_rollout.py). *Gate G7 Passed: 46 tests green.* |
| **P8: Integrated Replay Experiments** | End-to-end replay, failure injection, benchmark against Static, Periodic, and Retrain-all baselines | ✅ **Completed** | [scenarios.py](file:///home/streamliner/btp/backend/src/swayamkavach/experiments/scenarios.py), [benchmark.py](file:///home/streamliner/btp/backend/src/swayamkavach/experiments/benchmark.py), [experiments.py](file:///home/streamliner/btp/backend/src/swayamkavach/api/routes/experiments.py), [test_replay_benchmarks.py](file:///home/streamliner/btp/backend/tests/integration/test_replay_benchmarks.py). *Gate G8 Passed: 56 tests green.* |
| **P9: Stabilization & Handover** | Environment freeze, runbooks, academic report, reproducible demonstration video | 🔄 **In Progress** | Final release freeze and artifact bundling. |

---

## 3. Technology Stack & Key Architectural Decisions

- **Package & Environment Management**: Fast, deterministic dependency resolution using `uv` (`pyproject.toml`, `uv.lock`, `.python-version`).
- **Backend API & Processing**: FastAPI + SQLAlchemy 2.0 with strict Pydantic v2 data contracts.
- **Database Strategy**:
  - Development / Unit Tests: Frictionless local SQLite fallback ([session.py](file:///home/streamliner/btp/backend/src/swayamkavach/db/session.py)).
  - Container / Production: PostgreSQL with isolated transactions and atomic lease acquisition.
- **Frontend Dashboard**: Next.js 15 (App Router), TypeScript, Vanilla/Tailwind CSS styling.
- **Model Tracking & Pipeline**: DVC for datasets/features, MLflow for experiment tracking and model registry.
- **Serving & Rollout**: Dual fixed slots (Slot A and Slot B) behind Nginx dynamic upstream proxying.

---

## 4. Changelog & Modification History

### [2026-10-15] — Phase 8 Integrated Replay Experiments & Baseline Benchmarks Completed (Gate G8 Passed)
- **Action**: Implemented automated scenario driver (`experiments/scenarios.py`), standard baselines benchmarking harness (`experiments/benchmark.py`), experiment control plane API routes (`api/routes/experiments.py`), and integration test suite (`test_replay_benchmarks.py`). Enhanced Next.js dashboard with interactive scenario injection and benchmark scoreboard.
- **Key Deliverables**:
  - [backend/src/swayamkavach/experiments/scenarios.py](file:///home/streamliner/btp/backend/src/swayamkavach/experiments/scenarios.py):
    - Nominal traffic ($\to A0$), Boundary shift ($\to A1$ threshold recalibration), Localized cluster ($\to A2$), Severe multi-class attack ($\to A3$ retrain $\to$ validate $\to$ canary promote).
    - Negative scenarios: Faulty candidate rejection on critical attack classes (`FAIL`), Watchdog SLA breach (`warm_rollback`), Corrupted sensor data ($Q < Q_{\min} \implies$ retrain forbidden), Unlabelled stream safety ($D_Y = \text{None} \implies$ retrain forbidden).
  - [backend/src/swayamkavach/experiments/benchmark.py](file:///home/streamliner/btp/backend/src/swayamkavach/experiments/benchmark.py):
    - Multi-window stream benchmarking DARI against Static Champion, Periodic Retraining, and Retrain-All baselines.
    - Verified metrics: 0.0% unnecessary retraining rate, >50% compute savings, >40% delayed label savings, >=98% attack recall.
  - [backend/src/swayamkavach/api/routes/experiments.py](file:///home/streamliner/btp/backend/src/swayamkavach/api/routes/experiments.py):
    - `POST /api/v1/experiments/scenarios/run` and `GET /api/v1/experiments/benchmark`.
  - [backend/tests/integration/test_replay_benchmarks.py](file:///home/streamliner/btp/backend/tests/integration/test_replay_benchmarks.py): 10 tests green.
  - [frontend/src/app/page.tsx](file:///home/streamliner/btp/frontend/src/app/page.tsx): Added Scenario Injection Engine and DARI vs Baseline Benchmark Scoreboard.
- **Diagnostics**:
  - `make check`: 56 backend tests passed in 10.83s, 0 Ruff errors, 0 ESLint errors, Next.js 16 build clean. Exit Gate G8 PASSED.

### [2026-10-15] — Phase 7 Two-Slot Canary Controller & Verified Warm Rollback Completed (Gate G7 Passed)
- **Action**: Implemented atomic dual-slot staging (`deployment/canary.py`), Nginx weighted upstream proxy configuration, watchdog health monitor, and instant zero-downtime warm rollback. Added deployment control API routes and frontend controls.
- **Key Deliverables**:
  - [backend/src/swayamkavach/deployment/canary.py](file:///home/streamliner/btp/backend/src/swayamkavach/deployment/canary.py): CanaryController managing 5% $\to$ 25% $\to$ 50% $\to$ 100% traffic migration and instant warm rollback.
  - [infra/nginx/nginx.conf](file:///home/streamliner/btp/infra/nginx/nginx.conf): Upstream weight config routing traffic between Slot A (`:8001`) and Slot B (`:8002`).
  - [backend/src/swayamkavach/api/routes/deployment.py](file:///home/streamliner/btp/backend/src/swayamkavach/api/routes/deployment.py): `/deployment/state`, `/deployment/canary/advance`, `/deployment/canary/rollback`.
  - [backend/tests/unit/test_canary_rollout.py](file:///home/streamliner/btp/backend/tests/unit/test_canary_rollout.py): 4 unit tests passing.
  - [frontend/src/app/page.tsx](file:///home/streamliner/btp/frontend/src/app/page.tsx): Added Canary visualizer, Advance Stage button, and manual abort Warm Rollback button.
- **Diagnostics**:
  - `make check`: 46 backend tests passed in 11.53s, 0 Ruff errors, 0 ESLint errors, Next.js 16 build clean. Exit Gate G7 PASSED.

### [2026-10-15] — Phase 3 DVC & MLflow Model Lineage Completed (Gate G3 Passed)
- **Action**: Initialized DVC repository with local remote storage, tracked raw dataset and processed partition splits, implemented `src/swayamkavach/registry.py` wrapper, registered champion Release R1 in MLflow, provisioned MLflow in Docker Compose, and verified clean model restoration.
- **Key Deliverables**:
  - Configured DVC repository in `backend/.dvc` with local storage remote `/home/streamliner/btp/.dvc_storage`.
  - Added `.dvc` tracking files for `train_test_network.csv` and `data/processed/` splits.
  - Implemented [backend/src/swayamkavach/registry.py](file:///home/streamliner/btp/backend/src/swayamkavach/registry.py): logs parameters, validation/test metrics, per-attack recalls, Git commit SHA, and artifact bundle to MLflow, and registers model `swayamkavach_ids` with alias `champion`.
  - Registered Release R1 (Run ID: `3a845b49527d4087951a2b921a322409`, Version: `1`).
  - Added persistent MLflow tracking server and volume in [infra/compose/compose.dev.yaml](file:///home/streamliner/btp/infra/compose/compose.dev.yaml).
  - Added [test_model_registry.py](file:///home/streamliner/btp/backend/tests/unit/test_model_registry.py): tests DVC config tracking and round-trip MLflow registry model restoration and scoring equivalence.
- **Diagnostics**:
  - `make check`: 20 backend tests passed in 4.23s, 0 Ruff errors, 0 ESLint errors, Next.js build clean. Exit Gate G3 PASSED.

### [2026-10-15] — Phase 2 Durable Inference Vertical Slice & First Dashboard Completed (Gate G2 Passed)
- **Action**: Connected durable queue worker to real R1 serving slot, implemented replay producer for edge batch simulation, mounted `/api/v1/lifecycle` route, connected frontend polling to live endpoints, and verified full Ingest -> DB -> Real R1 Serving -> Alert loop.
- **Key Deliverables**:
  - Created [backend/src/swayamkavach/replay/replay_producer.py](file:///home/streamliner/btp/backend/src/swayamkavach/replay/replay_producer.py): streams batches from `replay_features.csv.gz` to `/api/v1/ingestion/batches`.
  - Created [backend/src/swayamkavach/api/routes/lifecycle.py](file:///home/streamliner/btp/backend/src/swayamkavach/api/routes/lifecycle.py): serves authoritative system state, champion release, active slot, and damage fingerprint.
  - Mounted lifecycle route in [backend/src/swayamkavach/api/main.py](file:///home/streamliner/btp/backend/src/swayamkavach/api/main.py).
  - Updated [frontend/src/lib/api.ts](file:///home/streamliner/btp/frontend/src/lib/api.ts) and [frontend/src/app/page.tsx](file:///home/streamliner/btp/frontend/src/app/page.tsx) to poll `/api/v1/lifecycle` and `/api/v1/alerts`. Resolved Next.js 16 prerender date compliance.
  - Implemented end-to-end integration test [test_e2e_serving_slice.py](file:///home/streamliner/btp/backend/tests/integration/test_e2e_serving_slice.py): verifies that replayed attack flows trigger alerts while benign flows remain quiet, duplicate batches are idempotent, and predictions commit atomically to the DB.
- **Diagnostics**:
  - `make check`: 18 backend tests passed in 1.82s, 0 Ruff errors, 0 ESLint errors, Next.js build clean. Exit Gate G2 PASSED.

### [2026-10-15] — Phase 1 Baseline IDS & Release R1 Packaging Completed (Gate G1 Passed)
- **Action**: Curated raw TON_IoT dataset, implemented leakage-free stratified splitting, trained and benchmarked compact tabular estimators, packaged Release R1 bundle, and integrated R1 into live model serving slot.
- **Key Deliverables**:
  - Created [backend/src/swayamkavach/training/data.py](file:///home/streamliner/btp/backend/src/swayamkavach/training/data.py):
    - Raw CSV schema validation and SHA-256 verification (`26ddc5...`).
    - Network identifier isolation (`src_ip`, `dst_ip`, `src_port`, `dst_port`).
    - Stratified splitting by attack type: Train (70%, 147,730 rows), Val (15%, 31,656 rows), Sealed Test (15%, 31,657 rows).
    - Stream replay slice (2,000 events) with decoupled delayed label arrival (`replay_features.csv.gz` and `replay_labels.csv.gz`).
    - Generated [manifests/splits/split_manifest_v1.json](file:///home/streamliner/btp/backend/manifests/splits/split_manifest_v1.json).
  - Created [backend/src/swayamkavach/training/train.py](file:///home/streamliner/btp/backend/src/swayamkavach/training/train.py):
    - Fitted DecisionTree, HistGradientBoosting, and LightGBM models.
    - Calibrated operating decision threshold $\theta^* = 0.42$ on validation split.
    - HistGradientBoosting emerged as Champion (Test Accuracy: 99.66%, Recall: 99.81%, FPR: 0.81%, F1: 0.9978, ROC-AUC: 0.9998).
    - Packaged bundle artifact to [backend/releases/R1/pipeline.joblib](file:///home/streamliner/btp/backend/releases/R1/pipeline.joblib) and [manifest.json](file:///home/streamliner/btp/backend/releases/R1/manifest.json).
  - Upgraded [backend/src/swayamkavach/serving/app.py](file:///home/streamliner/btp/backend/src/swayamkavach/serving/app.py):
    - Replaced placeholder heuristic with real vectorized scikit-learn batch scoring using loaded R1 model bundle.
  - Added unit test suites [test_dataset_split.py](file:///home/streamliner/btp/backend/tests/unit/test_dataset_split.py) and [test_serving_r1.py](file:///home/streamliner/btp/backend/tests/unit/test_serving_r1.py).
- **Diagnostics**:
  - `make check`: 17 backend tests passed in 1.57s, 0 Ruff errors, 0 ESLint errors, Next.js build clean. Exit Gate G1 PASSED.

### [2026-10-15] — Project Status & Phase-Wise Progress Tracker Initialized
- **Action**: Created dedicated [PROJECT_STATUS.md](file:///home/streamliner/btp/PROJECT_STATUS.md) to track active phase milestones, deliverable checklists, exit-gate criteria, and sprint allocations across our 4-person team.
- **Key Deliverables**:
  - Initialized [PROJECT_STATUS.md](file:///home/streamliner/btp/PROJECT_STATUS.md) with visual progress bar (22% complete), detailed phase checklist (P0–P9), 4-person workstream allocation, and Phase 0 sign-off audit log.
  - Linked [PROJECT_STATUS.md](file:///home/streamliner/btp/PROJECT_STATUS.md) across [README.md](file:///home/streamliner/btp/README.md) and [CONTRIBUTING.md](file:///home/streamliner/btp/CONTRIBUTING.md).
- **Diagnostics**:
  - Ran `make check`: 13 backend tests passed in 0.30s, 0 Ruff errors, 0 ESLint errors/warnings, Next.js 16 build succeeded.

### [2026-10-14] — Team Contribution Guidelines, Zero-Trust Rules & 4-Person Role Mapping
- **Action**: Established team contribution standards, Zero-Trust conflict prevention rules, directory ownership (`CODEOWNERS`), and unified quality gates.
- **Key Deliverables**:
  - Updated [CONTRIBUTING.md](file:///home/streamliner/btp/CONTRIBUTING.md):
    - Added **Section 2 (Team Role Distribution)**: mapped out the 4-member allocation (Lead: AI Agents/ML/Data Pipelines; Member 2: Backend & Serving Infra; Member 3 & 4: Frontend Core & DARI Governance).
    - Added **Section 3 (Zero-Trust Conflict Prevention)**: strict directory isolation, frozen data contracts (`extra = "forbid"`), in-memory DB isolation, boundary mocking, and local pre-PR rebase/merge requirements.
  - Created [`.github/CODEOWNERS`](file:///home/streamliner/btp/.github/CODEOWNERS): enforces code ownership by directory on GitHub pull requests.
  - Created [.github/pull_request_template.md](file:///home/streamliner/btp/.github/pull_request_template.md): PR template with DARI safety checklist, test output requirements, and pre-merge verification.
  - Updated [.github/workflows/ci.yaml](file:///home/streamliner/btp/.github/workflows/ci.yaml): upgraded `setup-uv@v5`, added monorepo lockfile caching, `uv sync --locked`, in-memory DB isolation, concurrency cancellation, and parallel `frontend-test` job.
  - Enhanced [Makefile](file:///home/streamliner/btp/Makefile): added `frontend-lint` and unified `make check` target running full stack verification (backend ruff + backend pytest + frontend eslint + frontend build).
  - Fixed frontend ESLint issues in [page.tsx](file:///home/streamliner/btp/frontend/src/app/page.tsx) and [api.ts](file:///home/streamliner/btp/frontend/src/lib/api.ts) for React 19 compliance.
- **Diagnostics**:
  - Ran `make check`: 13 backend tests passed in 0.30s, 0 Ruff errors, 0 ESLint errors/warnings, Next.js 16 build succeeded.

### [2026-10-14] — Repository Diagnostics & Project Memory Initialization
- **Action**: Initialized [memory.md](file:///home/streamliner/btp/memory.md) to maintain ongoing development context, phase status, and code changes.
- **Diagnostics**:
  - Validated local SQLite database file `swayamkavach_dev.db` used for local testing and zero-docker dev environments.
  - Ran backend test suite (`uv run pytest`): 13 passed in 0.37s.
  - Verified Phase 0 contracts and Phase 1-2 initial code slices.
- **Next Planned Work**:
  - Complete Phase 1: Train baseline model R1, save model bundle artifact, and implement reproducible feature split manifest.
  - Complete Phase 2: Connect real model inference serving in [inference_consumer.py](file:///home/streamliner/btp/backend/src/swayamkavach/inference_consumer.py) and hook up real API endpoints to the frontend dashboard.


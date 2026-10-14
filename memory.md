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
| **P1: Feature Pipeline & Baseline IDS** | Zeek connection adapter, TON_IoT dataset subset, preprocessing pipeline, baseline model R1 packaging | 🔄 **In Progress** | [zeek_adapter.py](file:///home/streamliner/btp/backend/src/swayamkavach/features/zeek_adapter.py), unit tests passing. *Pending: dataset download, split freeze, model R1 training & artifact packaging.* |
| **P2: Durable Inference & First UI** | Ingestion API (`POST /ingestion/batches`), DB models, queue & inference worker, initial Next.js dashboard | 🔄 **In Progress** | [ingestion.py](file:///home/streamliner/btp/backend/src/swayamkavach/api/ingestion.py), [models.py](file:///home/streamliner/btp/backend/src/swayamkavach/db/models.py), [inference_consumer.py](file:///home/streamliner/btp/backend/src/swayamkavach/inference_consumer.py), [page.tsx](file:///home/streamliner/btp/frontend/src/app/page.tsx). |
| **P3: DVC & Release Lineage** | DVC data tracking, MLflow model registry adapter, immutable release manifests | ⏳ **Pending** | MLflow docker setup ready in compose; pending DVC remote and `registry.py` wrapper. |
| **P4: Monitoring & Damage Calculator** | Window selector, Evidently adapter, DARI 7D Damage Calculator (`src/damage/calculator.py`) | ⏳ **Pending** | Schema contracts defined; pending calculator implementation & synthetic drift tests. |
| **P5: DARI Selector & LangGraph** | DARI utility optimizer, LangGraph state machine, Level A1 calibration, subprocess retraining runner | ⏳ **Pending** | Enum and contract in place; pending solver logic and LangGraph workflow nodes. |
| **P6: Candidate Evaluation & Gates** | Paired statistical tests, non-regression gates on critical attack classes, cryptographic approval hash | ⏳ **Pending** | Pending `backend/src/swayamkavach/evaluation/compare.py` & gates. |
| **P7: Two-Slot Canary Controller** | Slots A & B, Nginx dynamic upstream reload, watchdog health monitor, warm rollback executor | ⏳ **Pending** | Infrastructure compose files exist; pending controller daemon & journal logger. |
| **P8: Integrated Replay Experiments** | End-to-end replay, failure injection, benchmark against Static, Periodic, and Retrain-all baselines | ⏳ **Pending** | Pending scenario definitions and benchmark scripts. |
| **P9: Stabilization & Handover** | Environment freeze, runbooks, academic report, reproducible demonstration video | ⏳ **Pending** | Pending final validation. |

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


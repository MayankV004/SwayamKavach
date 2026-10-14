# SwayamKavach — Team Contribution Guidelines & Engineering Workflow

Welcome to **SwayamKavach**! This document establishes the engineering standards, branching policies, quality gates, and procedural workflow for contributing to the repository.

SwayamKavach is a research-grade, safety-conscious IoT Intrusion Detection System (IDS) and adaptive MLOps system governed by the **DARI (Damage-Aware Retraining & Intervention)** framework. Because of its safety-critical nature, all contributors must adhere strictly to these guidelines.

---

## Table of Contents
1. [Core Architectural Invariants](#1-core-architectural-invariants)
2. [Team Role Distribution & Workstream Ownership](#2-team-role-distribution--workstream-ownership)
3. [Zero-Trust Collaboration & Conflict Prevention Rules](#3-zero-trust-collaboration--conflict-prevention-rules)
4. [Monorepo Architecture](#4-monorepo-architecture)
5. [Prerequisites & Local Environment Setup](#5-prerequisites--local-environment-setup)
6. [Step-by-Step Contribution Procedure](#6-step-by-step-contribution-procedure)
7. [Git Workflow & Branching Conventions](#7-git-workflow--branching-conventions)
8. [Commit Message Standards](#8-commit-message-standards)
9. [Code Quality & Testing Standards](#9-code-quality--testing-standards)
10. [The Living Record (`memory.md`) Policy](#10-the-living-record-memorymd-policy)
11. [Pull Request & Code Review Process](#11-pull-request--code-review-process)
12. [Definition of Done](#12-definition-of-done)

---

## 1. Core Architectural Invariants

Every team member must understand and preserve the DARI lifecycle and security invariants:

```text
Monitor → Detect → Diagnose → Select Repair → Build Candidate → Validate → Canary → Promote or Roll Back
```

### The DARI 7-Dimensional Damage Fingerprint
$$F_t = [D_X, D_Y, D_B, Q, L, S, R]$$
- **$D_X$ (Distribution Damage)**: Feature distribution drift (Wasserstein / KS test). *Drift alone must never trigger full retraining.*
- **$D_Y$ (Performance Damage)**: Recall drop / FPR inflation on labeled windows ($D_Y = \text{None}$ when ground-truth labels are unavailable).
- **$D_B$ (Boundary Damage)**: Decision boundary margin ambiguity ($\pm 0.10$ around threshold $\theta$) and prediction entropy.
- **$Q$ (Data Quality)**: Ingestion data quality score.
- **$L$ (Label Reliability)**: Label verification status.
- **$S$ (Sample Sufficiency)**: Minimum sample count in current evaluation window.
- **$R$ (Persistence)**: Consecutive drift windows.

### Repair Action Ladder ($A0 - A3$)
- **A0 (No Repair)**: Continue monitoring if security behavior remains acceptable.
- **A1 (Threshold Calibration)**: Recalibrate decision threshold $\theta^*$ without retraining weights.
- **A2 (Targeted Adaptation)**: Subspace re-weighting or fine-tuning when evidence and vetted data are sufficient.
- **A3 (Full Retraining)**: Full retrain on broader dataset. Last resort only; never the default.
- **Rule of Parsimony**: Always choose the lowest feasible intervention that satisfies security constraints. Hard constraints are not soft penalties.

### Validation & Canary Deployment
- Candidates are evaluated against the current champion with outcomes `PASS`, `FAIL`, or `INCONCLUSIVE`.
- **Only `PASS` candidates may enter the canary phase.**
- Progressive rollout stages: **5% → 25% → 50% → 100%**.
- Any critical security breach immediately triggers a warm rollback to the champion.

### Agentic AI & LLM Boundaries
- Deterministic safety gates (data quality, feasibility, statistical comparison, canary thresholds) are hard rules in Python/SQL.
- LLMs / LangGraph nodes coordinate work and explain structured evidence, but **never invent metrics, override policy, or bypass safety gates**.

---

## 2. Team Role Distribution & Workstream Ownership

To ensure robust execution aligned with team expertise, technical ownership is divided into 4 non-overlapping roles. The complex AI, ML, and data pipeline tasks are concentrated with the technical lead, while standard backend and frontend responsibilities are cleanly isolated:

| Role & Title | Assigned Domain & Directories | Key Responsibilities |
|---|---|---|
| **Role 1: Lead — AI Agents, Orchestration, ML & Data Pipelines** | `backend/src/swayamkavach/features/`<br>`backend/src/swayamkavach/damage/`<br>`backend/src/swayamkavach/dari/`<br>`backend/src/swayamkavach/agents/`<br>`backend/src/swayamkavach/evaluation/`<br>`backend/training/`, `backend/releases/` | • Zeek feature adapter & preprocessing<br>• DVC dataset snapshots & MLflow model registry<br>• LightGBM baseline R1 training & artifact packaging<br>• DARI 7D Damage Calculator ($D_X, D_Y, D_B, Q, L, S, R$)<br>• DARI utility optimizer ($A0–A3$) & LangGraph state machine<br>• Paired statistical candidate evaluator & non-regression gates |
| **Role 2: Backend & Serving Infrastructure Engineer** | `backend/src/swayamkavach/api/`<br>`backend/src/swayamkavach/db/`<br>`backend/src/swayamkavach/serving/`<br>`backend/src/swayamkavach/inference_consumer.py`<br>`infra/` (Docker, Compose, Nginx) | • FastAPI REST endpoints (`/api/v1/health`, `/alerts`, `/ingestion`)<br>• SQLAlchemy ORM models, migrations, and atomic queue leases<br>• Durable inference consumer queue processor<br>• Isolated model serving slot runtime (Slot A & Slot B)<br>• Docker Compose local infrastructure & Nginx canary routing |
| **Role 3: Frontend Engineer (Core Monitoring & Live IDS)** | `frontend/src/app/`<br>`frontend/src/components/alerts/`<br>`frontend/src/components/metrics/`<br>`frontend/src/lib/api.ts` | • Next.js 16 operator dashboard shell & responsive layouts<br>• Real-time intrusion detection event stream & alert feed<br>• Connection drilldown modal with Zeek network identifiers<br>• Backend connectivity & system health indicators |
| **Role 4: Frontend Engineer (DARI Governance & Replay)** | `frontend/src/components/dari/`<br>`frontend/src/components/canary/`<br>`tests/e2e/` (Replay driver) | • DARI 7D Damage Radar chart visualization ($F_t$)<br>• Repair Action Ladder panel ($A0$ Monitor to $A3$ Retrain)<br>• Two-Slot Canary traffic split visualizer (5% $\to$ 100%) & Rollback button<br>• E2E traffic replay driver script & benchmark visualization |

---

## 3. Zero-Trust Collaboration & Conflict Prevention Rules

Because modules are interlinked, we enforce **Zero-Trust Engineering**: technical safeguards that prevent merge conflicts, data corruption, and broken builds regardless of teammate experience.

### Rule 1: Strict Directory Isolation
- Every team member works **only** within their assigned directories listed in Section 2.
- **Never edit another member's files** on your branch. If you need a helper function or new route, request it or discuss it in standup.
- This policy is enforced automatically via [`.github/CODEOWNERS`](.github/CODEOWNERS).

### Rule 2: Frozen Data Contracts (`extra = "forbid"`)
- The shared contracts in [`backend/schemas/flow_contracts.py`](backend/schemas/flow_contracts.py) and [`frontend/src/types/contracts.ts`](frontend/src/types/contracts.ts) are **locked**.
- All Pydantic models enforce strict validation with `model_config = ConfigDict(extra="forbid")`. Any extra, missing, or malformed fields are immediately rejected at the API boundary.
- **Never change a schema file in isolation.** Any schema update requires mandatory review from the Technical Lead.

### Rule 3: Zero Shared State & In-Memory Test Isolation
- **No database files in Git**: SQLite files (`*.db`, `*.sqlite`) are strictly gitignored. Teammates must never commit or share a local database file.
- **All automated tests run in memory**: Pytest runs against `DATABASE_URL: "sqlite:///:memory:"`. Tests leave zero residual state on disk. A teammate's dirty local environment cannot contaminate your code or the CI runner.

### Rule 4: Boundary Mocking During Development
- Teammates must never be blocked waiting for another member's service:
  - **Backend Developer** testing `inference_consumer.py` mocks the HTTP call to the serving slot (`httpx.post`).
  - **Frontend Developers** build and test UI panels using typed static fixtures (`fallbackState`) if the backend server is offline or being refactored.

### Rule 5: The Automated CI Gatekeeper (`make check`)
- Before opening a Pull Request, every contributor must run:
  ```bash
  make check
  ```
  This runs Ruff linting, Pytest, ESLint, and Next.js production build. If a teammate's PR fails even one check, GitHub Actions CI will automatically block the merge.

### Rule 6: Clean Local Sync Before Opening PRs
To eliminate merge conflicts before they reach GitHub:
```bash
# 1. Fetch latest main
git fetch origin

# 2. Merge main into your local branch to test compatibility
git merge origin/main

# 3. Resolve any conflicts locally on your machine
# 4. Verify clean build
make check

# 5. Push and open PR
git push origin <your-branch-name>
```

---

## 4. Monorepo Architecture

Keep clean separation between components:

```text
swayamkavach/
├── backend/                  # Python 3.11/3.12 backend (managed with uv)
│   ├── schemas/              # Pydantic v2 data contracts (events, predictions, receipts)
│   ├── src/swayamkavach/
│   │   ├── api/              # FastAPI ingestion and control plane endpoints
│   │   ├── db/               # SQLAlchemy 2.0 ORM models and session management
│   │   ├── features/         # Zeek connection adapters and preprocessing
│   │   ├── serving/          # Dual-slot inference runtime (Slot A & Slot B)
│   │   └── inference_consumer.py  # Durable queue worker
│   └── tests/                # Contract, unit, and integration tests
├── frontend/                 # Operator dashboard (Next.js 16, React 19, TypeScript)
│   ├── src/app/              # Next.js App Router pages and layouts
│   ├── src/components/       # UI components (metrics cards, charts, alerts)
│   ├── src/lib/              # Client API helpers and typed fetchers
│   └── src/types/            # TypeScript interfaces matching backend contracts
├── infra/                    # Infrastructure as Code
│   ├── compose/              # Docker Compose manifests (Postgres, MLflow, Nginx)
│   └── nginx/                # Dynamic dual-slot upstream reverse proxy configs
├── docs/                     # System architecture, PRDs, and phase-wise specs
├── .github/                  # GitHub Actions CI workflows and PR templates
├── Makefile                  # Unified developer task runner
└── memory.md                 # Living record of system state, phases, and changelog
```

---

## 5. Prerequisites & Local Environment Setup

### Prerequisites
- **Git** (v2.30+)
- **Python** 3.11 or 3.12
- **`uv`** (v0.5+): Fast Python package and environment manager (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **Node.js** (v20+) and **npm**
- **Docker** & **Docker Compose**

### First-Time Setup
```bash
# 1. Clone repository
git clone https://github.com/MayankV004/SwayamKavach.git
cd SwayamKavach

# 2. Configure environment variables
cp .env.example .env
# Review and adapt .env if necessary

# 3. Backend: Install dependencies and activate virtual environment
cd backend
uv sync
source .venv/bin/activate
cd ..

# 4. Frontend: Install dependencies
cd frontend
npm install
cd ..

# 5. Run the unified quality check to confirm clean environment
make check
```

---

## 6. Step-by-Step Contribution Procedure

Follow this procedure for every contribution:

```text
[Sync main] ➔ [Create Branch] ➔ [Implement & Test] ➔ [make check] ➔ [Update memory.md] ➔ [Push & Open PR] ➔ [Review & Merge]
```

### Step 1: Sync with `main`
Always start from the latest `main` branch:
```bash
git checkout main
git pull origin main
```

### Step 2: Create a Dedicated Feature Branch
Branch names must describe the task and follow our naming scheme:
```bash
git checkout -b <type>/<short-description>
# Examples:
# git checkout -b feat/dari-damage-calculator
# git checkout -b fix/ingestion-idempotency
# git checkout -b test/canary-rollback-edge-cases
```

### Step 3: Implement Changes
- Write clear, focused, typed code.
- Add or update tests for every behavior change.
- Never hardcode secrets, passwords, or credentials. Use `.env` and environment variables.
- Preserve public interfaces and data contracts in `schemas/`.
- Adhere to the Senior Engineering Rules (`.agents/rules/code-style-guide.md`).

### Step 4: Run the Pre-Commit Quality Gate
Before staging or committing, execute:
```bash
make check
```
This runs:
1. `uv run ruff check .` (Backend linting & import sorting)
2. `uv run pytest` (Backend unit, contract, and integration tests)
3. `npm run lint` (Frontend ESLint checks)
4. `npm run build` (Frontend TypeScript compilation & Next.js production build)

**All four checks must pass cleanly with 0 errors.**

### Step 5: Update `memory.md` (Mandatory Living Record)
Before committing, update `memory.md`:
- Add a new entry under **Section 4: Changelog & Modification History** with the date, action, summary, and verification evidence.
- Update **Section 2: Phase-Wise Implementation Roadmap & Status** if completing or advancing a phase deliverable.

### Step 6: Commit Your Changes
Use conventional commit messages (see [Section 8](#8-commit-message-standards)):
```bash
git add .
git commit -m "feat(damage): implement DARI 7D damage calculator with Kolmogorov-Smirnov test"
```

### Step 7: Push and Open a Pull Request
```bash
git push -u origin <type>/<short-description>
```
- Open a PR targeting `main` on GitHub.
- Fill out all sections in the [Pull Request Template](.github/pull_request_template.md).
- Ensure all automated GitHub Actions CI checks pass.
- Request review from at least one teammate.

### Step 8: Peer Review, Address Feedback & Squash Merge
- Address review comments with focused commits or rebase.
- Once approved and CI passes, use **Squash and Merge** with a clean, conventional commit message to preserve a clean Git history.
- Delete the remote feature branch after merging.

---

## 7. Git Workflow & Branching Conventions

- **Main Branch Protection**: The `main` branch is protected. Direct commits or forced pushes to `main` are strictly forbidden.
- **Branch Naming**:
  - `feat/<feature-name>`: New features or capabilities (e.g. `feat/mlflow-model-registry`)
  - `fix/<bug-name>`: Bug fixes (e.g. `fix/sqlite-session-leak`)
  - `ml/<experiment-name>`: ML training, features, or DARI policy updates (e.g. `ml/baseline-r1-lightgbm`)
  - `test/<test-scope>`: Test additions or test infrastructure (e.g. `test/canary-health-watchdog`)
  - `docs/<doc-name>`: Documentation, architecture, or guide updates (e.g. `docs/team-contributing-guide`)
  - `infra/<infra-change>`: Docker, Nginx, or CI/CD updates (e.g. `infra/nginx-canary-slots`)
  - `chore/<task>`: Dependency updates, refactoring, or maintenance (e.g. `chore/upgrade-ruff`)

---

## 8. Commit Message Standards

We use [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <short imperative description>

[optional body explaining motivation and context]

[optional footer, e.g. Closes #12]
```

### Types
- `feat`: A new user-facing or system feature
- `fix`: A bug fix
- `ml`: Machine learning pipelines, dataset splits, model training, or DARI policies
- `test`: Adding or correcting tests
- `docs`: Documentation updates or memory updates
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `infra`: Infrastructure, Docker Compose, or CI/CD configuration
- `chore`: Tooling, formatting, or dependency updates

### Examples
- `feat(api): add batch ingestion idempotency check with receipt hashing`
- `fix(consumer): handle null dashes in Zeek duration feature adapter`
- `ml(dari): implement Kolmogorov-Smirnov test for feature drift Dx`
- `docs(memory): update phase 2 status and record API endpoints`

---

## 9. Code Quality & Testing Standards

### Python & Backend Standards
- **Version**: Python 3.11 or 3.12.
- **Linter & Formatter**: Ruff (`target-version = "py312"`, `line-length = 100`). Run `uv run ruff check .` or `uv run ruff check --fix .`.
- **Typing**: Use explicit type annotations for public APIs, function signatures, and SQLAlchemy models. Prefer typed Pydantic models over raw `dict` or `Any`.
- **Contracts**: Never change Pydantic schemas in `schemas/` without updating both backend callers and frontend TypeScript interfaces in `frontend/src/types/`.
- **Logging**: Use standard Python `logging.getLogger(__name__)`. **Do not use `print()`**. Never log sensitive network payload contents or credentials.
- **Testing**: Write tests using `pytest` in `backend/tests/`:
  - Unit tests for pure functions (`tests/unit/`)
  - Contract validation tests (`tests/contracts/`)
  - End-to-end integration tests with SQLite or mock servers (`tests/integration/`)

### Frontend Standards
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript.
- **Linter**: ESLint (`npm run lint`).
- **Styling**: Tailwind CSS / Vanilla CSS. Avoid arbitrary ad-hoc inline styles.
- **State & Effects**: Adhere to React 19 standards. Avoid calling synchronous state setters directly inside `useEffect` bodies; use proper async cleanup and ignore flags.

---

## 10. Living Records Policy (`memory.md` & `PROJECT_STATUS.md`)

Our project relies on two living documents to ensure complete team alignment and historical continuity:

1. **[`memory.md`](memory.md)**: Shared architectural memory and chronological changelog.
   - For every merged change, append a dated entry under **Section 4: Changelog & Modification History** with action summary and test evidence.
2. **[`PROJECT_STATUS.md`](PROJECT_STATUS.md)**: Official phase milestone tracker, progress gauge, and exit-gate sign-off.
   - Whenever completing or advancing a deliverable or phase:
     - Check off completed task boxes in Section 3.
     - Update the Phase Status badge (`🔄 IN PROGRESS` or `✅ COMPLETED`) in Section 2.
     - When an entire phase is finished and verified via `make check`, log a sign-off entry in the **Phase Completion Log (Section 5)**.
3. Commit `memory.md` and `PROJECT_STATUS.md` together with your code changes.

---

## 11. Pull Request & Code Review Process

1. **Self-Review First**: Read your own Git diff on GitHub before requesting peer review. Ensure no leftover `console.log`, `print()`, commented-out dead code, or temporary files (`.db`, `__pycache__`) are included.
2. **Fill Out the PR Template**: Detail the motivation, affected components, verification commands run, and DARI safety check.
3. **CI Must Be Green**: The automated GitHub Actions CI workflow must pass completely.
4. **Peer Review Rules**:
   - Reviewers should focus on:
     - Correctness, safety invariants, and lack of data leakage.
     - Preservation of DARI repair action meanings ($A0 - A3$).
     - Test coverage and deterministic test fixtures.
     - Code clarity and adherence to style guides.
   - Be respectful, constructive, and actionable in review feedback.
5. **Merge**: Once approved by at least 1 peer, squash and merge into `main`.

---

## 12. Definition of Done

A task or PR is considered **Done** only when:
- [ ] Code is implemented cleanly without speculative abstractions or dead code.
- [ ] All public functions, contracts, and APIs are properly typed.
- [ ] Comprehensive unit/contract/integration tests are written and pass.
- [ ] `make check` passes locally (`ruff`, `pytest`, `eslint`, `next build`).
- [ ] DARI safety invariants and constraints are preserved.
- [ ] No hardcoded secrets, API keys, or raw sensitive payloads exist.
- [ ] [memory.md](memory.md) is updated with a dated changelog entry and phase status.
- [ ] GitHub Actions CI workflow passes on the PR branch.
- [ ] Peer review is conducted and approved.

Thank you for contributing to SwayamKavach! Let's build a resilient, research-grade autonomous IDS together.

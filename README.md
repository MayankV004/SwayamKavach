# SwayamKavach

**Self-Healing Autonomous IoT Intrusion Detection System with DARI (Damage-Aware Retraining & Intervention)**

## Overview
SwayamKavach is a research-grade, safety-conscious IoT intrusion detection and adaptive MLOps system. It operates on a closed-loop lifecycle:

```text
Monitor → Detect → Diagnose (Dx, Dy, Db) → Select Repair (A0–A3) → Build Candidate → Validate → Canary → Promote or Roll Back
```

## Quick Start (with `uv`)

### Prerequisites
- Python 3.11 or 3.12
- [`uv`](https://docs.astral.sh/uv/) (v0.5+)
- Docker & Docker Compose

### 1. Environment Setup
```bash
# Sync dependencies and create .venv
uv sync

# Activate environment (optional; you can also run commands with `uv run`)
source .venv/bin/activate
```

### 2. Linting and Testing
```bash
# Run unified quality gate (backend + frontend)
make check

# Or test backend individually
cd backend && uv run pytest
cd backend && uv run ruff check .
```

### 3. Local Development Infrastructure
```bash
# Start PostgreSQL & infrastructure
docker compose -f infra/compose/compose.dev.yaml up -d
```

## Monorepo Layout
- `schemas/`: Pydantic data contracts (canonical Zeek flow events, predictions, ingestion receipts)
- `src/swayamkavach/`: Core application modules (API, features, serving, inference consumer, db)
- `frontend/`: Operator dashboard
- `infra/`: Docker Compose and Nginx reverse proxy configurations
- `tests/`: Contract, unit, and integration tests
- `docs/`: System architecture, PRDs, and phase-wise implementation specifications
- `memory.md`: Living record of system architecture, phase state, and changelog

## Contributing & Team Guidelines
Working in this repository follows strict engineering rules, DARI safety invariants, conventional commits, and living documentation practices.

Please read **[CONTRIBUTING.md](CONTRIBUTING.md)** for:
- Local setup and branch naming conventions
- Pre-commit quality gate (`make check`)
- Procedure for opening pull requests and code reviews
- The `memory.md` update policy


#!/usr/bin/env bash
# ==============================================================================
# SwayamKavach — Clean-Room Environment Restore Rehearsal Script
#
# Phase 9: Automated validation script ensuring that any researcher, operator,
# or faculty reviewer can clone this repository on a fresh Linux workstation
# and verify full system integrity, model lineage, and test correctness.
#
# Usage:
#   chmod +x scripts/rehearse_restore.sh
#   ./scripts/rehearse_restore.sh
# ==============================================================================

set -euo pipefail

# ANSI Color codes for clean reporting
BOLD="\033[1m"
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
CYAN="\033[0;36m"
RESET="\033[0m"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

echo -e "${BOLD}${CYAN}======================================================================${RESET}"
echo -e "${BOLD}${CYAN}   SwayamKavach — Phase 9 Clean-Room Environment Rehearsal   ${RESET}"
echo -e "${BOLD}${CYAN}======================================================================${RESET}"
echo -e "Repository root: ${REPO_ROOT}"
echo -e "Date/Time:       $(date -u +"%Y-%m-%d %H:%M:%SZ")"
echo -e "Git Commit:      $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
echo -e "Git Branch:      $(git branch --show-current 2>/dev/null || echo 'N/A')"
echo ""

# ------------------------------------------------------------------------------
# STEP 1: Toolchain and Runtime Prerequisites Check
# ------------------------------------------------------------------------------
echo -e "${BOLD}[Step 1/6] Checking runtime prerequisites...${RESET}"

if ! command -v uv &> /dev/null; then
    echo -e "${RED}ERROR: 'uv' is not installed or not in PATH.${RESET}"
    echo "Install it via: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi
UV_VERSION=$(uv --version)
echo -e "  ✓ uv detected: ${GREEN}${UV_VERSION}${RESET}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: 'node' is not installed or not in PATH.${RESET}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "  ✓ Node.js detected: ${GREEN}${NODE_VERSION}${RESET}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: 'npm' is not installed or not in PATH.${RESET}"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "  ✓ npm detected: ${GREEN}${NPM_VERSION}${RESET}"

# ------------------------------------------------------------------------------
# STEP 2: Dependency Synchronization (Clean-Room Verification)
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}[Step 2/6] Synchronizing frozen dependencies...${RESET}"

echo -e "  → Syncing Python dependencies via 'uv sync --frozen'..."
(cd "${REPO_ROOT}/backend" && uv sync --frozen)
echo -e "  ✓ Python virtualenv synchronized cleanly."

echo -e "  → Verifying frontend dependencies..."
if [ ! -d "${REPO_ROOT}/frontend/node_modules" ]; then
    echo -e "  → Installing frontend packages via 'npm ci'..."
    (cd "${REPO_ROOT}/frontend" && npm ci)
else
    echo -e "  ✓ Frontend node_modules present."
fi

# ------------------------------------------------------------------------------
# STEP 3: Cryptographic Artifact & Model Lineage Verification
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}[Step 3/6] Verifying Release R1 artifact integrity & manifests...${RESET}"

MANIFEST_FILE="${REPO_ROOT}/backend/releases/R1/manifest.json"
PIPELINE_FILE="${REPO_ROOT}/backend/releases/R1/pipeline.joblib"

if [ ! -f "${MANIFEST_FILE}" ]; then
    echo -e "${RED}ERROR: Release R1 manifest missing at ${MANIFEST_FILE}${RESET}"
    exit 1
fi

if [ ! -f "${PIPELINE_FILE}" ]; then
    echo -e "${RED}ERROR: Release R1 pipeline artifact missing at ${PIPELINE_FILE}${RESET}"
    exit 1
fi

EXPECTED_SHA=$(grep -o '"bundle_sha256": *"[^"]*"' "${MANIFEST_FILE}" | cut -d'"' -f4)
ACTUAL_SHA=$(sha256sum "${PIPELINE_FILE}" | awk '{print $1}')

if [ "${EXPECTED_SHA}" != "${ACTUAL_SHA}" ]; then
    echo -e "${RED}ERROR: SHA-256 mismatch on R1 pipeline bundle!${RESET}"
    echo -e "  Expected: ${EXPECTED_SHA}"
    echo -e "  Actual:   ${ACTUAL_SHA}"
    exit 1
fi
echo -e "  ✓ Release R1 bundle SHA-256 verified: ${GREEN}${ACTUAL_SHA:0:16}...${RESET}"

# ------------------------------------------------------------------------------
# STEP 4: Database Schema Initialization & Health Check
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}[Step 4/6] Initializing database tables and testing DB session...${RESET}"

DB_CHECK_OUTPUT=$(cd "${REPO_ROOT}/backend" && uv run python -c '
from swayamkavach.db.session import init_db, SessionLocal
from swayamkavach.db.models import IngestionBatchRecordDB, LifecycleStateRecordDB
init_db()
session = SessionLocal()
try:
    batch_count = session.query(IngestionBatchRecordDB).count()
    state = session.query(LifecycleStateRecordDB).first()
    champ = state.champion_release if state else "R1"
    print(f"DB OK: {batch_count} batches, champion: {champ}")
finally:
    session.close()
')
echo -e "  ✓ ${GREEN}${DB_CHECK_OUTPUT}${RESET}"

# ------------------------------------------------------------------------------
# STEP 5: Full Automated Quality Gate Execution (make check)
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}[Step 5/6] Executing full quality gate (make check)...${RESET}"

echo -e "  → 1. Backend Linting (ruff)..."
(cd "${REPO_ROOT}/backend" && uv run ruff check .)
echo -e "    ✓ Ruff lint passed (0 errors)."

echo -e "  → 2. Backend Automated Test Suite (pytest, 56 unit & integration tests)..."
(cd "${REPO_ROOT}/backend" && uv run pytest -q)
echo -e "    ✓ Pytest passed (100% test pass rate)."

echo -e "  → 3. Frontend Linting (eslint)..."
(cd "${REPO_ROOT}/frontend" && npm run lint)
echo -e "    ✓ ESLint passed (0 errors)."

echo -e "  → 4. Frontend Production Build (Next.js)..."
(cd "${REPO_ROOT}/frontend" && npm run build)
echo -e "    ✓ Next.js build clean."

# ------------------------------------------------------------------------------
# STEP 6: Deterministic Scenario Replay Dry-Run
# ------------------------------------------------------------------------------
echo ""
echo -e "${BOLD}[Step 6/6] Executing deterministic scenario replay verification...${RESET}"

REPLAY_OUTPUT=$(cd "${REPO_ROOT}/backend" && uv run python -c '
from swayamkavach.experiments.scenarios import ReplayScenarioRunner
runner = ReplayScenarioRunner()
result = runner.run_boundary_shift_scenario()
print(f"Scenario BOUNDARY_SHIFT completed: {result.chosen_action.value} chosen. Deployment: {result.deployment_action}")
assert result.chosen_action.value == "A1", f"Expected A1, got {result.chosen_action.value}"
assert result.safety_invariants_preserved, "Safety invariants violated!"
')
echo -e "  ✓ ${GREEN}${REPLAY_OUTPUT}${RESET}"

echo ""
echo -e "${BOLD}${GREEN}======================================================================${RESET}"
echo -e "${BOLD}${GREEN}   ✓ PHASE 9 CLEAN-ROOM RESTORE REHEARSAL SUCCEEDED (GATE G9)        ${RESET}"
echo -e "${BOLD}${GREEN}======================================================================${RESET}"
echo -e "All dependencies, data hashes, DB migrations, tests, and scenario"
echo -e "replays have been cryptographically and empirically validated."
echo ""
exit 0

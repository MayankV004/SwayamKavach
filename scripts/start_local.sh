#!/usr/bin/env bash
# ==============================================================================
# SwayamKavach — Local Full-Stack Background Launcher
#
# Starts all backend microservices in the background:
#  - API Server (:8000)
#  - Slot A Serving (:8001)
#  - Slot B Serving (:8002)
#  - Inference Consumer Worker
# ==============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${REPO_ROOT}/.logs"
PID_DIR="${REPO_ROOT}/.pids"

mkdir -p "${LOG_DIR}" "${PID_DIR}"

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
RESET="\033[0m"

echo -e "${BOLD}${CYAN}======================================================================${RESET}"
echo -e "${BOLD}${CYAN}   Starting SwayamKavach Edge Intrusion Detection Platform          ${RESET}"
echo -e "${BOLD}${CYAN}======================================================================${RESET}"

# Stop any previously running local instances
if [ -f "${PID_DIR}/api.pid" ] || [ -f "${PID_DIR}/serving_a.pid" ]; then
    echo -e "${YELLOW}Stopping existing instances first...${RESET}"
    "${REPO_ROOT}/scripts/stop_local.sh" || true
    sleep 1
fi

cd "${REPO_ROOT}/backend"

echo -e "${BOLD}[1/4] Starting API Control Plane on http://localhost:8000...${RESET}"
nohup uv run uvicorn swayamkavach.api.main:app --host 0.0.0.0 --port 8000 > "${LOG_DIR}/api.log" 2>&1 &
echo $! > "${PID_DIR}/api.pid"

echo -e "${BOLD}[2/4] Starting Champion Serving Slot A on http://localhost:8001...${RESET}"
nohup env SLOT_ID=A RELEASE_ID=R1 uv run uvicorn swayamkavach.serving.app:app --host 0.0.0.0 --port 8001 > "${LOG_DIR}/serving_a.log" 2>&1 &
echo $! > "${PID_DIR}/serving_a.pid"

echo -e "${BOLD}[3/4] Starting Standby Serving Slot B on http://localhost:8002...${RESET}"
nohup env SLOT_ID=B RELEASE_ID=R1 uv run uvicorn swayamkavach.serving.app:app --host 0.0.0.0 --port 8002 > "${LOG_DIR}/serving_b.log" 2>&1 &
echo $! > "${PID_DIR}/serving_b.pid"

echo -e "${BOLD}[4/4] Starting Inference Consumer Worker...${RESET}"
nohup uv run python src/swayamkavach/inference_consumer.py > "${LOG_DIR}/consumer.log" 2>&1 &
echo $! > "${PID_DIR}/consumer.pid"

cd "${REPO_ROOT}"

echo ""
echo -e "${BOLD}${GREEN}✓ All 4 backend services are running in the background!${RESET}"
echo -e "  - API Docs:      ${CYAN}http://localhost:8000/docs${RESET}"
echo -e "  - Slot A Health: ${CYAN}http://localhost:8001/health${RESET}"
echo -e "  - Slot B Health: ${CYAN}http://localhost:8002/health${RESET}"
echo -e "  - Logs folder:   ${LOG_DIR}/"
echo ""
echo -e "To start the frontend dashboard, run:"
echo -e "  ${BOLD}${YELLOW}make frontend${RESET}   (or cd frontend && npm run dev)"
echo -e "Then open: ${BOLD}${GREEN}http://localhost:3000${RESET}"
echo ""
echo -e "To stop backend services at any time, run:"
echo -e "  ${BOLD}${YELLOW}make stop${RESET}       (or ./scripts/stop_local.sh)"
echo ""

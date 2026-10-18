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

export PYTHONPATH="${REPO_ROOT}/backend/src:${REPO_ROOT}/backend:${PYTHONPATH:-}"
VENV_BIN="${REPO_ROOT}/backend/.venv/bin"

echo -e "${BOLD}[1/5] Starting API Control Plane on http://localhost:8000...${RESET}"
nohup "${VENV_BIN}/uvicorn" swayamkavach.api.main:app --host 0.0.0.0 --port 8000 --reload > "${LOG_DIR}/api.log" 2>&1 &
echo $! > "${PID_DIR}/api.pid"
disown

echo -e "${BOLD}[2/5] Starting Champion Serving Slot A on http://localhost:8001...${RESET}"
nohup env SLOT_ID=A RELEASE_ID=R1 "${VENV_BIN}/uvicorn" swayamkavach.serving.app:app --host 0.0.0.0 --port 8001 > "${LOG_DIR}/serving_a.log" 2>&1 &
echo $! > "${PID_DIR}/serving_a.pid"
disown

echo -e "${BOLD}[3/5] Starting Standby Serving Slot B on http://localhost:8002...${RESET}"
nohup env SLOT_ID=B RELEASE_ID=R1 "${VENV_BIN}/uvicorn" swayamkavach.serving.app:app --host 0.0.0.0 --port 8002 > "${LOG_DIR}/serving_b.log" 2>&1 &
echo $! > "${PID_DIR}/serving_b.pid"
disown

echo -e "${BOLD}[4/5] Starting Inference Consumer Worker...${RESET}"
nohup "${VENV_BIN}/python" src/swayamkavach/inference_consumer.py > "${LOG_DIR}/consumer.log" 2>&1 &
echo $! > "${PID_DIR}/consumer.pid"
disown

echo -e "${BOLD}[5/5] Starting MLflow Tracking & Model Registry on http://localhost:5000...${RESET}"
nohup "${VENV_BIN}/mlflow" ui --backend-store-uri "sqlite:///${REPO_ROOT}/backend/mlflow.db" --host 0.0.0.0 --port 5000 > "${LOG_DIR}/mlflow.log" 2>&1 &
echo $! > "${PID_DIR}/mlflow.pid"
disown

cd "${REPO_ROOT}"

echo ""
echo -e "${BOLD}${GREEN}✓ All 5 backend services are running in the background!${RESET}"
echo -e "  - API Docs:      ${CYAN}http://localhost:8000/docs${RESET}"
echo -e "  - Slot A Health: ${CYAN}http://localhost:8001/health${RESET}"
echo -e "  - Slot B Health: ${CYAN}http://localhost:8002/health${RESET}"
echo -e "  - MLflow UI:     ${CYAN}http://localhost:5000${RESET}"
echo -e "  - Logs folder:   ${LOG_DIR}/"
echo ""
echo -e "To start the frontend dashboard, run:"
echo -e "  ${BOLD}${YELLOW}make frontend${RESET}   (or cd frontend && npm run dev)"
echo -e "Then open: ${BOLD}${GREEN}http://localhost:3000${RESET}"
echo ""
echo -e "To stop backend services at any time, run:"
echo -e "  ${BOLD}${YELLOW}make stop${RESET}       (or ./scripts/stop_local.sh)"
echo ""

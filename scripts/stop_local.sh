#!/usr/bin/env bash
# ==============================================================================
# SwayamKavach — Stop Local Background Services
# ==============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="${REPO_ROOT}/.pids"

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RESET="\033[0m"

echo -e "${BOLD}${YELLOW}Stopping SwayamKavach background processes...${RESET}"

for pid_file in "${PID_DIR}"/*.pid; do
    if [ -f "${pid_file}" ]; then
        service_name=$(basename "${pid_file}" .pid)
        pid=$(cat "${pid_file}")
        if kill -0 "${pid}" 2>/dev/null; then
            kill "${pid}" 2>/dev/null || true
            echo -e "  - Stopped ${service_name} (PID ${pid})"
        fi
        rm -f "${pid_file}"
    fi
done

# Fallback cleanup on port 8000, 8001, 8002 if needed
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 8001/tcp 2>/dev/null || true
fuser -k 8002/tcp 2>/dev/null || true

echo -e "${BOLD}${GREEN}✓ All local background services stopped.${RESET}"

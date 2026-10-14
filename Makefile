.PHONY: sync test lint lint-fix api serving-a serving-b consumer frontend frontend-lint frontend-build check docker-up docker-down clean

# Backend Environment & Dependencies (uv)
sync:
	cd backend && uv sync

# Code Quality & Tests
test:
	cd backend && uv run pytest

lint:
	cd backend && uv run ruff check .

lint-fix:
	cd backend && uv run ruff check --fix .

# Local Backend Services
api:
	cd backend && uv run uvicorn swayamkavach.api.main:app --reload --port 8000

serving-a:
	cd backend && SLOT_ID=A RELEASE_ID=R1 uv run uvicorn swayamkavach.serving.app:app --reload --port 8001

serving-b:
	cd backend && SLOT_ID=B RELEASE_ID=R1 uv run uvicorn swayamkavach.serving.app:app --reload --port 8002

consumer:
	cd backend && uv run python src/swayamkavach/inference_consumer.py

# Frontend Development
frontend:
	cd frontend && npm run dev

frontend-lint:
	cd frontend && npm run lint

frontend-build:
	cd frontend && npm run build

# Unified Quality Gate (Run before pushing / opening PR)
check: lint test frontend-lint frontend-build

# Docker Compose Infrastructure
docker-up:
	docker compose -f infra/compose/compose.dev.yaml up -d

docker-down:
	docker compose -f infra/compose/compose.dev.yaml down

clean:
	rm -rf backend/.pytest_cache backend/.ruff_cache backend/*.db frontend/.next frontend/out
	find . -type d -name __pycache__ -exec rm -rf {} +

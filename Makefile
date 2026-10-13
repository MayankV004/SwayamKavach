.PHONY: sync test lint lint-fix api serving-a serving-b consumer docker-up docker-down clean

# UV Environment & Dependencies
sync:
	uv sync

# Code Quality & Tests
test:
	uv run pytest

lint:
	uv run ruff check .

lint-fix:
	uv run ruff check --fix .

# Local Services Execution
api:
	uv run uvicorn swayamkavach.api.main:app --reload --port 8000

serving-a:
	SLOT_ID=A RELEASE_ID=R1 uv run uvicorn swayamkavach.serving.app:app --reload --port 8001

serving-b:
	SLOT_ID=B RELEASE_ID=R1 uv run uvicorn swayamkavach.serving.app:app --reload --port 8002

consumer:
	uv run python src/swayamkavach/inference_consumer.py

# Docker Compose Infrastructure
docker-up:
	docker compose -f infra/compose/compose.dev.yaml up -d

docker-down:
	docker compose -f infra/compose/compose.dev.yaml down

clean:
	rm -rf .pytest_cache .ruff_cache *.db
	find . -type d -name __pycache__ -exec rm -rf {} +

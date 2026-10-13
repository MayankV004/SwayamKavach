# SwayamKavach Backend

Python backend for SwayamKavach: Self-Healing Autonomous IoT Intrusion Detection System.

## Architecture
- `schemas/`: Pydantic data contracts (canonical Zeek flow events, predictions, ingestion receipts)
- `src/swayamkavach/api/`: FastAPI control plane & ingestion routes
- `src/swayamkavach/db/`: SQLAlchemy ORM models & session management
- `src/swayamkavach/serving/`: Isolated model serving slot runtime (Slot A & B)
- `src/swayamkavach/inference_consumer.py`: Background durable queue worker
- `src/swayamkavach/features/`: Canonical Zeek conn.log feature adapter
- `tests/`: Automated contract, unit, and integration tests

## Commands (with `uv`)
```bash
# Sync dependencies
uv sync

# Run tests
uv run pytest

# Run linter
uv run ruff check .

# Run API server
uv run uvicorn swayamkavach.api.main:app --reload --port 8000
```

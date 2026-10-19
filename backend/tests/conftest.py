"""Shared pytest fixtures."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from swayamkavach.db.models import Base
from swayamkavach.db.session import get_db

# Use in-memory SQLite for blazing fast isolated tests
TEST_DB_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def engine():
    """Create test SQLite engine."""
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture(scope="function")
def db_session(engine):
    """Provide a transactional in-memory database session for a test function."""
    connection = engine.connect()
    transaction = connection.begin()
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = session_factory()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Test client with overridden database dependency."""
    from fastapi.testclient import TestClient

    from swayamkavach.api.main import app

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, headers={"X-API-Key": "swayamkavach-control-plane-secret-key-v1"}) as test_client:
        yield test_client
    app.dependency_overrides.clear()


TEST_RELEASES = [
    "R2",
    "R2-candidate",
    "R2-unstable",
    "R2-faulty",
    "R2-zero-evidence",
    "R2-all-benign",
    "R2-all-attack",
    "R2-nginx-missing",
    "R2-bad-reload",
    "R2-heuristic",
]


@pytest.fixture(autouse=True)
def setup_test_candidate_artifacts():
    """Ensure test candidate artifacts exist on disk so controller pre-flight verification passes."""
    import json
    import shutil
    from pathlib import Path

    backend_dir = Path(__file__).resolve().parent.parent
    r1_dir = backend_dir / "releases" / "R1"
    created_dirs = []
    if r1_dir.exists():
        for rel_id in TEST_RELEASES:
            rel_dir = backend_dir / "releases" / rel_id
            if not rel_dir.exists():
                rel_dir.mkdir(parents=True, exist_ok=True)
                shutil.copy(r1_dir / "pipeline.joblib", rel_dir / "pipeline.joblib")
                with open(r1_dir / "manifest.json", encoding="utf-8") as f:
                    m = json.load(f)
                m["release_id"] = rel_id
                with open(rel_dir / "manifest.json", "w", encoding="utf-8") as f:
                    json.dump(m, f)
                created_dirs.append(rel_dir)
    yield
    for d in created_dirs:
        if d.name not in ("R2", "R2-candidate"):
            shutil.rmtree(d, ignore_errors=True)


@pytest.fixture(autouse=True)
def mock_serving_slot_http(monkeypatch):
    """Hermetic test isolation: mock candidate slot readiness probe, identity, and reload endpoint."""
    from unittest.mock import MagicMock

    active_releases = {8001: "R1", 8002: "R2"}
    active_thresholds = {8001: 0.42, 8002: 0.42}

    class MockHttpxClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def get(self, url, **kwargs):
            port = 8001 if "8001" in url else 8002
            mock = MagicMock()
            mock.status_code = 200
            if "identity" in url:
                mock.json.return_value = {
                    "release_id": active_releases.get(port, "R2"),
                    "status": "active",
                }
            elif "readyz" in url:
                mock.json.return_value = {
                    "status": "ready",
                    "is_ready": True,
                    "inference_mode": "pipeline",
                    "threshold": active_thresholds.get(port, 0.42),
                }
            else:
                mock.json.return_value = {"status": "ok"}
            return mock

        def post(self, url, params=None, json=None, **kwargs):
            port = 8001 if "8001" in url else 8002
            p = params or kwargs.get("params", {})
            if p and "release_id" in p:
                active_releases[port] = p["release_id"]
            if p and "threshold" in p:
                active_thresholds[port] = float(p["threshold"])
            mock = MagicMock()
            mock.status_code = 200
            mock.json.return_value = {
                "status": "reloaded",
                "release_id": active_releases.get(port, "R2"),
            }
            return mock

    monkeypatch.setattr("httpx.Client", MockHttpxClient)

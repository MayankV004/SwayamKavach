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


@pytest.fixture(autouse=True)
def mock_serving_slot_http(monkeypatch):
    """Hermetic test isolation: mock candidate slot readiness probe and reload endpoint."""
    from unittest.mock import MagicMock

    mock_resp_ready = MagicMock()
    mock_resp_ready.status_code = 200
    mock_resp_ready.json.return_value = {"status": "ready", "is_ready": True, "inference_mode": "pipeline"}

    mock_resp_reload = MagicMock()
    mock_resp_reload.status_code = 200
    mock_resp_reload.json.return_value = {"status": "reloaded"}

    class MockHttpxClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def get(self, url, **kwargs):
            return mock_resp_ready

        def post(self, url, **kwargs):
            return mock_resp_reload

    monkeypatch.setattr("httpx.Client", MockHttpxClient)

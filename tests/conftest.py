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
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

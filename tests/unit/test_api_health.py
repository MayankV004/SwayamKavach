"""Unit tests for API health and readiness endpoints."""


def test_api_health(client):
    """Test /api/v1/health liveness."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "swayamkavach-api"


def test_api_readyz(client):
    """Test /api/v1/readyz DB check."""
    response = client.get("/api/v1/readyz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"

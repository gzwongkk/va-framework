from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint() -> None:
    client = TestClient(app)

    response = client.get('/api/health')

    assert response.status_code == 200
    assert response.json()['version'] == '2.2.6'
    assert response.json()['stage'] == 'single-view-analytics'

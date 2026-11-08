from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_root_message():
    response = client.get('/')
    assert response.status_code == 200
    assert 'running' in response.json()['message']
#testing

def test_healthz():
    response = client.get('/healthz')
    assert response.status_code == 200
    assert response.json() == {'status': 'healthy', 'service': 'packaging-backend'}


def test_unknown_route_returns_structured_error():
    response = client.get('/does-not-exist')
    assert response.status_code == 404
    assert 'error' in response.json()
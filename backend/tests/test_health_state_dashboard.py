import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)
HEALTH_URL = '/api/v1/health-inputs'


def health_payload(**overrides):
    payload = {
        'schema_version': '1.0',
        'source': 'manual',
        'input_mode': 'manual_entry',
        'line_id': 'line_1',
        'input': {'temperature': {'value': 72.5, 'unit': 'celsius'}, 'wear_percent': 38},
        'timestamp_utc': '2026-11-10T10:20:00Z',
    }
    payload.update(overrides)
    return payload


def test_operator_can_store_a_health_input(fake_repo, login_as):
    login_as('operator')
    response = client.post(HEALTH_URL, json=health_payload())
    assert response.status_code == 201
    stored = fake_repo.docs[('health_readings', response.json()['reading_id'])]
    assert stored['submitted_by_uid'] == 'test-operator'
    assert stored['calculated']['health_score'] is None


def test_viewer_cannot_store_a_health_input(fake_repo, login_as):
    login_as('viewer')
    assert client.post(HEALTH_URL, json=health_payload()).status_code == 403
    assert fake_repo.count('health_readings') == 0


@pytest.mark.parametrize(
    'overrides',
    [
        {'input': {}},
        {'source': 'calculated'},
        {'timestamp_utc': '2026-11-10T10:20:00'},
        {'line_id': 'line_9'},
    ],
)
def test_bad_health_inputs_are_rejected(fake_repo, login_as, overrides):
    login_as('operator')
    assert client.post(HEALTH_URL, json=health_payload(**overrides)).status_code == 422


def test_internal_orders_hide_secret_fields(fake_repo, login_as, place_order):
    place_order()
    login_as('viewer')
    response = client.get('/api/v1/internal/orders')
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert 'hash' not in str(response.json())


def test_system_state_lists_pending_orders(fake_repo, login_as, place_order):
    place_order()
    login_as('viewer')
    body = client.get('/api/v1/system/state').json()
    assert body['queue']['length'] == 1
    assert set(body['machine_health']) == {'line_1', 'line_2', 'global'}


def test_dashboard_overview_counts_orders(fake_repo, login_as, place_order):
    place_order()
    place_order()
    login_as('viewer')
    body = client.get('/api/v1/dashboard/overview').json()
    assert body['total_orders'] == 2
    assert body['orders_by_status']['received'] == 2
    assert body['latest_scheduling_run'] is None


def test_dashboard_needs_a_login(fake_repo):
    assert client.get('/api/v1/dashboard/overview').status_code == 401
import types

import pytest
from fastapi.testclient import TestClient

from backend.app.core import security
from backend.app.main import app
from backend.app.services import bridge_service, order_service

client = TestClient(app)
BRIDGE = {'X-Bridge-Token': 'test-token'}
NEXT = '/api/v1/bridge/commands/next'


@pytest.fixture
def bridge_token(monkeypatch):
    monkeypatch.setattr(
        security, 'get_settings', lambda: types.SimpleNamespace(bridge_token='test-token')
    )


def test_scheduling_needs_pending_orders(fake_repo, login_as):
    login_as('operator')
    assert client.post('/api/v1/scheduling/requests', json={}).status_code == 409


def test_operator_can_request_scheduling(fake_repo, login_as, place_order):
    place_order()
    login_as('operator')
    response = client.post('/api/v1/scheduling/requests', json={})
    assert response.status_code == 201
    body = response.json()
    assert body['status'] == 'created'
    assert body['state_version'] == 1
    run = client.get('/api/v1/scheduling/requests/' + body['request_id']).json()
    assert set(run['agents']) == {'ml_agent', 'rl_agent', 'rule_based_agent'}
    assert len(run['state_snapshot']['pending_orders']) == 1


def test_viewer_cannot_request_scheduling(fake_repo, login_as, place_order):
    place_order()
    login_as('viewer')
    assert client.post('/api/v1/scheduling/requests', json={}).status_code == 403


def test_bridge_routes_need_the_token(fake_repo, bridge_token):
    assert client.get(NEXT).status_code == 401
    assert client.get(NEXT, headers={'X-Bridge-Token': 'wrong'}).status_code == 401
    assert client.get(NEXT, headers=BRIDGE).status_code == 204


def send_event(command_id, event_type, at, order_id=None):
    body = {'command_id': command_id, 'event_type': event_type, 'occurred_at_utc': at}
    if order_id:
        body['order_id'] = order_id
    return client.post('/api/v1/bridge/events', json=body, headers=BRIDGE)


def test_bridge_full_flow(fake_repo, bridge_token, place_order):
    order = place_order()
    order_id = order['order_id']
    order_service.update_order_status(order_id, 'queued')
    command_id = bridge_service.create_command(
        'RUN-1', 'SCH-1', 'start_schedule', {'order_sequence': [order_id]}
    )

    first = client.get(NEXT, headers=BRIDGE)
    assert first.status_code == 200
    assert first.json()['command_id'] == command_id
    assert first.json()['status'] == 'sent'
    assert client.get(NEXT, headers=BRIDGE).status_code == 204

    ack = client.post(
        '/api/v1/bridge/commands/' + command_id + '/ack',
        json={'received_at_utc': '2026-11-10T10:00:00Z'},
        headers=BRIDGE,
    )
    assert ack.json()['status'] == 'acknowledged'

    started = send_event(command_id, 'order_started', '2026-11-10T10:01:00Z', order_id)
    assert started.json()['order_status_updated'] is True
    done = send_event(command_id, 'order_completed', '2026-11-10T10:05:00Z', order_id)
    assert done.json()['order_status_updated'] is True
    send_event(command_id, 'command_completed', '2026-11-10T10:06:00Z')

    tracking = client.get(
        '/api/v1/orders/' + order_id + '/tracking',
        headers={'X-Order-Tracking-Token': order['tracking_token']},
    ).json()
    assert tracking['status'] == 'Completed'
    assert tracking['completed_at_utc'].startswith('2026-11-10T10:05:00')
    assert fake_repo.docs[('simulation_commands', command_id)]['status'] == 'completed'


def test_event_that_does_not_fit_is_kept_but_not_applied(fake_repo, bridge_token, place_order):
    order_id = place_order()['order_id']
    command_id = bridge_service.create_command('RUN-1', 'SCH-1', 'start_schedule', {})
    response = send_event(command_id, 'order_started', '2026-11-10T10:01:00Z', order_id)
    assert response.status_code == 201
    assert response.json()['order_status_updated'] is False
    assert response.json()['note'] is not None
    assert fake_repo.count('production_runs') == 1
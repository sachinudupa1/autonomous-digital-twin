from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from backend.app.core.errors import AppError
from backend.app.main import app
from backend.app.services import order_service
from backend.app.utils.ids import hash_value

client = TestClient(app)
URL = '/api/v1/orders'
GOOD_ITEMS = {'ball_1': 2, 'ball_2': 3, 'ball_3': 0, 'ball_4': 1}


def make_payload(**overrides):
    payload = {'schema_version': '1.0', 'items': dict(GOOD_ITEMS), 'order_type': 'normal'}
    payload.update(overrides)
    return payload


def future_deadline():
    return (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()


def past_deadline():
    return (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()


BAD_PAYLOADS = {
    'all_zero': make_payload(items={'ball_1': 0, 'ball_2': 0, 'ball_3': 0, 'ball_4': 0}),
    'negative': make_payload(items={'ball_1': -1, 'ball_2': 3, 'ball_3': 0, 'ball_4': 1}),
    'above_five': make_payload(items={'ball_1': 6, 'ball_2': 3, 'ball_3': 0, 'ball_4': 1}),
    'text_quantity': make_payload(items={'ball_1': '2', 'ball_2': 3, 'ball_3': 0, 'ball_4': 1}),
    'missing_field': make_payload(items={'ball_1': 2, 'ball_2': 3, 'ball_3': 0}),
    'unknown_field': make_payload(product_quantities={}),
    'bad_order_type': make_payload(order_type='urgent'),
    'rush_without_deadline': make_payload(order_type='rush'),
    'rush_past_deadline': make_payload(order_type='rush', requested_deadline_utc=past_deadline()),
    'rush_no_timezone': make_payload(order_type='rush', requested_deadline_utc='2999-01-01T12:00:00'),
    'normal_with_deadline': make_payload(requested_deadline_utc=future_deadline()),
}


@pytest.mark.parametrize('name', list(BAD_PAYLOADS))
def test_bad_orders_are_rejected(fake_repo, name):
    response = client.post(URL, json=BAD_PAYLOADS[name])
    assert response.status_code == 422
    assert fake_repo.count('orders') == 0


def test_valid_normal_order_is_saved(fake_repo):
    response = client.post(URL, json=make_payload())
    assert response.status_code == 201
    body = response.json()
    assert body['order_id'].startswith('ORD-')
    assert body['status'] == 'received'
    stored = fake_repo.docs[('orders', body['order_id'])]
    assert stored['total_quantity'] == 6
    assert stored['tracking_token_hash'] == hash_value(body['tracking_token'])
    assert body['tracking_token'] not in str(stored)


def test_valid_rush_order_is_saved(fake_repo):
    payload = make_payload(order_type='rush', requested_deadline_utc=future_deadline())
    assert client.post(URL, json=payload).status_code == 201


def test_order_ids_are_unique(fake_repo):
    first = client.post(URL, json=make_payload()).json()['order_id']
    second = client.post(URL, json=make_payload()).json()['order_id']
    assert first != second


def test_same_idempotency_key_creates_one_order(fake_repo):
    headers = {'Idempotency-Key': 'abc-123'}
    first = client.post(URL, json=make_payload(), headers=headers)
    second = client.post(URL, json=make_payload(), headers=headers)
    assert first.status_code == 201
    assert second.status_code == 200
    assert first.json()['order_id'] == second.json()['order_id']
    assert fake_repo.count('orders') == 1


def test_tracking_returns_only_safe_fields(fake_repo):
    created = client.post(URL, json=make_payload()).json()
    response = client.get(
        URL + '/' + created['order_id'] + '/tracking',
        headers={'X-Order-Tracking-Token': created['tracking_token']},
    )
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {'order_id', 'items', 'status', 'completed_at_utc'}
    assert body['status'] == 'Order Received'
    assert body['completed_at_utc'] is None


def test_tracking_needs_the_right_token(fake_repo):
    created = client.post(URL, json=make_payload()).json()
    url = URL + '/' + created['order_id'] + '/tracking'
    assert client.get(url).status_code == 404
    assert client.get(url, headers={'X-Order-Tracking-Token': 'wrong'}).status_code == 404
    assert client.get(URL + '/ORD-UNKNOWN/tracking', headers={'X-Order-Tracking-Token': 'x'}).status_code == 404


def test_status_changes_follow_the_allowed_order(fake_repo):
    created = client.post(URL, json=make_payload()).json()
    order_id = created['order_id']
    with pytest.raises(AppError) as error:
        order_service.update_order_status(order_id, 'completed')
    assert error.value.status_code == 409
    for new_status in ('queued', 'packing', 'completed'):
        order_service.update_order_status(order_id, new_status)
    tracking = client.get(
        URL + '/' + order_id + '/tracking',
        headers={'X-Order-Tracking-Token': created['tracking_token']},
    ).json()
    assert tracking['status'] == 'Completed'
    assert tracking['completed_at_utc'] is not None
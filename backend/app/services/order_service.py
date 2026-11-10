import hmac
from datetime import timezone

from backend.app.core.errors import AppError
from backend.app.repositories import collections as col
from backend.app.repositories import firestore_repository as repo
from backend.app.schemas.orders import CreateOrderRequest
from backend.app.utils.ids import generate_order_id, generate_tracking_token, hash_value

STATUS_LABELS = {
    'received': 'Order Received',
    'queued': 'Queued',
    'packing': 'Packing',
    'completed': 'Completed',
}

ALLOWED_TRANSITIONS = {
    'received': {'queued'},
    'queued': {'packing'},
    'packing': {'completed'},
    'completed': set(),
}

STATUS_TIME_FIELDS = {
    'queued': 'queued_at_utc',
    'packing': 'packing_started_at_utc',
    'completed': 'completed_at_utc',
}


def create_order(request: CreateOrderRequest, idempotency_key: str | None) -> dict:
    key_hash = hash_value(idempotency_key) if idempotency_key else None

    if key_hash:
        existing = repo.query_documents(
            col.ORDERS, filters={'idempotency_key_hash': key_hash}, limit=1
        )
        if existing:
            return {
                'order_id': existing[0]['order_id'],
                'status': existing[0]['status'],
                'tracking_token': None,
                'message': 'This order was already received. The tracking token was shown when it was first submitted.',
                'duplicate': True,
            }

    order_id = generate_order_id()
    token = generate_tracking_token()
    now = repo.utc_now()
    deadline = request.requested_deadline_utc

    document = {
        'schema_version': request.schema_version,
        'order_id': order_id,
        'items': request.items.model_dump(),
        'total_quantity': request.items.total_quantity(),
        'order_type': request.order_type,
        'requested_deadline_utc': deadline.astimezone(timezone.utc) if deadline else None,
        'status': 'received',
        'tracking_token_hash': hash_value(token),
        'idempotency_key_hash': key_hash,
        'scheduling_run_id': None,
        'created_at_utc': now,
        'updated_at_utc': now,
        'queued_at_utc': None,
        'packing_started_at_utc': None,
        'completed_at_utc': None,
    }
    repo.create_document(col.ORDERS, document, doc_id=order_id)

    return {
        'order_id': order_id,
        'status': 'received',
        'tracking_token': token,
        'message': 'Order received successfully.',
        'duplicate': False,
    }


def get_tracking(order_id: str, token: str | None) -> dict:
    not_found = AppError(404, 'order_not_found', 'No order matches that ID and token.')
    if not token:
        raise not_found
    order = repo.get_document(col.ORDERS, order_id)
    if order is None:
        raise not_found
    if not hmac.compare_digest(order.get('tracking_token_hash', ''), hash_value(token)):
        raise not_found
    return {
        'order_id': order['order_id'],
        'items': order['items'],
        'status': STATUS_LABELS[order['status']],
        'completed_at_utc': order.get('completed_at_utc'),
    }


def update_order_status(order_id: str, new_status: str, at=None) -> None:
    order = repo.get_document(col.ORDERS, order_id)
    if order is None:
        raise AppError(404, 'order_not_found', 'That order does not exist.')
    allowed = ALLOWED_TRANSITIONS.get(order['status'], set())
    if new_status not in allowed:
        raise AppError(
            409,
            'invalid_status_change',
            'Cannot change status from ' + order['status'] + ' to ' + new_status + '.',
        )
    now = repo.utc_now()
    changes = {
        'status': new_status,
        'updated_at_utc': now,
        STATUS_TIME_FIELDS[new_status]: at or now,
    }
    repo.update_document(col.ORDERS, order_id, changes)

INTERNAL_FIELDS = [
    'order_id',
    'items',
    'total_quantity',
    'order_type',
    'requested_deadline_utc',
    'status',
    'scheduling_run_id',
    'created_at_utc',
    'updated_at_utc',
    'queued_at_utc',
    'packing_started_at_utc',
    'completed_at_utc',
]


def to_internal_view(order: dict) -> dict:
    return {field: order.get(field) for field in INTERNAL_FIELDS}


def list_internal_orders(status=None, order_type=None, limit=50) -> list[dict]:
    filters = {}
    if status:
        filters['status'] = status
    if order_type:
        filters['order_type'] = order_type
    orders = repo.query_documents(
        col.ORDERS,
        filters=filters,
        order_by='created_at_utc',
        descending=True,
        limit=limit,
    )
    return [to_internal_view(order) for order in orders]
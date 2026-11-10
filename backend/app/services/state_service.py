from backend.app.repositories import collections as col
from backend.app.repositories import firestore_repository as repo
from backend.app.services import order_service

LINES = ('line_1', 'line_2')


def _current_state_version() -> int:
    current = repo.get_document(col.SYSTEM_STATE, 'current')
    return (current or {}).get('state_version', 0)


def _next_state_version() -> int:
    version = _current_state_version() + 1
    repo.create_document(
        col.SYSTEM_STATE,
        {'state_version': version, 'updated_at_utc': repo.utc_now()},
        doc_id='current',
    )
    return version


def latest_health_by_line() -> dict:
    readings = repo.query_documents(
        col.HEALTH_READINGS, order_by='timestamp_utc', descending=True, limit=50
    )
    latest = {line: None for line in (*LINES, 'global')}
    for reading in readings:
        key = reading.get('line_id') or 'global'
        if key in latest and latest[key] is None:
            latest[key] = {
                name: reading.get(name)
                for name in ('reading_id', 'source', 'timestamp_utc', 'input', 'calculated')
            }
    return latest


_latest_health_by_line = latest_health_by_line


def build_state(new_version: bool = False) -> dict:
    version = _next_state_version() if new_version else _current_state_version()
    orders = repo.query_documents(
        col.ORDERS,
        conditions=[('status', 'in', ['received', 'queued', 'packing'])],
        limit=200,
    )
    orders.sort(key=lambda order: order['created_at_utc'])
    pending = [
        order_service.to_internal_view(order)
        for order in orders
        if order['status'] in ('received', 'queued')
    ]
    return {
        'state_id': 'STATE-' + str(version).zfill(6),
        'state_version': version,
        'generated_at_utc': repo.utc_now(),
        'pending_orders': pending,
        'queue': {'length': len(pending)},
        'packaging_progress': {
            'orders_in_packing': [o['order_id'] for o in orders if o['status'] == 'packing']
        },
        'machine_availability': {line: 'unknown' for line in LINES},
        'machine_health': _latest_health_by_line(),
    }
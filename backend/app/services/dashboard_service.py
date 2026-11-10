from backend.app.repositories import collections as col
from backend.app.repositories import firestore_repository as repo
from backend.app.services import state_service

ORDER_STATUSES = ('received', 'queued', 'packing', 'completed')


def overview() -> dict:
    orders = repo.query_documents(col.ORDERS, limit=500)
    counts = {name: 0 for name in ORDER_STATUSES}
    for order in orders:
        counts[order['status']] = counts.get(order['status'], 0) + 1
    runs = repo.query_documents(
        col.SCHEDULING_RUNS, order_by='created_at_utc', descending=True, limit=1
    )
    latest_run = None
    if runs:
        latest_run = {
            name: runs[0].get(name)
            for name in ('run_id', 'status', 'created_at_utc', 'digital_twin_status', 'selected_proposal_id')
        }
    return {
        'total_orders': len(orders),
        'orders_by_status': counts,
        'latest_scheduling_run': latest_run,
        'machine_health': state_service.latest_health_by_line(),
    }


def metrics() -> dict:
    orders = repo.query_documents(col.ORDERS, limit=500)
    completed = [
        order for order in orders
        if order.get('status') == 'completed' and order.get('completed_at_utc')
    ]
    lead_times = [
        (order['completed_at_utc'] - order['created_at_utc']).total_seconds()
        for order in completed
    ]
    return {
        'total_orders': len(orders),
        'completed_orders': len(completed),
        'rush_orders': sum(1 for order in orders if order.get('order_type') == 'rush'),
        'average_lead_time_seconds': sum(lead_times) / len(lead_times) if lead_times else None,
    }
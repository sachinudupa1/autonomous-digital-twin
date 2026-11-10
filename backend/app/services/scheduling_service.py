import secrets

from backend.app.core.errors import AppError
from backend.app.repositories import collections as col
from backend.app.repositories import firestore_repository as repo
from backend.app.services import state_service

AGENTS = ('ml_agent', 'rl_agent', 'rule_based_agent')


def create_request(trigger: str, requested_by_uid: str) -> dict:
    state = state_service.build_state(new_version=True)
    if not state['pending_orders']:
        raise AppError(409, 'nothing_to_schedule', 'There are no pending orders to schedule.')

    request_id = 'RUN-' + secrets.token_hex(4).upper()
    now = repo.utc_now()
    document = {
        'schema_version': '1.0',
        'run_id': request_id,
        'status': 'created',
        'trigger': trigger,
        'requested_by_uid': requested_by_uid,
        'state_snapshot': state,
        'agents': {name: {'status': 'pending', 'proposal_id': None} for name in AGENTS},
        'digital_twin_status': 'not_started',
        'selected_proposal_id': None,
        'schedule_id': None,
        'errors': [],
        'created_at_utc': now,
        'updated_at_utc': now,
    }
    repo.create_document(col.SCHEDULING_RUNS, document, doc_id=request_id)
    return {
        'request_id': request_id,
        'status': 'created',
        'state_id': state['state_id'],
        'state_version': state['state_version'],
    }


def get_request(request_id: str) -> dict:
    run = repo.get_document(col.SCHEDULING_RUNS, request_id)
    if run is None:
        raise AppError(404, 'request_not_found', 'No scheduling request has that ID.')
    return run
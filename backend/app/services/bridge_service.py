import secrets
from datetime import timezone

from backend.app.core.errors import AppError
from backend.app.repositories import collections as col
from backend.app.repositories import firestore_repository as repo
from backend.app.schemas.bridge import BridgeEvent
from backend.app.services import order_service

COMMAND_FIELDS = ('command_id', 'run_id', 'schedule_id', 'type', 'payload', 'status', 'created_at_utc')
ORDER_EVENT_STATUS = {'order_started': 'packing', 'order_completed': 'completed'}


def create_command(run_id: str, schedule_id: str, command_type: str, payload: dict) -> str:
    command_id = 'CMD-' + secrets.token_hex(4).upper()
    document = {
        'schema_version': '1.0',
        'command_id': command_id,
        'run_id': run_id,
        'schedule_id': schedule_id,
        'type': command_type,
        'payload': payload,
        'status': 'pending',
        'created_at_utc': repo.utc_now(),
        'sent_at_utc': None,
        'acknowledged_at_utc': None,
        'completed_at_utc': None,
        'error': None,
    }
    repo.create_document(col.SIMULATION_COMMANDS, document, doc_id=command_id)
    return command_id


def _get_command(command_id: str) -> dict:
    command = repo.get_document(col.SIMULATION_COMMANDS, command_id)
    if command is None:
        raise AppError(404, 'command_not_found', 'No command has that ID.')
    return command


def fetch_next_command() -> dict | None:
    pending = repo.query_documents(
        col.SIMULATION_COMMANDS, filters={'status': 'pending'}, limit=50
    )
    if not pending:
        return None
    pending.sort(key=lambda command: command['created_at_utc'])
    command = pending[0]
    repo.update_document(
        col.SIMULATION_COMMANDS,
        command['command_id'],
        {'status': 'sent', 'sent_at_utc': repo.utc_now()},
    )
    command['status'] = 'sent'
    return {field: command.get(field) for field in COMMAND_FIELDS}


def acknowledge_command(command_id: str, received_at) -> dict:
    command = _get_command(command_id)
    if command['status'] != 'sent':
        raise AppError(409, 'invalid_command_state', 'Only a command that was sent can be acknowledged.')
    repo.update_document(
        col.SIMULATION_COMMANDS,
        command_id,
        {'status': 'acknowledged', 'acknowledged_at_utc': received_at.astimezone(timezone.utc)},
    )
    return {'command_id': command_id, 'status': 'acknowledged'}


def record_event(event: BridgeEvent) -> dict:
    command = _get_command(event.command_id)
    event_id = 'EVT-' + secrets.token_hex(5).upper()
    occurred = event.occurred_at_utc.astimezone(timezone.utc)
    repo.create_document(
        col.PRODUCTION_RUNS,
        {
            'schema_version': '1.0',
            'event_id': event_id,
            'command_id': event.command_id,
            'run_id': command.get('run_id'),
            'event_type': event.event_type,
            'order_id': event.order_id,
            'occurred_at_utc': occurred,
            'details': event.details,
            'created_at_utc': repo.utc_now(),
        },
        doc_id=event_id,
    )

    order_status_updated = False
    note = None
    if event.event_type in ORDER_EVENT_STATUS:
        try:
            order_service.update_order_status(
                event.order_id, ORDER_EVENT_STATUS[event.event_type], at=occurred
            )
            order_status_updated = True
        except AppError as exc:
            note = exc.message
    elif event.event_type == 'command_completed':
        repo.update_document(
            col.SIMULATION_COMMANDS,
            event.command_id,
            {'status': 'completed', 'completed_at_utc': occurred},
        )
    elif event.event_type == 'error':
        repo.update_document(
            col.SIMULATION_COMMANDS,
            event.command_id,
            {'status': 'failed', 'error': event.details},
        )
    return {'event_id': event_id, 'order_status_updated': order_status_updated, 'note': note}
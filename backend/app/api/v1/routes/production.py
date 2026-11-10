from fastapi import APIRouter, Depends, Response, status

from backend.app.core.security import require_bridge
from backend.app.schemas.bridge import BridgeEvent, CommandAck
from backend.app.services import bridge_service

router = APIRouter(prefix='/bridge', tags=['Production'], dependencies=[Depends(require_bridge)])


@router.get('/commands/next')
def next_command():
    command = bridge_service.fetch_next_command()
    if command is None:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return command


@router.post('/commands/{command_id}/ack')
def acknowledge(command_id: str, body: CommandAck):
    return bridge_service.acknowledge_command(command_id, body.received_at_utc)


@router.post('/events', status_code=status.HTTP_201_CREATED)
def report_event(event: BridgeEvent):
    return bridge_service.record_event(event)
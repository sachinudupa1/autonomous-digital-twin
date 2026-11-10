from typing import Annotated

from fastapi import APIRouter, Depends, status

from backend.app.core.security import CurrentUser, require_operator, require_viewer
from backend.app.schemas.scheduling import SchedulingRequest, SchedulingRequestCreated
from backend.app.services import scheduling_service

router = APIRouter(prefix='/scheduling', tags=['Scheduling'])


@router.post(
    '/requests', response_model=SchedulingRequestCreated, status_code=status.HTTP_201_CREATED
)
def create_scheduling_request(
    request: SchedulingRequest,
    user: Annotated[CurrentUser, Depends(require_operator)],
):
    return scheduling_service.create_request(request.trigger, user.uid)


@router.get('/requests/{request_id}', dependencies=[Depends(require_viewer)])
def get_scheduling_request(request_id: str):
    return scheduling_service.get_request(request_id)
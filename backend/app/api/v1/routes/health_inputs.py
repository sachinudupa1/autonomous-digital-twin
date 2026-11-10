from typing import Annotated

from fastapi import APIRouter, Depends, status

from backend.app.core.security import CurrentUser, require_operator
from backend.app.schemas.health import HealthInputRequest, HealthInputResponse
from backend.app.services import health_service

router = APIRouter(prefix='/health-inputs', tags=['Machine Health'])


@router.post('', response_model=HealthInputResponse, status_code=status.HTTP_201_CREATED)
def submit_health_input(
    request: HealthInputRequest,
    user: Annotated[CurrentUser, Depends(require_operator)],
):
    reading_id = health_service.store_health_input(request, user.uid)
    return {'reading_id': reading_id, 'status': 'stored'}


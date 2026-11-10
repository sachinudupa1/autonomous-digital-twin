from fastapi import APIRouter, Depends

from backend.app.core.security import require_viewer
from backend.app.services import state_service

router = APIRouter(prefix='/system', tags=['System State'], dependencies=[Depends(require_viewer)])


@router.get('/state')
def get_system_state():
    return state_service.build_state()
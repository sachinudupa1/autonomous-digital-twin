from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query

from backend.app.core.security import require_viewer
from backend.app.schemas.orders import InternalOrder
from backend.app.services import order_service

router = APIRouter(prefix='/internal', tags=['Internal'], dependencies=[Depends(require_viewer)])


@router.get('/orders', response_model=list[InternalOrder])
def list_orders(
    status: Literal['received', 'queued', 'packing', 'completed'] | None = None,
    order_type: Literal['normal', 'rush'] | None = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
):
    return order_service.list_internal_orders(status, order_type, limit)
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from backend.app.core.security import require_viewer
from backend.app.schemas.orders import InternalOrder
from backend.app.services import dashboard_service, order_service

router = APIRouter(prefix='/dashboard', tags=['Dashboard'], dependencies=[Depends(require_viewer)])


@router.get('/overview')
def overview():
    return dashboard_service.overview()


@router.get('/metrics')
def metrics():
    return dashboard_service.metrics()


@router.get('/orders', response_model=list[InternalOrder])
def orders(limit: Annotated[int, Query(ge=1, le=200)] = 50):
    return order_service.list_internal_orders(limit=limit)
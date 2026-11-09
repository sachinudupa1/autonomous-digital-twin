from typing import Annotated

from fastapi import APIRouter, Header, Response, status

from backend.app.schemas.orders import (
    CreateOrderRequest,
    CreateOrderResponse,
    TrackingResponse,
)
from backend.app.services import order_service

router = APIRouter(prefix='/orders', tags=['Orders'])


@router.post('', response_model=CreateOrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    request: CreateOrderRequest,
    response: Response,
    idempotency_key: Annotated[str | None, Header(alias='Idempotency-Key', max_length=128)] = None,
):
    result = order_service.create_order(request, idempotency_key)
    if result.pop('duplicate'):
        response.status_code = status.HTTP_200_OK
    return result


@router.get('/{order_id}/tracking', response_model=TrackingResponse)
def track_order(
    order_id: str,
    tracking_token: Annotated[str | None, Header(alias='X-Order-Tracking-Token')] = None,
):
    return order_service.get_tracking(order_id, tracking_token)

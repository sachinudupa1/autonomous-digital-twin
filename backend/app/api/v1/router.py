from fastapi import APIRouter

from backend.app.api.v1.routes import (
    dashboard,
    health_inputs,
    internal,
    orders,
    production,
    scheduling,
    state,
)

api_router = APIRouter()
api_router.include_router(orders.router)
api_router.include_router(internal.router)
api_router.include_router(health_inputs.router)
api_router.include_router(state.router)
api_router.include_router(scheduling.router)
api_router.include_router(production.router)
api_router.include_router(dashboard.router)


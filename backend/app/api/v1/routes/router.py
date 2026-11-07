from fastapi import APIRouter

from backend.app.api.v1.routes import (
    dashboard,
    health,
    orders,
    production,
    scheduling,
)

api_router = APIRouter()
api_router.include_router(orders.router)
api_router.include_router(health.router)
api_router.include_router(scheduling.router)
api_router.include_router(production.router)
api_router.include_router(dashboard.router)
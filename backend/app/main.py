from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.v1.routes.router import api_router
from backend.app.api.v1.routes import system
from backend.app.core.config import get_settings
from backend.app.core.errors import register_error_handlers

settings = get_settings()

app = FastAPI(
    title='Packaging Scheduling Backend',
    version='0.1.0',
    debug=settings.debug,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=False,
    allow_methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allow_headers=[
        'Authorization',
        'Content-Type',
        'Idempotency-Key',
        'X-Order-Tracking-Token',
    ],
)

register_error_handlers(app)

app.include_router(system.router)
app.include_router(api_router, prefix='/api/v1')
    

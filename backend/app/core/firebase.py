import logging
from functools import lru_cache

import firebase_admin
from firebase_admin import credentials, firestore

from backend.app.core.config import get_settings
from backend.app.core.errors import AppError

logger = logging.getLogger(__name__)


@lru_cache
def get_db():
    settings = get_settings()
    try:
        try:
            firebase_admin.get_app()
        except ValueError:
            firebase_admin.initialize_app(
                credentials.ApplicationDefault(),
                {'projectId': settings.firebase_project_id},
            )
        return firestore.client()
    except Exception as exc:
        logger.exception('Could not connect to Firebase')
        raise AppError(
            503,
            'database_unavailable',
            'The database is not available right now.',
        ) from exc
import logging
from functools import lru_cache

import firebase_admin
from firebase_admin import credentials, firestore

from backend.app.core.config import get_settings
from backend.app.core.errors import AppError

logger = logging.getLogger(__name__)


def _unavailable() -> AppError:
    return AppError(503, 'database_unavailable', 'The database is not available right now.')


@lru_cache
def get_firebase_app():
    settings = get_settings()
    try:
        return firebase_admin.get_app()
    except ValueError:
        pass
    try:
        return firebase_admin.initialize_app(
            credentials.ApplicationDefault(),
            {'projectId': settings.firebase_project_id},
        )
    except Exception as exc:
        logger.exception('Could not start the Firebase app')
        raise _unavailable() from exc


@lru_cache
def get_db():
    app = get_firebase_app()
    try:
        return firestore.client(app)
    except Exception as exc:
        logger.exception('Could not connect to Firestore')
        raise _unavailable() from exc

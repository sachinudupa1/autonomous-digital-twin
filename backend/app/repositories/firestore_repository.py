import logging
from datetime import datetime, timezone
from functools import wraps
from typing import Any

from google.api_core.exceptions import GoogleAPICallError, NotFound
from google.cloud.firestore_v1.base_query import FieldFilter
from google.cloud.firestore import Query
from backend.app.core.errors import AppError
from backend.app.core.firebase import get_db

logger = logging.getLogger(__name__)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def handle_db_errors(func):
    # Turns any Firestore crash into a polite 503 error.
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except AppError:
            raise
        except GoogleAPICallError as exc:
            logger.exception('Firestore call failed in %s', func.__name__)
            raise AppError(
                503,
                'database_unavailable',
                'The database is not available right now.',
            ) from exc

    return wrapper


@handle_db_errors
def create_document(collection: str, data: dict[str, Any], doc_id: str | None = None) -> str:
    collection_ref = get_db().collection(collection)
    doc_ref = collection_ref.document(doc_id) if doc_id else collection_ref.document()
    doc_ref.set(data)
    return doc_ref.id


@handle_db_errors
def get_document(collection: str, doc_id: str) -> dict[str, Any] | None:
    snapshot = get_db().collection(collection).document(doc_id).get()
    if not snapshot.exists:
        return None
    return snapshot.to_dict()


@handle_db_errors
def update_document(collection: str, doc_id: str, changes: dict[str, Any]) -> None:
    doc_ref = get_db().collection(collection).document(doc_id)
    try:
        doc_ref.update(changes)
    except NotFound as exc:
        raise AppError(404, 'not_found', 'That record does not exist.') from exc


@handle_db_errors
@handle_db_errors
def query_documents(
    collection: str,
    filters: dict[str, Any] | None = None,
    conditions: list[tuple[str, str, Any]] | None = None,
    order_by: str | None = None,
    descending: bool = False,
    limit: int = 50,
) -> list[dict[str, Any]]:
    query = get_db().collection(collection)
    for field, value in (filters or {}).items():
        query = query.where(filter=FieldFilter(field, '==', value))
    for field, operator, value in conditions or []:
        query = query.where(filter=FieldFilter(field, operator, value))
    if order_by:
        direction = Query.DESCENDING if descending else Query.ASCENDING
        query = query.order_by(order_by, direction=direction)
    query = query.limit(limit)
    return [{'id': doc.id, **(doc.to_dict() or {})} for doc in query.stream()]

@handle_db_errors
def delete_document(collection: str, doc_id: str) -> None:
    get_db().collection(collection).document(doc_id).delete()
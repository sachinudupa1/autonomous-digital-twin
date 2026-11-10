import secrets
from datetime import timezone

from backend.app.repositories import collections as col
from backend.app.repositories import firestore_repository as repo
from backend.app.schemas.health import HealthInputRequest


def store_health_input(request: HealthInputRequest, submitted_by_uid: str) -> str:
    reading_id = 'HR-' + secrets.token_hex(5).upper()
    document = {
        'schema_version': request.schema_version,
        'reading_id': reading_id,
        'source': request.source,
        'input_mode': request.input_mode,
        'line_id': request.line_id,
        'scenario_id': request.scenario_id,
        'input': request.input.model_dump(),
        'calculated': {'health_score': None, 'classification': None, 'calculated_at_utc': None},
        'timestamp_utc': request.timestamp_utc.astimezone(timezone.utc),
        'created_at_utc': repo.utc_now(),
        'submitted_by_uid': submitted_by_uid,
    }
    repo.create_document(col.HEALTH_READINGS, document, doc_id=reading_id)
    return reading_id
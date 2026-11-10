import hmac
import logging
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header
from firebase_admin import auth as firebase_auth

from backend.app.core.config import get_settings
from backend.app.core.errors import AppError
from backend.app.core.firebase import get_firebase_app
from backend.app.repositories import collections as col
from backend.app.repositories import firestore_repository as repo

logger = logging.getLogger(__name__)

ROLE_LEVELS = {'viewer': 1, 'operator': 2, 'owner': 3}


@dataclass(frozen=True)
class CurrentUser:
    uid: str
    email: str | None
    role: str


def _bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise AppError(401, 'not_authenticated', 'Missing Authorization header.')
    scheme, _, token = authorization.partition(' ')
    if scheme.lower() != 'bearer' or not token.strip():
        raise AppError(401, 'not_authenticated', 'Authorization header must look like: Bearer YOUR_TOKEN')
    return token.strip()


def get_current_user(authorization: Annotated[str | None, Header()] = None) -> CurrentUser:
    token = _bearer_token(authorization)
    get_firebase_app()
    try:
        decoded = firebase_auth.verify_id_token(token)
    except firebase_auth.ExpiredIdTokenError as exc:
        raise AppError(401, 'token_expired', 'Your login has expired. Please sign in again.') from exc
    except (firebase_auth.InvalidIdTokenError, ValueError) as exc:
        raise AppError(401, 'invalid_token', 'The login token is not valid.') from exc
    except firebase_auth.CertificateFetchError as exc:
        logger.exception('Could not fetch Google public keys')
        raise AppError(503, 'auth_unavailable', 'Login checking is not available right now.') from exc

    uid = decoded['uid']
    profile = repo.get_document(col.USERS, uid)
    if not profile or not profile.get('active', False) or profile.get('role') not in ROLE_LEVELS:
        raise AppError(403, 'no_access', 'This account has no access to the system.')
    return CurrentUser(uid=uid, email=decoded.get('email'), role=profile['role'])


def require_role(minimum_role: str):
    def checker(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
        if ROLE_LEVELS[user.role] < ROLE_LEVELS[minimum_role]:
            raise AppError(403, 'forbidden', 'Your role is not allowed to do this.')
        return user

    return checker


require_viewer = require_role('viewer')
require_operator = require_role('operator')
require_owner = require_role('owner')


def require_bridge(
    x_bridge_token: Annotated[str | None, Header(alias='X-Bridge-Token')] = None,
) -> None:
    expected = get_settings().bridge_token
    if not expected:
        raise AppError(503, 'bridge_not_configured', 'The bridge token is not set on the server.')
    if not x_bridge_token or not hmac.compare_digest(x_bridge_token.encode(), expected.encode()):
        raise AppError(401, 'invalid_bridge_token', 'The bridge token is missing or wrong.')
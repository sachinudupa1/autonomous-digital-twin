import hashlib
import secrets

_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'


def generate_order_id() -> str:
    suffix = ''.join(secrets.choice(_ALPHABET) for _ in range(10))
    return 'ORD-' + suffix


def generate_tracking_token() -> str:
    return secrets.token_urlsafe(32)


def hash_value(value: str) -> str:
    return hashlib.sha256(value.encode('utf-8')).hexdigest()
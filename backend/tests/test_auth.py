from fastapi.testclient import TestClient
from firebase_admin import auth as firebase_auth

from backend.app.core import security
from backend.app.main import app

client = TestClient(app)
URL = '/api/v1/internal/orders'
HEADERS = {'Authorization': 'Bearer abc'}


def fake_token_check(monkeypatch, result=None, error=None):
    monkeypatch.setattr(security, 'get_firebase_app', lambda: None)

    def verify(token):
        if error:
            raise error
        return result

    monkeypatch.setattr(security.firebase_auth, 'verify_id_token', verify)


def test_missing_header_is_401(fake_repo):
    assert client.get(URL).status_code == 401


def test_header_without_bearer_is_401(fake_repo):
    assert client.get(URL, headers={'Authorization': 'abc'}).status_code == 401


def test_invalid_token_is_401(fake_repo, monkeypatch):
    fake_token_check(monkeypatch, error=firebase_auth.InvalidIdTokenError('bad token'))
    response = client.get(URL, headers=HEADERS)
    assert response.status_code == 401
    assert response.json()['error']['code'] == 'invalid_token'


def test_expired_token_is_401(fake_repo, monkeypatch):
    fake_token_check(monkeypatch, error=firebase_auth.ExpiredIdTokenError('expired', None))
    response = client.get(URL, headers=HEADERS)
    assert response.status_code == 401
    assert response.json()['error']['code'] == 'token_expired'


def test_user_without_a_profile_is_403(fake_repo, monkeypatch):
    fake_token_check(monkeypatch, result={'uid': 'u1'})
    response = client.get(URL, headers=HEADERS)
    assert response.status_code == 403
    assert response.json()['error']['code'] == 'no_access'


def test_inactive_user_is_403(fake_repo, monkeypatch):
    fake_repo.docs[('users', 'u1')] = {'role': 'viewer', 'active': False}
    fake_token_check(monkeypatch, result={'uid': 'u1'})
    assert client.get(URL, headers=HEADERS).status_code == 403


def test_active_viewer_can_read(fake_repo, monkeypatch):
    fake_repo.docs[('users', 'u1')] = {'role': 'viewer', 'active': True}
    fake_token_check(monkeypatch, result={'uid': 'u1', 'email': 'v@example.com'})
    assert client.get(URL, headers=HEADERS).status_code == 200
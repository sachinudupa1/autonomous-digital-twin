from datetime import datetime, timezone

import pytest

from backend.app.core.errors import AppError
from fastapi.testclient import TestClient

from backend.app.core import security
from backend.app.core.security import CurrentUser, get_current_user
from backend.app.main import app
from backend.app.services import (
    bridge_service,
    dashboard_service,
    health_service,
    order_service,
    scheduling_service,
    state_service,
)


class FakeRepo:
    def __init__(self):
        self.docs = {}
        self._counter = 0

    def utc_now(self):
        return datetime.now(timezone.utc)

    def create_document(self, collection, data, doc_id=None):
        if doc_id is None:
            self._counter += 1
            doc_id = 'auto-' + str(self._counter)
        self.docs[(collection, doc_id)] = dict(data)
        return doc_id

    def get_document(self, collection, doc_id):
        data = self.docs.get((collection, doc_id))
        return dict(data) if data is not None else None

    def update_document(self, collection, doc_id, changes):
        if (collection, doc_id) not in self.docs:
            raise AppError(404, 'not_found', 'That record does not exist.')
        self.docs[(collection, doc_id)].update(changes)

    def delete_document(self, collection, doc_id):
        self.docs.pop((collection, doc_id), None)

    def count(self, collection):
        return sum(1 for (name, _) in self.docs if name == collection)

    def query_documents(
        self, collection, filters=None, conditions=None, order_by=None, descending=False, limit=50
    ):
        results = []
        for (name, doc_id), data in self.docs.items():
            if name != collection:
                continue
            if any(data.get(k) != v for k, v in (filters or {}).items()):
                continue
            matches = True
            for field, op, value in conditions or []:
                if op == 'in' and data.get(field) not in value:
                    matches = False
                if op == '==' and data.get(field) != value:
                    matches = False
            if matches:
                results.append({'id': doc_id, **data})
        if order_by:
            results.sort(
                key=lambda d: (d.get(order_by) is None, d.get(order_by)), reverse=descending
            )
        return results[:limit]


@pytest.fixture
def fake_repo(monkeypatch):
    fake = FakeRepo()
    for module in (
        security,
        order_service,
        health_service,
        state_service,
        scheduling_service,
        bridge_service,
        dashboard_service,
    ):
        monkeypatch.setattr(module, 'repo', fake)
    return fake


@pytest.fixture
def login_as():
    def _login(role):
        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            uid='test-' + role, email=None, role=role
        )

    yield _login
    app.dependency_overrides.clear()


@pytest.fixture
def place_order():
    client = TestClient(app)

    def _place(order_type='normal'):
        payload = {
            'schema_version': '1.0',
            'items': {'ball_1': 2, 'ball_2': 3, 'ball_3': 0, 'ball_4': 1},
            'order_type': order_type,
        }
        response = client.post('/api/v1/orders', json=payload)
        assert response.status_code == 201
        return response.json()

    return _place
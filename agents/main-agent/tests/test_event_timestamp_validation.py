from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from packaging_master.schemas.agent_error_event import AgentErrorEvent
from packaging_master.schemas.decision_event import DecisionEvent


def test_error_event_rejects_naive_timestamp():
    with pytest.raises(ValidationError):
        AgentErrorEvent(
            event_id="ERR-001",
            agent_id="ml",
            error_category="validation",
            severity="high",
            error_message="Invalid proposal",
            occurred_at_utc=datetime(2026, 11, 9, 12, 0),
        )


def test_error_event_normalizes_timestamp_to_utc():
    event = AgentErrorEvent(
        event_id="ERR-002",
        agent_id="ml",
        error_category="validation",
        severity="high",
        error_message="Invalid proposal",
        occurred_at_utc=datetime(
            2026, 11, 9, 17, 30,
            tzinfo=timezone(timedelta(hours=5, minutes=30)),
        ),
    )
    assert event.occurred_at_utc.utcoffset() == timedelta(0)


def test_decision_event_rejects_naive_timestamp():
    with pytest.raises(ValidationError):
        DecisionEvent(
            decision_id="DEC-001",
            state_id="STATE-001",
            state_version=1,
            created_at_utc=datetime(2026, 11, 9, 12, 0),
        )


def test_decision_event_normalizes_timestamp_to_utc():
    event = DecisionEvent(
        decision_id="DEC-002",
        state_id="STATE-001",
        state_version=1,
        created_at_utc=datetime(
            2026, 11, 9, 17, 30,
            tzinfo=timezone(timedelta(hours=5, minutes=30)),
        ),
    )
    assert event.created_at_utc.utcoffset() == timedelta(0)

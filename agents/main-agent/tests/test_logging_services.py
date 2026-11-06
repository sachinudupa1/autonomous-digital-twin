import pytest
from datetime import datetime, timezone
from uuid import uuid4

from pydantic import ValidationError

from packaging_master.logging.error_log_service import (
    create_agent_error_log,
)

from packaging_master.logging.decision_log_service import (
    create_master_decision_log,
)


def test_valid_agent_error_event():
    event_data = {
        "event_id": str(uuid4()),
        "agent_id": "ml",
        "proposal_id": None,
        "error_category": "invalid_proposal",
        "severity": "error",
        "error_message": "Proposal ID is missing",
        "occurred_at_utc": datetime.now(timezone.utc),
        "context": {"state_id": "STATE-001"},
    }

    event = create_agent_error_log(event_data)

    assert event.agent_id == "ml"
    assert event.error_category == "invalid_proposal"
    assert event.error_message == "Proposal ID is missing"


def test_invalid_agent_error_event():
    event_data = {
        "agent_id": "ml",
        "error_category": "invalid_proposal",
        "severity": "error",
    }

    with pytest.raises(ValidationError):
        create_agent_error_log(event_data)


def test_valid_master_decision_event():
    event_data = {
        "decision_id": str(uuid4()),
        "state_id": "STATE-001",
        "state_version": 1,
        "proposals_received": [
            "RULE-PROP-001",
            "ML-PROP-001",
            "RL-PROP-001",
        ],
        "selected_proposal_id": None,
        "rejected_proposals": [],
        "fallback_used": False,
        "guardrail_status": "pending",
        "reason": "Sample decision record",
        "actual_outcome_status": "pending",
        "created_at_utc": datetime.now(timezone.utc),
    }

    event = create_master_decision_log(event_data)

    assert event.state_id == "STATE-001"
    assert len(event.proposals_received) == 3
    assert event.selected_proposal_id is None
    assert event.fallback_used is False


def test_invalid_master_decision_event():
    event_data = {
        "decision_id": str(uuid4()),
        "state_id": "STATE-001",
        "state_version": "not-a-number",
        "created_at_utc": datetime.now(timezone.utc),
    }

    with pytest.raises(ValidationError):
        create_master_decision_log(event_data)

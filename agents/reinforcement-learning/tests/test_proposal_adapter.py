
import pytest

from src.agent.proposal_adapter import build_rl_proposal


def test_build_valid_rl_proposal():
    proposal = build_rl_proposal(
        order_sequence=["ORDER_A", "ORDER_B", "ORDER_C"],
        proposal_id="RL-PROP-001",
        input_state_id="STATE-001",
        input_state_version=1,
        created_at_utc="2026-11-09T12:00:00Z",
    )

    assert proposal["agent_id"] == "rl_agent"
    assert proposal["agent_type"] == "reinforcement_learning"

    assert proposal["schedule"]["order_sequence"] == [
        "ORDER_A",
        "ORDER_B",
        "ORDER_C",
    ]

    assert proposal["confidence"] is None
    assert "line_assignments" not in proposal["schedule"]


def test_reject_empty_order_sequence():
    with pytest.raises(ValueError):
        build_rl_proposal(
            order_sequence=[],
            proposal_id="RL-PROP-001",
            input_state_id="STATE-001",
            input_state_version=1,
            created_at_utc="2026-11-09T12:00:00Z",
        )


def test_reject_duplicate_order_ids():
    with pytest.raises(ValueError):
        build_rl_proposal(
            order_sequence=["ORDER_A", "ORDER_A"],
            proposal_id="RL-PROP-001",
            input_state_id="STATE-001",
            input_state_version=1,
            created_at_utc="2026-11-09T12:00:00Z",
        )


def test_reject_empty_order_id():
    with pytest.raises(ValueError):
        build_rl_proposal(
            order_sequence=["ORDER_A", ""],
            proposal_id="RL-PROP-001",
            input_state_id="STATE-001",
            input_state_version=1,
            created_at_utc="2026-11-09T12:00:00Z",
        )


def test_reject_invalid_state_version():
    with pytest.raises(ValueError):
        build_rl_proposal(
            order_sequence=["ORDER_A"],
            proposal_id="RL-PROP-001",
            input_state_id="STATE-001",
            input_state_version=0,
            created_at_utc="2026-11-09T12:00:00Z",
        )


def test_preserve_global_order_sequence():
    sequence = ["ORDER_C", "ORDER_A", "ORDER_B"]

    proposal = build_rl_proposal(
        order_sequence=sequence,
        proposal_id="RL-PROP-002",
        input_state_id="STATE-002",
        input_state_version=2,
        created_at_utc="2026-11-09T12:00:00Z",
    )

    assert proposal["schedule"]["order_sequence"] == sequence

import copy

from packaging_master.validation.proposal_validator import validate_proposal
from packaging_master.schemas.sample_state import sample_state
from sample_proposals import sample_proposals


def test_valid_sample_proposals():
    for proposal in sample_proposals:
        valid, message = validate_proposal(proposal, sample_state)
        assert valid is True
        assert message == "Proposal is valid"


def test_missing_proposal_id():
    proposal = copy.deepcopy(sample_proposals[0])
    proposal.pop("proposal_id")

    valid, message = validate_proposal(proposal, sample_state)

    assert valid is False
    assert message == "Missing proposal ID"


def test_unknown_agent_type():
    proposal = copy.deepcopy(sample_proposals[0])
    proposal["agent_id"] = "unknown"

    valid, message = validate_proposal(proposal, sample_state)

    assert valid is False
    assert message == "Unknown agent type"


def test_incorrect_state_version():
    proposal = copy.deepcopy(sample_proposals[0])
    proposal["state_version"] = 99

    valid, message = validate_proposal(proposal, sample_state)

    assert valid is False
    assert message == "Incorrect state version"


def test_invalid_schedule_type():
    proposal = copy.deepcopy(sample_proposals[0])
    proposal["schedule"] = ["ORDER-001", "ORDER-002"]

    valid, message = validate_proposal(proposal, sample_state)

    assert valid is False
    assert message == "Invalid schedule"


def test_missing_order_sequence():
    proposal = copy.deepcopy(sample_proposals[0])
    proposal["schedule"] = {}

    valid, message = validate_proposal(proposal, sample_state)

    assert valid is False
    assert message == "Invalid schedule"


def test_invalid_order_sequence_type():
    proposal = copy.deepcopy(sample_proposals[0])
    proposal["schedule"]["order_sequence"] = "ORDER-001"

    valid, message = validate_proposal(proposal, sample_state)

    assert valid is False
    assert message == "Invalid schedule"


def test_duplicate_order_ids():
    proposal = copy.deepcopy(sample_proposals[0])
    proposal["schedule"]["order_sequence"] = [
        "ORDER-001",
        "ORDER-001",
        "ORDER-003",
    ]

    valid, message = validate_proposal(proposal, sample_state)

    assert valid is False
    assert message == "Duplicate order IDs"


def test_missing_or_nonexistent_order_ids():
    proposal = copy.deepcopy(sample_proposals[0])
    proposal["schedule"]["order_sequence"] = [
        "ORDER-001",
        "ORDER-002",
        "ORDER-999",
    ]

    valid, message = validate_proposal(proposal, sample_state)

    assert valid is False
    assert message == "Missing or non-existent order IDs"


def test_line_assignments_not_required():
    proposal = copy.deepcopy(sample_proposals[0])
    proposal.pop("line_assignments", None)

    valid, message = validate_proposal(proposal, sample_state)

    assert valid is True
    assert message == "Proposal is valid"

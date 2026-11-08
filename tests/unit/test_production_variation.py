from dataclasses import asdict
from pathlib import Path
import sys

import pytest


ROOT = Path(__file__).resolve().parents[2]

SIMULATION_ENGINE_DIR = ROOT / "digital-twin" / "simulation-engine"
COMMUNICATION_DIR = ROOT / "digital-twin" / "communication"
PRODUCTION_ENGINE_DIR = ROOT / "digital-twin" / "production-engine"

for directory in (
    SIMULATION_ENGINE_DIR,
    COMMUNICATION_DIR,
    PRODUCTION_ENGINE_DIR,
):
    path = str(directory)
    if path not in sys.path:
        sys.path.insert(0, path)

from line_runner import LineParameters
from production_variation import ProductionVariationPolicy


BOUNDS = {
    "upper_belt_speed": (0.01, 0.15),
    "box_speed": (0.01, 0.15),
    "dispenser_rpm": (20.0, 200.0),
    "settle_time": (0.0, 5.0),
}


def make_parameters():
    return LineParameters(
        upper_belt_speed=0.025,
        box_speed=0.025,
        dispenser_rpm=30.0,
        settle_time=1.5,
    )


def apply_policy(
    policy=None,
    parameters=None,
    plan_id="plan_001",
    schedule_id="schedule_001",
    line_id="line_a",
):
    policy = policy or ProductionVariationPolicy()
    parameters = parameters or make_parameters()

    return policy.apply(
        parameters,
        plan_id=plan_id,
        schedule_id=schedule_id,
        line_id=line_id,
    )


def test_same_inputs_produce_same_parameters():
    policy = ProductionVariationPolicy(seed=2026)

    effective_1, report_1 = apply_policy(policy)
    effective_2, report_2 = apply_policy(policy)

    assert asdict(effective_1) == asdict(effective_2)
    assert report_1 == report_2
    assert report_1["deterministic"] is True


def test_variations_stay_within_configured_percentage():
    policy = ProductionVariationPolicy(max_relative_variation=0.02)

    requested = make_parameters()
    effective, report = apply_policy(policy, requested)

    requested_values = asdict(requested)
    effective_values = asdict(effective)

    for name, (low, high) in BOUNDS.items():
        original = requested_values[name]
        changed = effective_values[name]

        assert low <= changed <= high

        if original != 0:
            percentage = abs((changed - original) / original * 100)
            assert percentage <= 2.000001

    assert report["configured_max_variation_percent"] == 2.0


def test_zero_variation_preserves_original_parameters():
    policy = ProductionVariationPolicy(max_relative_variation=0.0)

    requested = make_parameters()
    effective, report = apply_policy(policy, requested)

    assert asdict(effective) == asdict(requested)

    for adjustment in report["parameter_adjustments"].values():
        assert adjustment["actual_change_percent"] == 0.0


def test_boundary_parameters_remain_inside_operating_limits():
    policy = ProductionVariationPolicy(max_relative_variation=0.10)

    requested = LineParameters(
        upper_belt_speed=0.15,
        box_speed=0.01,
        dispenser_rpm=200.0,
        settle_time=0.0,
    )

    effective, report = apply_policy(policy, requested)

    values = asdict(effective)

    for name, (low, high) in BOUNDS.items():
        assert low <= values[name] <= high

    assert report["effective_parameters"] == values


def test_different_line_identifiers_are_applied_independently():
    policy = ProductionVariationPolicy(seed=2026)

    line_a, _ = apply_policy(policy, line_id="line_a")
    line_b, _ = apply_policy(policy, line_id="line_b")

    # Different deterministic keys should produce different profiles.
    assert asdict(line_a) != asdict(line_b)


def test_different_seeds_produce_different_profiles():
    line_a, _ = apply_policy(
        ProductionVariationPolicy(seed=2026)
    )
    line_b, _ = apply_policy(
        ProductionVariationPolicy(seed=2027)
    )

    assert asdict(line_a) != asdict(line_b)


def test_original_parameters_are_not_modified():
    requested = make_parameters()
    original_values = asdict(requested)

    apply_policy(parameters=requested)

    assert asdict(requested) == original_values


@pytest.mark.parametrize(
    "variation",
    [-0.01, 0.11, "0.02", True, None],
)
def test_invalid_variation_configuration_is_rejected(variation):
    with pytest.raises(ValueError):
        ProductionVariationPolicy(
            max_relative_variation=variation
        )


@pytest.mark.parametrize(
    "seed",
    [True, 1.5, "2026", None],
)
def test_invalid_seed_is_rejected(seed):
    with pytest.raises(ValueError):
        ProductionVariationPolicy(seed=seed)


def test_invalid_line_identifier_is_rejected():
    with pytest.raises(ValueError, match="line_id"):
        apply_policy(line_id="line_c")


@pytest.mark.parametrize(
    "field,value",
    [
        ("plan_id", ""),
        ("plan_id", "   "),
        ("schedule_id", ""),
        ("schedule_id", "   "),
    ],
)
def test_missing_plan_or_schedule_identifier_is_rejected(field, value):
    kwargs = {
        "plan_id": "plan_001",
        "schedule_id": "schedule_001",
        field: value,
    }

    with pytest.raises(ValueError):
        apply_policy(**kwargs)


def test_wrong_parameter_object_type_is_rejected():
    policy = ProductionVariationPolicy()

    with pytest.raises(TypeError):
        policy.apply(
            {"upper_belt_speed": 0.025},
            plan_id="plan_001",
            schedule_id="schedule_001",
            line_id="line_a",
        )

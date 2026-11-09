
import pytest

from src.env.reward import (
    REWARD_COMPONENTS,
    SafetyConstraintViolation,
    SchedulingReward,
)


def test_reward_components_are_defined():
    assert "on_time_completion" in REWARD_COMPONENTS
    assert "lead_time" in REWARD_COMPONENTS
    assert "throughput" in REWARD_COMPONENTS
    assert "rush_handling" in REWARD_COMPONENTS
    assert "scheduling_regret" in REWARD_COMPONENTS
    assert "resource_utilization" in REWARD_COMPONENTS
    assert "makespan" in REWARD_COMPONENTS


def test_no_final_weights_are_assumed():
    reward = SchedulingReward()

    score, components = reward.calculate_components({
        "on_time_completion": 1.0,
        "lead_time": 0.8,
    })

    assert score == 0.0
    assert components["on_time_completion"] == 1.0


def test_configurable_weighted_reward():
    reward = SchedulingReward(
        weights={
            "on_time_completion": 0.75,
            "lead_time": 0.25,
        }
    )

    score, _ = reward.calculate_components({
        "on_time_completion": 1.0,
        "lead_time": 0.0,
    })

    assert score == pytest.approx(0.75)


def test_makespan_is_optional():
    reward = SchedulingReward(
        weights={"on_time_completion": 1.0}
    )

    score, _ = reward.calculate_components({
        "on_time_completion": 0.8,
    })

    assert score == pytest.approx(0.8)


def test_missing_configured_component_is_rejected():
    reward = SchedulingReward(
        weights={
            "on_time_completion": 0.5,
            "lead_time": 0.5,
        }
    )

    with pytest.raises(ValueError):
        reward.calculate_components({
            "on_time_completion": 1.0,
        })


def test_out_of_range_component_is_rejected():
    reward = SchedulingReward()

    with pytest.raises(ValueError):
        reward.calculate_components({
            "lead_time": 1.5,
        })


def test_negative_weight_is_rejected():
    with pytest.raises(ValueError):
        SchedulingReward(
            weights={"lead_time": -0.5}
        )


def test_safety_violation_is_not_a_reward_penalty():
    reward = SchedulingReward(
        weights={"on_time_completion": 1.0}
    )

    with pytest.raises(SafetyConstraintViolation):
        reward.calculate_components(
            {"on_time_completion": 1.0},
            safety_feasible=False,
        )


def test_invalid_reward_component_is_rejected():
    reward = SchedulingReward()

    with pytest.raises(ValueError):
        reward.calculate_components({
            "unknown_component": 1.0,
        })


def test_zero_total_weight_returns_zero():
    reward = SchedulingReward(
        weights={"on_time_completion": 0.0}
    )

    score, _ = reward.calculate_components({
        "on_time_completion": 1.0,
    })

    assert score == 0.0


import pytest

from src.env.packaging_env import PackagingEnv
from src.env.processing_time import ProcessingTimeEstimator
from src.env.reward import SchedulingReward


def sample_orders():
    return [
        {
            "order_id": "A",
            "status": "queued",
            "items": {
                "P1": 2,
                "P2": 1,
                "P3": 0,
                "P4": 0,
            },
            "order_type": "rush",
            "requested_deadline_utc": "2026-11-08T10:00:00Z",
        },
        {
            "order_id": "B",
            "status": "queued",
            "items": {
                "P1": 1,
                "P2": 0,
                "P3": 2,
                "P4": 0,
            },
            "order_type": "normal",
            "requested_deadline_utc": None,
        },
    ]


def test_modules_integrate_with_environment():
    env = PackagingEnv()

    observation, info = env.reset(
        options={"orders": sample_orders()}
    )

    assert observation.shape == env.observation_space.shape
    assert info["eligible_order_ids"] == ["A", "B"]

    observation, reward, terminated, truncated, info = env.step(0)

    assert reward == 1.0
    assert info["selected_order_id"] == "A"
    assert "processing_time_seconds" not in info


def test_configurable_processing_duration():
    estimator = ProcessingTimeEstimator(
        estimator=lambda order: 12.5
    )

    env = PackagingEnv(
        processing_time_estimator=estimator
    )

    env.reset(options={"orders": sample_orders()})

    _, _, _, _, info = env.step(0)

    assert info["processing_time_seconds"] == 12.5


def test_custom_reward_calculator():
    reward_calculator = SchedulingReward(
        completion_reward=5.0,
        invalid_action_penalty=-2.0,
    )

    env = PackagingEnv(
        reward_calculator=reward_calculator
    )

    env.reset(options={"orders": sample_orders()})

    _, reward, _, _, _ = env.step(0)

    assert reward == 5.0


def test_processing_duration_must_be_positive():
    estimator = ProcessingTimeEstimator(
        estimator=lambda order: 0
    )

    with pytest.raises(ValueError):
        estimator.estimate(sample_orders()[0])

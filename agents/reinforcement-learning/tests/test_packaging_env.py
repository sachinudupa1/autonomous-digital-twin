
import numpy as np
import pytest

from src.env.packaging_env import PackagingEnv


def make_order(order_id, status="queued", order_type="normal"):
    return {
        "order_id": order_id,
        "status": status,
        "order_type": order_type,
        "requested_deadline_utc": None,
        "items": {
            "P1": 2,
            "P2": 1,
            "P3": 0,
            "P4": 1,
        },
    }


def test_empty_queue():
    env = PackagingEnv(max_orders=4)

    observation, info = env.reset(options={"orders": []})

    assert observation.shape == env.observation_space.shape
    assert np.all(observation == 0)
    assert info["slot_order_ids"] == [None] * 4

    _, reward, terminated, truncated, info = env.step(0)

    assert reward == 0.0
    assert terminated is True
    assert truncated is False
    assert info["reason"] == "empty_queue"


def test_padded_slots():
    env = PackagingEnv(max_orders=4)

    observation, info = env.reset(
        options={"orders": [make_order("ORDER-1")]}
    )

    assert info["slot_order_ids"] == [
        "ORDER-1", None, None, None
    ]

    features = env.features_per_order

    # The second slot must be entirely zero-padded.
    assert np.all(observation[features:2 * features] == 0)


def test_ineligible_orders():
    env = PackagingEnv(max_orders=4)

    observation, info = env.reset(
        options={
            "orders": [
                make_order("ORDER-1", status="processing"),
                make_order("ORDER-2", status="queued"),
            ]
        }
    )

    _, reward, terminated, truncated, info = env.step(0)

    assert reward == -1.0
    assert terminated is False
    assert info["invalid_action"] is True
    assert info["reason"] == "ineligible_order"

    _, reward, terminated, truncated, info = env.step(1)

    assert info["selected_order_id"] == "ORDER-2"
    assert terminated is True


def test_queue_overflow():
    env = PackagingEnv(max_orders=2)

    orders = [
        make_order("ORDER-1"),
        make_order("ORDER-2"),
        make_order("ORDER-3"),
    ]

    with pytest.raises(ValueError, match="Queue overflow"):
        env.reset(options={"orders": orders})


def test_invalid_actions():
    env = PackagingEnv(max_orders=4)

    env.reset(options={"orders": [make_order("ORDER-1")]})

    # Negative and out-of-range actions.
    for action in (-1, 4):
        _, reward, terminated, truncated, info = env.step(action)

        assert reward == -1.0
        assert info["invalid_action"] is True

    # A non-integer action must also be rejected.
    _, reward, terminated, truncated, info = env.step(1.5)

    assert reward == -1.0
    assert info["invalid_action"] is True


def test_multiple_orders():
    env = PackagingEnv(max_orders=4)

    orders = [
        make_order("ORDER-1"),
        make_order("ORDER-2"),
        make_order("ORDER-3"),
    ]

    env.reset(options={"orders": orders})

    selected = []

    # Select the first remaining order each time.
    for _ in range(3):
        _, reward, terminated, truncated, info = env.step(0)
        selected.append(info["selected_order_id"])

    assert selected == [
        "ORDER-1",
        "ORDER-2",
        "ORDER-3",
    ]

    assert terminated is True
    assert env.orders == []

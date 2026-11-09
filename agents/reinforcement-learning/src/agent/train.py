
from src.env.packaging_env import PackagingEnv
from src.env.processing_time import ProcessingTimeEstimator


# Synthetic test data only.
# These durations are NOT a CoppeliaSim processing-time formula.
SAMPLE_ORDERS = [
    {
        "order_id": "ORDER_A",
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
        "order_id": "ORDER_B",
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
    {
        "order_id": "ORDER_C",
        "status": "queued",
        "items": {
            "P1": 0,
            "P2": 2,
            "P3": 1,
            "P4": 1,
        },
        "order_type": "normal",
        "requested_deadline_utc": "2026-11-08T12:00:00Z",
    },
]


def main():
    # Explicit test-only durations in seconds.
    test_durations = {
        "ORDER_A": 12.0,
        "ORDER_B": 8.0,
        "ORDER_C": 15.0,
    }

    estimator = ProcessingTimeEstimator(
        estimator=lambda order: test_durations[order["order_id"]]
    )

    env = PackagingEnv(
        max_orders=32,
        processing_time_estimator=estimator,
    )

    print("Checking environment...")

    observation, info = env.reset(
        options={"orders": SAMPLE_ORDERS}
    )

    print("Environment reset successful!")
    print("Initial observation shape:", observation.shape)
    print("Eligible orders:", info["eligible_order_ids"])

    terminated = False
    truncated = False

    while not (terminated or truncated):
        # Select the first currently eligible order for this
        # environment smoke test. This is not PPO training.
        eligible_slots = [
            index
            for index, order in enumerate(env.orders)
            if env._is_eligible(order)
        ]

        if not eligible_slots:
            break

        observation, reward, terminated, truncated, info = (
            env.step(eligible_slots[0])
        )

        print(
            f"Selected: {info['selected_order_id']} | "
            f"Reward: {reward} | "
            f"Duration: {info['processing_time_seconds']} seconds"
        )

    print("\nEnvironment smoke test completed!")
    print("Selected order sequence:", env.selected_order_ids)

    env.close()


if __name__ == "__main__":
    main()

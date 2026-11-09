from math import isfinite
from typing import Any, Mapping


REWARD_COMPONENTS = {
    "on_time_completion",
    "lead_time",
    "throughput",
    "rush_handling",
    "scheduling_regret",
    "resource_utilization",
    "makespan",
}


class SafetyConstraintViolation(Exception):
    """Raised when an action violates a hard safety constraint."""


class SchedulingReward:
    """
    Configurable multi-objective scheduling reward.

    Each component must be normalized to a score between 0 and 1:
        0 = worst score
        1 = best score

    Final objective weights are intentionally not assumed.
    """

    def __init__(
        self,
        weights: Mapping[str, float] | None = None,
        completion_reward: float = 1.0,
        invalid_action_penalty: float = -1.0,
    ):
        self.weights = dict(weights or {})

        unknown = set(self.weights) - REWARD_COMPONENTS
        if unknown:
            raise ValueError(
                f"Unknown reward components: {sorted(unknown)}"
            )

        for name, weight in self.weights.items():
            if (
                isinstance(weight, bool)
                or not isinstance(weight, (int, float))
                or not isfinite(weight)
                or weight < 0
            ):
                raise ValueError(
                    f"Weight for {name} must be finite and non-negative"
                )

        self.completion_reward = float(completion_reward)
        self.invalid_action_penalty = float(invalid_action_penalty)

    def calculate_components(
        self,
        components: Mapping[str, float],
        safety_feasible: bool = True,
    ) -> tuple[float, dict[str, float]]:
        """
        Combine normalized component scores using configured weights.

        Safety and feasibility are hard constraints, not reward terms.
        A violation raises an exception instead of applying a penalty.
        """

        if not safety_feasible:
            raise SafetyConstraintViolation(
                "Action rejected: safety or feasibility constraint violated."
            )

        unknown = set(components) - REWARD_COMPONENTS
        if unknown:
            raise ValueError(
                f"Unknown reward components: {sorted(unknown)}"
            )

        normalized = {}

        for name, score in components.items():
            if (
                isinstance(score, bool)
                or not isinstance(score, (int, float))
                or not isfinite(score)
                or not 0.0 <= score <= 1.0
            ):
                raise ValueError(
                    f"Component '{name}' must have a finite score "
                    "between 0 and 1."
                )

            normalized[name] = float(score)

        if not self.weights:
            # No approved objective weights yet.
            return 0.0, normalized

        missing = set(self.weights) - set(normalized)
        if missing:
            raise ValueError(
                f"Missing configured reward components: {sorted(missing)}"
            )

        total_weight = sum(self.weights.values())

        if total_weight == 0:
            return 0.0, normalized

        reward = sum(
            self.weights[name] * normalized[name]
            for name in self.weights
        ) / total_weight

        return float(reward), normalized

    # Temporary compatibility with the existing environment.
    # This simple reward is NOT the final scheduling objective.
    def calculate(
        self,
        selected_order: Mapping[str, Any] | None,
        valid_action: bool = True,
    ) -> float:
        if not valid_action:
            return self.invalid_action_penalty

        if selected_order is None:
            raise ValueError(
                "selected_order cannot be None for a valid action"
            )

        return self.completion_reward
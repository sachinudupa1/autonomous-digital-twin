"""Interface for Teammate 1's Digital Twin evaluator."""

from typing import Protocol


class TwinEvaluator(Protocol):

    def evaluate_candidate(
        self,
        system_state: dict,
        proposal: dict
    ) -> dict:
        ...
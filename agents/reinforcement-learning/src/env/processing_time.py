
from typing import Any, Callable, Mapping


class ProcessingTimeEstimator:
    """
    Configurable processing-time interface.

    Duration is expressed in seconds.

    No processing-time formula is assumed. Supply an estimator
    after the Digital Twin process has been validated.
    """

    def __init__(
        self,
        estimator: Callable[[Mapping[str, Any]], float] | None = None,
    ):
        self.estimator = estimator

    def estimate(self, order: Mapping[str, Any]) -> float:
        if self.estimator is None:
            raise NotImplementedError(
                "Processing-time formula has not been finalized."
            )

        duration = self.estimator(order)

        if isinstance(duration, bool) or not isinstance(
            duration, (int, float)
        ):
            raise ValueError(
                "Processing duration must be a numeric value in seconds."
            )

        if duration <= 0:
            raise ValueError(
                "Processing duration must be greater than zero."
            )

        return float(duration)

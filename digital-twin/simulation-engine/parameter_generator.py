
"""Operating-parameter candidate generation for the Digital Twin."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from math import isfinite
from random import Random


@dataclass(frozen=True)
class ParameterRange:
    """Allowed range for one operating parameter."""

    minimum: float
    maximum: float

    def validate(self, name: str) -> None:
        if not isfinite(self.minimum) or not isfinite(self.maximum):
            raise ValueError(f"{name}: bounds must be finite.")

        if self.minimum > self.maximum:
            raise ValueError(f"{name}: minimum exceeds maximum.")


@dataclass(frozen=True)
class ParameterBounds:
    """Operating limits supplied to the parameter generator."""

    upper_belt_speed: ParameterRange
    box_speed: ParameterRange
    dispenser_rpm: ParameterRange
    settle_time: ParameterRange

    def validate(self) -> None:
        for name, parameter_range in asdict(self).items():
            ParameterRange(**parameter_range).validate(name)


@dataclass(frozen=True)
class ParameterCandidate:
    """One generated operating configuration."""

    candidate_id: str
    schedule_id: str
    parameters: dict[str, float]
    seed: int
    strategy: str

    def to_dict(self) -> dict:
        return asdict(self)


class DigitalTwinParameterGenerator:
    """Generate reproducible parameter candidates within supplied limits.

    Uses stratified sampling to explore the allowed range of each
    parameter across the generated candidate set.

    These candidates must be evaluated by the Digital Twin before
    the Main Agent makes a scheduling decision.
    """

    STRATEGY = "stratified_random_sampling"

    def __init__(
        self,
        *,
        bounds: ParameterBounds,
        seed: int,
    ):
        if isinstance(seed, bool) or not isinstance(seed, int):
            raise ValueError("seed must be an integer.")

        bounds.validate()

        self.bounds = bounds
        self.seed = seed
        self.rng = Random(seed)

    def _sample_parameter(
        self,
        parameter_range: ParameterRange,
        count: int,
    ) -> list[float]:
        """Sample across the entire allowed range."""

        width = parameter_range.maximum - parameter_range.minimum

        if width == 0:
            return [parameter_range.minimum] * count

        strata = list(range(count))
        self.rng.shuffle(strata)

        values = []

        for stratum in strata:
            lower = (
                parameter_range.minimum
                + width * stratum / count
            )

            upper = (
                parameter_range.minimum
                + width * (stratum + 1) / count
            )

            values.append(
                self.rng.uniform(lower, upper)
            )

        return values

    def generate_candidates(
        self,
        *,
        schedule_id: str,
        count: int,
    ) -> list[ParameterCandidate]:
        """Generate parameter configurations for one candidate schedule."""

        if not isinstance(schedule_id, str) or not schedule_id.strip():
            raise ValueError("A valid schedule_id is required.")

        if isinstance(count, bool) or not isinstance(count, int):
            raise ValueError("count must be an integer.")

        if count < 1:
            raise ValueError("At least one candidate is required.")

        parameter_samples = {}

        for name, parameter_range in asdict(self.bounds).items():
            parameter_samples[name] = self._sample_parameter(
                ParameterRange(**parameter_range),
                count,
            )

        candidates = []

        for index in range(count):
            parameters = {
                name: round(values[index], 8)
                for name, values in parameter_samples.items()
            }

            candidate = ParameterCandidate(
                candidate_id=f"{schedule_id}-PARAM-{index + 1:03d}",
                schedule_id=schedule_id,
                parameters=parameters,
                seed=self.seed,
                strategy=self.STRATEGY,
            )

            candidates.append(candidate)

        return candidates

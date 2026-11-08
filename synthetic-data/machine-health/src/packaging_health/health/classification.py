from __future__ import annotations

from ..config import CATEGORY_ORDER, resolve_config
from ..utils import HealthValidationError


def classify_health(score: float, config: dict | None = None) -> str:
    """Map a 0-100 score to a configurable demonstration category.

    Lower bounds are inclusive. Categories are placeholders, not safety limits.
    """
    cfg = resolve_config(config)
    rng = cfg["health_calculation"]["score_range"]
    if isinstance(score, bool) or not isinstance(score, (int, float)) or score != score:
        raise HealthValidationError("health score must be a number")
    if not rng["minimum"] <= score <= rng["maximum"]:
        raise HealthValidationError(
            f"health score {score} outside configured range {rng['minimum']}-{rng['maximum']}"
        )
    cats = cfg["health_calculation"]["categories"]
    for name in CATEGORY_ORDER:
        if score >= cats[name]["minimum"]:
            return name
    return CATEGORY_ORDER[-1]  # unreachable with a validated config

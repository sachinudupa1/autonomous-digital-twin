from __future__ import annotations

import math


def normalize_risk(value: float, low: float, high: float) -> float:
    """Bounded risk in [0, 1]; higher measurement = higher risk.

    0 at/below `low`, 1 at/above `high`. Thresholds come from configuration.
    """
    if high <= low:
        raise ValueError("Invalid threshold range")
    if not math.isfinite(value):
        raise ValueError("value must be finite")
    score = (value - low) / (high - low)
    return max(0.0, min(1.0, score))

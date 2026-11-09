from typing import Any, Mapping, Sequence

import numpy as np


class LineStateEncoder:
    """
    Converts configurable packaging-line state dictionaries
    into a fixed-size numerical observation.

    Field names are supplied through feature_map because the
    shared Digital Twin contract is still being finalized.
    """

    def __init__(
        self,
        max_lines: int = 2,
        feature_map: Mapping[str, str] | None = None,
        id_field: str | None = None,
    ):
        if max_lines < 1:
            raise ValueError("max_lines must be at least 1")

        self.max_lines = max_lines
        self.feature_map = dict(feature_map or {})
        self.id_field = id_field

    @property
    def observation_size(self) -> int:
        return self.max_lines * len(self.feature_map)

    def encode(
        self,
        line_states: Sequence[Mapping[str, Any]],
    ) -> tuple[np.ndarray, list[str | None]]:

        if len(line_states) > self.max_lines:
            raise ValueError(
                f"Received {len(line_states)} lines, "
                f"but max_lines is {self.max_lines}"
            )

        encoded = np.zeros(
            self.observation_size,
            dtype=np.float32,
        )

        line_ids: list[str | None] = []

        for line_index, line in enumerate(line_states):
            if not isinstance(line, Mapping):
                raise TypeError("Each line state must be a dictionary")

            line_id = (
                str(line[self.id_field])
                if self.id_field and self.id_field in line
                else None
            )
            line_ids.append(line_id)

            for feature_index, source_field in enumerate(
                self.feature_map.values()
            ):
                value = line.get(source_field, 0)

                if isinstance(value, bool):
                    numeric_value = float(value)
                elif isinstance(value, (int, float)):
                    numeric_value = float(value)
                else:
                    raise ValueError(
                        f"Line field '{source_field}' must be numeric "
                        "or boolean in this provisional encoder"
                    )

                position = (
                    line_index * len(self.feature_map)
                    + feature_index
                )
                encoded[position] = numeric_value

        # Unused line slots remain zero-padded.
        return encoded, line_ids
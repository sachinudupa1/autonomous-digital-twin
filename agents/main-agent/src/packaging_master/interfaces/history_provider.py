"""Interface for historical performance retrieval."""

from typing import Protocol


class HistoryProvider(Protocol):

    def get_agent_history(
        self,
        agent_id: str,
        filters: dict | None = None
    ) -> list[dict]:
        ...
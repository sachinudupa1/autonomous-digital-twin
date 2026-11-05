"""Interface for backend-side log persistence."""

from typing import Protocol


class LogWriter(Protocol):

    def write_agent_log(self, event: dict) -> None:
        ...

    def write_decision_log(self, event: dict) -> None:
        ...

    def update_execution_outcome(self, event: dict) -> None:
        ...
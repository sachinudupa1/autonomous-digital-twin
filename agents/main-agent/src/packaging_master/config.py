"""
Configuration handling for the Main Agent.
"""

from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parent

PROJECT_ROOT = PACKAGE_ROOT.parents[3]

CONFIG_DIRECTORY = PROJECT_ROOT / "configs"

DECISION_CONFIG_FILE = (
    CONFIG_DIRECTORY / "decision_config.yaml"
)
"""Synthetic machine-health data generator (packaging_health)."""
from .config import load_config
from .generators.scenario_generator import generate_health_scenario, generate_health_sequence
from .health.classification import classify_health
from .health.health_score import calculate_health
from .processing.manual_input import process_manual_health_input
from .utils import GENERATOR_VERSION, ConfigError, HealthValidationError

__all__ = [
    "load_config",
    "generate_health_scenario",
    "generate_health_sequence",
    "classify_health",
    "calculate_health",
    "process_manual_health_input",
    "GENERATOR_VERSION",
    "ConfigError",
    "HealthValidationError",
]
__version__ = "0.1.0"

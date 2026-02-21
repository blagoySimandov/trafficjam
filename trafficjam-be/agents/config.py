from pydantic_settings import BaseSettings, SettingsConfigDict


class AgentConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AGENT_",
        env_file=".env",
        extra="ignore",
    )

    default_population_density: int = 100
    shopping_probability: float = 0.40
    max_shopping_distance_km: float = 2000.0
    healthcare_chance: float = 0.30
    elderly_age_threshold: int = 65
    kindergarten_age: int = 6
    min_independent_school_age: int = 12
    errand_min_minutes: int = 30
    errand_max_minutes: int = 120
    child_dropoff_min_minutes: int = 5
    child_dropoff_max_minutes: int = 10


config = AgentConfig()

POPULATION_DENSITY: dict[str, int] = {
    "IRL": 70,
    "GBR": 275,
    "USA": 36,
    "DEU": 240,
    "FRA": 119,
    "NLD": 508,
    "BEL": 383,
    "ESP": 94,
    "PRT": 111,
    "ITA": 200,
}

ADULT_DEPARTURE_CUMULATIVE_PROBS = [0.05, 0.15, 0.35, 0.65, 0.85, 0.95]

ELDERLY_DEPARTURE_HOURS = [9, 10, 11]
ELDERLY_DEPARTURE_WEIGHTS = [0.4, 0.4, 0.2]

WORK_HOURS = [7, 8, 9]
WORK_HOURS_WEIGHTS = [0.25, 0.5, 0.25]
WORK_MINUTES_CHOICES = [0, 15, 30, 45]

SCHOOL_DEPARTURE_HOURS = [7, 8]
SCHOOL_DEPARTURE_WEIGHTS = [0.6, 0.4]

from pydantic_settings import BaseSettings, SettingsConfigDict


class AgentConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="AGENT_",
        env_file=".env",
        extra="ignore",
    )

    default_population_density: int = 100


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

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    debug: bool = False
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/trafficjam"
    nats_url: str = "nats://localhost:4222"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()

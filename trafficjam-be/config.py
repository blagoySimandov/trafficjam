from pydantic_settings import BaseSettings
from functools import lru_cache


# TODO: add all config here
class Settings(BaseSettings):
    debug: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()

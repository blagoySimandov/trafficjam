from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    debug: bool = False

    # "gcs" or "overpass"
    data_source: str = "overpass"

    # Google Cloud Storage settings
    gcs_bucket_name: str = "tj-mapdata"
    gcs_network_file: str = "ireland-and-northern-ireland-260210.osm.json"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()

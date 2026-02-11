from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    debug: bool = False
    
    # Google Cloud Storage settings
    gcs_bucket_name: str = "trafficjam-network-data"
    gcs_network_file: str = "network.osm.json"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()

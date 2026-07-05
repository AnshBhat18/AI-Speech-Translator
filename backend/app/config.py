"""Application configuration loaded from environment variables."""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "AI Speech Translator Pro"
    app_env: str = "development"
    secret_key: str = "dev-secret-change-in-production"
    access_token_expire_minutes: int = 60
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    database_url: str = "sqlite:///./data/translator.db"
    log_level: str = "INFO"
    max_upload_size_mb: int = 10
    rate_limit_per_minute: int = 60

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()

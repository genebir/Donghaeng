from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    environment: Literal["development", "staging", "production"] = "development"

    database_url: str = Field(
        default="postgresql+asyncpg://donghaeng:donghaeng@localhost:5433/donghaeng",
    )

    jwt_secret: str = Field(default="change-me-in-development")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days

    bank_info_encryption_key: str | None = None

    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    sentry_dsn: str | None = None

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

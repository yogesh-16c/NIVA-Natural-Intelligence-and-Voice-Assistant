import os
from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="NIVA Backend")
    environment: str = Field(default="development")
    api_prefix: str = Field(default="/api")
    frontend_origins: List[str] = Field(default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"])
    backend_url: str = Field(default="http://localhost:8000")
    database_url: str = Field(default_factory=lambda: os.getenv("DATABASE_URL", "postgresql+asyncpg://localhost:5432/niva_dev"))
    db_echo: bool = Field(default=False)
    db_pool_size: int = Field(default=5)
    db_max_overflow: int = Field(default=10)
    db_pool_timeout: int = Field(default=30)
    jwt_secret_key: str = Field(default_factory=lambda: os.getenv("JWT_SECRET_KEY", "demo-dev-secret-change-me"), alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(default=60, alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-3.8-flash")
    gemini_live_model: str = Field(default="models/gemini-3.8-live")
    log_level: str = Field(default="INFO")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @classmethod
    def _parse_frontend_origins(cls, value):
        if value is None:
            return ["http://localhost:3000", "http://127.0.0.1:3000"]
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @classmethod
    def _get_frontend_origins(cls, value):
        return cls._parse_frontend_origins(value)


@lru_cache

def get_settings() -> Settings:
    settings = Settings()
    if settings.frontend_origins == ["http://localhost:3000", "http://127.0.0.1:3000"]:
        settings.frontend_origins = settings._parse_frontend_origins(
            __import__("os").getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
        )
    return settings

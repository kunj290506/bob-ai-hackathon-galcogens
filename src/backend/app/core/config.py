"""
Configuration module for D1 Mission Readiness & Predictive Maintenance Copilot.
Loads environment variables via pydantic-settings.
"""

from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Project Information
    PROJECT_NAME: str = "D1 Mission Readiness & Predictive Maintenance Copilot"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    # Defaults to local SQLite with async I/O; can be overridden by PostgreSQL connection string in production
    DATABASE_URL: str = "sqlite+aiosqlite:///./mission_readiness.db"

    # Security & JWT
    SECRET_KEY: str = "d1-mission-readiness-military-defense-key-super-secure-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # IBM watsonx.ai
    WATSONX_API_KEY: Optional[str] = None
    WATSONX_PROJECT_ID: Optional[str] = None
    WATSONX_URL: str = "https://us-south.ml.cloud.ibm.com"
    WATSONX_MODEL_ID: str = "ibm/granite-3-8b-instruct"

    # FastMCP & IBM Bob Settings
    MCP_SERVER_NAME: str = "mission-readiness-copilot"
    MCP_HOST: str = "0.0.0.0"
    MCP_PORT: int = 8000

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000"
    ]


settings = Settings()

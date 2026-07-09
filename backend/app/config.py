from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://observatorio:observatorio_dev@postgres:5432/observatorio_db"
    neo4j_uri: str = "bolt://neo4j:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "observatorio_dev"
    redis_url: str = "redis://redis:6379/0"
    secret_key: str = "dev-secret-key-no-usar-en-produccion"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    backend_cors_origins: str = '["http://localhost:3000","http://localhost:5173"]'

    @property
    def cors_origins(self) -> List[str]:
        return json.loads(self.backend_cors_origins)


settings = Settings()

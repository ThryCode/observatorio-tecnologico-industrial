from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    backend_cors_origins: str = '["http://localhost:5173"]'
    first_superuser: str = "admin@mindus.gob.cu"
    first_superuser_password: str

    @property
    def cors_origins(self) -> List[str]:
        return json.loads(self.backend_cors_origins)


settings = Settings()

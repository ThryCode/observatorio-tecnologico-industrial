import json

from pydantic_settings import BaseSettings, SettingsConfigDict


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

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    email_from: str = "Observatorio Tecnologico Industrial <noreply@mindus.gob.cu>"
    frontend_url: str = "http://localhost:5173"

    upload_dir: str = "./uploads"
    max_upload_size: int = 10_485_760  # 10MB
    allowed_extensions: str = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"

    @property
    def cors_origins(self) -> list[str]:
        return json.loads(self.backend_cors_origins)

    @property
    def allowed_extensions_list(self) -> list[str]:
        return [ext.strip().lower() for ext in self.allowed_extensions.split(",")]


settings = Settings()

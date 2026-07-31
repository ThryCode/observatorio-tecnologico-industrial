from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _strip_tz(v):
    if isinstance(v, str):
        v = datetime.fromisoformat(v.replace("Z", "+00:00"))
    if isinstance(v, datetime) and v.tzinfo is not None:
        return v.replace(tzinfo=None)
    return v


class ResearchPublicationCreate(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=300)
    autores: str = Field(..., min_length=1)
    resumen: str | None = None
    doi: str | None = Field(None, max_length=100)
    journal: str | None = Field(None, max_length=200)
    fecha_publicacion: datetime
    palabras_clave: list[str] | None = None
    sector_codigo: str | None = Field(None, min_length=3, max_length=3)
    url: str | None = Field(None, max_length=500)

    @field_validator("fecha_publicacion", mode="before")
    @classmethod
    def strip_tz(cls, v):
        return _strip_tz(v)


class ResearchPublicationUpdate(BaseModel):
    titulo: str | None = Field(None, min_length=1, max_length=300)
    autores: str | None = Field(None, min_length=1)
    resumen: str | None = None
    doi: str | None = Field(None, max_length=100)
    journal: str | None = Field(None, max_length=200)
    fecha_publicacion: datetime | None = None
    palabras_clave: list[str] | None = None
    sector_codigo: str | None = Field(None, min_length=3, max_length=3)
    url: str | None = Field(None, max_length=500)

    @field_validator("fecha_publicacion", mode="before")
    @classmethod
    def strip_tz(cls, v):
        return _strip_tz(v)


class ResearchPublicationResponse(BaseModel):
    id: UUID
    titulo: str
    autores: str
    resumen: str | None
    doi: str | None
    journal: str | None
    fecha_publicacion: datetime
    palabras_clave: list[str] | None
    sector_codigo: str | None
    url: str | None
    created_by: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

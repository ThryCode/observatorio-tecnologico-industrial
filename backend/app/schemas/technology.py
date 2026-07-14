from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class TechnologyCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    descripcion: str | None = None
    sector_codigo: str | None = Field(None, min_length=3, max_length=3)
    trl_nivel: int | None = Field(None, ge=1, le=9)
    referencia_ontologia: str | None = Field(None, max_length=50)
    palabras_clave: list[str] | None = None

    @field_validator("palabras_clave")
    @classmethod
    def validate_palabras_clave(cls, v: list[str] | None) -> list[str] | None:
        if v is not None:
            return [kw.strip().lower() for kw in v if kw.strip()]
        return v


class TechnologyUpdate(BaseModel):
    nombre: str | None = Field(None, min_length=1, max_length=200)
    descripcion: str | None = None
    sector_codigo: str | None = Field(None, min_length=3, max_length=3)
    trl_nivel: int | None = Field(None, ge=1, le=9)
    referencia_ontologia: str | None = Field(None, max_length=50)
    palabras_clave: list[str] | None = None

    @field_validator("palabras_clave")
    @classmethod
    def validate_palabras_clave(cls, v: list[str] | None) -> list[str] | None:
        if v is not None:
            return [kw.strip().lower() for kw in v if kw.strip()]
        return v


class TechnologyResponse(BaseModel):
    id: UUID
    nombre: str
    descripcion: str | None
    sector_codigo: str | None
    trl_nivel: int | None
    referencia_ontologia: str | None
    palabras_clave: list[str] | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

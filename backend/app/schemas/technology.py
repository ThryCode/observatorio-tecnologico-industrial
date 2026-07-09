from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List


class TechnologyCreate(BaseModel):
    nombre: str
    descripcion: str | None = None
    sector_codigo: str | None = None
    trl_nivel: int | None = None
    referencia_ontologia: str | None = None
    palabras_clave: List[str] | None = None


class TechnologyUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    sector_codigo: str | None = None
    trl_nivel: int | None = None
    referencia_ontologia: str | None = None
    palabras_clave: List[str] | None = None


class TechnologyResponse(BaseModel):
    id: UUID
    nombre: str
    descripcion: str | None
    sector_codigo: str | None
    trl_nivel: int | None
    referencia_ontologia: str | None
    palabras_clave: List[str] | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

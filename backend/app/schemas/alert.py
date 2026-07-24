from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AlertCreate(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=200)
    descripcion: str | None = None
    severidad: str = Field("media", max_length=10)
    sector_codigo: str | None = Field(None, max_length=3)


class AlertUpdate(BaseModel):
    titulo: str | None = Field(None, min_length=1, max_length=200)
    descripcion: str | None = None
    severidad: str | None = Field(None, max_length=10)
    sector_codigo: str | None = Field(None, max_length=3)
    leida: bool | None = None


class AlertResponse(BaseModel):
    id: UUID
    titulo: str
    descripcion: str | None
    severidad: str
    fecha: datetime
    sector_codigo: str | None
    leida: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

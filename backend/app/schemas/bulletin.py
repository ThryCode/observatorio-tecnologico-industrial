from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BulletinCreate(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=300)
    resumen: str | None = None
    fecha_publicacion: datetime
    categoria: str = Field(..., max_length=50)
    autor: str | None = Field(None, max_length=200)
    archivo_url: str | None = Field(None, max_length=500)
    sector_codigo: str | None = Field(None, min_length=3, max_length=3)


class BulletinUpdate(BaseModel):
    titulo: str | None = Field(None, min_length=1, max_length=300)
    resumen: str | None = None
    fecha_publicacion: datetime | None = None
    categoria: str | None = Field(None, max_length=50)
    autor: str | None = Field(None, max_length=200)
    archivo_url: str | None = Field(None, max_length=500)
    sector_codigo: str | None = Field(None, min_length=3, max_length=3)


class BulletinResponse(BaseModel):
    id: UUID
    titulo: str
    resumen: str | None
    fecha_publicacion: datetime
    categoria: str
    autor: str | None
    archivo_url: str | None
    sector_codigo: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    siglas: str = Field(..., min_length=1, max_length=20)
    tipo: str = Field(..., max_length=50)
    sector_codigo: str | None = Field(None, max_length=3)
    pais: str | None = Field(None, max_length=100)
    provincia: str | None = Field(None, max_length=100)
    sitio_web: str | None = Field(None, max_length=500)
    email_contacto: str | None = Field(None, max_length=255)


class OrganizationUpdate(BaseModel):
    nombre: str | None = Field(None, min_length=1, max_length=200)
    siglas: str | None = Field(None, min_length=1, max_length=20)
    tipo: str | None = Field(None, max_length=50)
    sector_codigo: str | None = Field(None, max_length=3)
    pais: str | None = Field(None, max_length=100)
    provincia: str | None = Field(None, max_length=100)
    sitio_web: str | None = Field(None, max_length=500)
    email_contacto: str | None = Field(None, max_length=255)


class OrganizationResponse(BaseModel):
    id: UUID
    nombre: str
    siglas: str
    tipo: str
    sector_codigo: str | None
    pais: str | None
    provincia: str | None
    sitio_web: str | None
    email_contacto: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

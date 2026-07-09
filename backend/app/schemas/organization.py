from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class OrganizationCreate(BaseModel):
    nombre: str
    siglas: str
    tipo: str
    sector_codigo: str | None = None
    pais: str | None = None
    provincia: str | None = None
    sitio_web: str | None = None
    email_contacto: str | None = None


class OrganizationUpdate(BaseModel):
    nombre: str | None = None
    siglas: str | None = None
    tipo: str | None = None
    sector_codigo: str | None = None
    pais: str | None = None
    provincia: str | None = None
    sitio_web: str | None = None
    email_contacto: str | None = None


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

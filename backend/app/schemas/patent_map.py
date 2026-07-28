from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class PatentMapCreate(BaseModel):
    tecnologia: str = Field(..., max_length=200)
    pais: str = Field(..., max_length=100)
    sector_codigo: str | None = Field(None, min_length=3, max_length=3)
    total_patentes: int = Field(..., ge=0)
    periodo: str = Field(..., max_length=20)
    tendencia: str = Field(..., max_length=20)


class PatentMapUpdate(BaseModel):
    tecnologia: str | None = Field(None, max_length=200)
    pais: str | None = Field(None, max_length=100)
    sector_codigo: str | None = Field(None, min_length=3, max_length=3)
    total_patentes: int | None = Field(None, ge=0)
    periodo: str | None = Field(None, max_length=20)
    tendencia: str | None = Field(None, max_length=20)


class PatentMapResponse(BaseModel):
    id: UUID
    tecnologia: str
    pais: str
    sector_codigo: str | None
    total_patentes: int
    periodo: str
    tendencia: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

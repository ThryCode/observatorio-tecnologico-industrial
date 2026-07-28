from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class CompetitivenessCreate(BaseModel):
    sector: str = Field(..., max_length=200)
    sector_codigo: str | None = Field(None, min_length=3, max_length=3)
    indicador: str = Field(..., max_length=200)
    valor: Decimal
    pais: str = Field(..., max_length=100)
    periodo: str = Field(..., max_length=20)
    fuente: str | None = Field(None, max_length=300)


class CompetitivenessUpdate(BaseModel):
    sector: str | None = Field(None, max_length=200)
    sector_codigo: str | None = Field(None, min_length=3, max_length=3)
    indicador: str | None = Field(None, max_length=200)
    valor: Decimal | None = None
    pais: str | None = Field(None, max_length=100)
    periodo: str | None = Field(None, max_length=20)
    fuente: str | None = Field(None, max_length=300)


class CompetitivenessResponse(BaseModel):
    id: UUID
    sector: str
    sector_codigo: str | None
    indicador: str
    valor: Decimal
    pais: str
    periodo: str
    fuente: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

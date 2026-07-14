from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.indicator import IndicatorPeriod


class IndicatorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    code: str = Field(..., min_length=1, max_length=50)
    description: str | None = None
    unit: str = Field(..., min_length=1, max_length=50)
    value: Decimal
    source: str = Field(..., min_length=1, max_length=200)
    period: IndicatorPeriod
    sector_codigo: str | None = Field(None, min_length=3, max_length=3)

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        return v.upper()


class IndicatorUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    unit: str | None = Field(None, min_length=1, max_length=50)
    value: Decimal | None = None
    source: str | None = Field(None, min_length=1, max_length=200)
    period: IndicatorPeriod | None = None
    sector_codigo: str | None = Field(None, min_length=3, max_length=3)


class IndicatorResponse(BaseModel):
    id: UUID
    name: str
    code: str
    description: str | None
    unit: str
    value: Decimal
    source: str
    period: IndicatorPeriod
    sector_codigo: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

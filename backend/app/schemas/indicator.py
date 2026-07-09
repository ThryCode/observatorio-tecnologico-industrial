from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.models.indicator import IndicatorPeriod


class IndicatorCreate(BaseModel):
    name: str
    code: str
    description: str | None = None
    unit: str
    value: Decimal
    source: str
    period: IndicatorPeriod
    sector: str | None = None


class IndicatorUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    unit: str | None = None
    value: Decimal | None = None
    source: str | None = None
    period: IndicatorPeriod | None = None
    sector: str | None = None


class IndicatorResponse(BaseModel):
    id: UUID
    name: str
    code: str
    description: str | None
    unit: str
    value: Decimal
    source: str
    period: IndicatorPeriod
    sector: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

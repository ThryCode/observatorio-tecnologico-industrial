from pydantic import BaseModel
from uuid import UUID
from datetime import date, datetime
from app.models.regulation import RegulationCategory


class RegulationCreate(BaseModel):
    title: str
    regulation_number: str
    issuing_body: str
    publication_date: date
    effective_date: date | None = None
    category: RegulationCategory
    summary: str | None = None


class RegulationUpdate(BaseModel):
    title: str | None = None
    issuing_body: str | None = None
    publication_date: date | None = None
    effective_date: date | None = None
    category: RegulationCategory | None = None
    summary: str | None = None


class RegulationResponse(BaseModel):
    id: UUID
    title: str
    regulation_number: str
    issuing_body: str
    publication_date: date
    effective_date: date | None
    category: RegulationCategory
    summary: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

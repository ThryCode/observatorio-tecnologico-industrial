from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.regulation import RegulationCategory


class RegulationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    regulation_number: str = Field(..., min_length=1, max_length=50)
    issuing_body: str = Field(..., min_length=1, max_length=200)
    publication_date: date
    effective_date: date | None = None
    category: RegulationCategory
    summary: str | None = None
    sector_codigo: str | None = Field(None, min_length=3, max_length=3)

    @field_validator("effective_date")
    @classmethod
    def validate_effective_date(cls, v: date | None, info) -> date | None:
        if v is not None and "publication_date" in info.data and v < info.data["publication_date"]:
            raise ValueError("Effective date must be after publication date")
        return v


class RegulationUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    issuing_body: str | None = Field(None, min_length=1, max_length=200)
    publication_date: date | None = None
    effective_date: date | None = None
    category: RegulationCategory | None = None
    summary: str | None = None
    sector_codigo: str | None = Field(None, min_length=3, max_length=3)


class RegulationResponse(BaseModel):
    id: UUID
    title: str
    regulation_number: str
    issuing_body: str
    publication_date: date
    effective_date: date | None
    category: RegulationCategory
    summary: str | None
    sector_codigo: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

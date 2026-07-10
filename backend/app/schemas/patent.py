import re
from pydantic import BaseModel, Field, field_validator
from uuid import UUID
from datetime import date, datetime
from app.models.patent import PatentStatus


class PatentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    patent_number: str = Field(..., min_length=1, max_length=50)
    applicant: str = Field(..., min_length=1, max_length=200)
    inventor: str = Field(..., min_length=1, max_length=200)
    filing_date: date
    publication_date: date | None = None
    status: PatentStatus = PatentStatus.FILED
    abstract: str | None = None
    technological_sector: str | None = None
    country: str = Field(..., min_length=2, max_length=2)
    technology_id: UUID | None = None
    organization_id: UUID | None = None

    @field_validator("patent_number")
    @classmethod
    def validate_patent_number(cls, v: str) -> str:
        if not re.match(r"^[A-Z]{2}-\d{4}-\d{3,6}$", v.upper()):
            raise ValueError("Patent number must follow format: XX-YYYY-NNNN (e.g., CU-2026-001)")
        return v.upper()

    @field_validator("country")
    @classmethod
    def validate_country(cls, v: str) -> str:
        return v.upper()


class PatentUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    applicant: str | None = Field(None, min_length=1, max_length=200)
    inventor: str | None = Field(None, min_length=1, max_length=200)
    publication_date: date | None = None
    status: PatentStatus | None = None
    abstract: str | None = None
    technological_sector: str | None = None
    country: str | None = Field(None, min_length=2, max_length=2)
    technology_id: UUID | None = None
    organization_id: UUID | None = None

    @field_validator("country")
    @classmethod
    def validate_country(cls, v: str | None) -> str | None:
        return v.upper() if v else v


class PatentResponse(BaseModel):
    id: UUID
    title: str
    patent_number: str
    applicant: str
    inventor: str
    filing_date: date
    publication_date: date | None
    status: PatentStatus
    abstract: str | None
    technological_sector: str | None
    country: str
    technology_id: UUID | None
    organization_id: UUID | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

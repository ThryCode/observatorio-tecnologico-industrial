from pydantic import BaseModel
from uuid import UUID
from datetime import date, datetime
from app.models.patent import PatentStatus


class PatentCreate(BaseModel):
    title: str
    patent_number: str
    applicant: str
    inventor: str
    filing_date: date
    publication_date: date | None = None
    status: PatentStatus = PatentStatus.FILED
    abstract: str | None = None
    technological_sector: str | None = None
    country: str
    technology_id: UUID | None = None
    organization_id: UUID | None = None


class PatentUpdate(BaseModel):
    title: str | None = None
    applicant: str | None = None
    inventor: str | None = None
    publication_date: date | None = None
    status: PatentStatus | None = None
    abstract: str | None = None
    technological_sector: str | None = None
    country: str | None = None
    technology_id: UUID | None = None
    organization_id: UUID | None = None


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

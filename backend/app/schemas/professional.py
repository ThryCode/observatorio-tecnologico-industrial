from uuid import UUID

from pydantic import BaseModel, Field


class ProfessionalProfileCreate(BaseModel):
    especialidad: str = Field(..., min_length=1, max_length=100)
    grado_cientifico: str | None = Field(None, max_length=50)
    cv_url: str | None = Field(None, max_length=255)
    biografia: str | None = None
    intereses: list[str] | None = None


class ProfessionalProfileUpdate(BaseModel):
    especialidad: str | None = Field(None, min_length=1, max_length=100)
    grado_cientifico: str | None = Field(None, max_length=50)
    cv_url: str | None = Field(None, max_length=255)
    biografia: str | None = None
    intereses: list[str] | None = None


class ProfessionalProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    especialidad: str
    grado_cientifico: str | None
    cv_url: str | None
    biografia: str | None
    intereses: list[str] | None

    model_config = {"from_attributes": True}


class ProfessionalListItem(BaseModel):
    id: UUID
    full_name: str
    username: str
    email: str
    phone: str | None
    job_title: str | None
    organization_id: UUID | None
    profile: ProfessionalProfileResponse | None = None

    model_config = {"from_attributes": True}

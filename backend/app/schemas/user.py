import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

VALID_ROLES = {"admin_mindus", "rep_cti", "analista", "cliente", "visitante"}


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=200)
    phone: str | None = None
    job_title: str | None = None
    organization_id: UUID | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", v):
            raise ValueError("Invalid email format")
        return v.lower()

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z0-9_-]+$", v):
            raise ValueError("Username must contain only letters, numbers, underscores, or hyphens")
        return v.lower()


class UserUpdate(BaseModel):
    email: str | None = Field(None, max_length=255)
    full_name: str | None = Field(None, min_length=1, max_length=200)
    role: str | None = None
    phone: str | None = None
    job_title: str | None = None
    organization_id: UUID | None = None
    is_active: bool | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str | None) -> str | None:
        if v is not None and not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", v):
            raise ValueError("Invalid email format")
        return v.lower() if v else v

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str | None) -> str | None:
        if v is not None and v not in VALID_ROLES:
            raise ValueError(f"Role must be one of: {', '.join(sorted(VALID_ROLES))}")
        return v


class ProfessionalProfileBrief(BaseModel):
    especialidad: str
    grado_cientifico: str | None
    cv_url: str | None
    biografia: str | None
    intereses: list[str] | None

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    full_name: str
    role: str
    phone: str | None
    job_title: str | None
    organization_id: UUID | None
    is_active: bool
    is_superuser: bool
    account_type: str | None
    status: str
    rejection_reason: str | None
    approved_at: datetime | None
    created_at: datetime
    updated_at: datetime
    professional_profile: ProfessionalProfileBrief | None = None

    model_config = {"from_attributes": True}

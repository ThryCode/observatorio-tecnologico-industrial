import re
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

VALID_ACCOUNT_TYPES = {"representante", "analista"}


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    account_type: str = Field(..., description="representante o analista")
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=200)
    phone: str | None = None
    job_title: str = Field(..., min_length=1, max_length=100)
    organization_id: UUID | None = None
    new_organization_name: str | None = Field(None, max_length=200)
    new_organization_siglas: str | None = Field(None, max_length=20)
    sector_codigo: str | None = None

    @field_validator("account_type")
    @classmethod
    def validate_account_type(cls, v: str) -> str:
        if v not in VALID_ACCOUNT_TYPES:
            raise ValueError(f"account_type must be one of: {', '.join(sorted(VALID_ACCOUNT_TYPES))}")
        return v

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


class RejectRequest(BaseModel):
    reason: str = Field(..., min_length=1, max_length=255)


class PendingUserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    full_name: str
    account_type: str | None
    phone: str | None
    job_title: str | None
    organization_id: UUID | None
    status: str
    rejection_reason: str | None
    approved_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}

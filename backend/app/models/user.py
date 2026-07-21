import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class UserRole(enum.StrEnum):
    ADMIN_MINDUS = "admin_mindus"
    REP_CTI = "rep_cti"
    ANALISTA = "analista"
    CLIENTE = "cliente"
    VISITANTE = "visitante"


class AccountType(enum.StrEnum):
    REPRESENTANTE = "representante"
    ANALISTA = "analista"


class UserStatus(enum.StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(150))
    role: Mapped[str] = mapped_column(String(20), default=UserRole.VISITANTE.value)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    job_title: Mapped[str | None] = mapped_column(String(100), nullable=True)
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("organizations.id"), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)

    # Registration fields
    account_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=UserStatus.PENDING.value)
    rejection_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

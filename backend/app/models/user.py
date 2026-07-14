import enum
import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class UserRole(enum.StrEnum):
    ADMIN_MINDUS = "admin_mindus"
    REP_CTI = "rep_cti"
    ANALISTA = "analista"
    CLIENTE = "cliente"
    VISITANTE = "visitante"


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

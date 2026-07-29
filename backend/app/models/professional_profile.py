from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ARRAY, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User


class ProfessionalProfile(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "professional_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    especialidad: Mapped[str] = mapped_column(String(100))
    grado_cientifico: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cv_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    biografia: Mapped[str | None] = mapped_column(Text, nullable=True)
    intereses: Mapped[list[str] | None] = mapped_column(
        ARRAY(String), nullable=True
    )

    user: Mapped[User] = relationship("User", back_populates="professional_profile")

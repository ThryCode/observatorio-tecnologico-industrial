from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class Alert(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "alerts"

    titulo: Mapped[str] = mapped_column(String(200))
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    severidad: Mapped[str] = mapped_column(String(10), default="media")
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    sector_codigo: Mapped[str | None] = mapped_column(
        ForeignKey("industrial_sectores.codigo"), nullable=True
    )
    leida: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))

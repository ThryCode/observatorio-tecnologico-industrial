import uuid
from datetime import datetime

from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class ResearchPublication(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "research_publications"

    titulo: Mapped[str] = mapped_column(String(300))
    autores: Mapped[str] = mapped_column(Text)
    resumen: Mapped[str | None] = mapped_column(Text, nullable=True)
    doi: Mapped[str | None] = mapped_column(String(100), nullable=True)
    journal: Mapped[str | None] = mapped_column(String(200), nullable=True)
    fecha_publicacion: Mapped[datetime] = mapped_column()
    palabras_clave: Mapped[list[str] | None] = mapped_column(
        JSON, nullable=True
    )
    sector_codigo: Mapped[str | None] = mapped_column(
        ForeignKey("industrial_sectores.codigo"), nullable=True
    )
    url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

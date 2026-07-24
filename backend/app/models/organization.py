from datetime import date

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class Organization(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "organizations"

    nombre: Mapped[str] = mapped_column(String(200))
    siglas: Mapped[str] = mapped_column(String(20), unique=True)
    tipo: Mapped[str] = mapped_column(String(30))
    sector_codigo: Mapped[str | None] = mapped_column(
        ForeignKey("industrial_sectores.codigo"), nullable=True
    )
    pais: Mapped[str | None] = mapped_column(String(100), nullable=True)
    provincia: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sitio_web: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email_contacto: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fecha_creacion: Mapped[date | None] = mapped_column(Date, nullable=True)
    contacto: Mapped[str | None] = mapped_column(String(50), nullable=True)

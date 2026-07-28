from datetime import datetime

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class Bulletin(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "bulletins"

    titulo: Mapped[str] = mapped_column(String(300))
    resumen: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_publicacion: Mapped[datetime] = mapped_column()
    categoria: Mapped[str] = mapped_column(String(50))
    autor: Mapped[str | None] = mapped_column(String(200), nullable=True)
    archivo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sector_codigo: Mapped[str | None] = mapped_column(
        ForeignKey("industrial_sectores.codigo"), nullable=True
    )

from sqlalchemy import String, Text, Integer, ForeignKey, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDMixin, TimestampMixin


class Technology(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "technologies"

    nombre: Mapped[str] = mapped_column(String(200))
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    sector_codigo: Mapped[str | None] = mapped_column(
        ForeignKey("industrial_sectores.codigo"), nullable=True
    )
    trl_nivel: Mapped[int | None] = mapped_column(Integer, nullable=True)
    referencia_ontologia: Mapped[str | None] = mapped_column(String(50), nullable=True)
    palabras_clave: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(50)), nullable=True
    )

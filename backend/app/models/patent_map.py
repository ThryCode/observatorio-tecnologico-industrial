from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class PatentMapEntry(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "patent_map_entries"

    tecnologia: Mapped[str] = mapped_column(String(200))
    pais: Mapped[str] = mapped_column(String(100))
    sector_codigo: Mapped[str | None] = mapped_column(
        ForeignKey("industrial_sectores.codigo"), nullable=True
    )
    total_patentes: Mapped[int] = mapped_column(Integer)
    periodo: Mapped[str] = mapped_column(String(20))
    tendencia: Mapped[str] = mapped_column(String(20))

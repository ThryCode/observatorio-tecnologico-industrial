from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class CompetitivenessIndex(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "competitiveness_indices"

    sector: Mapped[str] = mapped_column(String(200))
    sector_codigo: Mapped[str | None] = mapped_column(
        ForeignKey("industrial_sectores.codigo"), nullable=True
    )
    indicador: Mapped[str] = mapped_column(String(200))
    valor: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    pais: Mapped[str] = mapped_column(String(100))
    periodo: Mapped[str] = mapped_column(String(20))
    fuente: Mapped[str | None] = mapped_column(String(300), nullable=True)

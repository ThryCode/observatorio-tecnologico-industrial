import enum
from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class RegulationCategory(enum.StrEnum):
    LAW = "law"
    DECREE = "decree"
    RESOLUTION = "resolution"
    STANDARD = "standard"
    NORM = "norm"


class Regulation(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "regulations"

    title: Mapped[str] = mapped_column(String(300))
    regulation_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    issuing_body: Mapped[str] = mapped_column(String(200))
    publication_date: Mapped[date] = mapped_column(Date)
    effective_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    category: Mapped[RegulationCategory] = mapped_column(SAEnum(RegulationCategory))
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    sector_codigo: Mapped[str | None] = mapped_column(
        ForeignKey("industrial_sectores.codigo"), nullable=True
    )

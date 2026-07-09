import enum
from decimal import Decimal
from sqlalchemy import String, Text, Numeric, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, UUIDMixin, TimestampMixin


class IndicatorPeriod(str, enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"


class Indicator(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "indicators"

    name: Mapped[str] = mapped_column(String(200))
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    unit: Mapped[str] = mapped_column(String(50))
    value: Mapped[Decimal] = mapped_column(Numeric(14, 4))
    source: Mapped[str] = mapped_column(String(200))
    period: Mapped[IndicatorPeriod] = mapped_column(SAEnum(IndicatorPeriod))
    sector: Mapped[str | None] = mapped_column(String(100), nullable=True)

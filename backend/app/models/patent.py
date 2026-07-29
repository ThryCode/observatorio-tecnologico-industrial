import enum
import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


class PatentStatus(enum.StrEnum):
    FILED = "filed"
    EXAMINATION = "examination"
    GRANTED = "granted"
    EXPIRED = "expired"
    REJECTED = "rejected"


class Patent(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "patents"

    title: Mapped[str] = mapped_column(String(300))
    patent_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    applicant: Mapped[str] = mapped_column(String(200))
    inventor: Mapped[str] = mapped_column(String(200))
    filing_date: Mapped[date] = mapped_column(Date)
    publication_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[PatentStatus] = mapped_column(SAEnum(PatentStatus), default=PatentStatus.FILED)
    abstract: Mapped[str | None] = mapped_column(Text, nullable=True)
    technological_sector: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str] = mapped_column(String(50))
    technology_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("technologies.id"), nullable=True
    )
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("organizations.id"), nullable=True
    )

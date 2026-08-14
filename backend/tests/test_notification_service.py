from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta

import pytest
import pytest_asyncio

from app.core import db
from app.models.alert import Alert
from app.models.user import User, UserStatus
from app.services.notification_service import notify_new_alert, send_due_summaries


def _make_user(
    username: str,
    email: str,
    *,
    notifications: bool = True,
    frequency: str = "diario",
    status: str = UserStatus.APPROVED.value,
) -> User:
    return User(
        username=username,
        email=email,
        hashed_password="x",
        full_name=username,
        role="analista",
        status=status,
        is_active=True,
        email_notifications=notifications,
        summary_frequency=frequency,
    )


@pytest_asyncio.fixture
def patch_session_factory(db_session):
    @asynccontextmanager
    async def factory():
        yield db_session

    original = db._session_factory
    db._session_factory = factory
    yield
    db._session_factory = original


@pytest.mark.asyncio
async def test_notify_new_alert_sends_only_to_subscribed_approved_users(db_session, patch_session_factory, monkeypatch):
    db_session.add_all([
        _make_user("sub1", "sub1@x.cu"),
        _make_user("nosub", "nosub@x.cu", notifications=False),
        _make_user("pend", "pend@x.cu", status=UserStatus.PENDING.value),
    ])
    await db_session.flush()

    sent = []

    async def fake_send(to: str, subject: str, html: str) -> bool:
        sent.append(to)
        return True

    monkeypatch.setattr("app.services.notification_service._send_email", fake_send)

    await notify_new_alert("alert-1", "Nueva patente", "Descripcion", "alta")

    assert sent == ["sub1@x.cu"]


@pytest.mark.asyncio
async def test_send_due_summaries_sends_to_users_with_due_frequency(db_session, patch_session_factory, monkeypatch):
    db_session.add_all([
        _make_user("daily", "daily@x.cu", frequency="diario"),
        _make_user("weekly", "weekly@x.cu", frequency="semanal"),
        _make_user("monthly", "monthly@x.cu", frequency="mensual"),
    ])
    db_session.add(Alert(titulo="Alerta reciente", descripcion="d", severidad="media"))
    await db_session.flush()

    sent = []

    async def fake_send(to: str, subject: str, html: str) -> bool:
        sent.append((to, subject))
        return True

    monkeypatch.setattr("app.services.notification_service._send_email", fake_send)

    now = datetime.now(UTC)
    days_until_monday = (now.weekday() - 0) % 7
    monday = now - timedelta(days=days_until_monday)
    await send_due_summaries(monday)

    assert any(to == "daily@x.cu" for to, _ in sent)
    assert any(to == "weekly@x.cu" for to, _ in sent)
    assert not any(to == "monthly@x.cu" for to, _ in sent)


@pytest.mark.asyncio
async def test_send_due_summaries_skips_days_without_due_frequency(db_session, patch_session_factory, monkeypatch):
    sent = []

    async def fake_send(to: str, subject: str, html: str) -> bool:
        sent.append(to)
        return True

    monkeypatch.setattr("app.services.notification_service._send_email", fake_send)

    now = datetime.now(UTC)
    days_until_tuesday = (now.weekday() - 1) % 7
    tuesday = now - timedelta(days=days_until_tuesday)
    await send_due_summaries(tuesday)

    assert sent == []

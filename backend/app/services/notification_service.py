import asyncio
from datetime import UTC, datetime, timedelta

import structlog
from sqlalchemy import select

from app.core.config import settings
from app.models.alert import Alert
from app.models.user import User, UserStatus
from app.services.email_service import _render, _send_email

logger = structlog.stdlib.get_logger()

FREQUENCY_DAY_RANGES: dict[str, int] = {
    "diario": 1,
    "semanal": 7,
    "mensual": 30,
}


def _subscribed_users_query():
    return select(User).where(
        User.is_active.is_(True),
        User.status == UserStatus.APPROVED.value,
        User.email_notifications.is_(True),
    )


async def notify_new_alert(alert_id: str, titulo: str, descripcion: str | None, severidad: str) -> None:
    """Fire-and-forget: send an email to all subscribed users when an alert is created."""
    try:
        from app.core import db

        async with db._session_factory() as session:
            result = await session.execute(_subscribed_users_query())
            users = result.scalars().all()
            if not users:
                logger.info("new_alert_email_no_subscribers")
                return
            html = _render(
                "new_alert.html",
                titulo=titulo,
                descripcion=descripcion or "",
                severidad=severidad,
                alerts_url=f"{settings.frontend_url}/alerts",
            )
            for user in users:
                await _send_email(
                    user.email,
                    f"Nueva alerta: {titulo} - Observatorio Tecnologico",
                    html,
                )
            logger.info("new_alert_email_sent", user_count=len(users))
    except Exception as e:  # noqa: BLE001
        logger.error("new_alert_notification_failed", error=str(e))


async def _send_summary_for(frequency: str, users: list[User]) -> None:
    days = FREQUENCY_DAY_RANGES[frequency]
    since = datetime.now(UTC) - timedelta(days=days)
    try:
        from app.core import db

        async with db._session_factory() as session:
            result = await session.execute(
                select(Alert).where(Alert.created_at >= since).order_by(Alert.created_at.desc())
            )
            alerts = result.scalars().all()
            if not alerts:
                logger.info("summary_no_activity", frequency=frequency)
                return
            html = _render(
                "summary.html",
                frequency=frequency,
                period=days,
                items=[
                    {"titulo": a.titulo, "descripcion": a.descripcion or "", "severidad": a.severidad}
                    for a in alerts[:20]
                ],
                alerts_url=f"{settings.frontend_url}/alerts",
            )
            for user in users:
                await _send_email(
                    user.email,
                    f"Resumen {frequency} del Observatorio - {len(alerts)} novedades",
                    html,
                )
            logger.info("summary_sent", frequency=frequency, user_count=len(users), alert_count=len(alerts))
    except Exception as e:  # noqa: BLE001
        logger.error("summary_failed", frequency=frequency, error=str(e))


async def send_due_summaries(now: datetime | None = None) -> None:
    """Send summaries whose frequency is due today (diario: always; semanal: Monday; mensual: 1st)."""
    now = now or datetime.now(UTC)
    frequency_by_day = {
        "diario": True,
        "semanal": now.weekday() == 0,
        "mensual": now.day == 1,
    }
    due = [f for f, ok in frequency_by_day.items() if ok]
    if not due:
        return

    try:
        from app.core import db

        async with db._session_factory() as session:
            result = await session.execute(_subscribed_users_query())
            all_users = result.scalars().all()
    except Exception as e:  # noqa: BLE001
        logger.error("summary_scheduler_user_query_failed", error=str(e))
        return

    for frequency in due:
        users = [u for u in all_users if u.summary_frequency == frequency]
        if users:
            await _send_summary_for(frequency, users)


async def summary_scheduler_loop(stop_event: asyncio.Event) -> None:
    """Background loop: check every 6h whether summaries are due, send at the configured hour."""
    logger.info("summary_scheduler_started", send_hour=settings.summary_send_hour)
    while not stop_event.is_set():
        now = datetime.now(UTC)
        if now.hour == settings.summary_send_hour:
            await send_due_summaries(now)
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=6 * 3600)
            except TimeoutError:
                continue
        else:
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=1800)
            except TimeoutError:
                continue
    logger.info("summary_scheduler_stopped")

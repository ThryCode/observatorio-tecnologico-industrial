import asyncio
from pathlib import Path

from jinja2 import Template
from loguru import logger

from app.core.config import settings

_TEMPLATES_DIR = Path(__file__).parent / "email_templates"

_RETRIES = 3
_BACKOFF = 1.0


async def _send_email(to: str, subject: str, html: str) -> bool:
    if not settings.smtp_host:
        logger.warning("SMTP not configured, skipping email to {}", to)
        return False

    import aiosmtplib

    for attempt in range(1, _RETRIES + 1):
        try:
            async with aiosmtplib.SMTP(hostname=settings.smtp_host, port=settings.smtp_port, use_tls=settings.smtp_use_tls) as smtp:  # noqa: E501
                if settings.smtp_user:
                    await smtp.login(settings.smtp_user, settings.smtp_password)
                await smtp.sendmail(settings.email_from, [to], _build_mime(to, subject, html))
            return True
        except Exception as e:
            logger.warning("Email attempt {}/{} failed: {}", attempt, _RETRIES, e)
            if attempt < _RETRIES:
                await asyncio.sleep(_BACKOFF * attempt)
    return False


def _build_mime(to: str, subject: str, html: str) -> str:
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.email_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html, "html", "utf-8"))
    return msg.as_string()


def _render(template_name: str, **kwargs) -> str:
    path = _TEMPLATES_DIR / template_name
    raw = path.read_text(encoding="utf-8")
    return Template(raw).render(**kwargs)


async def notify_approval(user_email: str, user_name: str) -> bool:
    html = _render("approval.html", nombre=user_name, login_url=f"{settings.frontend_url}/login")
    return await _send_email(user_email, "Cuenta aprobada — Observatorio Tecnologico", html)


async def notify_rejection(user_email: str, user_name: str, reason: str | None = None) -> bool:
    html = _render("rejection.html", nombre=user_name, razon=reason)
    return await _send_email(user_email, "Solicitud rechazada — Observatorio Tecnologico", html)

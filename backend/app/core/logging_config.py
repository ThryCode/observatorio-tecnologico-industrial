import sys

from loguru import logger

from app.core.request_context import get_request_id


def setup_logging() -> None:
    logger.remove()

    def request_id_filter(record):
        record["request_id"] = get_request_id()
        return True

    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green>"
        " | <level>{level:8}</level>"
        " | <cyan>{extra[service]}</cyan>"
        " | {extra[request_id]}"
        " | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan>"
        " - <level>{message}</level>"
    )

    logger.add(
        sys.stdout,
        format=log_format,
        level="DEBUG",
        colorize=True,
        serialize=False,
        filter=request_id_filter,
    )

    logger.add(
        "logs/observatorio.log",
        format=(
            "{time:YYYY-MM-DD HH:mm:ss.SSS}"
            " | {level:8}"
            " | {extra[service]}"
            " | {extra[request_id]}"
            " | {name}:{function}:{line}"
            " - {message}"
        ),
        level="INFO",
        rotation="10 MB",
        retention="30 days",
        serialize=True,
        filter=request_id_filter,
    )

    logger.configure(extra={"service": "observatorio", "request_id": ""})

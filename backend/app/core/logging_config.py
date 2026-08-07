import sys

from loguru import logger


def setup_logging() -> None:
    logger.remove()

    log_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green>"
        " | <level>{level:8}</level>"
        " | <cyan>{extra[service]}</cyan>"
        " | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan>"
        " - <level>{message}</level>"
    )

    logger.add(
        sys.stdout,
        format=log_format,
        level="DEBUG",
        colorize=True,
        serialize=False,
    )

    logger.add(
        "logs/observatorio.log",
        format=(
            "{time:YYYY-MM-DD HH:mm:ss.SSS}"
            " | {level:8}"
            " | {extra[service]}"
            " | {name}:{function}:{line}"
            " - {message}"
        ),
        level="INFO",
        rotation="10 MB",
        retention="30 days",
        serialize=True,
    )

    logger.configure(extra={"service": "observatorio"})

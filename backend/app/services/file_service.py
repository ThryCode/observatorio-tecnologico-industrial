import uuid
from pathlib import Path

from fastapi import UploadFile
from loguru import logger

from app.core.config import settings

ALLOWED = settings.allowed_extensions_list
MAX_SIZE = settings.max_upload_size
UPLOAD_DIR = Path(settings.upload_dir)


class FileServiceError(Exception):
    pass


def _ensure_dir(subdir: str = "") -> Path:
    target = UPLOAD_DIR / subdir
    target.mkdir(parents=True, exist_ok=True)
    return target


def _validate(file: UploadFile) -> str:
    ext = Path(file.filename or "").suffix.lower()
    if not ext:
        raise FileServiceError("El archivo no tiene extensión")
    if ext not in ALLOWED:
        raise FileServiceError(f"Extensión '{ext}' no permitida. Permitidas: {', '.join(ALLOWED)}")
    return ext


async def save_upload(file: UploadFile, subdir: str = "") -> dict:
    ext = _validate(file)
    _ensure_dir(subdir)
    filename = f"{uuid.uuid4().hex}{ext}"
    path = UPLOAD_DIR / subdir / filename

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise FileServiceError(f"El archivo excede el tamaño máximo de {MAX_SIZE // 1_048_576}MB")

    path.write_bytes(content)
    logger.info("File saved: {} ({} bytes)", path, len(content))

    return {
        "filename": filename,
        "path": str(path.relative_to(UPLOAD_DIR.parent)),
        "url": f"/api/v1/files/{subdir}/{filename}" if subdir else f"/api/v1/files/{filename}",
        "size": len(content),
    }


def delete_file(relative_path: str) -> None:
    full = UPLOAD_DIR.parent / relative_path
    try:
        full.unlink(missing_ok=True)
        logger.info("File deleted: {}", full)
    except Exception as e:
        logger.warning("Failed to delete file {}: {}", full, e)

from pathlib import Path

import structlog
from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.exceptions import AppException
from app.dependencies import get_current_user
from app.services.file_service import FileServiceError, save_upload

logger = structlog.stdlib.get_logger()

router = APIRouter(prefix="/upload", tags=["upload"])
files_router = APIRouter(prefix="/files", tags=["files"])


@router.post("", response_model=dict)
async def upload_file(file: UploadFile = File(...), user=Depends(get_current_user)):
    try:
        result = await save_upload(file)
        return result
    except FileServiceError as e:
        raise AppException(status_code=400, detail=str(e)) from None
    except Exception as e:
        logger.error("upload_error", error=str(e))
        raise AppException(status_code=500, detail="Error al subir el archivo") from None


@files_router.get("/{filename:path}")
async def get_file(filename: str, user=Depends(get_current_user)):
    file_path = Path(settings.upload_dir) / filename
    resolved = file_path.resolve()
    uploads_resolved = Path(settings.upload_dir).resolve()
    if not str(resolved).startswith(str(uploads_resolved)):
        raise AppException(status_code=403, detail="Acceso denegado")
    if not resolved.exists() or not resolved.is_file():
        raise AppException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(str(resolved))

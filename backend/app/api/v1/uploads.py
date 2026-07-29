from fastapi import APIRouter, Depends, File, UploadFile
from loguru import logger

from app.dependencies import get_current_user
from app.services.file_service import FileServiceError, save_upload

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("", response_model=dict)
async def upload_file(file: UploadFile = File(...), user=Depends(get_current_user)):
    try:
        result = await save_upload(file)
        return result
    except FileServiceError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Upload error: {}", e)
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail="Error al subir el archivo")

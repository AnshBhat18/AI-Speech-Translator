"""File and OCR translation routes."""

import aiosqlite
from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.api.deps import get_db, get_optional_user
from app.config import get_settings
from app.core.exceptions import AppError
from app.models.languages import resolve_language_code
from app.models.schemas import TranslateResponse
from app.services.file_service import file_service
from app.services.history_service import history_service
from app.services.language_service import language_service
from app.services.translation_service import translation_service

router = APIRouter(tags=["Files & OCR"])


async def _read_securely(file: UploadFile) -> bytes:
    """Read upload file securely in chunks to prevent memory exhaustion."""
    max_bytes = get_settings().max_upload_size_mb * 1024 * 1024
    content_chunks = []
    total_size = 0
    while True:
        chunk = await file.read(65536)  # Read in 64KB chunks
        if not chunk:
            break
        total_size += len(chunk)
        if total_size > max_bytes:
            raise AppError(
                f"File too large. Maximum size is {get_settings().max_upload_size_mb} MB",
                status_code=413,
            )
        content_chunks.append(chunk)
    return b"".join(content_chunks)


@router.post("/files/translate", response_model=TranslateResponse)
async def translate_file(
    file: UploadFile = File(...),
    target_language: str = Form(...),
    conn: aiosqlite.Connection = Depends(get_db),
    user_id: int | None = Depends(get_optional_user),
) -> TranslateResponse:
    content = await _read_securely(file)
    text = file_service.extract_text_from_file(file.filename or "upload.txt", content)
    translated = translation_service.translate(text, target_language)
    detection = language_service.detect(text)
    target_code = resolve_language_code(target_language)

    await history_service.add_entry(
        conn,
        original=text[:500],
        translated=translated[:500],
        source_language=detection.language_code,
        target_language=target_code,
        mode="file",
        user_id=user_id,
    )

    return TranslateResponse(
        original=text,
        translated=translated,
        source_language=detection.language_code,
        target_language=target_code,
    )


@router.post("/ocr/translate", response_model=TranslateResponse)
async def translate_image(
    image: UploadFile = File(...),
    target_language: str = Form(...),
    conn: aiosqlite.Connection = Depends(get_db),
    user_id: int | None = Depends(get_optional_user),
) -> TranslateResponse:
    """Extract text from an image using OCR and translate it."""
    content = await _read_securely(image)
    text = file_service.extract_text_from_image(content)
    translated = translation_service.translate(text, target_language)
    detection = language_service.detect(text)
    target_code = resolve_language_code(target_language)

    await history_service.add_entry(
        conn,
        original=text[:500],
        translated=translated[:500],
        source_language=detection.language_code,
        target_language=target_code,
        mode="ocr",
        user_id=user_id,
    )

    return TranslateResponse(
        original=text,
        translated=translated,
        source_language=detection.language_code,
        target_language=target_code,
    )


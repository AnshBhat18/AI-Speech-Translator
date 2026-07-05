"""Speech and TTS API routes."""

import aiosqlite
from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import Response

from app.api.deps import get_db, get_optional_user
from app.config import get_settings
from app.core.exceptions import AppError
from app.models.languages import resolve_language_code
from app.models.schemas import SpeechTranslateResponse
from app.services.history_service import history_service
from app.services.language_service import language_service
from app.services.speech_service import speech_service
from app.services.translation_service import translation_service
from app.services.tts_service import tts_service

router = APIRouter(tags=["Speech & TTS"])


async def _read_securely(file: UploadFile) -> bytes:
    """Read upload audio file securely in chunks to prevent memory exhaustion."""
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
                f"Audio file too large. Maximum size is {get_settings().max_upload_size_mb} MB",
                status_code=413,
            )
        content_chunks.append(chunk)
    return b"".join(content_chunks)


@router.post("/speech/translate", response_model=SpeechTranslateResponse)
async def translate_speech(
    audio: UploadFile = File(...),
    target_language: str = Form(...),
    conn: aiosqlite.Connection = Depends(get_db),
    user_id: int | None = Depends(get_optional_user),
) -> SpeechTranslateResponse:
    content = await _read_securely(audio)
    recognized = speech_service.recognize(content)
    detection = language_service.detect(recognized)
    translated = translation_service.translate(recognized, target_language)
    target_code = resolve_language_code(target_language)

    await history_service.add_entry(
        conn,
        original=recognized,
        translated=translated,
        source_language=detection.language_code,
        target_language=target_code,
        mode="speech",
        user_id=user_id,
    )

    return SpeechTranslateResponse(
        recognized_text=recognized,
        translated_text=translated,
        source_language=detection.language_code,
        target_language=target_code,
    )


@router.post("/tts")
def text_to_speech(text: str, language: str = "en") -> Response:
    """Generate MP3 audio from translated text."""
    audio_bytes = tts_service.synthesize(text, language)
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=translation.mp3"},
    )


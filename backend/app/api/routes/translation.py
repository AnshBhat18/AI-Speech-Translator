"""Translation API routes."""

import asyncio
import aiosqlite
from fastapi import APIRouter, Depends
from fastapi.concurrency import run_in_threadpool

from app.api.deps import get_db, get_optional_user
from app.models.languages import LANGUAGES, get_language_name, resolve_language_code
from app.models.schemas import (
    BatchTranslateRequest,
    BatchTranslateResponse,
    LanguageDetectionResponse,
    LanguageInfo,
    TranslateRequest,
    TranslateResponse,
    MultiTranslateRequest,
    MultiTranslateResponse,
)
from app.services.history_service import history_service
from app.services.language_service import language_service
from app.services.translation_service import translation_service

router = APIRouter(prefix="/translate", tags=["Translation"])


@router.get("/languages", response_model=list[LanguageInfo])
def list_languages() -> list[LanguageInfo]:
    return [LanguageInfo(name=name, code=code) for name, code in LANGUAGES.items()]


@router.post("/detect", response_model=LanguageDetectionResponse)
def detect_language(text: str) -> LanguageDetectionResponse:
    return language_service.detect(text)


@router.post("/text", response_model=TranslateResponse)
async def translate_text(
    payload: TranslateRequest,
    conn: aiosqlite.Connection = Depends(get_db),
    user_id: int | None = Depends(get_optional_user),
) -> TranslateResponse:
    translated = translation_service.translate(
        payload.text,
        payload.target_language,
        payload.source_language,
    )
    detection = language_service.detect(payload.text)
    target_code = resolve_language_code(payload.target_language)

    await history_service.add_entry(
        conn,
        original=payload.text,
        translated=translated,
        source_language=detection.language_code,
        target_language=target_code,
        mode="text",
        user_id=user_id,
    )

    return TranslateResponse(
        original=payload.text,
        translated=translated,
        source_language=detection.language_code,
        target_language=target_code,
        confidence=detection.confidence,
    )


@router.post("/batch", response_model=BatchTranslateResponse)
def translate_batch(payload: BatchTranslateRequest) -> BatchTranslateResponse:
    """Translate up to 20 texts in a single request."""
    return translation_service.translate_batch(
        payload.texts,
        payload.target_language,
        payload.source_language,
    )


@router.post("/multi", response_model=MultiTranslateResponse)
async def translate_multi(
    payload: MultiTranslateRequest,
    conn: aiosqlite.Connection = Depends(get_db),
    user_id: int | None = Depends(get_optional_user),
) -> MultiTranslateResponse:
    """Translate a text to multiple target languages concurrently."""
    detection = language_service.detect(payload.text)

    async def _translate_single(target_lang: str) -> tuple[str, str]:
        target_code = resolve_language_code(target_lang)
        # deep-translator makes synchronous network requests. Run in threadpool to avoid blocking.
        translated = await run_in_threadpool(
            translation_service.translate,
            payload.text,
            target_lang,
            payload.source_language,
        )
        return target_code, translated

    tasks = [_translate_single(lang) for lang in payload.target_languages]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    translations = {}
    for lang_code_or_name, res in zip(payload.target_languages, results):
        if isinstance(res, Exception):
            continue
        target_code, translated = res
        translations[target_code] = translated

        # Log each translation to user's history
        await history_service.add_entry(
            conn,
            original=payload.text,
            translated=translated,
            source_language=detection.language_code,
            target_language=target_code,
            mode="multi-text",
            user_id=user_id,
        )

    return MultiTranslateResponse(
        original=payload.text,
        translations=translations,
        source_language=detection.language_code,
    )


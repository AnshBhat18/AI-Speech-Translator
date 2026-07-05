"""Translation business logic."""

import logging
from typing import List

from deep_translator import GoogleTranslator
from deep_translator.exceptions import TranslationNotFound

from app.core.exceptions import TranslationError
from app.models.languages import resolve_language_code
from app.models.schemas import BatchTranslateResponse, TranslateResponse

logger = logging.getLogger(__name__)


class TranslationService:
    def translate(
        self,
        text: str,
        target_language: str,
        source_language: str = "auto",
    ) -> str:
        target = resolve_language_code(target_language)
        source = "auto" if source_language in ("auto", "") else resolve_language_code(source_language)

        try:
            result = GoogleTranslator(source=source, target=target).translate(text.strip())
            if not result:
                raise TranslationError("Translation returned empty result")
            return result
        except TranslationNotFound as exc:
            logger.error("Translation not found: %s", exc)
            raise TranslationError(f"Could not translate text: {exc}") from exc
        except Exception as exc:
            logger.exception("Translation failed")
            raise TranslationError(f"Translation service error: {exc}") from exc

    def translate_batch(
        self,
        texts: List[str],
        target_language: str,
        source_language: str = "auto",
    ) -> BatchTranslateResponse:
        results: List[TranslateResponse] = []
        for text in texts:
            if not text.strip():
                continue
            translated = self.translate(text, target_language, source_language)
            results.append(
                TranslateResponse(
                    original=text,
                    translated=translated,
                    source_language=source_language,
                    target_language=resolve_language_code(target_language),
                )
            )
        if not results:
            raise TranslationError("No valid texts to translate")
        return BatchTranslateResponse(results=results)


translation_service = TranslationService()

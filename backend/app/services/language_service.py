"""Language detection service."""

import logging

from langdetect import DetectorFactory, LangDetectException, detect

from app.core.exceptions import AppError
from app.models.languages import get_language_name
from app.models.schemas import LanguageDetectionResponse

DetectorFactory.seed = 0
logger = logging.getLogger(__name__)


class LanguageService:
    def detect(self, text: str) -> LanguageDetectionResponse:
        if not text or not text.strip():
            raise AppError("Text is required for language detection")

        try:
            code = detect(text)
            confidence = "High" if len(text.split()) >= 3 else "Medium" if len(text.split()) >= 1 else "Low"
            return LanguageDetectionResponse(
                language_code=code,
                language_name=get_language_name(code),
                confidence=confidence,
            )
        except LangDetectException as exc:
            logger.warning("Language detection failed: %s", exc)
            return LanguageDetectionResponse(
                language_code="unknown",
                language_name="Unknown",
                confidence="Low",
            )


language_service = LanguageService()

"""Text-to-speech generation using gTTS."""

import io
import logging

from gtts import gTTS

from app.core.exceptions import AppError
from app.models.languages import resolve_language_code

logger = logging.getLogger(__name__)


class TTSService:
    def synthesize(self, text: str, language: str = "en") -> bytes:
        if not text.strip():
            raise AppError("Text is required for speech synthesis")

        lang_code = resolve_language_code(language)
        # gTTS uses zh-CN → zh-cn style; strip region for some langs
        if "-" in lang_code:
            base = lang_code.split("-")[0]
        else:
            base = lang_code

        try:
            tts = gTTS(text=text, lang=base)
            buffer = io.BytesIO()
            tts.write_to_fp(buffer)
            buffer.seek(0)
            return buffer.read()
        except Exception as exc:
            logger.exception("TTS generation failed")
            raise AppError(f"Text-to-speech failed: {exc}") from exc


tts_service = TTSService()

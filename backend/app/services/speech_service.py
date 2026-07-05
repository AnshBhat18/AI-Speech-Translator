"""Speech recognition service for uploaded audio."""

import io
import logging
import wave

import speech_recognition as sr

from app.core.exceptions import SpeechRecognitionError

logger = logging.getLogger(__name__)


class SpeechService:
    def __init__(self) -> None:
        self.recognizer = sr.Recognizer()

    def _bytes_to_audio_data(self, audio_bytes: bytes) -> sr.AudioData:
        try:
            wav_buffer = io.BytesIO(audio_bytes)
            with wave.open(wav_buffer, "rb") as wav_file:
                sample_rate = wav_file.getframerate()
                sample_width = wav_file.getsampwidth()
                frame_data = wav_file.readframes(wav_file.getnframes())
            return sr.AudioData(frame_data, sample_rate, sample_width)
        except Exception as exc:
            logger.error("Failed to parse audio: %s", exc)
            raise SpeechRecognitionError(
                "Could not parse audio file. Please upload WAV format for best results."
            ) from exc

    def recognize(self, audio_bytes: bytes, language: str = "en-US") -> str:
        try:
            audio_data = self._bytes_to_audio_data(audio_bytes)
            text = self.recognizer.recognize_google(audio_data, language=language)
            if not text.strip():
                raise SpeechRecognitionError("No speech detected in audio")
            return text.strip()
        except sr.UnknownValueError as exc:
            raise SpeechRecognitionError("Could not understand audio") from exc
        except sr.RequestError as exc:
            raise SpeechRecognitionError(f"Speech recognition service error: {exc}") from exc
        except SpeechRecognitionError:
            raise
        except Exception as exc:
            logger.exception("Speech recognition failed")
            raise SpeechRecognitionError(str(exc)) from exc


speech_service = SpeechService()

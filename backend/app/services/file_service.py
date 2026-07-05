"""File parsing and OCR text extraction."""

import io
import logging
from pathlib import Path

from app.core.exceptions import AppError
from app.config import get_settings

logger = logging.getLogger(__name__)

try:
    import docx
except ImportError:
    docx = None

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

try:
    from PIL import Image
except ImportError:
    Image = None

try:
    import pytesseract
except ImportError:
    pytesseract = None


class FileService:
    def validate_size(self, size_bytes: int) -> None:
        max_bytes = get_settings().max_upload_size_mb * 1024 * 1024
        if size_bytes > max_bytes:
            raise AppError(
                f"File too large. Maximum size is {get_settings().max_upload_size_mb} MB"
            )

    def extract_text_from_file(self, filename: str, content: bytes) -> str:
        self.validate_size(len(content))
        ext = Path(filename).suffix.lower()

        if ext == ".txt":
            return content.decode("utf-8", errors="ignore")

        if ext == ".docx":
            if docx is None:
                raise AppError("DOCX support not available. Install python-docx.")
            document = docx.Document(io.BytesIO(content))
            paragraphs = [p.text for p in document.paragraphs if p.text.strip()]
            return "\n".join(paragraphs)

        if ext == ".pdf":
            if PdfReader is None:
                raise AppError("PDF support not available. Install pypdf.")
            reader = PdfReader(io.BytesIO(content))
            pages = [page.extract_text() or "" for page in reader.pages]
            return "\n".join(pages)

        raise AppError(f"Unsupported file type: {ext}. Supported: .txt, .docx, .pdf")

    def extract_text_from_image(self, content: bytes) -> str:
        self.validate_size(len(content))

        if Image is None:
            raise AppError("Image support not available. Install Pillow.")

        if pytesseract is None:
            raise AppError(
                "OCR not available. Install pytesseract and Tesseract OCR binary."
            )

        try:
            image = Image.open(io.BytesIO(content))
            text = pytesseract.image_to_string(image)
            cleaned = text.strip()
            if not cleaned:
                raise AppError("No text found in image")
            return cleaned
        except AppError:
            raise
        except Exception as exc:
            logger.exception("OCR failed")
            raise AppError(f"OCR extraction failed: {exc}") from exc


file_service = FileService()

"""Pydantic request/response schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class MessageResponse(BaseModel):
    success: bool = True
    message: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        if not all(c.isalnum() or c == "_" for c in value):
            raise ValueError("Username may only contain letters, numbers, and underscores")
        return value.lower()


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime


class TranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)
    target_language: str = Field(min_length=2, max_length=10)
    source_language: str = "auto"


class BatchTranslateRequest(BaseModel):
    texts: List[str] = Field(min_length=1, max_length=20)
    target_language: str = Field(min_length=2, max_length=10)
    source_language: str = "auto"


class TranslateResponse(BaseModel):
    original: str
    translated: str
    source_language: str
    target_language: str
    confidence: Optional[str] = None


class BatchTranslateResponse(BaseModel):
    results: List[TranslateResponse]


class LanguageDetectionResponse(BaseModel):
    language_code: str
    language_name: str
    confidence: str


class SpeechTranslateResponse(BaseModel):
    recognized_text: str
    translated_text: str
    source_language: str
    target_language: str


class HistoryEntry(BaseModel):
    id: int
    user_id: Optional[int] = None
    original: str
    translated: str
    source_language: str
    target_language: str
    mode: str
    created_at: datetime


class FavoriteEntry(BaseModel):
    id: int
    user_id: int
    original: str
    translated: str
    target_language: str
    created_at: datetime


class FavoriteCreate(BaseModel):
    original: str = Field(min_length=1, max_length=10000)
    translated: str = Field(min_length=1, max_length=10000)
    target_language: str


class AnalyticsResponse(BaseModel):
    total_translations: int
    total_favorites: int
    most_used_language: Optional[str]
    translations_by_language: dict[str, int]
    translations_by_mode: dict[str, int]
    daily_counts: dict[str, int]


class LanguageInfo(BaseModel):
    name: str
    code: str


class MultiTranslateRequest(BaseModel):
    text: str = Field(min_length=1, max_length=10000)
    target_languages: List[str] = Field(min_length=1, max_length=5)
    source_language: str = "auto"


class MultiTranslateResponse(BaseModel):
    original: str
    translations: dict[str, str]
    source_language: str


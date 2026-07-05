"""Supported languages registry."""

LANGUAGES: dict[str, str] = {
    "English": "en",
    "Hindi": "hi",
    "French": "fr",
    "Spanish": "es",
    "German": "de",
    "Japanese": "ja",
    "Chinese": "zh-CN",
    "Arabic": "ar",
    "Russian": "ru",
    "Portuguese": "pt",
    "Italian": "it",
    "Korean": "ko",
    "Dutch": "nl",
    "Turkish": "tr",
    "Polish": "pl",
}

# ISO code → display name lookup
CODE_TO_NAME: dict[str, str] = {code: name for name, code in LANGUAGES.items()}


def get_language_name(code: str) -> str:
    return CODE_TO_NAME.get(code, code)


def resolve_language_code(name_or_code: str) -> str:
    """Accept either display name or ISO code."""
    if name_or_code in LANGUAGES:
        return LANGUAGES[name_or_code]
    normalized = name_or_code.lower()
    for name, code in LANGUAGES.items():
        if code.lower() == normalized:
            return code
    return name_or_code

from langdetect import detect

def detect_language(text):
    """Detects the language of spoken text."""
    lang_code = detect(text)
    return lang_code

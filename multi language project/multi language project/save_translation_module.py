def save_translation(original, translated, language):
    """Saves the translation history to a file."""
    with open("translation_history.txt", "a", encoding="utf-8") as file:
        file.write(f"Original: {original}\nTranslated ({language}): {translated}\n---\n")

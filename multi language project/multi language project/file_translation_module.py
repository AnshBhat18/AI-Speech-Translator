import os

def translate_from_file(filename, target_language):
    """Reads a text file and translates its content."""
    if not os.path.exists(filename):
        print("❌ File not found!")
        return
    
    with open(filename, "r", encoding="utf-8") as file:
        text = file.read()
    
    translated_text = translate_text(text, target_language)
    print(f"📜 Translated Text ({target_language}):", translated_text)
    return translated_text


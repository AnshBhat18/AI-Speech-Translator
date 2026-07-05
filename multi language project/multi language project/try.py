# speech_recognition_module.py
import speech_recognition as sr

def recognize_speech():
    """Recognizes speech from the microphone."""
    recognizer = sr.Recognizer()
    
    with sr.Microphone() as source:
        print("\n🎤 Speak something... (Listening)")
        recognizer.adjust_for_ambient_noise(source)
        audio = recognizer.listen(source)

    try:
        text = recognizer.recognize_google(audio)
        print("✅ Recognized Text:", text)
        return text
    except sr.UnknownValueError:
        print("❌ Could not understand the audio. Try again.")
        return None
    except sr.RequestError:
        print("❌ Could not request results. Check your internet connection.")
        return None

# translation_module.py
from deep_translator import GoogleTranslator

def translate_text(text, target_language):
    """Translates text into the selected language."""
    translated_text = GoogleTranslator(source='auto', target=target_language).translate(text)
    return translated_text

# text_to_speech_module.py
import pyttsx3

def speak_text(text):
    """Speaks out the translated text."""
    engine = pyttsx3.init()
    engine.say(text)
    engine.runAndWait()

# language_detection_module.py
from langdetect import detect

def detect_language(text):
    """Detects the language of spoken text."""
    lang_code = detect(text)
    return lang_code

# file_translation_module.py
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

# save_translation_module.py
def save_translation(original, translated, language):
    """Saves the translation history to a file."""
    with open("translation_history.txt", "a", encoding="utf-8") as file:
        file.write(f"Original: {original}\nTranslated ({language}): {translated}\n---\n")

# main.py
import speech_recognition_module as sr_module
import translation_module as tr_module
import text_to_speech_module as tts_module
import language_detection_module as ld_module
import file_translation_module as ft_module
import save_translation_module as st_module

def main():
    print("🎙️ Speech-to-Text and Translation AI (Modular)")
    print("Available languages (ISO Codes): en, fr, es, de, hi, ja, zh, ru, ar, etc.")
    
    target_language = input("Enter the language code for translation (e.g., 'fr' for French): ").strip().lower()
    mode = input("Choose mode: 'speak' for speech or 'write' for text input: ").strip().lower()
    
    while True:
        if mode == 'speak':
            print("\n🔵 Speak into the microphone... Say 'exit' to stop.\n")
            recognized_text = sr_module.recognize_speech()
        else:
            recognized_text = input("✍️ Enter text to translate (or type 'exit' to quit): ").strip()
        
        if recognized_text:
            if recognized_text.lower() == "exit":
                print("🚪 Exiting program. Have a great day!")
                break
            
            translated_text = tr_module.translate_text(recognized_text, target_language)
            print(f"🌍 Translated Text ({target_language}):", translated_text)
            
            tts_module.speak_text(translated_text)
            st_module.save_translation(recognized_text, translated_text, target_language)

if __name__ == "__main__":
    main()

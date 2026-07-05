import speech_recognition as sr
from deep_translator import GoogleTranslator

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

def translate_text(text, target_language):
    """Translates text into the selected language."""
    translated_text = GoogleTranslator(source='auto', target=target_language).translate(text)
    return translated_text

def main():
    print("🎙️ Speech-to-Text and Translation AI (Loop Mode)")
    print("Available languages (ISO Codes): en, fr, es, de, hi, ja, zh, ru, ar, etc.")
    
    target_language = input("Enter the language code for translation (e.g., 'fr' for French): ").strip().lower()
    print("\n🔵 Speak into the microphone... Say 'exit' to stop.\n")
    
    while True:
        recognized_text = recognize_speech()
        
        if recognized_text:
            if recognized_text.lower() == "exit":
                print("🚪 Exiting program. Have a great day!")
                break
            
            translated_text = translate_text(recognized_text, target_language)
            print(f"🌍 Translated Text ({target_language}):", translated_text)

if __name__ == "__main__":
    main()

import speech_recognition_module as sr_module
import translation_module as tr_module
import text_to_speech_module as tts_module
import language_detection_module as ld_module
import file_translation_module as ft_module
import save_translation_module as st_module

def main():
    print("🎙️ Speech-to-Text and Translation AI (Modular)")
    print("Available languages (ISO Codes): en, fr, es, de, hi, ja, zh, ru, ar, etc.")
    '''en → English
fr → French
es → Spanish
de → German
hi → Hindi
ja → Japanese
zh → Chinese (Mandarin)
ru → Russian
ar → Arabic'''
    target_language = input("Enter the language code for translation (e.g., 'fr' for French): ").strip().lower()
    if not target_language:
        target_language = 'fr'  # default to French
    mode = input("Choose mode: 'speak' for speech or 'write' for text input: ").strip().lower()
    if not mode:
        mode = 'write'  # default to text input
    
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

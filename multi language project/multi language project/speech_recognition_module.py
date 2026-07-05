import speech_recognition as sr

def recognize_speech():
    """Recognizes speech from the microphone. (Simulated)"""
    text = input("🎤 Enter the text to simulate speech: ")
    print("✅ Recognized Text:", text)
    return text

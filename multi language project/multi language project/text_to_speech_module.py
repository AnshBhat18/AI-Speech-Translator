import pyttsx3

def speak_text(text):
    """Speaks out the translated text."""
    engine = pyttsx3.init()
    engine.say(text)
    engine.runAndWait()

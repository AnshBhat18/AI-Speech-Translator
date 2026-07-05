import io
import os
import wave
from datetime import datetime
from pathlib import Path

import pandas as pd
import speech_recognition as sr
import streamlit as st
from deep_translator import GoogleTranslator
from langdetect import detect

try:
    import docx
except Exception:
    docx = None

try:
    from pypdf import PdfReader
except Exception:
    PdfReader = None

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

st.set_page_config(page_title="AI Speech Translator Pro", layout="wide")

languages = {
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
}

if "history" not in st.session_state:
    st.session_state.history = []
if "favorites" not in st.session_state:
    st.session_state.favorites = []
if "dark_mode" not in st.session_state:
    st.session_state.dark_mode = True


def get_language_name(code: str) -> str:
    for name, value in languages.items():
        if value == code:
            return name
    return code


def translate_text(text: str, target: str) -> str:
    return GoogleTranslator(source="auto", target=target).translate(text)


def detect_language(text: str):
    try:
        lang = detect(text)
        confidence = "High" if len(text.split()) >= 2 else "Medium"
        return lang, confidence
    except Exception:
        return "unknown", "Low"


def add_history_entry(original: str, translated: str, source_lang: str, target_lang: str, mode: str = "text"):
    entry = {
        "Time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "Source Language": source_lang,
        "Target Language": target_lang,
        "Original": original,
        "Translated": translated,
        "Mode": mode,
    }
    st.session_state.history.insert(0, entry)


def audio_bytes_to_audio_data(audio_bytes):
    if hasattr(audio_bytes, "getvalue"):
        audio_bytes = audio_bytes.getvalue()
    elif hasattr(audio_bytes, "read"):
        audio_bytes = audio_bytes.read()

    wav_buffer = io.BytesIO(audio_bytes)
    with wave.open(wav_buffer, "rb") as wav_file:
        sample_rate = wav_file.getframerate()
        sample_width = wav_file.getsampwidth()
        frame_data = wav_file.readframes(wav_file.getnframes())
    return sr.AudioData(frame_data, sample_rate, sample_width)


def recognize_audio(audio_bytes, language: str = "en-US"):
    recognizer = sr.Recognizer()
    audio_data = audio_bytes_to_audio_data(audio_bytes)
    text = recognizer.recognize_google(audio_data, language=language)
    return text


def read_uploaded_file(uploaded_file):
    ext = Path(uploaded_file.name).suffix.lower()
    if ext == ".txt":
        return uploaded_file.read().decode("utf-8", errors="ignore")
    if ext == ".docx" and docx is not None:
        doc = docx.Document(uploaded_file)
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    if ext == ".pdf" and PdfReader is not None:
        reader = PdfReader(uploaded_file)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    return None


def make_pdf(content: str, filename: str) -> bytes:
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    text = pdf.beginText(40, 750)
    text.setFont("Helvetica", 10)
    for line in content.splitlines():
        text.textLine(line[:110])
    pdf.drawText(text)
    pdf.save()
    buffer.seek(0)
    return buffer.getvalue()


def sidebar_css():
    st.markdown(
        """
        <style>
        [data-testid="stSidebar"] {background: linear-gradient(180deg, #0f172a, #111827);}
        [data-testid="stAppViewContainer"] {padding-top: 0.5rem;}
        </style>
        """,
        unsafe_allow_html=True,
    )


sidebar_css()

if st.session_state.dark_mode:
    st.markdown(
        """
        <style>
        html, body, [data-testid="stAppViewContainer"] {
            background-color: #0b1120;
            color: #e5eefc;
        }
        .stTextInput > div > div > input,
        .stTextArea > div > div > textarea,
        .stSelectbox > div > div,
        .stFileUploader > div {
            background-color: #111827;
            color: #e5eefc;
        }
        div[data-testid="stMetric"] {
            background: linear-gradient(90deg, #1d4ed8, #7c3aed);
            padding: 12px;
            border-radius: 14px;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

st.sidebar.title("🧭 Navigation")
page = st.sidebar.radio(
    "Go to",
    [
        "Dashboard",
        "Speech Translation",
        "Text Translation",
        "File Translation",
        "Translation History",
        "Analytics",
    ],
)

st.session_state.dark_mode = st.sidebar.checkbox("🌙 Dark mode", value=st.session_state.dark_mode)

if page == "Dashboard":
    st.title("🌍 AI Speech Translator Pro")
    st.caption("Speech • Text • File Translation • Analytics")

    total = len(st.session_state.history)
    favorite_count = len(st.session_state.favorites)
    most_used = "—"
    if st.session_state.history:
        most_used = pd.DataFrame(st.session_state.history)["Target Language"].mode().iloc[0]

    c1, c2, c3 = st.columns(3)
    c1.metric("Total Translations", total)
    c2.metric("Favorites", favorite_count)
    c3.metric("Most Used Language", most_used)

    st.subheader("🕒 Recent Translations")
    if st.session_state.history:
        recent = st.session_state.history[:5]
        for item in recent:
            with st.container(border=True):
                st.write(f"**{item['Original']}**")
                st.write(f"➡️ {item['Translated']}")
                st.caption(f"{item['Mode']} • {item['Time']}")
    else:
        st.info("No translations yet.")

elif page == "Speech Translation":
    st.title("🎤 Speech Translation")
    st.caption("Choose one option below: record audio or upload a file")

    col1, col2 = st.columns(2)
    with col1:
        st.markdown("### 1) Record audio")
        audio_file = st.audio_input("Record or upload audio", key="audio_input")
    with col2:
        st.markdown("### 2) Upload audio file")
        uploaded_audio = st.file_uploader(
            "Upload WAV / MP3 / M4A audio",
            type=["wav", "mp3", "m4a", "ogg", "webm"],
            key="uploaded_audio",
        )

    target = st.selectbox("Select target language", list(languages.keys()), key="speech_target")

    selected_audio = audio_file if audio_file is not None else uploaded_audio

    if selected_audio is not None:
        raw_bytes = selected_audio.getvalue() if hasattr(selected_audio, "getvalue") else selected_audio.read()
        st.audio(raw_bytes, format="audio/wav")

        st.markdown("---")
        if st.button("▶️ Recognize Speech"):
            spoken_text = ""
            with st.spinner("Recognizing speech..."):
                try:
                    spoken_text = recognize_audio(raw_bytes)
                except Exception as e:
                    st.error(f"Could not read audio: {e}")

            if spoken_text:
                st.success(f"Recognized text: {spoken_text}")
                detected_lang, confidence = detect_language(spoken_text)
                st.info(f"Detected Language: {detected_lang}  •  Confidence: {confidence}")
                translated = translate_text(spoken_text, languages[target])

                st.subheader("🌐 Translated Text")
                st.write(translated)

                if st.button("💾 Save this translation"):
                    add_history_entry(
                        spoken_text,
                        translated,
                        detected_lang,
                        target,
                        mode="speech",
                    )
                    st.success("Saved to history")

elif page == "Text Translation":
    st.title("✍️ Text Translation")
    text = st.text_area("Enter text to translate")
    target = st.selectbox("Target language", list(languages.keys()), key="text_target")

    if st.button("Translate") and text.strip():
        source = detect_language(text)
        translated = translate_text(text, languages[target])
        st.success(translated)

        if st.button("⭐ Add to favorites"):
            st.session_state.favorites.append(
                {
                    "Original": text,
                    "Translated": translated,
                    "Target": target,
                }
            )

        add_history_entry(text, translated, source, target, mode="text")

elif page == "File Translation":
    st.title("📂 File Translation")
    uploaded_file = st.file_uploader(
        "Upload a text/docx/pdf file",
        type=["txt", "docx", "pdf"],
    )
    target = st.selectbox("Target language", list(languages.keys()), key="file_target")

    if uploaded_file is not None:
        text = read_uploaded_file(uploaded_file)
        if text:
            st.text_area("File content preview", text, height=250)
            if st.button("Translate file"):
                translated = translate_text(text, languages[target])
                st.subheader("Translated Output")
                st.write(translated)
                add_history_entry(text[:300], translated[:300], "detected", target, mode="file")
        else:
            st.warning("Unsupported file type or could not read file contents.")

elif page == "Translation History":
    st.title("📜 Translation History")
    if st.session_state.history:
        df = pd.DataFrame(st.session_state.history)
        st.dataframe(df, use_container_width=True)
        col1, col2, col3 = st.columns(3)
        with col1:
            st.download_button(
                "Download CSV",
                df.to_csv(index=False),
                file_name="translation_history.csv",
            )
        with col2:
            st.download_button(
                "Download TXT",
                df.to_string(index=False),
                file_name="translation_history.txt",
            )
        with col3:
            pdf_bytes = make_pdf(df.to_string(index=False), "translation_history.pdf")
            st.download_button(
                "Download PDF",
                pdf_bytes,
                file_name="translation_history.pdf",
                mime="application/pdf",
            )
    else:
        st.info("No history available yet.")

elif page == "Analytics":
    st.title("📊 Analytics")
    if st.session_state.history:
        df = pd.DataFrame(st.session_state.history)
        df["Time"] = pd.to_datetime(df["Time"], errors="coerce")
        st.metric("Total translations", len(df))
        st.metric("Most used target language", df["Target Language"].mode().iloc[0])

        daily_counts = df.resample("D", on="Time").size()
        st.line_chart(daily_counts)

        lang_counts = df["Target Language"].value_counts()
        st.bar_chart(lang_counts)
    else:
        st.info("No analytics data yet.")
# AI Speech Translator

An intelligent full-stack multilingual translation platform that converts speech, text, files, and images into different languages in real time. Built with a non-blocking asynchronous FastAPI backend and a modern React frontend.

![Tech Stack](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.12-blue?style=flat&logo=python&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)

## Project Overview

AI Speech Translator Pro helps users translate content across 15+ languages using multiple input modes. The project has been modernized to run fully asynchronously (preventing event-loop blockages in FastAPI) and upgraded with engaging vocabulary review and recording tools.

### Key Capabilities:
- **Text Translation** — single, batch (up to 20 lines), or simultaneous multi-target translation.
- **Speech Translation** — upload WAV/MP3 files or **record voice directly from your microphone** in the browser.
- **File Translation** — translate TXT, DOCX, and PDF documents.
- **OCR Translation** — extract text from images (PNG, JPG, WEBP) and translate (requires Tesseract).
- **Interactive Flashcards** — quiz yourself on saved favorites using a responsive 3D-flipping interface.
- **JWT Authentication** — secure accounts, history logs, favorites synchronization, and progress tracking.

---

## Technical Architecture

```
┌─────────────────────────────────┐     REST API      ┌───────────────────────────────────┐
│         React Frontend          │ ◄───────────────► │          FastAPI Backend          │
│  - Vite + React + TypeScript    │                   │  - Fully Asynchronous (aiosqlite) │
│  - Tailwind CSS + 3D Transforms │                   │  - Chunked File Stream Validation │
│  - Browser Audio Recorder      │                   │  - SlowAPI Rate Limiting          │
└─────────────────────────────────┘                   └───────────────────────────────────┘
```

---

## Features

| Feature | Description | Status |
| :--- | :--- | :--- |
| **Asynchronous Engine** | Refactored database layer to use `aiosqlite` for non-blocking concurrent requests. | **New** |
| **Microphone Recorder** | Record live speech in browser, encode to mono WAV, and translate. | **New** |
| **Vocabulary Flashcards** | Practice saved favorites in an interactive quiz view with 3D flip card animations. | **New** |
| **Multi-Language Translation** | Translate a single input into up to 5 target languages concurrently. | **New** |
| **Stream Validation** | Upload streams are evaluated in chunks (64KB) to abort before memory exhaustion (DoS mitigation). | **New** |
| **Text-to-Speech** | Listen to translated phrases via synthesized audio playback using gTTS. | Existing |
| **JWT Authentication** | Secure passwords hashed with bcrypt, access tokens with expiration controls. | Existing |
| **Analytics Dashboard** | Usage statistics segmented by language, input mode, and daily query frequency. | Existing |

---

## Installation & Setup

### Prerequisites
- Python 3.12+
- Node.js 20+
- (Optional) Tesseract OCR for image character extraction
- (Optional) Docker & Docker Compose

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ai-speech-translator-pro.git
cd ai-speech-translator-pro
```

### 2. Environment Variables
Copy `.env.example` to `.env` in the root folder:
```bash
cp .env.example .env
# Set a strong SECRET_KEY and customize variables
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv

# Activate Virtual Environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install and Run
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Swagger Documentation: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Development Server: [http://localhost:5173](http://localhost:5173)

### 5. Docker Deployment (Recommended for Production)
```bash
docker compose up --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)

---

## API Endpoints

### Authentication
- `POST /api/auth/register` — Create a new account
- `POST /api/auth/login` — Authenticate and receive JWT access token
- `GET /api/auth/me` — Retrieve active user details (Auth header required)

### Translation & Speech
- `POST /api/translate/text` — Translate text to target language
- `POST /api/translate/batch` — Translate multiple phrases
- `POST /api/translate/multi` — Translate text to multiple languages simultaneously
- `POST /api/speech/translate` — Transcribe and translate WAV file/microphone stream
- `POST /api/tts` — Synthesize target translation into MP3 audio
- `POST /api/files/translate` — Upload and translate text/DOCX/PDF document
- `POST /api/ocr/translate` — OCR-extract text from image and translate

### History & Favorites
- `GET /api/history` — Fetch user translation history
- `DELETE /api/history` — Clear active user's translation history
- `GET /api/favorites` — Fetch user favorites
- `POST /api/favorites` — Save a translation to favorites
- `DELETE /api/favorites/{id}` — Remove translation from favorites

---

## Contribution Guidelines

1. Fork this repository and create a branch (`git checkout -b feature/amazing-feature`).
2. Follow existing structures: keep routes in `api/routes`, database services async in `services/`, and styling utility-based.
3. Write non-blocking async operations for database calls.
4. Ensure files are validated in chunks during upload.
5. Create a Pull Request outlining the changes and manual verification tests performed.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

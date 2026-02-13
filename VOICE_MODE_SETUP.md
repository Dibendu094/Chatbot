# Apex Advanced Voice AI Mode - Setup Guide

## 🚀 Overview

Apex now features an **Advanced Real-Time Voice Mode** inspired by GPT-4o. This mode allows for seamless, low-latency bilingual conversations with emotion detection and neural-reactive visuals.

## 🛠️ Features

- **Real-Time Streaming:** WebSocket-based audio/text streaming.
- **Bilingual Support:** Smooth Hindi-English-Hinglish transitions.
- **Reactive Orb:** Fluid UI that responds to voice levels and status.
- **Emotion Detection:** AI adapts its tone based on user emotions.
- **Binaural Audio:** Noise suppression and echo cancellation built-in.

## 📦 Requirements

### Backend

- Groq API Key (for LLM and Whisper STT)
- Deepgram OR ElevenLabs API Key (for TTS)
- Python 3.10+
- Dependencies: `fastapi`, `websockets`, `pydub`, `deepgram-sdk`, `elevenlabs`

### Frontend

- Next.js 14+
- `framer-motion`
- `lucide-react`

## ⚙️ Configuration

1. **Environment Variables:**
   Update `backend/.env`:

   ```env
   GROQ_API_KEY=your_groq_key
   DEEPGRAM_API_KEY=your_deepgram_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   ```

2. **Backend Setup:**

   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🎯 Usage

1. Open the sidebar.
2. Click on the **"Voice Mode (Beta)"** button.
3. Grant microphone permissions.
4. Start talking! Apex will respond in real-time.

## 🧠 Architecture

- **STT:** Groq Whisper Large V3 (Streaming)
- **LLM:** Llama 3.3 70B (Bilingual Optimized)
- **TTS:** ElevenLabs Multi-lingual V2 / Deepgram Aura
- **UI:** Custom Framer Motion orbital visualization

## 🚀 Roadmap

- [ ] Multi-user session isolation.
- [ ] Advanced noise cancellation via RNNoise WASM.
- [ ] Gesture/Camera intensity detection.

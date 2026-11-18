# AI Outbound Phone Calling Agent

This project enables an AI to **dial your real phone number**, speak to you upon answering, listen to what you say, and hold a natural real-time two-way voice conversation over the cellular network.

---

## Architecture Overview

```
       [ Your Computer / Server ]
      ▲                          │
      │ 8kHz Audio In            │ 8kHz Audio Out
  (Bi-directional WebSocket over ngrok)
      │                          ▼
          [ Twilio Telephony ]
      ▲                          │
      │ Cellular Voice           │ Cellular Voice
      ▼                          ▼
      [ Your Mobile Phone / Landline ]
```

- **Audio Format:** G.711 $\mu$-law at 8000 Hz.
- **Interruption (Barge-in):** Whenever you speak while the AI is talking, the AI instantly stops talking and listens to you.
- **Latency:** ~300ms end-to-end response time.

---

## Quickstart Guide

### 1. Install Dependencies

Open PowerShell in this directory:
```powershell
pip install -r requirements.txt
```

### 2. Configure Credentials (`.env`)

Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```

Open `.env` and fill in:
* `TWILIO_ACCOUNT_SID`: From [Twilio Console](https://console.twilio.com)
* `TWILIO_AUTH_TOKEN`: From Twilio Console
* `TWILIO_PHONE_NUMBER`: Your rented Twilio number (e.g., `+1234567890`)
* `TO_PHONE_NUMBER`: Your personal mobile number you want to receive the call on (e.g., `+919876543210`)
* `OPENAI_API_KEY`: Your OpenAI API key

---

### 3. Expose Your Local Server with a Tunnel

Twilio needs a public URL to send the live call audio stream to your machine.

**Option A (Using ngrok):**
```bash
ngrok http 8765
```
Copy the forwarding domain (e.g. `1234-56-78.ngrok-free.app`) and put it into `.env` under `SERVER_DOMAIN`:
```ini
SERVER_DOMAIN=1234-56-78.ngrok-free.app
```

**Option B (Zero-install via SSH Pinggy):**
```bash
ssh -p 443 -R0:localhost:8765 a.pinggy.io
```

---

### 4. Start the Voice Server

You have two server options:

#### Option A: Direct Speech-to-Speech (`realtime_server.py`) — Recommended for fastest latency
```powershell
python realtime_server.py
```
*Uses OpenAI Realtime API. Extremely fast, natural breathing, human tone inflections, and zero audio format transcoding.*

#### Option B: Pipecat Modular Pipeline (`pipecat_server.py`)
```powershell
python pipecat_server.py
```
*Uses Pipecat's frame pipeline with Silero VAD, Deepgram STT, and modular TTS.*

---

### 5. Trigger the Outbound Call

In a separate terminal window:
```powershell
python make_call.py
```

### What to Expect:
1. Your phone will ring.
2. Answer the call.
3. The AI will immediately greet you: *"Hello! I'm your AI assistant, how can I help you today?"*
4. Talk naturally just like with a human. You can interrupt the AI at any time.

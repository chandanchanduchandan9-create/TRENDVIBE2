# Twilio + Gemini Live Real-Time AI Phone Agent Architecture & Restructuring Plan

This implementation plan outlines the full architecture to restructure and integrate the **Twilio + Gemini Live Real-Time AI Phone Agent** into TrendVibe Store, leveraging patterns from production open-source voice architectures (such as Twilio Conversation Relay, Flux Voice Assistant, and VoiceDesk).

> [!IMPORTANT] User Review & Critical Decisions
> - **Real-Time Voice Architecture**: Twilio Media Streams WebSocket endpoint (`/api/twilio/media-stream`) bridging inbound/outbound calls directly to Gemini Live streaming audio protocol.
> - **Source of Truth**: MongoDB is the authoritative database for product catalogue, customer profiles, orders, and call telemetry.
> - **Security & Compliance**: Twilio webhook signature validation (`X-Twilio-Signature`) and 6-digit OTP customer verification before disclosing sensitive order/tracking details.

---

## 1. Overview & Core Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TELEPHONY CARRIER NETWORK                       │
│                     (Twilio Programmable Voice / SIP)                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                        WebSocket / Media Streams
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  EXPRESS BACKEND SERVER (/server.ts)                   │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Twilio Media Streams Handler (`/api/twilio/media-stream`)        │  │
│  │ - Bidirectional 8kHz/16kHz PCM audio streaming                   │  │
│  │ - Session state management & transcript logging                  │  │
│  └────────────────────────────────┬─────────────────────────────────┘  │
│                                   │                                    │
│                                   ▼                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Gemini Live / Flash Multimodal AI Engine (`/server/zyroAi.ts`)  │  │
│  │ - English, हिन्दी (Hindi), and ಕನ್ನಡ (Kannada) support          │  │
│  │ - Google Search Grounding & MongoDB Tool Calling                 │  │
│  └────────────────────────────────┬─────────────────────────────────┘  │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌──────────────┐            ┌──────────────┐            ┌──────────────┐
│   MongoDB    │            │ Razorpay API │            │  Twilio SMS  │
│  Catalogue & │            │   Secure     │            │ OTP & Track  │
│    Orders    │            │   Payments   │            │  Dispatcher  │
└──────────────┘            └──────────────┘            └──────────────┘
```

---

## 2. Key Modules & Restructuring Components

### A. Twilio WebSocket Media Stream Service (`/server/twilioMediaStream.ts`)
- Manages bi-directional audio packets (`audio` payload in base64 mulaw/pcm) between Twilio calls and the Gemini Live API model session.
- Handles barge-in (when the customer interrupts the AI while speaking) by clearing audio buffers instantly.

### B. MongoDB Authoritative Data Engine (`/server/mongodb.ts`)
- Products, inventory, customer profiles, and orders are queried directly from MongoDB collections (`products`, `orders`, `users`, `otps`, `inbound_calls`).

### C. Security & OTP Verification (`/server/otp.ts`)
- Enforces 6-digit OTP verification dispatched via Twilio SMS before Zyro AI reveals sensitive order details, tracking AWB numbers, or recipient addresses.

### D. Multi-Language Voice Support (English, Hindi, Kannada)
- Leverages Gemini Live / Flash multi-lingual speech models with dynamic system prompts and locale instructions.

### E. Admin Call Analytics & Transcripts (`/server/zyroAi.ts` & Frontend Dashboards)
- Logs every call turn, duration, customer phone, resolved product, and outcome into MongoDB for admin review and analytics display.

---

## 3. Implementation Steps

1. **WebSocket Media Stream Handler**: Implement server-side WebSocket upgrade route for Twilio Media Streams.
2. **Gemini Live Multimodal Bridge**: Wire Twilio audio stream into Gemini 3.8 Flash / Live bidirectional socket.
3. **MongoDB Integration**: Ensure all catalogue, order, and OTP queries hit MongoDB collections with robust fallback.
4. **UI & Landing Gate**: Ensure the mandatory authentication landing gate (`LoginGateView`) operates cleanly upon startup, leading into the full e-commerce storefront and AI calling features.

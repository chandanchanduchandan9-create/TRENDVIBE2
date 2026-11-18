"""
realtime_server.py - Direct Speech-to-Speech In-Call AI Server
Bridges Twilio Media Streams (8kHz G.711 mu-law) directly to OpenAI Realtime API.
Provides sub-350ms conversational latency and native barge-in (interruption).
"""

import os
import json
import asyncio
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import Response
import websockets
import uvicorn

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PORT = int(os.getenv("PORT", 8765))

# System prompt defining AI persona for the phone call
SYSTEM_PROMPT = (
    "You are a friendly, concise, and helpful AI assistant making an outbound phone call. "
    "Your responses must be spoken naturally, clear, and kept short (1-2 sentences per turn), "
    "just like in a real telephone conversation. Avoid bullet points, long lists, or markdown symbols. "
    "Start by introducing yourself warmly and asking how you can help today."
)

app = FastAPI()

@app.get("/")
async def root():
    return {"status": "running", "service": "AI Outbound Phone Server"}

@app.api_route("/twiml", methods=["GET", "POST"])
async def get_twiml(request: Request):
    """
    Returns TwiML telling Twilio to connect the call's audio stream to our WebSocket.
    """
    host = request.headers.get("host", "localhost")
    ws_url = f"wss://{host}/media-stream"

    twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="{ws_url}" />
    </Connect>
</Response>"""
    return Response(content=twiml_response, media_type="application/xml")

@app.websocket("/media-stream")
async def handle_media_stream(websocket: WebSocket):
    """
    Handles the bi-directional audio stream between Twilio and OpenAI Realtime API.
    """
    await websocket.accept()
    print("[+] Twilio phone call media stream connected.")

    stream_sid = None
    openai_ws = None

    try:
        # Connect to OpenAI Realtime API (WebSocket)
        openai_url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17"
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "OpenAI-Beta": "realtime=v1"
        }

        async with websockets.connect(openai_url, extra_headers=headers) as openai_ws:
            print("[+] Connected to OpenAI Realtime Voice API.")

            # Configure session for G.711 mu-law (native Twilio phone format)
            session_update = {
                "type": "session.update",
                "session": {
                    "turn_detection": {"type": "server_vad"},
                    "input_audio_format": "g711_ulaw",
                    "output_audio_format": "g711_ulaw",
                    "voice": "alloy",
                    "instructions": SYSTEM_PROMPT,
                    "modalities": ["text", "audio"],
                    "temperature": 0.8
                }
            }
            await openai_ws.send(json.dumps(session_update))

            # Trigger initial greeting when call connects
            initial_greeting = {
                "type": "response.create",
                "response": {
                    "modalities": ["audio", "text"],
                    "instructions": "Greet the user warmly as soon as the call connects and ask how you can help."
                }
            }
            await openai_ws.send(json.dumps(initial_greeting))

            async def receive_from_twilio():
                nonlocal stream_sid
                try:
                    while True:
                        message = await websocket.receive_text()
                        data = json.loads(message)
                        event = data.get("event")

                        if event == "start":
                            stream_sid = data["start"]["streamSid"]
                            print(f"[*] Stream started. Stream SID: {stream_sid}")
                        elif event == "media":
                            # Stream raw mu-law audio chunk directly to OpenAI
                            audio_append = {
                                "type": "input_audio_buffer.append",
                                "audio": data["media"]["payload"]
                            }
                            await openai_ws.send(json.dumps(audio_append))
                        elif event == "stop":
                            print(f"[*] Stream {stream_sid} stopped (call ended).")
                            break
                except Exception as e:
                    print(f"[-] Twilio receive error: {e}")

            async def receive_from_openai():
                try:
                    async for raw_msg in openai_ws:
                        response_data = json.loads(raw_msg)
                        msg_type = response_data.get("type")

                        # AI generated speech chunk -> send to Twilio
                        if msg_type == "response.audio.delta" and "delta" in response_data:
                            if stream_sid:
                                audio_payload = {
                                    "event": "media",
                                    "streamSid": stream_sid,
                                    "media": {"payload": response_data["delta"]}
                                }
                                await websocket.send_text(json.dumps(audio_payload))

                        # User started speaking while AI was talking -> Barge-in interruption
                        elif msg_type == "input_audio_buffer.speech_started":
                            print("[*] User interrupted AI. Clearing Twilio audio buffer...")
                            if stream_sid:
                                clear_payload = {
                                    "event": "clear",
                                    "streamSid": stream_sid
                                }
                                await websocket.send_text(json.dumps(clear_payload))

                except Exception as e:
                    print(f"[-] OpenAI receive error: {e}")

            # Run both streaming loops concurrently
            await asyncio.gather(receive_from_twilio(), receive_from_openai())

    except Exception as e:
        print(f"[-] Error in media stream session: {e}")
    finally:
        print("[*] Media stream closed.")

if __name__ == "__main__":
    print(f"[*] Starting Outbound Voice AI Server on port {PORT}...")
    uvicorn.run(app, host="0.0.0.0", port=PORT)

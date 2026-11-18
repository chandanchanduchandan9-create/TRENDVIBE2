"""
pipecat_server.py - Modular Voice Pipeline In-Call AI Server using Pipecat.
Demonstrates the classic pipeline:
Twilio In -> Silero VAD -> Deepgram STT -> OpenAI LLM -> Cartesia/OpenAI TTS -> Twilio Out.
"""

import os
import sys
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import Response
import uvicorn

load_dotenv()

PORT = int(os.getenv("PORT", 8765))

app = FastAPI()

@app.get("/")
async def root():
    return {"status": "running", "framework": "Pipecat AI"}

@app.api_route("/twiml", methods=["GET", "POST"])
async def get_twiml(request: Request):
    host = request.headers.get("host", "localhost")
    ws_url = f"wss://{host}/pipecat-ws"

    twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="{ws_url}" />
    </Connect>
</Response>"""
    return Response(content=twiml_response, media_type="application/xml")

@app.websocket("/pipecat-ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    try:
        from pipecat.transports.network.fastapi_websocket import (
            FastAPIWebsocketTransport,
            FastAPIWebsocketParams
        )
        from pipecat.serializers.twilio import TwilioFrameSerializer
        from pipecat.audio.vad.silero import SileroVADAnalyzer
        from pipecat.services.deepgram import DeepgramSTTService
        from pipecat.services.openai import OpenAILLMService, OpenAITTSService
        from pipecat.processors.aggregators.llm_response import (
            LLMUserResponseAggregator,
            LLMAssistantResponseAggregator
        )
        from pipecat.pipeline.pipeline import Pipeline
        from pipecat.pipeline.task import PipelineTask, PipelineParams
        from pipecat.pipeline.runner import PipelineRunner
        from pipecat.frames.frames import EndFrame
    except ImportError as e:
        print(f"[!] Pipecat or its submodules are not installed: {e}")
        await websocket.close()
        return

    # Twilio sends 8kHz mu-law audio
    transport = FastAPIWebsocketTransport(
        websocket=websocket,
        params=FastAPIWebsocketParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            add_wav_header=False,
            vad_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
            serializer=TwilioFrameSerializer(stream_sid="")
        )
    )

    # Modular AI services
    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))
    llm = OpenAILLMService(
        api_key=os.getenv("OPENAI_API_KEY"),
        model="gpt-4o-mini"
    )
    tts = OpenAITTSService(
        api_key=os.getenv("OPENAI_API_KEY"),
        voice="alloy"
    )

    user_aggregator = LLMUserResponseAggregator()
    assistant_aggregator = LLMAssistantResponseAggregator()

    pipeline = Pipeline([
        transport.input(),
        stt,
        user_aggregator,
        llm,
        tts,
        transport.output(),
        assistant_aggregator
    ])

    task = PipelineTask(
        pipeline,
        PipelineParams(
            allow_interruptions=True,
            enable_metrics=False
        )
    )

    runner = PipelineRunner()
    await runner.run(task)

if __name__ == "__main__":
    print(f"[*] Starting Pipecat Outbound Voice Server on port {PORT}...")
    uvicorn.run(app, host="0.0.0.0", port=PORT)

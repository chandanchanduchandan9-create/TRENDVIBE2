"""
make_call.py - Initiates an outbound telephone call to your phone.
When answered, Twilio connects the audio directly to your running voice server.
"""

import os
import sys
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
FROM_PHONE = os.getenv("TWILIO_PHONE_NUMBER")
TO_PHONE = os.getenv("TO_PHONE_NUMBER")
SERVER_DOMAIN = os.getenv("SERVER_DOMAIN")

def validate_config():
    missing = []
    if not ACCOUNT_SID or "ACXXX" in ACCOUNT_SID:
        missing.append("TWILIO_ACCOUNT_SID")
    if not AUTH_TOKEN or "your_" in AUTH_TOKEN:
        missing.append("TWILIO_AUTH_TOKEN")
    if not FROM_PHONE:
        missing.append("TWILIO_PHONE_NUMBER")
    if not TO_PHONE:
        missing.append("TO_PHONE_NUMBER")
    if not SERVER_DOMAIN or "your-ngrok" in SERVER_DOMAIN:
        missing.append("SERVER_DOMAIN (must be your active ngrok/tunnel domain)")

    if missing:
        print("[ERROR] Please configure the following in your .env file:")
        for item in missing:
            print(f"  - {item}")
        sys.exit(1)

def trigger_outbound_call():
    validate_config()

    # Twilio will fetch the TwiML from our /twiml endpoint once answered
    twiml_url = f"https://{SERVER_DOMAIN}/twiml"

    print(f"[*] Initializing Twilio client...")
    client = Client(ACCOUNT_SID, AUTH_TOKEN)

    print(f"[*] Dialing {TO_PHONE} from {FROM_PHONE}...")
    print(f"[*] Twilio webhook target: {twiml_url}")

    call = client.calls.create(
        to=TO_PHONE,
        from_=FROM_PHONE,
        url=twiml_url
    )

    print(f"[+] Call initiated successfully!")
    print(f"    Call SID: {call.sid}")
    print(f"    Status:   {call.status}")
    print(f"\nYour phone should ring in a few seconds. Answer and say 'Hello!' to talk to the AI.")

if __name__ == "__main__":
    trigger_outbound_call()

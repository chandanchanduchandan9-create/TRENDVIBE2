"""
agent_server.py - Complete In-Call Conversational AI Server
Uses:
- Telephony: Twilio Media Streams (8kHz G.711 mu-law)
- Speech-to-Text: Deepgram Nova-2 (Live streaming WebSocket)
- Brain (LLM): Google Gemini 3.5 Flash Lite
- Text-to-Speech: Deepgram Aura (8kHz G.711 mu-law)
- Interruption: Native Barge-In (stops talking when you speak)
"""

import os
import sys
import json
import time
import base64
import asyncio
import urllib.request
from datetime import datetime
from contextlib import asynccontextmanager
import aiohttp
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.responses import Response, FileResponse
from pydantic import BaseModel
from twilio.rest import Client as TwilioClient
import websockets
import uvicorn

# Ensure real-time terminal output without buffering
sys.stdout.reconfigure(line_buffering=True)

load_dotenv()

PORT = int(os.getenv("PORT", 8765))
DEEPGRAM_KEY = os.getenv("DEEPGRAM_API_KEY")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
SERVER_DOMAIN = os.getenv("SERVER_DOMAIN", "localhost:8000")

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
TO_PHONE_NUMBER = os.getenv("TO_PHONE_NUMBER")

SHOPIFY_SHOP = os.getenv("SHOPIFY_SHOP", "7wu5j4-ke.myshopify.com")
SHOPIFY_CLIENT_ID = os.getenv("SHOPIFY_CLIENT_ID")
SHOPIFY_CLIENT_SECRET = os.getenv("SHOPIFY_CLIENT_SECRET")
SHOPIFY_ACCESS_TOKEN = os.getenv("SHOPIFY_ACCESS_TOKEN")

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
LOCAL_PRODUCTS_PATH = os.path.join(os.path.dirname(__file__), "products.json")

# Live dashboard & session state
DASHBOARD_CLIENTS = set()
CALL_CONTEXTS = {}
CALL_HISTORY = []
HTTP_SESSION = None


def get_active_domain() -> tuple[str, bool]:
    """Detects live ngrok HTTPS tunnel URL from local ngrok API if active, else returns SERVER_DOMAIN."""
    try:
        with urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels", timeout=0.6) as resp:
            data = json.loads(resp.read().decode())
            for t in data.get("tunnels", []):
                pub = t.get("public_url", "")
                if pub.startswith("https://"):
                    return pub.replace("https://", "").rstrip("/"), True
    except Exception:
        pass
    return SERVER_DOMAIN, False


async def broadcast_dashboard(event: dict):
    """Pushes real-time call and transcript events to open browser dashboards."""
    if not DASHBOARD_CLIENTS:
        return
    msg = json.dumps(event)
    dead = []
    for ws in list(DASHBOARD_CLIENTS):
        try:
            await ws.send_text(msg)
        except Exception:
            dead.append(ws)
    for ws in dead:
        DASHBOARD_CLIENTS.discard(ws)

CURRENCY_SPOKEN_MAP = {
    "INR": "rupees",
    "USD": "dollars",
    "EUR": "euros",
    "GBP": "pounds",
    "CAD": "Canadian dollars",
    "AUD": "Australian dollars",
}

# In-memory store metadata & products cache
CACHED_PRODUCTS = []
PRODUCTS_SOURCE = "none"
SHOPIFY_LIVE_COUNT = 0
STORE_CURRENCY = "INR"
STORE_DISPLAY_NAME = SHOPIFY_SHOP.split(".")[0].replace("-", " ")
SHOPIFY_GRANTED_SCOPES = []


def refresh_shopify_scopes() -> list:
    """Checks granted OAuth scopes for the current Shopify token."""
    global SHOPIFY_GRANTED_SCOPES
    token = os.getenv("SHOPIFY_ACCESS_TOKEN") or SHOPIFY_ACCESS_TOKEN
    shop = os.getenv("SHOPIFY_SHOP") or SHOPIFY_SHOP
    if not token or not shop:
        SHOPIFY_GRANTED_SCOPES = []
        return []
    req = urllib.request.Request(
        f"https://{shop}/admin/oauth/access_scopes.json",
        headers={"X-Shopify-Access-Token": token}
    )
    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode())
            SHOPIFY_GRANTED_SCOPES = [s["handle"] for s in data.get("access_scopes", [])]
    except Exception as e:
        print(f"[*] Could not read access scopes: {e}")
    return SHOPIFY_GRANTED_SCOPES


def format_spoken_price(price_val, currency_code: str) -> str:
    currency_word = CURRENCY_SPOKEN_MAP.get(currency_code.upper(), currency_code)
    try:
        num = float(price_val)
        if num.is_integer():
            return f"{int(num)} {currency_word}"
        return f"{num:.2f} {currency_word}"
    except Exception:
        return f"{price_val} {currency_word}"


def load_local_products(currency_code: str) -> list:
    """Loads products from local products.json fallback when Shopify store has 0 products."""
    if not os.path.exists(LOCAL_PRODUCTS_PATH):
        return []
    try:
        with open(LOCAL_PRODUCTS_PATH, "r", encoding="utf-8") as f:
            items = json.load(f)
        parsed = []
        for item in items:
            item_curr = item.get("currency", currency_code)
            variants = item.get("variants") or []
            if isinstance(variants, list):
                variants_str = ", ".join(str(v) for v in variants)
            else:
                variants_str = str(variants)
            parsed.append({
                "title": item.get("title", ""),
                "price": format_spoken_price(item.get("price", "0"), item_curr),
                "stock": item.get("stock", "In stock"),
                "description": item.get("description", ""),
                "variants": variants_str,
            })
        return parsed
    except Exception as e:
        print(f"[-] Could not load local products.json: {e}")
        return []


def fetch_shopify_products():
    """Fetches store metadata and real-time products from Shopify Admin API (with local products.json fallback)."""
    global CACHED_PRODUCTS, PRODUCTS_SOURCE, SHOPIFY_LIVE_COUNT, STORE_CURRENCY, STORE_DISPLAY_NAME
    token = os.getenv("SHOPIFY_ACCESS_TOKEN") or SHOPIFY_ACCESS_TOKEN
    shop = os.getenv("SHOPIFY_SHOP") or SHOPIFY_SHOP
    if not token or not shop:
        print("[*] No Shopify access token yet. Checking local catalog.")
        local_items = load_local_products(STORE_CURRENCY)
        if local_items:
            CACHED_PRODUCTS = local_items
            PRODUCTS_SOURCE = "local_products.json"
        return

    import re
    headers = {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json"
    }

    # Fetch store currency and display name
    try:
        shop_req = urllib.request.Request(f"https://{shop}/admin/api/2024-01/shop.json", headers=headers)
        with urllib.request.urlopen(shop_req, timeout=6) as sresp:
            shop_info = json.loads(sresp.read().decode()).get("shop", {})
            if shop_info.get("currency"):
                STORE_CURRENCY = shop_info["currency"]
            api_name = (shop_info.get("name") or "").strip()
            if api_name and api_name.lower() != "my store":
                STORE_DISPLAY_NAME = api_name
            else:
                STORE_DISPLAY_NAME = shop.split(".")[0].replace("-", " ")
    except Exception as e:
        print(f"[*] Could not fetch shop.json metadata: {e}")

    url = f"https://{shop}/admin/api/2024-01/products.json?limit=20&status=active"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode())
            products = data.get("products", [])
            SHOPIFY_LIVE_COUNT = len(products)
            parsed = []
            for p in products:
                title = p.get("title", "")
                raw_desc = p.get("body_html") or ""
                clean_desc = re.sub(r'<[^>]+>', ' ', raw_desc).strip()
                clean_desc = re.sub(r'\s+', ' ', clean_desc)[:200]
                variants = p.get("variants", [])
                pos_prices = sorted({float(v["price"]) for v in variants if v.get("price") and float(v["price"]) > 0})
                if pos_prices:
                    min_p, max_p = pos_prices[0], pos_prices[-1]
                    if min_p == max_p:
                        price_text = format_spoken_price(min_p, STORE_CURRENCY)
                    else:
                        currency_word = CURRENCY_SPOKEN_MAP.get(STORE_CURRENCY.upper(), STORE_CURRENCY)
                        min_str = f"{int(min_p)}" if min_p.is_integer() else f"{min_p:.2f}"
                        max_str = f"{int(max_p)}" if max_p.is_integer() else f"{max_p:.2f}"
                        price_text = f"from {min_str} to {max_str} {currency_word}"
                else:
                    price = variants[0].get("price", "N/A") if variants else "N/A"
                    price_text = format_spoken_price(price, STORE_CURRENCY)
                tracked = any(v.get("inventory_management") is not None for v in variants)
                total_inv = sum((v.get("inventory_quantity") or 0) for v in variants)
                if total_inv > 0:
                    stock_status = f"{total_inv} in stock"
                elif not tracked:
                    stock_status = "In stock"
                else:
                    stock_status = "Out of stock"
                option_summaries = []
                for opt in p.get("options", []):
                    vals = [val for val in (opt.get("values") or []) if val and val != "Default Title"]
                    if not vals:
                        continue
                    shown = ", ".join(vals[:8]) + (f" (plus {len(vals) - 8} more)" if len(vals) > 8 else "")
                    option_summaries.append(f"{opt.get('name')}: {shown}")
                if not option_summaries:
                    variant_names = [v.get("title") for v in variants if v.get("title") and v.get("title") != "Default Title"]
                    variants_summary = ", ".join(variant_names[:10])
                else:
                    variants_summary = "; ".join(option_summaries)
                parsed.append({
                    "title": title,
                    "price": price_text,
                    "stock": stock_status,
                    "description": clean_desc,
                    "variants": variants_summary
                })
            if parsed:
                CACHED_PRODUCTS = parsed
                PRODUCTS_SOURCE = "shopify"
                print(f"[+] Successfully loaded {len(CACHED_PRODUCTS)} live products from Shopify store ({shop}) [{STORE_CURRENCY}]!")
            else:
                local_items = load_local_products(STORE_CURRENCY)
                if local_items:
                    CACHED_PRODUCTS = local_items
                    PRODUCTS_SOURCE = "local_products.json"
                    print(f"[*] Shopify store ({shop}) has 0 active products. Loaded {len(CACHED_PRODUCTS)} products from local products.json!")
                else:
                    CACHED_PRODUCTS = []
                    PRODUCTS_SOURCE = "default_fallback"
                    print(f"[*] Shopify store ({shop}) has 0 active products.")
    except Exception as e:
        print(f"[-] Could not fetch Shopify products: {e}")
        local_items = load_local_products(STORE_CURRENCY)
        if local_items and not CACHED_PRODUCTS:
            CACHED_PRODUCTS = local_items
            PRODUCTS_SOURCE = "local_products.json"

# Initial product fetch & scope check
fetch_shopify_products()
refresh_shopify_scopes()

def build_system_prompt(call_ctx: dict = None) -> str:
    """Builds an informed, voice-optimized prompt with current product catalog."""
    if CACHED_PRODUCTS:
        catalog_lines = []
        for p in CACHED_PRODUCTS:
            line = f"- {p['title']}: {p['price']} ({p['stock']})"
            if p.get("variants"):
                line += f" | Options: {p['variants']}"
            if p.get("description"):
                line += f" | Details: {p['description']}"
            catalog_lines.append(line)
        catalog_text = "\n".join(catalog_lines)
    else:
        catalog_text = (
            "- Hydrating Facial Cleanser: 24 dollars (In Stock)\n"
            "- Vitamin C Glow Serum: 38 dollars (In Stock)\n"
            "- Barrier Repair Moisturizer: 32 dollars (Low Stock)"
        )

    free_shipping_threshold = "999 rupees" if STORE_CURRENCY == "INR" else "50 dollars"

    ctx_note = ""
    if call_ctx:
        cname = (call_ctx.get("customer_name") or "").strip()
        purpose = (call_ctx.get("purpose") or "").strip()
        if cname:
            ctx_note += f"\nCALLER NAME: {cname}\n"
        if purpose == "promo":
            ctx_note += "CALL GOAL: Highlight our seasonal offer and free shipping over the threshold.\n"
        elif purpose == "followup":
            ctx_note += "CALL GOAL: Check in on the customer's recent interest and help them choose color or size.\n"

    return (
        f"You are a friendly, concise, and helpful sales assistant calling on behalf of our online store '{STORE_DISPLAY_NAME}' ({SHOPIFY_SHOP}). "
        "You are having a live voice phone call with a customer.\n\n"
        f"{ctx_note}"
        f"CURRENT PRODUCTS & PRICING:\n{catalog_text}\n\n"
        "STORE POLICIES:\n"
        f"- Free shipping on orders over {free_shipping_threshold}.\n"
        "- 30-day money-back guarantee.\n\n"
        "STRICT CONVERSATIONAL VOICE RULES:\n"
        "1. Speak naturally and keep answers short (1 to 2 sentences max) so it sounds like a real phone conversation.\n"
        "2. Suggest products based on what the caller asks about, mentioning price and benefits.\n"
        "3. NEVER use bullet points, asterisks, emoji, or markdown because your words are spoken aloud.\n"
        "4. Always end with a short question to keep the dialogue natural."
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    global HTTP_SESSION
    HTTP_SESSION = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15))
    try:
        yield
    finally:
        if HTTP_SESSION and not HTTP_SESSION.closed:
            await HTTP_SESSION.close()


app = FastAPI(title="Outbound Voice AI Agent", lifespan=lifespan)


class CallRequest(BaseModel):
    to_number: str
    customer_name: str = ""
    purpose: str = "sales"


class ShopifyProductRequest(BaseModel):
    title: str
    price: str
    description: str = ""
    product_type: str = "Apparel"
    vendor: str = "TrendRaj"
    option_name: str = "Size"
    options: str = "M, L, XL"
    inventory_qty: int = 20


@app.get("/")
async def root():
    """Serves the standalone live demo web dashboard."""
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path, headers={"Cache-Control": "no-store"})
    return {
        "status": "online",
        "stt": "Deepgram Nova-2 (8kHz mu-law)",
        "llm": "Gemini 3.5 Flash Lite",
        "tts": "Deepgram Aura (8kHz mu-law)"
    }


@app.get("/health")
async def health():
    active_domain, tunnel_online = await asyncio.to_thread(get_active_domain)
    return {
        "status": "online",
        "store": SHOPIFY_SHOP,
        "currency": STORE_CURRENCY,
        "product_count": len(CACHED_PRODUCTS),
        "active_domain": active_domain,
        "tunnel_online": tunnel_online,
        "stt": "Deepgram Nova-2 (8kHz mu-law)",
        "llm": "Gemini 3.5 Flash Lite",
        "tts": "Deepgram Aura (8kHz mu-law)"
    }


@app.get("/api/config")
async def get_api_config():
    active_domain, tunnel_online = await asyncio.to_thread(get_active_domain)
    return {
        "store": SHOPIFY_SHOP,
        "display_name": STORE_DISPLAY_NAME,
        "currency": STORE_CURRENCY,
        "from_number": TWILIO_PHONE_NUMBER or "",
        "default_to_number": TO_PHONE_NUMBER or "",
        "active_domain": active_domain,
        "tunnel_online": tunnel_online,
        "shopify_connected": bool(os.getenv("SHOPIFY_ACCESS_TOKEN") or SHOPIFY_ACCESS_TOKEN),
        "shopify_scopes": SHOPIFY_GRANTED_SCOPES,
        "shopify_write_enabled": "write_products" in SHOPIFY_GRANTED_SCOPES,
        "shopify_orders_write_enabled": "write_orders" in SHOPIFY_GRANTED_SCOPES,
    }


@app.get("/api/calls")
async def get_call_history():
    return {"calls": CALL_HISTORY[:20]}


@app.post("/api/call")
async def start_outbound_call(req: CallRequest):
    to_number = req.to_number.strip()
    if not to_number.startswith("+"):
        digits = "".join(c for c in to_number if c.isdigit())
        if len(digits) == 10:
            to_number = f"+91{digits}"
        elif digits:
            to_number = f"+{digits}"

    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_PHONE_NUMBER:
        raise HTTPException(status_code=500, detail="Twilio credentials missing in .env")

    active_domain, _ = await asyncio.to_thread(get_active_domain)
    twiml_url = f"https://{active_domain}/twiml"

    def _dial():
        client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        return client.calls.create(
            to=to_number,
            from_=TWILIO_PHONE_NUMBER,
            url=twiml_url
        )

    try:
        call = await asyncio.to_thread(_dial)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    CALL_CONTEXTS[call.sid] = {
        "to_number": to_number,
        "customer_name": req.customer_name.strip(),
        "purpose": req.purpose.strip() or "sales",
    }

    return {
        "call_sid": call.sid,
        "status": call.status,
        "to_number": to_number,
        "from_number": TWILIO_PHONE_NUMBER,
        "twiml_url": twiml_url,
    }


@app.get("/api/call-status/{call_sid}")
async def get_call_status(call_sid: str):
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        raise HTTPException(status_code=500, detail="Twilio credentials missing")

    def _fetch():
        client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        return client.calls(call_sid).fetch()

    try:
        c = await asyncio.to_thread(_fetch)
        return {
            "call_sid": c.sid,
            "status": c.status,
            "duration": c.duration or "0",
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/call/{call_sid}/hangup")
async def hangup_call(call_sid: str):
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        raise HTTPException(status_code=500, detail="Twilio credentials missing")

    def _end():
        client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        return client.calls(call_sid).update(status="completed")

    try:
        c = await asyncio.to_thread(_end)
        return {"call_sid": c.sid, "status": c.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket):
    await websocket.accept()
    DASHBOARD_CLIENTS.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        DASHBOARD_CLIENTS.discard(websocket)


@app.get("/shopify/refresh")
async def refresh_shopify():
    """Manually refreshes the product catalog from Shopify (or local products.json fallback)."""
    await asyncio.to_thread(fetch_shopify_products)
    await broadcast_dashboard({"type": "products_updated"})
    return {
        "status": "refreshed",
        "store": SHOPIFY_SHOP,
        "currency": STORE_CURRENCY,
        "source": PRODUCTS_SOURCE,
        "shopify_live_count": SHOPIFY_LIVE_COUNT,
        "product_count": len(CACHED_PRODUCTS),
        "products": CACHED_PRODUCTS
    }


@app.get("/shopify/products")
async def get_products():
    """Returns current active products in the AI memory."""
    return {
        "store": SHOPIFY_SHOP,
        "currency": STORE_CURRENCY,
        "source": PRODUCTS_SOURCE,
        "shopify_live_count": SHOPIFY_LIVE_COUNT,
        "count": len(CACHED_PRODUCTS),
        "products": CACHED_PRODUCTS
    }


@app.post("/api/shopify/products")
async def create_shopify_product(item: ShopifyProductRequest):
    """Creates a live active product in Shopify Admin if write_products is granted."""
    token = os.getenv("SHOPIFY_ACCESS_TOKEN") or SHOPIFY_ACCESS_TOKEN
    shop = os.getenv("SHOPIFY_SHOP") or SHOPIFY_SHOP
    if not token:
        raise HTTPException(status_code=400, detail="Shopify is not connected.")

    scopes = await asyncio.to_thread(refresh_shopify_scopes)
    if "write_products" not in scopes:
        raise HTTPException(
            status_code=403,
            detail="Shopify token lacks 'write_products'. Click 'Authorize Write Access' to grant it."
        )

    vals = [v.strip() for v in item.options.split(",") if v.strip()] or ["Default"]
    qty_per_var = max(1, item.inventory_qty // len(vals))
    sku_base = "".join(c for c in item.title.upper() if c.isalnum())[:6] or "ITEM"

    variants = [
        {
            "option1": val,
            "price": str(item.price),
            "sku": f"TR-{sku_base}-{idx:02d}",
            "inventory_management": "shopify",
            "inventory_quantity": qty_per_var,
        }
        for idx, val in enumerate(vals, start=1)
    ]

    payload = {
        "product": {
            "title": item.title.strip(),
            "body_html": f"<p>{item.description.strip()}</p>" if item.description.strip() else "",
            "vendor": item.vendor.strip() or "TrendRaj",
            "product_type": item.product_type.strip() or "General",
            "status": "active",
            "options": [{"name": item.option_name.strip() or "Option"}],
            "variants": variants,
        }
    }

    def _create():
        req = urllib.request.Request(
            f"https://{shop}/admin/api/2024-01/products.json",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "X-Shopify-Access-Token": token,
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode())

    try:
        res = await asyncio.to_thread(_create)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    await asyncio.to_thread(fetch_shopify_products)
    await broadcast_dashboard({"type": "products_updated"})
    created = res.get("product", {})
    return {
        "status": "created",
        "id": created.get("id"),
        "title": created.get("title"),
        "product_count": len(CACHED_PRODUCTS),
    }


@app.post("/api/shopify/import-samples")
async def import_sample_products():
    """Imports sample products from local products.json into Shopify Admin."""
    token = os.getenv("SHOPIFY_ACCESS_TOKEN") or SHOPIFY_ACCESS_TOKEN
    shop = os.getenv("SHOPIFY_SHOP") or SHOPIFY_SHOP
    if not token or not os.path.exists(LOCAL_PRODUCTS_PATH):
        raise HTTPException(status_code=400, detail="Missing Shopify token or products.json.")

    scopes = await asyncio.to_thread(refresh_shopify_scopes)
    if "write_products" not in scopes:
        raise HTTPException(
            status_code=403,
            detail="Shopify token lacks 'write_products'. Click 'Authorize Write Access' first."
        )

    def _sync_samples():
        headers = {"X-Shopify-Access-Token": token, "Content-Type": "application/json"}
        req_ex = urllib.request.Request(
            f"https://{shop}/admin/api/2024-01/products.json?limit=250&status=any",
            headers=headers
        )
        with urllib.request.urlopen(req_ex, timeout=10) as r:
            existing = json.loads(r.read().decode()).get("products", [])
        ex_handles = {p.get("handle") for p in existing}
        ex_titles = {p.get("title", "").lower() for p in existing}

        with open(LOCAL_PRODUCTS_PATH, "r", encoding="utf-8") as f:
            items = json.load(f)

        created_titles, skipped_titles = [], []
        for p_idx, item in enumerate(items, start=1):
            handle = item.get("handle") or f"product-{p_idx}"
            title = item.get("title", "")
            if handle in ex_handles or title.lower() in ex_titles:
                skipped_titles.append(title)
                continue
            vals = item.get("variants") or ["Default"]
            qty = max(1, int(item.get("inventory_qty", 15)) // len(vals))
            parts = [w for w in handle.split("-") if w != "trendraj"]
            sku_prefix = ("TR-" + "".join(w[:3].upper() for w in parts[:2])) or f"TR-{p_idx:02d}"
            variants_payload = [
                {
                    "option1": str(v),
                    "price": str(item.get("price", "0")),
                    "sku": f"{sku_prefix}-{idx:02d}",
                    "inventory_management": "shopify",
                    "inventory_quantity": qty,
                }
                for idx, v in enumerate(vals, start=1)
            ]
            body = {
                "product": {
                    "title": title,
                    "handle": handle,
                    "body_html": f"<p>{item.get('description', '')}</p>",
                    "vendor": item.get("vendor", "TrendRaj"),
                    "product_type": item.get("type", "General"),
                    "tags": item.get("tags", ""),
                    "status": "active",
                    "options": [{"name": item.get("option_name", "Option")}],
                    "variants": variants_payload,
                }
            }
            req_c = urllib.request.Request(
                f"https://{shop}/admin/api/2024-01/products.json",
                data=json.dumps(body).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req_c, timeout=10) as rc:
                created_titles.append(json.loads(rc.read().decode())["product"]["title"])
        return created_titles, skipped_titles

    try:
        created_titles, skipped_titles = await asyncio.to_thread(_sync_samples)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    await asyncio.to_thread(fetch_shopify_products)
    await broadcast_dashboard({"type": "products_updated"})
    return {
        "status": "done",
        "created": created_titles,
        "skipped": skipped_titles,
        "product_count": len(CACHED_PRODUCTS),
    }


@app.get("/auth/install")
async def shopify_install(write: bool = True):
    """Generates the Shopify OAuth installation redirect URL."""
    active_domain, _ = await asyncio.to_thread(get_active_domain)
    scopes = "read_products,write_products,read_orders,write_orders" if write else "read_products,read_orders"
    auth_url = (
        f"https://{SHOPIFY_SHOP}/admin/oauth/authorize?"
        f"client_id={SHOPIFY_CLIENT_ID}&"
        f"scope={scopes}&"
        f"redirect_uri=https://{active_domain}/auth/callback"
    )
    from fastapi.responses import RedirectResponse
    return RedirectResponse(auth_url)


@app.get("/auth/callback")
async def shopify_callback(code: str, shop: str = SHOPIFY_SHOP):
    """Exchanges OAuth code for permanent Shopify Admin API access token."""
    global SHOPIFY_ACCESS_TOKEN
    token_url = f"https://{shop}/admin/oauth/access_token"
    payload = {
        "client_id": SHOPIFY_CLIENT_ID,
        "client_secret": SHOPIFY_CLIENT_SECRET,
        "code": code
    }
    req = urllib.request.Request(
        token_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            token = data.get("access_token")
            if token:
                SHOPIFY_ACCESS_TOKEN = token
                os.environ["SHOPIFY_ACCESS_TOKEN"] = token
                # Save token to .env for persistence
                env_path = os.path.join(os.path.dirname(__file__), ".env")
                if os.path.exists(env_path):
                    with open(env_path, "r") as ef:
                        content = ef.read()
                    if "SHOPIFY_ACCESS_TOKEN=" in content:
                        import re
                        content = re.sub(r"SHOPIFY_ACCESS_TOKEN=.*", f"SHOPIFY_ACCESS_TOKEN={token}", content)
                    else:
                        content += f"\nSHOPIFY_ACCESS_TOKEN={token}\n"
                    with open(env_path, "w") as ef:
                        ef.write(content)

                print(f"[+] Shopify Access Token obtained: {token[:10]}... Saved to .env!")
                fetch_shopify_products()
                refresh_shopify_scopes()
                await broadcast_dashboard({"type": "products_updated"})
                from fastapi.responses import HTMLResponse
                return HTMLResponse(
                    f"<h2>✅ Shopify Store Connected Successfully!</h2>"
                    f"<p>Connected to <b>{shop}</b>.</p>"
                    f"<p>Granted Scopes: <code>{', '.join(SHOPIFY_GRANTED_SCOPES)}</code></p>"
                    f"<p>Loaded <b>{SHOPIFY_LIVE_COUNT}</b> live Shopify products (<b>{len(CACHED_PRODUCTS)}</b> active in AI memory from <code>{PRODUCTS_SOURCE}</code>).</p>"
                    f"<p><a href='/'>Return to AI Voice Dashboard</a></p>"
                )
    except Exception as e:
        print(f"[-] Token exchange error: {e}")
        return {"error": str(e)}


@app.api_route("/twiml", methods=["GET", "POST"])
async def get_twiml(request: Request):
    """
    Returns TwiML telling Twilio to connect this call to our WebSocket stream.
    Only refreshes catalog if empty to avoid network contention during call setup.
    """
    if not CACHED_PRODUCTS:
        asyncio.create_task(asyncio.to_thread(fetch_shopify_products))
    host = request.headers.get("host", "localhost")
    ws_url = f"wss://{host}/media-stream"
    print(f"[*] Twilio requested /twiml. Returning Stream url: {ws_url}")

    twiml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>Connecting to your A I assistant.</Say>
    <Connect>
        <Stream url="{ws_url}" />
    </Connect>
    <Pause length="60" />
</Response>"""
    return Response(content=twiml_response, media_type="application/xml")


async def generate_llm_reply_async(history: list, call_ctx: dict = None) -> tuple[str, int]:
    """Queries Gemini 3.5 Flash Lite asynchronously with persistent HTTP session & retry."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={GEMINI_KEY}"
    payload = {
        "system_instruction": {"parts": [{"text": build_system_prompt(call_ctx)}]},
        "contents": history,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 90
        }
    }
    t0 = time.monotonic()
    for attempt in range(2):
        try:
            async with HTTP_SESSION.post(
                url,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=12)
            ) as resp:
                data = await resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                elapsed_ms = int((time.monotonic() - t0) * 1000)
                return text, elapsed_ms
        except asyncio.CancelledError:
            raise
        except Exception as e:
            if attempt == 0:
                print(f"[*] LLM retry after transient error: {e}")
                continue
            print(f"[-] LLM Error: {e}")
            return "Sorry, could you repeat that quickly?", int((time.monotonic() - t0) * 1000)


async def synthesize_speech_deepgram_async(text: str) -> bytes:
    """Generates 8kHz mu-law audio asynchronously using Deepgram Aura TTS."""
    url = "https://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=mulaw&sample_rate=8000"
    headers = {
        "Authorization": f"Token {DEEPGRAM_KEY}",
        "Content-Type": "application/json"
    }
    try:
        async with HTTP_SESSION.post(
            url,
            json={"text": text},
            headers=headers,
            timeout=aiohttp.ClientTimeout(total=10)
        ) as resp:
            if resp.status == 200:
                return await resp.read()
            print(f"[-] TTS HTTP {resp.status}: {await resp.text()}")
            return b""
    except asyncio.CancelledError:
        raise
    except Exception as e:
        print(f"[-] TTS Error: {e}")
        return b""


@app.websocket("/media-stream")
async def handle_media_stream(websocket: WebSocket):
    await websocket.accept()
    print("\n[+] Phone call connected! Initializing live audio pipeline...")

    stream_sid = None
    call_sid = None
    call_ctx = {}
    session_turns = []
    conversation_history = []
    current_playback_task = None
    current_response_task = None
    pending_flush_task = None
    pending_utterance_parts = []
    last_final_norm = ""
    last_final_time = 0.0
    turn_seq = 0
    is_ai_speaking = False
    is_call_active = True

    # Deepgram Live Transcription WebSocket URL (accepts raw 8kHz mulaw audio)
    dg_url = (
        "wss://api.deepgram.com/v1/listen?"
        "encoding=mulaw&sample_rate=8000&channels=1&model=nova-2&punctuate=true&endpointing=350"
    )

    dg_ws = None
    for attempt in range(1, 4):
        try:
            dg_ws = await websockets.connect(
                dg_url,
                additional_headers={"Authorization": f"Token {DEEPGRAM_KEY}"},
                proxy=None,
                open_timeout=8
            )
            print("[+] Connected to Deepgram Nova-2 Speech-to-Text.")
            break
        except Exception as e:
            print(f"[*] Deepgram connection attempt {attempt}/3 failed ({e}), retrying...")
            await asyncio.sleep(0.5)

    if not dg_ws:
        print("[-] Could not connect to Deepgram STT after 3 attempts.")
        return

    try:

            async def play_audio_to_phone(audio_bytes: bytes):
                """Streams 8kHz mu-law audio to Twilio in small chunks (barge-in interruptible)."""
                nonlocal is_ai_speaking
                if not stream_sid or not audio_bytes or not is_call_active:
                    return

                is_ai_speaking = True
                chunk_size = 320  # 40ms of 8kHz audio
                try:
                    for i in range(0, len(audio_bytes), chunk_size):
                        if not is_ai_speaking or not is_call_active:
                            break
                        chunk = audio_bytes[i:i + chunk_size]
                        payload = base64.b64encode(chunk).decode("utf-8")
                        await websocket.send_text(json.dumps({
                            "event": "media",
                            "streamSid": stream_sid,
                            "media": {"payload": payload}
                        }))
                        await asyncio.sleep(0.038)
                except asyncio.CancelledError:
                    pass
                except Exception:
                    pass
                finally:
                    is_ai_speaking = False

            async def trigger_ai_response(user_text: str, seq_id: int):
                nonlocal current_playback_task
                if not is_call_active or seq_id != turn_seq:
                    return

                print(f"[Caller]: {user_text}")
                session_turns.append({"role": "user", "text": user_text})
                await broadcast_dashboard({"type": "transcript_user", "text": user_text})

                conversation_history.append({
                    "role": "user",
                    "parts": [{"text": user_text}]
                })

                try:
                    reply, llm_ms = await generate_llm_reply_async(conversation_history[-8:], call_ctx)
                    if not is_call_active or seq_id != turn_seq:
                        return

                    t_tts = time.monotonic()
                    audio_data = await synthesize_speech_deepgram_async(reply)
                    tts_ms = int((time.monotonic() - t_tts) * 1000)

                    if not is_call_active or seq_id != turn_seq:
                        return

                    print(f"[AI] ({llm_ms}ms LLM / {tts_ms}ms TTS): {reply}")
                    meta = f"LLM {llm_ms}ms • TTS {tts_ms}ms"
                    conversation_history.append({
                        "role": "model",
                        "parts": [{"text": reply}]
                    })
                    session_turns.append({"role": "model", "text": reply, "meta": meta})
                    await broadcast_dashboard({"type": "transcript_ai", "text": reply, "meta": meta})

                    if current_playback_task and not current_playback_task.done():
                        current_playback_task.cancel()
                    current_playback_task = asyncio.create_task(play_audio_to_phone(audio_data))
                except asyncio.CancelledError:
                    pass

            async def flush_pending_utterance():
                nonlocal pending_utterance_parts, current_response_task, turn_seq
                if not pending_utterance_parts:
                    return
                combined = " ".join(pending_utterance_parts).strip()
                pending_utterance_parts = []
                if len(combined) <= 1:
                    return
                turn_seq += 1
                seq_id = turn_seq
                if current_response_task and not current_response_task.done():
                    current_response_task.cancel()
                current_response_task = asyncio.create_task(trigger_ai_response(combined, seq_id))

            async def delayed_flush(delay_s: float = 0.28):
                try:
                    await asyncio.sleep(delay_s)
                    await flush_pending_utterance()
                except asyncio.CancelledError:
                    pass

            async def receive_from_twilio():
                nonlocal stream_sid, call_sid, call_ctx, current_playback_task, is_call_active
                try:
                    while True:
                        msg = await websocket.receive_text()
                        data = json.loads(msg)
                        event = data.get("event")

                        if event == "start":
                            stream_sid = data["start"]["streamSid"]
                            call_sid = data["start"].get("callSid")
                            call_ctx = CALL_CONTEXTS.get(call_sid, {})
                            print(f"[*] Twilio Stream started. Stream SID: {stream_sid} | Call SID: {call_sid}")
                            await broadcast_dashboard({
                                "type": "call_started",
                                "store": SHOPIFY_SHOP,
                                "call_sid": call_sid,
                            })

                            store_name = STORE_DISPLAY_NAME or SHOPIFY_SHOP.split('.')[0].replace('-', ' ')
                            cname = (call_ctx.get("customer_name") or "").strip()
                            if cname:
                                greeting = f"Hello {cname}! I am your sales assistant calling from {store_name}. How can I help you with our products today?"
                            else:
                                greeting = f"Hello! I am your sales assistant calling from {store_name}. How can I help you with our products today?"

                            print(f"[AI]: {greeting}")
                            conversation_history.append({"role": "model", "parts": [{"text": greeting}]})
                            session_turns.append({"role": "model", "text": greeting, "meta": "Greeting"})
                            await broadcast_dashboard({"type": "transcript_ai", "text": greeting, "meta": "Greeting"})
                            greeting_audio = await synthesize_speech_deepgram_async(greeting)
                            current_playback_task = asyncio.create_task(play_audio_to_phone(greeting_audio))

                        elif event == "media":
                            raw_audio = base64.b64decode(data["media"]["payload"])
                            try:
                                await dg_ws.send(raw_audio)
                            except Exception:
                                break

                        elif event == "stop":
                            print("[*] Twilio Stream stopped (call hung up).")
                            is_call_active = False
                            try:
                                await dg_ws.close()
                            except Exception:
                                pass
                            break
                except WebSocketDisconnect:
                    is_call_active = False
                except Exception as e:
                    is_call_active = False
                    print(f"[-] Twilio receive loop: {e}")

            async def receive_from_deepgram():
                nonlocal is_ai_speaking, current_playback_task, current_response_task
                nonlocal pending_flush_task, last_final_norm, last_final_time
                try:
                    async for raw_response in dg_ws:
                        if not is_call_active:
                            break
                        res = json.loads(raw_response)
                        if res.get("type") == "Results":
                            channel = res.get("channel", {})
                            alts = channel.get("alternatives", [{}])
                            transcript = alts[0].get("transcript", "").strip()

                            if transcript:
                                # User started speaking: handle Barge-In interruption
                                if is_ai_speaking:
                                    print("[*] User interrupted AI. Clearing phone audio buffer...")
                                    is_ai_speaking = False
                                    if current_playback_task and not current_playback_task.done():
                                        current_playback_task.cancel()
                                    if stream_sid:
                                        try:
                                            await websocket.send_text(json.dumps({
                                                "event": "clear",
                                                "streamSid": stream_sid
                                            }))
                                        except Exception:
                                            pass
                                    await broadcast_dashboard({"type": "barge_in"})

                                if current_response_task and not current_response_task.done():
                                    current_response_task.cancel()

                                # Final transcript: deduplicate & coalesce rapid chunks
                                if res.get("is_final", False) and len(transcript) > 1:
                                    norm = transcript.lower().strip(".,!? ")
                                    now = time.monotonic()
                                    if norm and norm == last_final_norm and (now - last_final_time) < 1.5:
                                        continue
                                    last_final_norm = norm
                                    last_final_time = now

                                    pending_utterance_parts.append(transcript)
                                    if pending_flush_task and not pending_flush_task.done():
                                        pending_flush_task.cancel()

                                    if res.get("speech_final", False):
                                        await flush_pending_utterance()
                                    else:
                                        pending_flush_task = asyncio.create_task(delayed_flush(0.28))

                except Exception as e:
                    if is_call_active:
                        print(f"[-] Deepgram receive loop: {e}")

            await asyncio.gather(receive_from_twilio(), receive_from_deepgram(), return_exceptions=True)

    except Exception as e:
        print(f"[-] Session error: {e}")
    finally:
        is_call_active = False
        for t in (pending_flush_task, current_response_task, current_playback_task):
            if t and not t.done():
                t.cancel()
        if session_turns:
            CALL_HISTORY.insert(0, {
                "call_sid": call_sid or "",
                "to_number": call_ctx.get("to_number", TO_PHONE_NUMBER or ""),
                "customer_name": call_ctx.get("customer_name", ""),
                "started_at": datetime.now().strftime("%H:%M:%S"),
                "status": "completed",
                "turns": session_turns,
            })
            del CALL_HISTORY[20:]
        if dg_ws:
            try:
                await dg_ws.close()
            except Exception:
                pass
        await broadcast_dashboard({"type": "call_ended"})
        print("[*] Call session concluded.\n")


if __name__ == "__main__":
    print(f"[*] Starting Outbound Conversational Voice AI Server on port {PORT}...")
    uvicorn.run(app, host="0.0.0.0", port=PORT)

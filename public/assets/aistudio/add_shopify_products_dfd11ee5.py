"""
add_shopify_products.py - Pushes local products.json catalog to Shopify via Admin API
when the merchant has approved the `write_products` OAuth scope.
"""

import os
import sys
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv

load_dotenv()

SHOP = os.getenv("SHOPIFY_SHOP", "trendraj.myshopify.com")
TOKEN = os.getenv("SHOPIFY_ACCESS_TOKEN")
PORT = int(os.getenv("PORT", 8000))
PRODUCTS_FILE = os.path.join(os.path.dirname(__file__), "products.json")


def shopify_request(path: str, method: str = "GET", payload: dict = None):
    url = f"https://{SHOP}{path}"
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "X-Shopify-Access-Token": TOKEN,
            "Content-Type": "application/json",
        },
        method=method,
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    if not TOKEN:
        print("[ERROR] SHOPIFY_ACCESS_TOKEN missing in .env")
        sys.exit(1)

    if not os.path.exists(PRODUCTS_FILE):
        print(f"[ERROR] {PRODUCTS_FILE} not found.")
        sys.exit(1)

    # 1. Check granted OAuth scopes first
    try:
        scopes_data = shopify_request("/admin/oauth/access_scopes.json")
        granted = [s["handle"] for s in scopes_data.get("access_scopes", [])]
        print(f"[*] Connected store: {SHOP}")
        print(f"[*] Granted scopes:  {', '.join(granted)}")
    except Exception as e:
        print(f"[ERROR] Failed to verify Shopify scopes: {e}")
        sys.exit(1)

    if "write_products" not in granted:
        print("\n[BLOCKED] Current Shopify access token does not have 'write_products' scope.")
        print("To add products automatically via API:")
        print("  1. Open Shopify Dev Dashboard -> your app -> Versions -> Scopes")
        print("  2. Add 'write_products' (keep read_products, read_inventory, read_orders) and Release")
        print("  3. Visit /auth/install?write=true on your server URL to approve the new permission")
        print("  4. Re-run: python add_shopify_products.py")
        print("\nAlternatively, upload shopify_products_import.csv in Shopify Admin -> Products -> Import.")
        sys.exit(2)

    # 2. Fetch existing products to prevent duplicates
    existing = shopify_request("/admin/api/2024-01/products.json?limit=250&status=any").get("products", [])
    existing_handles = {p.get("handle") for p in existing}
    existing_titles = {p.get("title", "").lower() for p in existing}

    with open(PRODUCTS_FILE, "r", encoding="utf-8") as f:
        local_products = json.load(f)

    created = 0
    skipped = 0

    for p_idx, item in enumerate(local_products, start=1):
        handle = item.get("handle") or f"product-{p_idx}"
        title = item.get("title", "")
        if handle in existing_handles or title.lower() in existing_titles:
            print(f"[-] Skipping existing product: {title}")
            skipped += 1
            continue

        option_name = item.get("option_name", "Option")
        variant_values = item.get("variants") or ["Default"]
        qty_per_variant = max(1, int(item.get("inventory_qty", 15)) // len(variant_values))
        parts = [w for w in handle.split("-") if w != "trendraj"]
        sku_prefix = ("TR-" + "".join(w[:3].upper() for w in parts[:2])) or f"TR-{p_idx:02d}"

        variants_payload = []
        for idx, val in enumerate(variant_values, start=1):
            variants_payload.append({
                "option1": str(val),
                "price": str(item.get("price", "0")),
                "sku": f"{sku_prefix}-{idx:02d}",
                "inventory_management": "shopify",
                "inventory_quantity": qty_per_variant,
            })

        body = {
            "product": {
                "title": title,
                "handle": handle,
                "body_html": f"<p>{item.get('description', '')}</p>",
                "vendor": item.get("vendor", "TrendRaj"),
                "product_type": item.get("type", "General"),
                "tags": item.get("tags", ""),
                "status": "active",
                "options": [{"name": option_name}],
                "variants": variants_payload,
            }
        }

        try:
            res = shopify_request("/admin/api/2024-01/products.json", method="POST", payload=body)
            new_p = res.get("product", {})
            print(f"[+] Created in Shopify: {new_p.get('title')} (ID: {new_p.get('id')})")
            created += 1
        except urllib.error.HTTPError as he:
            err_body = he.read().decode("utf-8", errors="ignore")
            print(f"[-] Failed to create '{title}': HTTP {he.code} - {err_body}")

    print(f"\n[*] Summary: {created} created, {skipped} skipped.")

    # 3. Trigger local server refresh if running
    try:
        with urllib.request.urlopen(f"http://localhost:{PORT}/shopify/refresh", timeout=5) as r:
            print("[+] Voice agent catalog refreshed:", r.read().decode("utf-8"))
    except Exception:
        pass


if __name__ == "__main__":
    main()

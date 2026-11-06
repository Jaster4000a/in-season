#!/usr/bin/env python3
"""Dev-only worst-case viewer. Never deployed behaviour: the production page has no toggle.

  python3 dev/serve.py [port] [--lan]

This computer only by default. Add --lan to test from a phone on your network.

Serves only index.html, data/ and vendor/. Injects a Demo / Worst case / Empty / One toggle
and swaps data/items.json (and regions.json for Worst case) at the data boundary, via a cookie.
"""
import http.cookies, http.server, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOGGLE = """<div id="devtoggle" style="position:fixed;left:50%;bottom:72px;transform:translateX(-50%);z-index:99;display:flex;gap:2px;padding:3px;background:#888;border-radius:8px;font:12px system-ui">%s</div>"""
MODES = ["demo", "worst", "empty", "one"]
LABELS = {"demo": "Demo", "worst": "Worst case", "empty": "Empty", "one": "One"}

class H(http.server.BaseHTTPRequestHandler):
    def mode(self):
        c = http.cookies.SimpleCookie(self.headers.get("Cookie", ""))
        m = c["data"].value if "data" in c else "demo"
        return m if m in MODES else "demo"
    def send(self, body, ctype):
        self.send_response(200); self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store"); self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        path = self.path.split("?")[0].split("#")[0]
        m = self.mode()
        if path in ("/", "/index.html"):
            html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
            btn = "".join(
                f'<button onclick="document.cookie=\'data={k};path=/\';location.reload()" style="min-height:0;padding:4px 8px;border:0;border-radius:6px;color:#111;background:{"#fff" if k==m else "transparent"}">{LABELS[k]}</button>'
                for k in MODES)
            html = html.replace("</body>", TOGGLE.replace("%s", btn) + "</body>")
            return self.send(html.encode(), "text/html; charset=utf-8")
        name = os.path.basename(path)
        if path.startswith("/data/") and name in ("items.json", "regions.json") and m != "demo":
            f = os.path.join(ROOT, "dev/fixtures", f"{m}.{name}")
            if os.path.exists(f):
                return self.send(open(f, "rb").read(), "application/json")
        # sw.js is left out on purpose: a service worker would cache the fixtures.
        if not (path.startswith(("/data/", "/vendor/", "/icons/")) or path == "/manifest.webmanifest") or ".." in path:
            self.send_error(404); return
        f = os.path.join(ROOT, path.lstrip("/"))
        if not os.path.isfile(f):
            self.send_error(404); return
        ctype = {".json": "application/json", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json"}.get(os.path.splitext(f)[1], "application/octet-stream")
        self.send(open(f, "rb").read(), ctype)
    def log_message(self, *a): pass

args = [a for a in sys.argv[1:] if a != "--lan"]
host = "0.0.0.0" if "--lan" in sys.argv else "127.0.0.1"
http.server.ThreadingHTTPServer((host, int(args[0]) if args else 8780), H).serve_forever()

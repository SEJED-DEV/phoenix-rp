"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const FLAG = path.join(ROOT, "maintenance.flag");
const HTML_PATH = path.join(ROOT, "public", "maintenance.html");
const UPSTREAM_PORT = 3000;
const PORT = 3001;

let html = "";
try {
  html = fs.readFileSync(HTML_PATH, "utf8");
} catch (e) {
  console.error("[maintenance] Failed to load public/maintenance.html:", e.message);
}

function inMaintenance() {
  try {
    fs.accessSync(FLAG);
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer((req, res) => {
  if (inMaintenance()) {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Robots-Tag": "noindex",
    });
    res.end(html);
    return;
  }

  const proxyReq = http.request(
    {
      host: "127.0.0.1",
      port: UPSTREAM_PORT,
      method: req.method,
      path: req.url,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", (err) => {
    console.error("[maintenance] Upstream proxy error:", err.message);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Bad Gateway");
    } else {
      res.destroy();
    }
  });

  req.pipe(proxyReq);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[maintenance] Gatekeeper listening on 127.0.0.1:${PORT} -> 127.0.0.1:${UPSTREAM_PORT}`);
});

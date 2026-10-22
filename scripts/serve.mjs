// Tiny static server for local development. Sends no-store so edits to the
// data or logic show up on a normal reload. Usage: npm start [-- --port 8080]
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = process.argv.indexOf("--port");
const port = Number(arg > -1 ? process.argv[arg + 1] : process.env.PORT) || 8080;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".md": "text/plain", ".xml": "application/xml", ".txt": "text/plain", ".ico": "image/x-icon" };

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(root)) return res.writeHead(403).end();
    try {
      if ((await fs.stat(file)).isDirectory()) {
        // Like GitHub Pages: /states/ohio → /states/ohio/, so relative links resolve.
        if (!url.pathname.endsWith("/")) return res.writeHead(301, { location: url.pathname + "/" + url.search }).end();
        file = path.join(file, "index.html");
      }
      const body = await fs.readFile(file);
      res.writeHead(200, { "content-type": (TYPES[path.extname(file)] || "application/octet-stream") + "; charset=utf-8", "cache-control": "no-store" });
      res.end(body);
    } catch {
      res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
    }
  })
  .listen(port, () => console.log(`Start a Company → http://localhost:${port}`));

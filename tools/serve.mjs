import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = process.argv[2] || ".";
// Prefer the port the harness assigns via PORT env (autoPort), else argv, else default.
const PORT = Number(process.env.PORT || process.argv[3] || 5599);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".mp4": "video/mp4", ".webm": "video/webm"
};

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/" || p.endsWith("/")) p += "index.html";
    const file = normalize(join(ROOT, p));
    const buf = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(buf);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404");
  }
}).listen(PORT, () => console.log("serving " + ROOT + " on http://localhost:" + PORT));

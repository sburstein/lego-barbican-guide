#!/usr/bin/env node
// Production-style host for the guide WITH the AI designer: serves the built
// site (dist/) and the /api/design route on one origin. Run on any machine or
// Node host that has ANTHROPIC_API_KEY and headless Chrome; static hosts like
// the Netlify site serve the guide only, and its designer panel says so.
//
//   npm run build && node scripts/designer-server.mjs [--port 8787]

import Anthropic from "@anthropic-ai/sdk";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createDesignApi } from "./lib/design-api.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const port = Number(process.argv[process.argv.indexOf("--port") + 1]) || 8787;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".pdf": "application/pdf", ".json": "application/json" };

const api = createDesignApi({ root: ROOT, makeClient: (key) => new Anthropic({ apiKey: key, maxRetries: 3, timeout: 20 * 60 * 1000 }) });

createServer((req, res) => {
  api(req, res, () => {
    const path = normalize(decodeURIComponent(new URL(req.url, "http://local").pathname)).replace(/^(\.\.[/\\])+/, "");
    let file = join(DIST, path);
    if (!file.startsWith(DIST)) { res.statusCode = 403; return res.end(); }
    if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, "index.html");
    res.setHeader("Content-Type", TYPES[extname(file)] ?? "application/octet-stream");
    createReadStream(file).pipe(res);
  });
}).listen(port, "127.0.0.1", () => console.log(`guide + designer on http://127.0.0.1:${port}`));

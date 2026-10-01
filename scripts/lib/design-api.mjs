// HTTP route for the AI designer: /api/design. Mounted by the Vite dev
// server (vite.config.ts) and by scripts/designer-server.mjs. The API key
// stays in this process; the browser only sees job status and results.
//
//   GET  /api/design/health            {enabled, reason, model, effort, busy}
//   POST /api/design                   {subject, brief?, budgetUsd?} -> 202 {jobId}
//   GET  /api/design/jobs/:id          job status, progress events, result
//   POST /api/design/jobs/:id/cancel
//
// Writes need the same-origin header X-Designer-Request: 1, which a page on
// another site cannot send without a CORS preflight this route never grants.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { EFFORT, MODEL, runDesigner } from "./designer.mjs";
import { saveApproved } from "./save-design.mjs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export function readEnvKey(root) {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const f = join(root, ".env");
  if (!existsSync(f)) return null;
  const m = readFileSync(f, "utf8").match(/^ANTHROPIC_API_KEY=["']?([^"'\r\n]+)/m);
  return m ? m[1] : null;
}

export function createDesignApi({ root, makeClient, run = runDesigner, save = saveApproved, chrome = CHROME, defaults = {} }) {
  const jobs = new Map();
  let active = null;

  const health = () => {
    const key = !!readEnvKey(root);
    const renderer = existsSync(chrome);
    const enabled = key && renderer;
    return {
      enabled,
      reason: enabled ? null : !key ? "no ANTHROPIC_API_KEY on this server" : "headless Chrome is not installed on this server",
      model: MODEL,
      effort: EFFORT,
      busy: !!active,
    };
  };

  const send = (res, code, body) => {
    res.statusCode = code;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(JSON.stringify(body));
  };
  const readBody = (req) =>
    new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (c) => {
        data += c;
        if (data.length > 20000) reject(new Error("body too large"));
      });
      req.on("end", () => {
        try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error("invalid JSON")); }
      });
    });
  const view = (job) => ({
    id: job.id, subject: job.subject, status: job.status, startedAt: job.startedAt,
    events: job.events.slice(-60), designId: job.designId ?? null,
    result: job.result ? {
      status: job.result.status, reason: job.result.reason ?? null, cost: job.result.cost, seconds: job.result.seconds,
      review: job.result.review ? { quality: job.result.review.quality, fidelity: job.result.review.fidelity, guess: job.result.review.guess, recognisable: job.result.review.recognisable, issues: job.result.review.issues } : null,
    } : null,
  });

  return async function handler(req, res, next) {
    const url = new URL(req.url, "http://local");
    if (!url.pathname.startsWith("/api/design")) return next ? next() : send(res, 404, { error: "not found" });
    try {
      if (req.method === "GET" && url.pathname === "/api/design/health") return send(res, 200, health());
      const writing = req.method === "POST";
      if (writing && req.headers["x-designer-request"] !== "1") return send(res, 403, { error: "missing X-Designer-Request header" });

      if (req.method === "POST" && url.pathname === "/api/design") {
        const h = health();
        if (!h.enabled) return send(res, 503, { error: `designer disabled: ${h.reason}` });
        if (active) return send(res, 409, { error: "a design is already running", jobId: active.id });
        const body = await readBody(req);
        const subject = typeof body.subject === "string" ? body.subject.trim() : "";
        if (subject.length < 3 || subject.length > 200) return send(res, 400, { error: "subject must be 3 to 200 characters" });
        const brief = typeof body.brief === "string" ? body.brief.slice(0, 1000) : "";
        const budgetUsd = Math.min(30, Math.max(0.5, Number(body.budgetUsd) || defaults.budgetUsd || 20));
        const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
        const controller = new AbortController();
        const runDir = join(root, ".cache/design-runs", id);
        const job = { id, subject, status: "running", startedAt: new Date().toISOString(), events: [], controller, runDir };
        jobs.set(id, job);
        active = job;
        run({
          subject, brief, budgetUsd, runDir, signal: controller.signal, client: makeClient(readEnvKey(root)),
          readFile: (f) => readFileSync(f), onEvent: (e) => job.events.push(e), ...defaults.runOptions,
        })
          .then((result) => {
            job.result = result;
            job.status = result.status;
            if (result.status === "approved") job.designId = save(root, result, { model: MODEL, effort: EFFORT, runId: id });
          })
          .catch((err) => {
            job.status = "failed";
            job.result = { status: "failed", reason: `designer crashed: ${err.message}` };
          })
          .finally(() => { active = null; });
        return send(res, 202, { jobId: id });
      }
      const img = url.pathname.match(/^\/api\/design\/jobs\/([^/]+)\/render\/((?:render|submitted)-\d+\.png)$/);
      if (img && req.method === "GET") {
        const job = jobs.get(img[1]);
        const file = job && join(job.runDir, img[2]);
        if (!file || !existsSync(file)) return send(res, 404, { error: "no such render" });
        res.statusCode = 200;
        res.setHeader("Content-Type", "image/png");
        return res.end(readFileSync(file));
      }
      const m = url.pathname.match(/^\/api\/design\/jobs\/([^/]+)(\/cancel)?$/);
      if (m) {
        const job = jobs.get(m[1]);
        if (!job) return send(res, 404, { error: "no such job" });
        if (m[2] && req.method === "POST") {
          job.controller.abort();
          return send(res, 202, { ok: true });
        }
        if (req.method === "GET") return send(res, 200, view(job));
      }
      return send(res, 404, { error: "not found" });
    } catch (err) {
      return send(res, 400, { error: err.message });
    }
  };
}

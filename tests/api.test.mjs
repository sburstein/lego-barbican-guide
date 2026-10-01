// Designer HTTP route: real server, fake designer, fake key.
//
//   node --test tests/

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDesignApi } from "../scripts/lib/design-api.mjs";

const KEY = "sk-ant-test-0000000000000000000000000000";
const HDR = { "Content-Type": "application/json", "X-Designer-Request": "1" };

async function serve({ withKey = true, run, save } = {}) {
  const root = mkdtempSync(join(tmpdir(), "design-api-"));
  if (withKey) writeFileSync(join(root, ".env"), `ANTHROPIC_API_KEY=${KEY}\n`);
  const saved = [];
  const api = createDesignApi({
    root,
    makeClient: () => ({}),
    chrome: process.execPath, // any existing file stands in for Chrome
    run: run ?? (({ signal, onEvent }) => new Promise((resolve) => {
      onEvent({ t: 0, type: "start" });
      const done = setTimeout(() => resolve({ status: "approved", spec: { id: "x" }, review: { quality: 8 }, cost: { usd: 1 } }), 150);
      signal.addEventListener("abort", () => { clearTimeout(done); resolve({ status: "failed", reason: "cancelled", cost: { usd: 0 } }); });
    })),
    save: save ?? ((_root, result) => (saved.push(result), "saved-design")),
  });
  delete process.env.ANTHROPIC_API_KEY;
  const server = createServer((req, res) => api(req, res, () => { res.statusCode = 404; res.end("static"); }));
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const bodies = [];
  const req = async (path, init) => {
    const r = await fetch(base + path, init);
    const text = await r.text();
    bodies.push(text);
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: r.status, json, text };
  };
  return { req, saved, bodies, close: () => server.close() };
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test("health reports enabled with a key and Chrome, disabled without a key", async () => {
  const on = await serve();
  const h = await on.req("/api/design/health");
  assert.equal(h.status, 200);
  assert.equal(h.json.enabled, true);
  assert.equal(h.json.model, "claude-opus-5-5");
  on.close();
  const off = await serve({ withKey: false });
  const h2 = await off.req("/api/design/health");
  assert.equal(h2.json.enabled, false);
  assert.match(h2.json.reason, /no ANTHROPIC_API_KEY/);
  const start = await off.req("/api/design", { method: "POST", headers: HDR, body: JSON.stringify({ subject: "Habitat 67" }) });
  assert.equal(start.status, 503);
  off.close();
});

test("writes need the same-origin header and a sensible subject", async () => {
  const s = await serve();
  const noHeader = await s.req("/api/design", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: "Habitat 67" }) });
  assert.equal(noHeader.status, 403);
  const tooShort = await s.req("/api/design", { method: "POST", headers: HDR, body: JSON.stringify({ subject: "x" }) });
  assert.equal(tooShort.status, 400);
  const notJson = await s.req("/api/design", { method: "POST", headers: HDR, body: "{" });
  assert.equal(notJson.status, 400);
  s.close();
});

test("a job runs, one at a time, reports progress and saves an approved design", async () => {
  const s = await serve();
  const a = await s.req("/api/design", { method: "POST", headers: HDR, body: JSON.stringify({ subject: "the Barbican Estate", budgetUsd: 5 }) });
  assert.equal(a.status, 202);
  const busy = await s.req("/api/design", { method: "POST", headers: HDR, body: JSON.stringify({ subject: "Habitat 67" }) });
  assert.equal(busy.status, 409);
  const running = await s.req(`/api/design/jobs/${a.json.jobId}`);
  assert.equal(running.json.status, "running");
  assert.equal(running.json.events[0].type, "start");
  await wait(250);
  const done = await s.req(`/api/design/jobs/${a.json.jobId}`);
  assert.equal(done.json.status, "approved");
  assert.equal(done.json.designId, "saved-design");
  assert.equal(s.saved.length, 1);
  assert.equal((await s.req("/api/design/jobs/nope")).status, 404);
  assert.equal((await s.req(`/api/design/jobs/${a.json.jobId}/render/render-1.png`)).status, 404);
  // the key never leaves the server
  assert.ok(s.bodies.every((b) => !b.includes(KEY)));
  s.close();
});

test("a running job can be cancelled", async () => {
  const s = await serve();
  const a = await s.req("/api/design", { method: "POST", headers: HDR, body: JSON.stringify({ subject: "Habitat 67" }) });
  assert.equal((await s.req(`/api/design/jobs/${a.json.jobId}/cancel`, { method: "POST", headers: HDR })).status, 202);
  await wait(30);
  const j = await s.req(`/api/design/jobs/${a.json.jobId}`);
  assert.equal(j.json.status, "failed");
  assert.equal(j.json.result.reason, "cancelled");
  assert.equal(s.saved.length, 0);
  s.close();
});

test("non-designer paths fall through to the static site", async () => {
  const s = await serve();
  const r = await s.req("/manuals/index.json");
  assert.equal(r.text, "static");
  s.close();
});

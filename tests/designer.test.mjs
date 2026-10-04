// Designer loop with a scripted client: every outcome path, without spend.
//
//   node --test tests/

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runDesigner, MODEL, EFFORT } from "../scripts/lib/designer.mjs";

const good = JSON.parse(readFileSync(new URL("./fixtures/barbican-hand.json", import.meta.url), "utf8"));
const bad = { ...good, elements: [...good.elements, { type: "block", id: "clash", name: "Clash", rect: { x: 3, z: 0, w: 6, d: 6 }, levels: 2 }] };
// a 1×1 PNG, so renders and image blocks are real without Chrome
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const fakeRender = (_pieces, _title, file) => (writeFileSync(file, PNG), true);

const usage = (i = 2000, o = 400) => ({ input_tokens: i, output_tokens: o, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 });
const msg = (content, stop = "tool_use", u = usage()) => ({ content, stop_reason: stop, usage: u });
let n = 0;
const use = (name, input) => ({ type: "tool_use", id: `tu_${++n}`, name, input });
const text = (t) => ({ type: "text", text: t });
const blind = (o) => msg([text(JSON.stringify({ guess: "the Barbican Estate", confidence: 0.8, quality: 8, strengths: ["towers"], problems: [], ...o }))], "end_turn");
const named = (o) => msg([text(JSON.stringify({ recognisable: true, fidelity: 8, issues: [], verdict: "Reads as the Barbican.", ...o }))], "end_turn");

function client(script) {
  const calls = [];
  return {
    calls,
    beta: { messages: { stream(params) {
      calls.push({ ...params, messages: structuredClone(params.messages) }); // as sent, not as it grows
      const step = script.shift();
      if (!step) throw new Error("script exhausted");
      return { finalMessage: async () => { const r = typeof step === "function" ? step(params) : step; if (r instanceof Error) throw r; return r; } };
    } } },
  };
}
const run = (c, opts = {}) => runDesigner({
  subject: "the Barbican Estate, London", client: c, runDir: mkdtempSync(join(tmpdir(), "designer-")),
  readFile: (f) => readFileSync(f), renderFn: fakeRender, ...opts,
});

test("approved path: fixes a compile error, submits, passes both reviews", async () => {
  const c = client([
    msg([text("First draft."), use("compile_design", { spec: bad })]),
    msg([use("compile_design", { spec: good })]),
    msg([use("submit_design", { spec: good, notes: "Towers behind the lake." })]),
    blind(), named(),
  ]);
  const r = await run(c);
  assert.equal(r.status, "approved", r.reason);
  assert.equal(r.spec.id, good.id);
  assert.equal(r.review.quality, 8);
  assert.ok(r.cost.usd > 0);
  const kinds = r.events.map((e) => e.type);
  assert.ok(kinds.includes("compile") && kinds.includes("review"));
  // the first compile reported errors; the second returned a render image
  const firstResult = c.calls[1].messages.at(-1).content[0];
  assert.match(firstResult.content[0].text, /"ok": false/);
  const secondResult = c.calls[2].messages.at(-1).content[0];
  assert.ok(secondResult.content.some((b) => b.type === "image"));
});

test("the reviewer's image is blind: no title on the submitted render", async () => {
  const titles = [];
  const render = (pieces, title, file) => (titles.push([file.split("/").pop(), title]), fakeRender(pieces, title, file));
  const c = client([msg([use("compile_design", { spec: good })]), msg([use("submit_design", { spec: good })]), blind(), named()]);
  const r = await run(c, { renderFn: render });
  assert.equal(r.status, "approved", r.reason);
  assert.deepEqual(titles, [["render-1.png", good.title], ["submitted-1.png", null]]);
});

test("every request uses Opus 5.5, xhigh effort, the refusal fallback and web search", async () => {
  const c = client([msg([use("submit_design", { spec: good })]), blind(), named()]);
  await run(c);
  const p = c.calls[0];
  assert.equal(p.model, MODEL);
  assert.equal(MODEL, "claude-opus-5-5");
  assert.equal(p.output_config.effort, EFFORT);
  assert.equal(EFFORT, "xhigh");
  assert.equal(p.fallbacks, "default");
  assert.ok(p.betas.includes("server-side-fallback-2026-07-01"));
  assert.ok(p.tools.some((t) => t.type === "web_search_20260209"));
  // the reviewer sees the render and nothing of the designer's conversation
  const review = c.calls[1];
  assert.equal(review.messages.length, 1);
  assert.ok(review.messages[0].content.some((b) => b.type === "image"));
  assert.ok(!review.tools);
});

test("critique loop: a failed review goes back to the designer, which resubmits", async () => {
  const c = client([
    msg([use("submit_design", { spec: good })]),
    blind({ quality: 5, guess: "a generic office park", problems: ["towers too short"] }), named({ recognisable: false, fidelity: 5, issues: ["make the towers taller"] }),
    msg([use("submit_design", { spec: good })]),
    blind(), named(),
  ]);
  const r = await run(c);
  assert.equal(r.status, "approved");
  const critique = c.calls[3].messages.at(-1).content[0];
  assert.match(critique.content, /Not approved.*make the towers taller/s);
});

test("rejected after the review limit; the last valid spec is kept", async () => {
  const c = client([
    msg([use("submit_design", { spec: good })]), blind({ quality: 4 }), named({ fidelity: 4 }),
    msg([use("submit_design", { spec: good })]), blind({ quality: 5 }), named({ fidelity: 5 }),
  ]);
  const r = await run(c, { maxReviews: 2 });
  assert.equal(r.status, "rejected");
  assert.match(r.reason, /not approved after 2 reviews/);
  assert.equal(r.spec.id, good.id);
});

test("an invalid submission is bounced back with the compiler's errors", async () => {
  const c = client([
    msg([use("submit_design", { spec: bad })]),
    msg([use("submit_design", { spec: good })]), blind(), named(),
  ]);
  const r = await run(c);
  assert.equal(r.status, "approved");
  const bounce = c.calls[1].messages.at(-1).content[0];
  assert.equal(bounce.is_error, true);
  assert.match(bounce.content, /Not valid yet/);
});

test("refusal stops the run", async () => {
  const r = await run(client([msg([], "refusal")]));
  assert.equal(r.status, "failed");
  assert.match(r.reason, /declined/);
});

test("an API error fails the run with the status", async () => {
  const err = Object.assign(new Error("overloaded"), { status: 529 });
  const r = await run(client([err]));
  assert.equal(r.status, "failed");
  assert.match(r.reason, /the API is unavailable \(529\)/);
});

test("an out-of-credit account is reported in plain words", async () => {
  const err = Object.assign(new Error('400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API."}}'),
    { status: 400, error: { type: "error", error: { type: "invalid_request_error", message: "Your credit balance is too low to access the Anthropic API." } } });
  const r = await run(client([err]));
  assert.equal(r.status, "failed");
  assert.match(r.reason, /out of API credit/);
});

test("the budget cap stops the run", async () => {
  const r = await run(client([msg([use("compile_design", { spec: good })], "tool_use", usage(5_000_000, 100))]), { budgetUsd: 1 });
  assert.equal(r.status, "rejected"); // a valid spec existed, so it is kept as rejected
  assert.match(r.reason, /budget of \$1 reached/);
});

test("malformed tool input is reported, not run", async () => {
  const c = client([msg([use("compile_design", {})]), msg([use("submit_design", { spec: good })]), blind(), named()]);
  const r = await run(c);
  assert.equal(r.status, "approved");
  const res = c.calls[1].messages.at(-1).content[0];
  assert.equal(res.is_error, true);
  assert.match(res.content, /INVALID_INPUT/);
});

test("a designer that stops talking is nudged, then failed", async () => {
  const r = await run(client([msg([text("Done?")], "end_turn"), msg([text("Hmm")], "end_turn"), msg([text("…")], "end_turn")]));
  assert.equal(r.status, "failed");
  assert.match(r.reason, /stopped without submitting/);
});

test("output truncation and cancellation fail cleanly", async () => {
  const t = await run(client([msg([use("compile_design", { spec: good })], "max_tokens")]));
  assert.match(t.reason, /output limit/);
  const ctl = new AbortController();
  ctl.abort();
  const c = await run(client([]), { signal: ctl.signal });
  assert.equal(c.status, "failed");
  assert.equal(c.reason, "cancelled");
});

test("the compile limit is enforced", async () => {
  const c = client([
    msg([use("compile_design", { spec: good })]),
    msg([use("compile_design", { spec: good })]),
    msg([use("submit_design", { spec: good })]), blind(), named(),
  ]);
  const r = await run(c, { maxCompiles: 1 });
  assert.equal(r.status, "approved");
  assert.match(c.calls[2].messages.at(-1).content[0].content, /Compile limit \(1\) reached/);
});

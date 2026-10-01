#!/usr/bin/env node
// AI designer, command line. Runs Claude Opus 5.5 (xhigh effort) against the
// architecture compiler and the review gate; an approved design is saved to
// src/designs/ and appears in the app, manuals and checks.
//
//   node scripts/design.mjs "the Barbican Estate, London" [--brief "..."] [--budget 20] [--max-compiles 12] [--no-save]
//
// Reads ANTHROPIC_API_KEY from the environment or this repo's .env (never
// printed). Run artifacts (specs, renders, reviews, cost) go to
// .cache/design-runs/<run-id>/. Exit codes: 0 approved, 2 rejected, 1 failed.

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EFFORT, MODEL, runDesigner } from "./lib/designer.mjs";
import { readEnvKey } from "./lib/design-api.mjs";
import { saveApproved } from "./lib/save-design.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const subject = args.find((a, i) => !a.startsWith("--") && !["--brief", "--budget", "--max-compiles"].includes(args[i - 1]));
if (!subject) {
  console.log('usage: node scripts/design.mjs "<subject>" [--brief "..."] [--budget 20] [--max-compiles 12] [--no-save]');
  process.exit(1);
}
const key = readEnvKey(ROOT);
if (!key) {
  console.error("No ANTHROPIC_API_KEY in the environment or .env");
  process.exit(1);
}
const client = new Anthropic({ apiKey: key, maxRetries: 3, timeout: 20 * 60 * 1000 });
const runId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;
const runDir = join(ROOT, ".cache/design-runs", runId);
const controller = new AbortController();
process.on("SIGINT", () => { console.log("\ncancelling…"); controller.abort(); });

console.log(`designer  ${MODEL}, effort ${EFFORT}, server-side refusal fallback on`);
console.log(`subject   ${subject}`);
console.log(`run dir   ${runDir}`);
const result = await runDesigner({
  subject,
  brief: opt("--brief", ""),
  budgetUsd: Number(opt("--budget", "20")),
  maxCompiles: Number(opt("--max-compiles", "12")),
  client,
  runDir,
  signal: controller.signal,
  readFile: (f) => readFileSync(f),
  onEvent: (e) => {
    const t = `${String(e.t).padStart(4)}s`;
    if (e.type === "turn") console.log(`${t} turn  stop=${e.stop}  $${e.usd}${e.text ? `  ${e.text.replace(/\s+/g, " ").slice(0, 140)}` : ""}`);
    else if (e.type === "compile") console.log(`${t} compile #${e.n}  ${e.ok ? "valid" : `${e.errors} errors`}  ${e.pieces ?? 0} pieces${e.render ? `  ${e.render}` : ""}`);
    else if (e.type === "review") console.log(`${t} review #${e.n}  ${e.pass ? "PASS" : "fail"}  quality ${e.quality}  fidelity ${e.fidelity}  recognised ${e.recognisable}  guess "${e.guess}"`);
    else if (e.type === "submit") console.log(`${t} submit rejected by compiler: ${e.errors} errors`);
  },
});
console.log(`\nresult    ${result.status}${result.reason ? ` (${result.reason})` : ""}`);
console.log(`cost      $${result.cost.usd}  (${result.cost.tokens.input} in, ${result.cost.tokens.output} out, ${result.cost.tokens.cacheRead} cache read, ${result.cost.tokens.searches} searches)`);
console.log(`time      ${result.seconds}s`);
if (result.status === "approved" && !args.includes("--no-save")) {
  const id = saveApproved(ROOT, result, { model: MODEL, effort: EFFORT, runId });
  console.log(`saved     src/designs/${id}.ts (now in the app, manuals and checks)`);
}
process.exit(result.status === "approved" ? 0 : result.status === "rejected" ? 2 : 1);

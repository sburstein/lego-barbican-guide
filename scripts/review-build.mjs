#!/usr/bin/env node
// Independent review of a finished build, using the AI designer's review
// gate: Claude Opus 5.5 (xhigh effort) sees only a four-view render, names
// what it depicts and scores it as a LEGO Architecture set; a second pass,
// told the subject, scores fidelity and lists concrete fixes.
//
//   node scripts/review-build.mjs [buildId] [--subject "..."] [--budget 5]
//   node scripts/review-build.mjs --spec design.json   (a compiled design spec)
//
// Writes reviews/<buildId>-<date>.json and .png (kept in the repo as the
// record). Costs roughly $0.10 to $0.50 per run.

import Anthropic from "@anthropic-ai/sdk";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { modelFor, phaseOrderFor } from "../src/build-models.ts";
import { compileDesign } from "../src/design/compile.ts";
import { ALL_BUILDS } from "../src/builds.ts";
import { apiReason, Budget, EFFORT, MODEL, renderViews, reviewDesign } from "./lib/designer.mjs";
import { readEnvKey } from "./lib/design-api.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const specFile = opt("--spec", null);
const spec = specFile ? JSON.parse(readFileSync(specFile, "utf8")) : null;
const id = spec?.id ?? args.find((a, i) => !a.startsWith("--") && !["--subject", "--budget", "--spec"].includes(args[i - 1])) ?? "barbican-panorama";
const subject = opt("--subject", "the Barbican Estate, City of London (Chamberlin, Powell and Bon)");
const key = readEnvKey(ROOT);
if (!key) { console.error("No ANTHROPIC_API_KEY"); process.exit(1); }

let pieces;
if (spec) {
  const compiled = compileDesign(spec);
  if (!compiled.ok) { console.error(`spec does not compile:\n${compiled.errors.join("\n")}`); process.exit(1); }
  pieces = compiled.phaseOrder.flatMap((ph) => compiled.build[ph].flat());
} else {
  if (!ALL_BUILDS.some((b) => b.id === id)) { console.error(`no build "${id}"`); process.exit(1); }
  pieces = phaseOrderFor(id).flatMap((ph) => (modelFor(id)[ph] ?? []).flat());
}
const stamp = new Date().toISOString().slice(0, 10);
mkdirSync(join(ROOT, "reviews"), { recursive: true });
const png = join(ROOT, "reviews", `${id}-${stamp}.png`);
// Blind: the render carries no title, so the reviewer must recognise the model.
if (!renderViews(pieces, null, png)) { console.error("render failed (headless Chrome)"); process.exit(1); }

const budget = new Budget(Number(opt("--budget", "5")));
const client = new Anthropic({ apiKey: key, maxRetries: 3, timeout: 15 * 60 * 1000 });
console.log(`reviewing ${id} (${pieces.length} pieces) with ${MODEL}, effort ${EFFORT}`);
try {
  const review = await reviewDesign({ client, png, subject, budget, readFile: (f) => readFileSync(f) });
  const record = { build: id, ...(specFile ? { spec: specFile } : {}), version: JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version, subject, model: MODEL, effort: EFFORT, date: new Date().toISOString(), costUsd: Math.round(budget.usd * 100) / 100, ...review };
  writeFileSync(join(ROOT, "reviews", `${id}-${stamp}.json`), JSON.stringify(record, null, 2));
  console.log(`blind guess   ${review.guess}`);
  console.log(`quality       ${review.quality}/10   fidelity ${review.fidelity}/10   recognisable ${review.recognisable}   pass ${review.pass}`);
  console.log(`verdict       ${review.verdict}`);
  console.log(`cost          $${record.costUsd}`);
} catch (err) {
  console.error(`review failed: ${err.status ? apiReason(err) : err.message}`);
  process.exit(1);
}

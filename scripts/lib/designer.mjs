// AI architectural designer: Claude Opus 5.5 at xhigh effort writes a design
// spec, the deterministic compiler (src/design/compile.ts) turns it into
// validated LEGO placements, and an independent reviewer that sees only the
// renders decides whether it is good enough to ship.
//
//   const result = await runDesigner({ subject, client, runDir, onEvent })
//
// Shared by the CLI (scripts/design.mjs), the local server route
// (scripts/lib/design-api.mjs) and the tests, which pass a scripted client.
// The API key never leaves the process that calls this.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compileDesign } from "../../src/design/compile.ts";
import { FULL_INVENTORY } from "../../src/inventory.ts";
import { screenshot, viewsHtml } from "../render-views.mjs";

export const MODEL = "claude-opus-5-5";
export const EFFORT = "xhigh";
// Opus 5.5 list prices per million tokens (cache writes 1.25×, reads 0.1×)
const PRICE = { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.4, search: 0.01 };
const PASS = { quality: 7, fidelity: 7 };

// ─── prompts ───────────────────────────────────────────────────────────

const stockLines = () =>
  FULL_INVENTORY.map((e) => `${e.name} ×${e.totalInSet}`).join("; ");

export const DESIGNER_SYSTEM = `You design LEGO Architecture models that can be built from ONE copy of LEGO Architecture Studio 21050 (1,210 white and trans-clear pieces). You never place bricks yourself. You write a design spec in architectural terms; a deterministic compiler turns it into bricks, checks physics, connectivity, build order and stock, and renders it.

# Quality bar
Aim for an official LEGO Architecture set: the subject must be recognisable from its massing, proportions and one or two signature features, at a consistent scale, on a clean base. Monochrome white with sparing trans-clear glass. Restraint beats clutter. If the full subject cannot fit the set, model the defining part of it well rather than all of it badly.

# Coordinates
Studs. x runs east, z runs south. South (+z) is the front: render View 1 looks at the south and east faces from the south-east. The site is a rectangle w × d (8 to 48 studs each) of base plates at layer 0. Ground level is layer 1. Heights are in plate layers (a brick is 3). A "level" is one brick course plus a one-plate floor band (4 layers).

# Spec (JSON)
{ "id": "lowercase-dashes", "title", "subtitle", "description" (2-3 sentences for the guide), "concept" (a short line), "site": {"w","d","finish":"studs"|"tiles"}, "elements": [...] }
Official sets tile most ground and decks: "finish":"tiles" on the site or a podium smooths exposed studs at the end, as far as the set's tiles last (about 360 cells; the rest keeps studs).
Elements are built in order; each element sits on whatever is beneath its footprint, so list them bottom-up (ground surfaces first, then podiums, then buildings on them, then trees and details). Every element has "id", "name", and optional "concept" (one line), "about" (2-3 sentences: where this is in the real building and why it matters) and "facts" (2-5 short researched facts, shown as building tips).
- surface: {"type":"surface","material":"water"|"lawn"|"paving","rects":[{x,z,w,d}]} lies on the bare site at layer 1. Water uses trans-clear 1×1 and 1×2 plates only (140 cells at most, shared with glass roofs). Paving uses tiles (about 360 cells), then studded plates.
- podium: {"type":"podium","rect","levels":1-6,"style":"colonnade"|"solid"|"arcade","spacing":3,"arcadeSide":"S","finish":"tiles","parapet":true} a raised deck on columns or walls. Its deck carries later elements. "parapet" rails the free deck edges with panels (10 long, 10 corner).
- block: {"type":"block","rect","levels":n,"facade": name or {"N":..,"S":..,"E":..,"W":..},"groundFacade":..,"pilotis":bool,"bands":true,"balconies":"all"|["S",..],"serrate":bool,"roof":{..},"tint":"white"|"dark","bandTint":..}
  The rect is the outer envelope. Balcony sides inset the walls by 1 stud, so floor bands project as balcony slabs; "serrate" alternates them N/S then E/W level by level (the jagged look of Barbican towers). Walls are hollow 1-stud rings; footprints 2 studs or narrower are solid.
  Facades: "solid" (white running bond), "glass" (2-stud trans windows between 1-stud piers), "ribbon" (continuous glass between corners), "open" (piers every other stud with voids: loggias, undercrofts), "grille" (ribbed grille bricks), "arches" (1×4 arch bricks, first level only). "pilotis": true stands the first level on round columns.
  Roofs: {"type":"scallops","edges":"front"|"both"} a fine rhythm of small vaults, one curved-top hump every 2 studs along the edge (12 in the set, shared with "rounded"); {"type":"flat","finish":"studs"|"tiles"}; {"type":"vaults","axis":"ns"|"ew","count","rows","at"} barrel vaults from curved slopes, each vault 6 studs wide, 2 curved slopes per vault per row, only 12 in the set ("ns" arches face the front); {"type":"rounded"} curved-top bricks over walls exactly 4 deep, 2 per stud of length, 12 in the set; {"type":"pitched","ridge":"ew"|"ns"} slopes over walls 2, 4 or 6 deep; {"type":"glass"} trans plates.
- tower: {"type":"tower","at":[x,z],"plan":"triangle"|"square","size":4-12,"point":"N"|"S"|"E"|"W","levels":n,"courses":1|2,"balconies":true,"serrate":true,"lobby":bool,"crown":"fins"|"tiles"|"flat"} a tall tower on a real triangular (rasterised equilateral, apex toward "point") or square plan. Each level is "courses" brick courses plus a balcony slab that projects one stud; "serrate" alternates the projection N/S then E/W, which gives a saw-tooth edge. "crown":"fins" stands steep-slope fins round the top (20 in the set, shared by all towers). Budget: a size-6 triangular tower costs roughly 40 parts per level with courses 2, so three towers of 5 levels use about half the set; "at" is the plan's bounding-box corner, and slabs need one free stud all round.
- glasshouse: {"type":"glasshouse","rect","tiers":1-3} glass-panel walls (16 panels in the set) with white corner posts and a roof slab.
- walkway: {"type":"walkway","rect","levels":n,"spacing":4} a deck on piers, levels bricks above ground (gap to the ground under each pier must be whole bricks).
- trees: {"type":"trees","at":[[x,z],..],"style":"round"|"tall"|"shrub"} planted on studs (lawns, decks, site plates).
- parts: {"type":"parts","items":[{"kind","w","d","x","z","layer"?,"color"?,"facing"?,"desc"}]} raw parts for small details; omit layer to drop onto what is below. Kinds: brick, plate, tile, slope45, slope33, steepSlope2, steepSlope3, invSlope, curvedSlope, cheese, slopeCorner, curvedTop, roundBrick, roundPlate, roundCornerPlate, macaroni, cornerPlate, cornerBrick, arch, panel, glassPanel, profile, headlight, jumper, wedgeL, wedgeR. Facing turns directional parts (slopes fall toward their facing).

# The set (scarce parts matter most)
Blocks and podiums are rectangles; towers can be triangular or square. Glass is scarce: 40 Trans-Clear Brick 1×2, 40 Trans-Clear Plate 1×1, 50 Trans-Clear Plate 1×2, 16 Panel 1×2×2. 1×1 bricks of all kinds: about 96. Large plates are few and the site base uses them first. Full inventory: ${stockLines()}.

# Process
1. If you are unsure of the subject's massing, use web_search (a few queries at most).
2. Plan a footprint and scale first: towers, blocks and voids in studs, heights in levels.
3. Call compile_design with the full spec. It returns errors (stock shortages by part, collisions, floating or loose parts, build-order problems), usage, and when the model is valid, a render with four views. Study the render like a set designer: proportions, silhouette, recognisability, clutter.
4. Fix and recompile until it is valid and you are proud of it. You have a limited number of compiles, so make each one count.
5. Call submit_design with the spec and a short note. An independent reviewer will see only the renders. If it rejects the design you will get its critique; revise and submit again.
Keep your text replies short; the work is in the tool calls.`;

const REVIEW_SYSTEM = `You review LEGO models for the LEGO Architecture product line. You see only renders: four isometric views of a model built from white and trans-clear parts (grey and green tints mark paving and planting; they are white parts on the table). Be honest and specific. Answer with one JSON object and nothing else.`;

// ─── helpers ───────────────────────────────────────────────────────────

const tools = [
  {
    name: "compile_design",
    description: "Compile a design spec into LEGO placements. Returns errors, warnings, piece and stock usage, and (when valid) a four-view render.",
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: { spec: { type: "object", description: "The full design spec" } },
      required: ["spec"],
    },
  },
  {
    name: "submit_design",
    description: "Submit a finished, valid design for independent review. Returns approval, or the reviewer's critique to act on.",
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        spec: { type: "object", description: "The full design spec" },
        notes: { type: "string", description: "One or two sentences on the design intent" },
      },
      required: ["spec"],
    },
  },
  { type: "web_search_20260209", name: "web_search", max_uses: 5 },
];

function parseJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("no JSON object in reviewer reply");
  return JSON.parse(m[0]);
}

/** A sentence for an API failure; the SDK's message carries the raw body. */
export function apiReason(err) {
  const detail = err?.error?.error?.message ?? err?.message ?? String(err);
  if (/credit balance is too low/i.test(detail)) return "the Anthropic account is out of API credit (add credit under Plans & Billing in the Console, then retry)";
  if (err?.status === 401) return "the API key was rejected (401)";
  if (err?.status === 429) return "rate limited by the API (429) after retries";
  if (err?.status >= 500) return `the API is unavailable (${err.status}) after retries`;
  return `API error${err?.status ? ` ${err.status}` : ""}: ${detail}`;
}

const textOf = (msg) => msg.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");

export class Budget {
  constructor(limitUsd) {
    this.limitUsd = limitUsd;
    this.usd = 0;
    this.tokens = { input: 0, output: 0, cacheWrite: 0, cacheRead: 0, searches: 0 };
  }
  add(usage) {
    if (!usage) return;
    const t = this.tokens;
    t.input += usage.input_tokens ?? 0;
    t.output += usage.output_tokens ?? 0;
    t.cacheWrite += usage.cache_creation_input_tokens ?? 0;
    t.cacheRead += usage.cache_read_input_tokens ?? 0;
    t.searches += usage.server_tool_use?.web_search_requests ?? 0;
    this.usd =
      (t.input * PRICE.input + t.output * PRICE.output + t.cacheWrite * PRICE.cacheWrite + t.cacheRead * PRICE.cacheRead) / 1e6 +
      t.searches * PRICE.search;
  }
  get over() {
    return this.usd > this.limitUsd;
  }
}

/** Default renderer: four-view grid through headless Chrome; true if written. */
export function renderViews(pieces, title, file) {
  const html = file.replace(/\.png$/, ".html");
  writeFileSync(html, viewsHtml(pieces, title, `${pieces.length} pieces`, 1400));
  return screenshot(html, file, 1400, 1050);
}

/** Compile and (optionally) render a spec; never throws. */
export function compileAndRender(spec, file, { render = true, renderFn = renderViews } = {}) {
  let compiled;
  try {
    compiled = compileDesign(spec);
  } catch (err) {
    return { compiled: null, report: { ok: false, errors: [`compiler crashed: ${err.message}`] }, png: null };
  }
  const report = {
    ok: compiled.ok,
    errors: compiled.errors.slice(0, 40),
    moreErrors: Math.max(0, compiled.errors.length - 40),
    warnings: compiled.warnings,
    pieces: compiled.stats.pieces,
    steps: compiled.stats.steps,
    heightBricks: compiled.stats.heightBricks,
    site: compiled.stats.footprint,
    scarce: compiled.stats.usage.filter((u) => u.used / u.stock >= 0.75).map((u) => `${u.name} ${u.used}/${u.stock}`),
  };
  let png = null;
  if (render && compiled.stats.pieces > 0) {
    try {
      const pieces = compiled.phaseOrder.flatMap((id) => compiled.build[id].flat());
      if (renderFn(pieces, spec.title ?? "Design", file)) png = file;
    } catch (err) {
      report.renderError = err.message;
    }
  }
  return { compiled, report, png };
}

const imageBlock = (buf) => ({ type: "image", source: { type: "base64", media_type: "image/png", data: buf.toString("base64") } });

/** One streamed request with the house settings; returns the final message. */
async function call(client, params, budget, signal) {
  const stream = client.beta.messages.stream(
    {
      model: MODEL,
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      output_config: { effort: EFFORT },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      cache_control: { type: "ephemeral" },
      ...params,
    },
    { signal },
  );
  const msg = await stream.finalMessage();
  budget.add(msg.usage);
  return msg;
}

// ─── review gate ───────────────────────────────────────────────────────

export async function reviewDesign({ client, png, subject, budget, signal, readFile }) {
  const img = imageBlock(readFile(png));
  const blind = await call(client, {
    system: REVIEW_SYSTEM,
    messages: [{
      role: "user",
      content: [img, { type: "text", text: 'What real building or place does this LEGO model depict? If you cannot tell, say what kind of building it is. Then rate it 1-10 as if it were an official LEGO Architecture set. JSON: {"guess": string, "confidence": 0-1, "quality": 1-10, "strengths": [string], "problems": [string]}' }],
    }],
  }, budget, signal);
  if (blind.stop_reason === "refusal") throw new Error("reviewer refused");
  const b = parseJson(textOf(blind));
  const named = await call(client, {
    system: REVIEW_SYSTEM,
    messages: [{
      role: "user",
      content: [img, { type: "text", text: `This model is meant to be: ${subject}. A blind reviewer guessed: "${b.guess}". Judge (1) recognisable: would someone who knows ${subject} recognise it from these renders (true if the guess names it, or names the right kind of place and the signature features are present)? (2) fidelity 1-10: massing, proportions, signature features. (3) issues: concrete, actionable fixes in architectural terms (which element, which view, what to change). JSON: {"recognisable": boolean, "fidelity": 1-10, "issues": [string], "verdict": string}` }],
    }],
  }, budget, signal);
  if (named.stop_reason === "refusal") throw new Error("reviewer refused");
  const n = parseJson(textOf(named));
  const pass = Number(b.quality) >= PASS.quality && Number(n.fidelity) >= PASS.fidelity && n.recognisable === true;
  return { pass, guess: b.guess, confidence: b.confidence, quality: Number(b.quality), fidelity: Number(n.fidelity), recognisable: n.recognisable === true, strengths: b.strengths ?? [], problems: b.problems ?? [], issues: n.issues ?? [], verdict: n.verdict ?? "" };
}

// ─── designer loop ─────────────────────────────────────────────────────

/**
 * Run one design request to a verdict.
 * status: "approved" (passed the gate), "rejected" (valid but never passed
 * review), or "failed" (budget, time, refusal, API error, no valid design).
 */
export async function runDesigner({
  subject,
  brief = "",
  client,
  runDir,
  onEvent = () => {},
  budgetUsd = 20,
  maxCompiles = 12,
  maxReviews = 3,
  maxTurns = 40,
  deadlineMs = 50 * 60 * 1000,
  signal,
  readFile,
  renderFn = renderViews,
}) {
  mkdirSync(runDir, { recursive: true });
  const budget = new Budget(budgetUsd);
  const started = Date.now();
  const events = [];
  const emit = (type, data = {}) => {
    const e = { t: Math.round((Date.now() - started) / 1000), type, ...data };
    events.push(e);
    onEvent(e);
  };
  const finish = (status, extra = {}) => {
    const result = { status, subject, cost: { usd: Math.round(budget.usd * 100) / 100, tokens: budget.tokens }, seconds: Math.round((Date.now() - started) / 1000), events, ...extra };
    writeFileSync(join(runDir, "result.json"), JSON.stringify({ ...result, events: undefined }, null, 2));
    emit("done", { status, reason: extra.reason, usd: result.cost.usd });
    return result;
  };

  const messages = [{
    role: "user",
    content: `Design a LEGO Architecture model of: ${subject}.${brief ? `\nBrief: ${brief}` : ""}\nUse the whole Architecture Studio set if it helps, but every part must come from one box. Compile, study the render, refine, then submit.`,
  }];
  let compiles = 0, reviews = 0, nudges = 0, lastValid = null, lastReview = null;
  emit("start", { subject, model: MODEL, effort: EFFORT, budgetUsd });

  for (let turn = 0; turn < maxTurns; turn++) {
    if (signal?.aborted) return finish("failed", { reason: "cancelled" });
    if (budget.over) return finish(lastValid ? "rejected" : "failed", { reason: `budget of $${budgetUsd} reached`, spec: lastValid, review: lastReview });
    if (Date.now() - started > deadlineMs) return finish(lastValid ? "rejected" : "failed", { reason: "time limit reached", spec: lastValid, review: lastReview });

    let msg;
    try {
      msg = await call(client, { system: DESIGNER_SYSTEM, tools, messages }, budget, signal);
    } catch (err) {
      if (signal?.aborted) return finish("failed", { reason: "cancelled" });
      return finish("failed", { reason: apiReason(err) });
    }
    emit("turn", { stop: msg.stop_reason, usd: Math.round(budget.usd * 100) / 100, text: textOf(msg).slice(0, 400) });
    if (msg.stop_reason === "refusal") return finish("failed", { reason: "the model declined the request" });
    if (msg.stop_reason === "max_tokens") return finish("failed", { reason: "a reply hit the output limit before finishing a tool call" });
    messages.push({ role: "assistant", content: msg.content });
    if (msg.stop_reason === "pause_turn") continue;

    const uses = msg.content.filter((b) => b.type === "tool_use");
    if (!uses.length) {
      if (nudges++ >= 2) return finish(lastValid ? "rejected" : "failed", { reason: "the designer stopped without submitting", spec: lastValid, review: lastReview });
      messages.push({ role: "user", content: "Please continue: compile the design, check the render, and submit it with submit_design." });
      continue;
    }

    const results = [];
    let approved = null;
    for (const use of uses) {
      const spec = use.input?.spec;
      if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
        results.push({ type: "tool_result", tool_use_id: use.id, is_error: true, content: "INVALID_INPUT: `spec` must be the design spec as a JSON object." });
        continue;
      }
      if (use.name === "compile_design") {
        if (compiles >= maxCompiles) {
          results.push({ type: "tool_result", tool_use_id: use.id, is_error: true, content: `Compile limit (${maxCompiles}) reached. Submit your best valid design now.` });
          continue;
        }
        compiles++;
        writeFileSync(join(runDir, `spec-${compiles}.json`), JSON.stringify(spec, null, 2));
        const { report, png } = compileAndRender(spec, join(runDir, `render-${compiles}.png`), { render: true, renderFn });
        if (report.ok) lastValid = spec;
        emit("compile", { n: compiles, ok: report.ok, errors: report.errors.length + (report.moreErrors ?? 0), pieces: report.pieces, render: png ? `render-${compiles}.png` : null });
        const content = [{ type: "text", text: JSON.stringify(report, null, 1) + (png ? "" : report.ok ? "\n(render unavailable)" : "\n(no render until the design is valid)") }];
        if (png) content.push(imageBlock(readFile(png)));
        results.push({ type: "tool_result", tool_use_id: use.id, content });
      } else if (use.name === "submit_design") {
        writeFileSync(join(runDir, "submitted.json"), JSON.stringify(spec, null, 2));
        const { compiled, report, png } = compileAndRender(spec, join(runDir, `submitted-${reviews + 1}.png`), { render: true, renderFn });
        if (!report.ok) {
          emit("submit", { ok: false, errors: report.errors.length });
          results.push({ type: "tool_result", tool_use_id: use.id, is_error: true, content: `Not valid yet; fix these first:\n${report.errors.join("\n")}` });
          continue;
        }
        lastValid = spec;
        if (!png) return finish("failed", { reason: "renderer unavailable (headless Chrome), so the design cannot be reviewed", spec });
        reviews++;
        let review;
        try {
          review = await reviewDesign({ client, png, subject, budget, signal, readFile });
        } catch (err) {
          return finish("failed", { reason: `review failed: ${err.message}`, spec });
        }
        lastReview = review;
        writeFileSync(join(runDir, `review-${reviews}.json`), JSON.stringify(review, null, 2));
        emit("review", { n: reviews, pass: review.pass, quality: review.quality, fidelity: review.fidelity, recognisable: review.recognisable, guess: review.guess });
        if (review.pass) {
          approved = { spec, compiled, review, png, notes: use.input.notes ?? "" };
          results.push({ type: "tool_result", tool_use_id: use.id, content: "Approved." });
          break;
        }
        if (reviews >= maxReviews) return finish("rejected", { reason: `not approved after ${reviews} reviews`, spec, review });
        results.push({
          type: "tool_result",
          tool_use_id: use.id,
          content: `Not approved (quality ${review.quality}/10, fidelity ${review.fidelity}/10, recognised: ${review.recognisable}; the blind reviewer guessed "${review.guess}"). Both scores must reach 7 and the subject must be recognisable. Fix these, recompile, and submit again:\n- ${[...review.issues, ...review.problems].join("\n- ")}`,
        });
      } else {
        results.push({ type: "tool_result", tool_use_id: use.id, is_error: true, content: `Unknown tool ${use.name}` });
      }
    }
    if (approved) return finish("approved", { spec: approved.spec, review: approved.review, notes: approved.notes, png: approved.png, pieces: approved.compiled.stats.pieces });
    messages.push({ role: "user", content: results });
  }
  return finish(lastValid ? "rejected" : "failed", { reason: `turn limit (${maxTurns}) reached`, spec: lastValid, review: lastReview });
}

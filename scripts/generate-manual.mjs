#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// PRINT INSTRUCTION-MANUAL GENERATOR
//
// Reads the validated placement model and emits a print-ready booklet
// following LEGO instruction-manual conventions: fixed camera, per-step
// parts callouts, cumulative renders, phase dividers, parts inventory.
//
// Rendering is isometric SVG (scripts/lib/iso.mjs) rather than a raster 3D
// render: vector output stays crisp at any print size and stays small via
// <use> reuse. Part shapes, rotations and studs come from the engine
// (src/engine/shapes.ts, canonicalToLocal), the same functions the
// validator and the 3D viewer use, so the booklet draws parts as checked.
//
// Run: node scripts/generate-manual.mjs [buildId] [--print]
// ═══════════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { modelFor, phaseOrderFor } from "../src/build-models.ts";
import { FULL_INVENTORY } from "../src/inventory.ts";
import { ALL_BUILDS } from "../src/builds.ts";
import { compileDesign } from "../src/design/compile.ts";
import { designToBuild } from "../src/design/guide.ts";
import {
  ACCENT, C30, K, SET_COLOR, boundsOf, createSymbols, fitAspect,
  occupancy, painterOrder, sceneSvg as isoScene, useTag as isoUse, vbStr, visible,
} from "./lib/iso.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, "../manual");

const args = process.argv.slice(2);
const PRINT = args.includes("--print");
// --spec <file.json>: a booklet for any design spec, compiled on the spot
// (for previewing designs that are not yet approved, and for tests).
const SPEC_FILE = args.includes("--spec") ? args[args.indexOf("--spec") + 1] : null;
const SPEC = SPEC_FILE ? JSON.parse(readFileSync(SPEC_FILE, "utf8")) : null;
const BUILD_ID = SPEC?.id ?? args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--spec") ?? "barbican-panorama";

// Screen/home-print: exact A4 landscape trim. Professional POD (--print):
// A4 landscape plus 3.175mm bleed on every edge, per Lulu's spec.
const SHEET_W = PRINT ? 303 : 297;
const SHEET_H = PRINT ? 216 : 210;

// Rendering lives in scripts/lib/iso.mjs and takes every shape, rotation and
// stud from the engine, so the booklet draws parts the way they were checked.
const sym = createSymbols();
const symbols = sym.symbols;
const sceneSvg = (built, fresh, viewBox, extra = "", variant = "n") => isoScene(sym, built, fresh, viewBox, extra, variant);
const useTag = (p, variant) => isoUse(sym, p, variant);

// ─── Part icons for callouts ───────────────────────────────────────────

const iconCache = new Map();
function partIcon(src) {
  // Callout and inventory icons show the colour you actually pick up, so
  // they ignore the guide tint the scene uses for water, paving and planting.
  // Attached parts are drawn lying flat, the way they come out of the box.
  const p = { ...src, color: src.color === "trans" ? "trans" : "white", attach: false, x: 0, z: 0, layer: 0 };
  const key = `${p.kind}_${p.w}x${p.d}_${p.h}_${p.color}_${p.facing}`;
  if (!iconCache.has(key)) {
    const id = sym.idFor(p, "i");
    const b = boundsOf([p], 0.35);
    iconCache.set(key, `<svg class="pico" viewBox="${vbStr(b)}" xmlns="http://www.w3.org/2000/svg"><use href="#${id}"/></svg>`);
  }
  return iconCache.get(key);
}

// ─── Data ──────────────────────────────────────────────────────────────

let model, phaseOrder, meta;
if (SPEC) {
  const compiled = compileDesign(SPEC);
  if (!compiled.ok) {
    console.error(`spec does not compile:\n${compiled.errors.join("\n")}`);
    process.exit(1);
  }
  model = compiled.build;
  phaseOrder = compiled.phaseOrder;
  meta = designToBuild({ spec: SPEC, subject: SPEC.title, model: "", effort: "", approvedAt: "", runId: "", costUsd: 0,
    review: { guess: "", quality: 0, fidelity: 0, recognisable: false, verdict: "", strengths: [], issues: [] } }, compiled);
} else {
  model = modelFor(BUILD_ID);
  phaseOrder = phaseOrderFor(BUILD_ID);
  meta = ALL_BUILDS.find((b) => b.id === BUILD_ID);
}
const phaseMeta = new Map((meta?.phases ?? []).map((ph) => [ph.id, ph]));

const allPieces = phaseOrder.flatMap((id) => (model[id] ?? []).flat());
const FULL_VB = vbStr(boundsOf(allPieces, 1.6));

// The camera holds still inside a phase and re-frames at phase boundaries:
// the LEGO convention, and necessary here because the tower is far taller
// than the base is wide. Each phase frames everything standing at its end.
const phaseCam = new Map();
{
  const acc = [];
  for (const phaseId of phaseOrder) {
    acc.push(...(model[phaseId] ?? []).flat());
    const b = fitAspect(boundsOf(acc, 1.8));
    phaseCam.set(phaseId, { vb: vbStr(b), b });
  }
}

// Flatten to a numbered step list.
const steps = [];
for (const phaseId of phaseOrder) {
  const phase = model[phaseId] ?? [];
  phase.forEach((pieces, idx) => {
    steps.push({ phaseId, idxInPhase: idx, pieces });
  });
}
steps.forEach((s, i) => { s.n = i + 1; });

const invByPart = new Map(FULL_INVENTORY.map((e) => [e.partNumber, e]));

function calloutRows(pieces) {
  const groups = new Map();
  for (const p of pieces) {
    const key = `${p.info.partNumber}|${SET_COLOR[p.color]}|${p.kind}|${p.w}x${p.d}|${p.facing}`;
    if (!groups.has(key)) groups.set(key, { p, qty: 0 });
    groups.get(key).qty++;
  }
  return [...groups.values()].sort((a, b) => b.qty - a.qty);
}

// Whole-build usage, for the inventory pages.
const usage = new Map();
for (const p of allPieces) {
  const k = p.info.partNumber;
  if (!usage.has(k)) usage.set(k, { part: k, name: p.info.name, colors: new Set(), qty: 0 });
  const u = usage.get(k);
  u.qty++;
  u.colors.add(SET_COLOR[p.color]);
}
const usageRows = [...usage.values()].sort((a, b) => b.qty - a.qty);
const overCount = usageRows.filter((u) => {
  const inv = invByPart.get(u.part);
  return inv && u.qty > inv.totalInSet;
});

// A representative placement per part number, so the inventory can show it.
const iconForPart = new Map();
for (const p of allPieces) if (!iconForPart.has(p.info.partNumber)) iconForPart.set(p.info.partNumber, p);

// ─── Page composition ──────────────────────────────────────────────────

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function stepPanel(step, cumulative, cam) {
  const rows = calloutRows(step.pieces);
  const ph = phaseMeta.get(step.phaseId);
  const stepMeta = ph?.steps?.[step.idxInPhase];

  // Detail inset when the new work occupies a small part of the frame.
  const nb = boundsOf(step.pieces, 2.6);
  const full = cam.b;
  const wantsDetail = nb.w < full.w * 0.5 && nb.h < full.h * 0.5;
  let locator = "";
  let inset = "";
  if (wantsDetail) {
    const r = boundsOf(step.pieces, 1.4);
    locator = `<rect x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" width="${r.w.toFixed(1)}" height="${r.h.toFixed(1)}" fill="none" stroke="${ACCENT}" stroke-width="2.2" stroke-dasharray="7 5" rx="6"/>`;
    const occ = occupancy(cumulative.concat(step.pieces));
    const near = cumulative.filter((p) => {
      const b = boundsOf([p], 0);
      return b.x < nb.x + nb.w && b.x + b.w > nb.x && b.y < nb.y + nb.h && b.y + b.h > nb.y && visible(p, occ);
    });
    const items = painterOrder([...near.map((p) => ({ p, v: "i" })), ...step.pieces.map((p) => ({ p, v: "n" }))]);
    const midNew = (nb.x + nb.w / 2 - cam.b.x) / cam.b.w;
    const side = midNew > 0.5 ? " left" : "";
    inset = `<div class="inset${side}"><div class="inset-lbl">Detail</div><svg class="scene" viewBox="${vbStr(nb)}" xmlns="http://www.w3.org/2000/svg">${items.map(({ p, v }) => useTag(p, v)).join("")}</svg></div>`;
  }

  const callout = rows.map(({ p, qty }) =>
    `<div class="pitem">${partIcon(p)}<div class="pqty">${qty}&times;</div><div class="pname">${esc(p.info.name)}<span class="pnum">${esc(SET_COLOR[p.color])} &middot; ${esc(p.info.partNumber)}</span></div></div>`
  ).join("");

  return `<section class="panel">
  <header class="phead"><div class="snum">${step.n}</div><div class="stitle">${esc(stepMeta?.title ?? ph?.title ?? "")}</div></header>
  <div class="callout">${callout}</div>
  <div class="stage">${sceneSvg(cumulative, step.pieces, cam.vb, locator)}${inset}</div>
</section>`;
}

// Edition record: which edition this is, and what changed for anyone who
// built from an earlier one (the September 2026 repair, REVIEW.md).
const EDITIONS = {
  "barbican-panorama": {
    edition: "October 2026 edition",
    previous: "August 2026 edition",
    changes: [
      ["Step 29: deck upstand", "Five Brick 1×4 replace the five rounded Panel 1×4×1 along the deck edge. The panels have no studs on top, so the highwalk plates in steps 53 and 54 had nothing to grip."],
      ["Steps 62 and 63: vault caps", "Point the curved humps outward: north on the rear row, south on the front row. The flat ends with the recessed stud meet in the middle."],
      ["Step 84: crown roof", "Two Slope 1×2 (45°) sit side by side, studs to the north, both falling toward the lake. The earlier crossed pair could not physically fit."],
    ],
    parts: "Parts: 5 more Brick 1×4 (3010) and 5 fewer Panel 1×4×1 Rounded (30413). Everything else, and the step numbering, is unchanged.",
  },
};
const EDITION = EDITIONS[BUILD_ID];

const pages = [];
const page = (cls, body) =>
  pages.push(`<div class="page ${pages.length % 2 === 0 ? "recto" : "verso"} ${cls}">${body}</div>`);

// Cover -----------------------------------------------------------------
page("cover", `
  <div class="cover-art">${sceneSvg([], allPieces, FULL_VB, "", "f")}</div>
  <div class="cover-txt">
    <div class="brandline">Building Instructions</div>
    <h1>${esc(meta?.title ?? "Barbican")}</h1>
    <p class="csub">${esc(meta?.subtitle ?? "")}</p>
    <div class="cmeta"><span>${allPieces.length} pieces</span><span>${steps.length} steps</span><span>LEGO&reg; Architecture Studio 21050</span>${EDITION ? `<span>${esc(EDITION.edition)}</span>` : ""}</div>
  </div>`);

// About -----------------------------------------------------------------
page("essay", `
  <div class="ecol">
    <h2>About this model</h2>
    <p>${esc(meta?.description ?? "")}</p>
    <h3>Before you start</h3>
    <p>Sort your parts by category first. This build uses ${usageRows.length} distinct part types from the Architecture Studio set, and the largest plates form the base, so lay those out before step 1. Work on a flat surface with room for a ${Math.round((boundsOf(allPieces, 0).w / K / C30))}-stud span.</p>
    <p>The build runs ${steps.length} steps across ${phaseOrder.length} phases, averaging ${(allPieces.length / steps.length).toFixed(1)} pieces per step. It is designed to be built across several sessions; each phase divider is a natural stopping point.</p>
  </div>
  <div class="ecol">
    <h3>Estimated time</h3><p>${esc(meta?.estimatedTime ?? "")}</p>
    <h3>Concept</h3><p>${esc(meta?.concept ?? "")}</p>
    <h3>A note on colour</h3>
    <p>The Architecture Studio set contains white and trans-clear parts only. These instructions tint some renders grey and green to make water, paving and planting legible on the page. Those are white parts on the table. Every parts callout states the real colour you need, so follow the callout, not the tint.</p>
  </div>`);

// Legend ----------------------------------------------------------------
const legendPiece = { kind: "brick", w: 2, d: 4, h: 3, x: 0, z: 0, layer: 0, color: "white", facing: "S", info: { name: "Brick 2×4", partNumber: "3001" } };
page("essay legend", `
  <div class="ecol">
    <h2>How to read this manual</h2>
    <div class="lrow"><div class="lkey"><div class="snum sample">14</div></div><div class="ltxt"><b>Step number</b><br/>Steps run continuously from 1 to ${steps.length} across the whole build.</div></div>
    <div class="lrow"><div class="lkey"><div class="pitem mini">${partIcon(legendPiece)}<div class="pqty">2&times;</div></div></div><div class="ltxt"><b>Parts callout</b><br/>Everything you add in this step, with quantity, colour and part number. Gather these before you place anything.</div></div>
    <div class="lrow"><div class="lkey"><svg viewBox="0 0 60 40" class="lswatch"><rect x="4" y="8" width="52" height="24" rx="4" fill="#f0efec" stroke="#c9c6c0" stroke-width="1.4"/><rect x="14" y="14" width="32" height="12" rx="3" fill="#fdf1ea" stroke="${ACCENT}" stroke-width="2"/></svg></div><div class="ltxt"><b>New pieces are outlined in orange</b><br/>This build is almost entirely white, so the usual spot-the-difference method does not work. Parts added in the current step carry an orange outline and keep their studs; work already built is shown as flat massing.</div></div>
    <div class="lrow"><div class="lkey"><svg viewBox="0 0 60 40" class="lswatch"><rect x="6" y="6" width="48" height="28" rx="5" fill="none" stroke="${ACCENT}" stroke-width="2.2" stroke-dasharray="7 5"/></svg></div><div class="ltxt"><b>Dashed box and detail view</b><br/>When new work is small, a dashed box marks the area on the main view and a magnified <i>Detail</i> panel shows it close up.</div></div>
  </div>
  <div class="ecol">
    <h3>The camera holds still</h3>
    <p>Every view uses the same angle throughout the book, and the framing holds still for a whole phase, so the model grows in place from step to step and your eye can track what changed. The frame widens only at a phase divider, as the build outgrows it. Turn the physical model to match the page rather than turning the page.</p>
    <h3>Phases</h3>
    <p>The build is grouped into ${phaseOrder.length} phases, each opening with a divider page that shows the model at that point and explains what you are about to build.</p>
    <h3>If a piece will not sit flat</h3>
    <p>Check the step before it. Every piece in this model is validated against a physical-buildability check for collisions and support, so a piece that will not seat means something below it is one stud off.</p>
  </div>`);

// Changes since the previous edition ---------------------------------------
if (EDITION?.changes?.length) {
  page("essay changes", `
  <div class="ecol">
    <h2>Changes from the ${esc(EDITION.previous)}</h2>
    <p>If you built from the ${esc(EDITION.previous)}, three places differ. Each fixes a spot where the earlier instructions could not be built as drawn; every step in this edition has been checked for fit, grip and build order.</p>
    <p>${esc(EDITION.parts)}</p>
  </div>
  <div class="ecol">
    ${EDITION.changes.map(([t, d]) => `<h3>${esc(t)}</h3><p>${esc(d)}</p>`).join("")}
  </div>`);
}

// Inventory -------------------------------------------------------------
const perPage = 40;
const cardList = usageRows.map((u) => u.part);
for (let i = 0; i < cardList.length; i += perPage) {
  const slice = cardList.slice(i, i + perPage).map((part) => {
    const u = usage.get(part);
    const p = iconForPart.get(part);
    const inv = invByPart.get(part);
    const over = inv && u.qty > inv.totalInSet;
    return `<div class="icard${over ? " over" : ""}">${partIcon(p)}<div class="iqty">${u.qty}&times;</div><div class="iname">${esc(u.name)}</div><div class="ipart">${esc([...u.colors].join(" / "))} &middot; ${esc(part)}${inv ? ` &middot; set has ${inv.totalInSet}` : ""}</div></div>`;
  }).join("");
  page("inv", `<h2 class="invh">Parts inventory${i ? " (continued)" : ""}</h2><p class="invsub">${allPieces.length} pieces &middot; ${usageRows.length} part types &middot; every part drawn from LEGO&reg; Architecture Studio 21050</p><div class="igrid">${slice}</div>`);
}

// Phases and steps ------------------------------------------------------
const cumulative = [];
let pending = [];
const flushPanels = () => {
  while (pending.length) {
    const pair = pending.splice(0, 2);
    page("steps", pair.join(""));
  }
};

for (const phaseId of phaseOrder) {
  const ph = phaseMeta.get(phaseId);
  const phaseSteps = steps.filter((s) => s.phaseId === phaseId);
  const cam = phaseCam.get(phaseId);
  flushPanels();

  const snapshot = cumulative.slice();
  const upcoming = phaseSteps.flatMap((s) => s.pieces);
  page("divider", `
    <div class="dtxt">
      <div class="dkicker">Phase ${phaseOrder.indexOf(phaseId) + 1} of ${phaseOrder.length}</div>
      <h2>${esc(ph?.title ?? phaseId)}</h2>
      <p class="dconcept">${esc(ph?.concept ?? "")}</p>
      <p class="dloc">${esc(ph?.location ?? "")}</p>
      <div class="dmeta"><span>Steps ${phaseSteps[0].n}&ndash;${phaseSteps[phaseSteps.length - 1].n}</span><span>${upcoming.length} pieces</span>${ph?.time ? `<span>${esc(ph.time)}</span>` : ""}</div>
    </div>
    <div class="dart">${sceneSvg(snapshot, upcoming, cam.vb, "", "f")}</div>`);

  for (const step of phaseSteps) {
    pending.push(stepPanel(step, cumulative.slice(), cam));
    cumulative.push(...step.pieces);
    if (pending.length === 2) flushPanels();
  }
  flushPanels();
}

// Finished --------------------------------------------------------------
page("finish", `
  <div class="fart">${sceneSvg([], allPieces, FULL_VB, "", "f")}</div>
  <div class="ftxt"><h2>Finished</h2><p>${allPieces.length} pieces, ${steps.length} steps, ${phaseOrder.length} phases.</p>
  <p class="fnote">${overCount.length === 0
    ? "Every part in this build fits within a single Architecture Studio 21050 set."
    : `Note: ${overCount.length} part type(s) exceed a single set: ${overCount.map((o) => `${o.name} (${o.qty} needed, ${invByPart.get(o.part).totalInSet} in set)`).join("; ")}.`}</p></div>`);

// ─── Document ──────────────────────────────────────────────────────────

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
@page{size:${SHEET_W}mm ${SHEET_H}mm;margin:0}
html,body{background:#e6e5e2}
body{font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;color:#1b1b1b;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:${SHEET_W}mm;height:${SHEET_H}mm;background:#fff;position:relative;overflow:hidden;page-break-after:always;break-after:page;margin:0 auto 6mm}
@media print{.page{margin:0}}
.scene{width:100%;height:100%;display:block;overflow:hidden}

/* Cover */
.cover{background:#111;color:#fff;display:grid;grid-template-columns:1.15fr .85fr;grid-template-rows:1fr}
.cover-art{padding:14mm 6mm 14mm 12mm;min-height:0;min-width:0}
.cover-art .scene{filter:drop-shadow(0 6px 18px rgba(0,0,0,.5))}
.cover-txt{padding:20mm 14mm 14mm 4mm;display:flex;flex-direction:column;justify-content:center}
.brandline{font-size:8pt;letter-spacing:.32em;text-transform:uppercase;color:#9b9b9b;margin-bottom:6mm}
.cover h1{font-size:27pt;line-height:1.1;font-weight:700;letter-spacing:-.01em}
.csub{margin-top:5mm;font-size:10.5pt;line-height:1.5;color:#b9b9b9;max-width:78mm}
.cmeta{margin-top:12mm;display:flex;flex-direction:column;gap:2mm;font-size:8.5pt;letter-spacing:.16em;text-transform:uppercase;color:#7d7d7d}

/* Essay + legend */
.essay{display:grid;grid-template-columns:1fr 1fr;gap:12mm;padding:18mm 16mm}
.ecol h2{font-size:17pt;margin-bottom:5mm;letter-spacing:-.01em}
.ecol h3{font-size:9pt;letter-spacing:.18em;text-transform:uppercase;color:#8a8a8a;margin:7mm 0 2.5mm}
.ecol p{font-size:9.5pt;line-height:1.62;color:#333;margin-bottom:3mm}
.lrow{display:grid;grid-template-columns:26mm 1fr;gap:5mm;align-items:center;margin-bottom:6mm}
.ltxt{font-size:9pt;line-height:1.55;color:#333}
.lswatch{width:26mm;height:17mm}
.snum.sample{position:static}

/* Inventory */
.inv{padding:14mm 14mm 10mm}
.invh{font-size:15pt;margin-bottom:1.5mm}
.invsub{font-size:8.5pt;color:#8a8a8a;margin-bottom:6mm;letter-spacing:.04em}
.igrid{display:grid;grid-template-columns:repeat(8,1fr);gap:3mm}
.icard{border:.4mm solid #e2e0dc;border-radius:2mm;padding:2mm 1.5mm;text-align:center;background:#fcfcfb}
.icard.over{border-color:${ACCENT};background:#fff6f1}
.icard .pico{width:100%;height:11mm}
.iqty{font-size:11pt;font-weight:700;margin-top:.5mm}
.iname{font-size:6.4pt;line-height:1.25;color:#333;margin-top:.6mm}
.ipart{font-size:5.4pt;color:#9a9a9a;margin-top:.4mm;line-height:1.2}

/* Phase divider */
.divider{display:grid;grid-template-columns:.9fr 1.1fr;grid-template-rows:1fr;background:#f4f3f0}
.dtxt{padding:22mm 8mm 18mm 16mm;display:flex;flex-direction:column;justify-content:center}
.dkicker{font-size:8pt;letter-spacing:.3em;text-transform:uppercase;color:${ACCENT};margin-bottom:5mm}
.dtxt h2{font-size:21pt;line-height:1.15;letter-spacing:-.01em;margin-bottom:4mm}
.dconcept{font-size:10.5pt;line-height:1.5;color:#4a4a4a;margin-bottom:4mm}
.dloc{font-size:8.8pt;line-height:1.6;color:#6d6d6d}
.dmeta{margin-top:8mm;display:flex;gap:6mm;font-size:7.6pt;letter-spacing:.14em;text-transform:uppercase;color:#8d8d8d}
.dart{padding:12mm 12mm 12mm 4mm;background:#fff;min-height:0;min-width:0}

/* Step pages */
.steps{display:grid;grid-template-columns:1fr 1fr}
.panel{padding:9mm 8mm;display:flex;flex-direction:column;position:relative}
.panel+.panel{border-left:.35mm solid #ecebe7}
.phead{display:flex;align-items:baseline;gap:3.5mm;margin-bottom:3mm}
.snum{font-size:20pt;font-weight:700;line-height:1;color:#111;min-width:11mm}
.stitle{font-size:8.6pt;line-height:1.35;color:#555;letter-spacing:.01em;padding-top:.6mm}
.callout{display:flex;flex-wrap:wrap;gap:2mm;padding:2.5mm;border:.35mm solid #e2e0dc;border-radius:2mm;background:#faf9f7;margin-bottom:3mm}
.pitem{display:flex;align-items:center;gap:1.4mm;padding:.8mm 2mm .8mm .8mm;background:#fff;border:.3mm solid #ebe9e5;border-radius:1.4mm}
.pico{width:13mm;height:9mm;display:block}
.pqty{font-size:10pt;font-weight:700;color:#111}
.pname{font-size:6.4pt;line-height:1.25;color:#444;max-width:32mm}
.pnum{display:block;color:#a3a3a3;font-size:5.6pt;letter-spacing:.03em}
.stage{flex:1;position:relative;min-height:0}
.inset{overflow:hidden;position:absolute;right:0;top:0;width:44%;height:42%;background:#fff;border:.4mm solid #e2e0dc;border-radius:2mm;padding:2mm;box-shadow:0 1mm 3mm rgba(0,0,0,.07)}
.inset.left{left:0;right:auto}
.inset-lbl{position:absolute;top:1.2mm;left:2.4mm;font-size:5.8pt;letter-spacing:.2em;text-transform:uppercase;color:${ACCENT}}
.inset .scene{height:100%}

/* Finish */
.finish{display:grid;grid-template-columns:1.2fr .8fr;grid-template-rows:1fr;background:#111;color:#fff}
.fart{padding:14mm 6mm 14mm 12mm;min-height:0;min-width:0}
.ftxt{padding:0 14mm 0 4mm;display:flex;flex-direction:column;justify-content:center}
.ftxt h2{font-size:24pt;margin-bottom:4mm}
.ftxt p{font-size:10pt;line-height:1.6;color:#b9b9b9;margin-bottom:3mm}
.fnote{font-size:8.6pt;color:#8a8a8a}
`;

const PRINT_CSS = `
/* Press setup: 3.175mm bleed, 12.7mm safety inside trim, 8mm binding gutter
   mirrored across facing pages. Backgrounds still run to the sheet edge. */
.cover-art{padding:22mm 8mm 22mm 24mm}
.cover-txt{padding:26mm 22mm 22mm 6mm}
.fart{padding:22mm 8mm 22mm 24mm}
.ftxt{padding:0 22mm 0 6mm}
.essay{padding:24mm 20mm}
.inv{padding:22mm 20mm 18mm}
.dtxt{padding:28mm 10mm 24mm 24mm}
.dart{padding:20mm 22mm 20mm 6mm}
.panel{padding:15mm 12mm}
.page.recto .panel:first-child{padding-left:24mm}
.page.verso .panel:last-child{padding-right:24mm}
.page.recto.essay,.page.recto.inv{padding-left:28mm}
.page.verso.essay,.page.verso.inv{padding-right:28mm}
.page.recto .dtxt{padding-left:24mm}
`;

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<title>${esc(meta?.title ?? BUILD_ID)}: Building Instructions</title>
<style>${CSS}${PRINT ? PRINT_CSS : ""}</style></head>
<body>
${sym.defs()}
${pages.join("\n")}
</body></html>`;

mkdirSync(OUT_DIR, { recursive: true });
const outFile = resolve(OUT_DIR, `${BUILD_ID}-manual${PRINT ? "-print" : ""}.html`);
writeFileSync(outFile, html);

const mb = (Buffer.byteLength(html) / 1048576).toFixed(1);
console.log(`build      ${BUILD_ID}`);
console.log(`pieces     ${allPieces.length}`);
console.log(`steps      ${steps.length} across ${phaseOrder.length} phases`);
console.log(`part types ${usageRows.length}`);
console.log(`symbols    ${symbols.size}`);
console.log(`pages      ${pages.length}`);
console.log(`over-count ${overCount.length ? overCount.map((o) => `${o.name} ${o.qty}/${invByPart.get(o.part).totalInSet}`).join(", ") : "none"}`);
console.log(`written    ${outFile} (${mb} MB)`);

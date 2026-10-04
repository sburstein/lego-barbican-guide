#!/usr/bin/env node
// Link-preview image for the site (Open Graph and Twitter cards): the
// finished Panorama, drawn by the booklet's renderer, beside its title.
//
//   node scripts/render-og.mjs      → public/og.png (1200×630)
//
// Run it again whenever the model changes; it needs headless Chrome.

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { modelFor, phaseOrderFor } from "../src/build-models.ts";
import { boundsOf, createSymbols, sceneSvg, vbStr } from "./lib/iso.mjs";
import { screenshot } from "./render-views.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ID = "barbican-panorama";
const W = 1200, H = 630;

const pieces = phaseOrderFor(ID).flatMap((ph) => (modelFor(ID)[ph] ?? []).flat());
const sym = createSymbols();
const scene = sceneSvg(sym, [], pieces, vbStr(boundsOf(pieces, 1.6)), "", "f");

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden;background:#111;color:#fff;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;display:grid;grid-template-columns:600px 1fr}
.art{padding:28px 8px 28px 48px;min-height:0}
.scene{width:100%;height:100%;display:block}
.txt{display:flex;flex-direction:column;justify-content:center;padding:0 64px 0 32px}
.kick{font-size:15px;letter-spacing:.32em;text-transform:uppercase;color:#9a9a9a;margin-bottom:24px}
h1{font-size:60px;line-height:1.04;letter-spacing:-.015em;margin-bottom:24px}
p{font-size:24px;line-height:1.4;color:#c9c9c9}
.meta{margin-top:34px;font-size:14px;letter-spacing:.22em;text-transform:uppercase;color:#8a8a8a}
</style></head><body>${sym.defs()}
<div class="art">${scene}</div>
<div class="txt">
  <div class="kick">Fan-made build guide</div>
  <h1>The Barbican Estate</h1>
  <p>Lakeside Panorama: step-by-step 3D instructions and a printable booklet</p>
  <div class="meta">LEGO&reg; Architecture Studio 21050 &middot; ${pieces.length} pieces</div>
</div></body></html>`;

const dir = mkdtempSync(join(tmpdir(), "og-"));
const page = join(dir, "og.html");
writeFileSync(page, html);
const out = join(ROOT, "public/og.png");
if (!screenshot(page, out, W, H)) { console.error("render failed (headless Chrome)"); process.exit(1); }
console.log(`og image → ${out}`);

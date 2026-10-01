#!/usr/bin/env node
// Render a model from four sides (and optionally phase by phase) to PNG,
// for visual review by a person or by a vision model. Uses the same
// isometric renderer as the print manual, so what you review is what prints.
//
//   node scripts/render-views.mjs <buildId> [--out dir] [--phases] [--size 1600]
//
// Writes <out>/<buildId>-views.png (a 2×2 grid: front-right, and the model
// turned 90°, 180°, 270°) and, with --phases, <buildId>-phase-<n>.png.
// PNGs come from headless Chrome under a hard timeout; if Chrome is missing
// the HTML is still written next to them.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { modelFor, phaseOrderFor } from "../src/build-models.ts";
import { boundsOf, createSymbols, sceneSvg, turnPieces, vbStr } from "./lib/iso.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
};
const BUILD_ID = args.find((a, i) => !a.startsWith("--") && !["--out", "--size"].includes(args[i - 1])) ?? "barbican-panorama";
const OUT = resolve(opt("--out", resolve(HERE, "../.cache/renders")));
const SIZE = Number(opt("--size", "1600"));
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export function viewsHtml(pieces, title, subtitle = "") {
  const sym = createSymbols();
  const labels = ["View 1 (front, from the south-east)", "View 2 (turned 90°)", "View 3 (turned 180°)", "View 4 (turned 270°)"];
  const cells = [0, 1, 2, 3].map((q) => {
    const turned = turnPieces(pieces, q);
    const vb = vbStr(boundsOf(turned, 1.5));
    return `<figure><figcaption>${labels[q]}</figcaption>${sceneSvg(sym, [], turned, vb, "", "f")}</figure>`;
  });
  return page(title, subtitle, `<div class="grid">${cells.join("")}</div>`, sym);
}

function page(title, subtitle, body, sym) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>
*{box-sizing:border-box;margin:0}
body{font:14px/1.3 -apple-system,Helvetica,Arial,sans-serif;background:#fff;color:#222;width:${SIZE}px;height:${Math.round(SIZE * 0.75)}px;padding:14px;display:flex;flex-direction:column}
h1{font-size:18px;margin-bottom:2px}p{color:#777;font-size:12px;margin-bottom:8px}
.grid{flex:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:10px;min-height:0}
figure{border:1px solid #e4e2de;border-radius:6px;padding:6px;display:flex;flex-direction:column;min-height:0}
figcaption{font-size:11px;color:#999;margin-bottom:2px}
.scene{flex:1;width:100%;min-height:0}
</style></head><body><h1>${title}</h1><p>${subtitle}</p>${sym.defs()}${body}</body></html>`;
}

function phaseHtml(built, fresh, title, subtitle) {
  const sym = createSymbols();
  const vb = vbStr(boundsOf([...built, ...fresh], 1.5));
  return page(title, subtitle, `<div class="grid" style="grid-template-columns:1fr;grid-template-rows:1fr"><figure>${sceneSvg(sym, built, fresh, vb, "", "n")}</figure></div>`, sym);
}

/** Screenshot an HTML file with headless Chrome; false if unavailable. */
export function screenshot(htmlFile, pngFile, width = SIZE, height = Math.round(SIZE * 0.75)) {
  if (!existsSync(CHROME)) return false;
  // perl's alarm is the portable hard timeout on macOS (no coreutils timeout)
  execFileSync("perl", [
    "-e", "alarm shift; exec @ARGV", "90", CHROME,
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
    `--window-size=${width},${height}`, `--screenshot=${pngFile}`, `file://${htmlFile}`,
  ], { stdio: "ignore" });
  return existsSync(pngFile);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(OUT, { recursive: true });
  const model = modelFor(BUILD_ID);
  const order = phaseOrderFor(BUILD_ID);
  const all = order.flatMap((id) => (model[id] ?? []).flat());
  const html = resolve(OUT, `${BUILD_ID}-views.html`);
  writeFileSync(html, viewsHtml(all, BUILD_ID, `${all.length} pieces`));
  const png = resolve(OUT, `${BUILD_ID}-views.png`);
  console.log(screenshot(html, png) ? `wrote ${png}` : `wrote ${html} (no Chrome for PNG)`);
  if (args.includes("--phases")) {
    const built = [];
    order.forEach((id, n) => {
      const fresh = (model[id] ?? []).flat();
      const f = resolve(OUT, `${BUILD_ID}-phase-${n + 1}.html`);
      writeFileSync(f, phaseHtml(built.slice(), fresh, `${BUILD_ID}: phase ${n + 1} (${id})`, `${fresh.length} new pieces outlined`));
      const pf = resolve(OUT, `${BUILD_ID}-phase-${n + 1}.png`);
      console.log(screenshot(f, pf) ? `wrote ${pf}` : `wrote ${f}`);
      built.push(...fresh);
    });
  }
}

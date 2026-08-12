#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// PRINT INSTRUCTION-MANUAL GENERATOR
//
// Reads the validated placement model and emits a print-ready booklet
// following LEGO instruction-manual conventions: fixed camera, per-step
// parts callouts, cumulative renders, phase dividers, parts inventory.
//
// Rendering is isometric SVG rather than a raster 3D render: every piece
// is an axis-aligned solid on an integer grid, so vector output is exact,
// stays crisp at any print size, and keeps the file small via <use> reuse.
//
// Run: node scripts/generate-manual.mjs [buildId]
// ═══════════════════════════════════════════════════════════════════════

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { studCells } from "../src/lego-model.ts";
import { modelFor, phaseOrderFor } from "../src/build-models.ts";
import { FULL_INVENTORY } from "../src/inventory.ts";
import { ALL_BUILDS } from "../src/builds.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, "../manual");

const args = process.argv.slice(2);
const PRINT = args.includes("--print");
const BUILD_ID = args.find((a) => !a.startsWith("--")) ?? "barbican-panorama";

// Screen/home-print: exact A4 landscape trim. Professional POD (--print):
// A4 landscape plus 3.175mm bleed on every edge, per Lulu's spec.
const SHEET_W = PRINT ? 303 : 297;
const SHEET_H = PRINT ? 216 : 210;

// ─── Projection ────────────────────────────────────────────────────────
// Classic 30° isometric. 1 stud = 1 world unit in x/z; 1 plate = 0.4 units.

const C30 = Math.cos(Math.PI / 6);
const S30 = 0.5;
const PLATE = 0.4;
const K = 10; // world units -> SVG user units

const proj = (x, z, y) => [(x - z) * C30 * K, ((x + z) * S30 - y) * K];

// Light direction for face shading (above, slightly front-right).
const LIGHT = (() => {
  const v = [0.42, 0.86, 0.3];
  const m = Math.hypot(...v);
  return v.map((c) => c / m);
})();

// ─── Palette ───────────────────────────────────────────────────────────
// The 21050 set is white and trans-clear only. The model tints some pieces
// "dark" and "green" purely as a reading aid; the manual keeps that tint in
// the renders (it makes zones legible) but the callouts state the real
// set colour, which is always White or Trans-Clear.

const BASE = {
  white: [246, 246, 244],
  dark: [124, 129, 133],
  trans: [206, 231, 241],
  green: [111, 162, 79],
};

const SET_COLOR = { white: "White", dark: "White", trans: "Trans-Clear", green: "White" };

const ACCENT = "#E2571E";
const shadeHex = (rgb, f, mute) => {
  const g = mute ? 0.42 : 0; // blend toward paper for already-built work
  const c = rgb.map((v) => {
    const s = Math.max(0, Math.min(255, v * f));
    return Math.round(s + (255 - s) * g);
  });
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

// ─── Solid decomposition ───────────────────────────────────────────────
// Every part becomes one or more convex sub-solids expressed as polygon
// faces in piece-local world coordinates. Outward normals are recovered by
// pushing each face away from its sub-solid's centre, which is exact for
// convex pieces, so slopes and cylinders shade correctly at any facing.

/** Map canonical (span u, run v) coords to local (x, z) for a facing. */
function axes(facing, w, d) {
  switch (facing) {
    case "S": return { U: w, V: d, m: (u, v) => [u, v] };
    case "N": return { U: w, V: d, m: (u, v) => [u, d - v] };
    case "E": return { U: d, V: w, m: (u, v) => [v, u] };
    default:  return { U: d, V: w, m: (u, v) => [w - v, u] }; // W
  }
}

const box = (x0, x1, z0, z1, y0, y1) => ({
  faces: [
    [[x0, z0, y1], [x1, z0, y1], [x1, z1, y1], [x0, z1, y1]], // top
    [[x0, z0, y0], [x1, z0, y0], [x1, z1, y0], [x0, z1, y0]], // bottom
    [[x1, z0, y0], [x1, z1, y0], [x1, z1, y1], [x1, z0, y1]], // +x
    [[x0, z0, y0], [x0, z1, y0], [x0, z1, y1], [x0, z0, y1]], // -x
    [[x0, z1, y0], [x1, z1, y0], [x1, z1, y1], [x0, z1, y1]], // +z
    [[x0, z0, y0], [x1, z0, y0], [x1, z0, y1], [x0, z0, y1]], // -z
  ],
});

/** Vertical n-gon prism (round bricks and plates, and stud bodies). */
function prism(cx, cz, r, y0, y1, seg = 14) {
  const ring = [];
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    ring.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]);
  }
  const faces = [ring.map(([x, z]) => [x, z, y1]), ring.map(([x, z]) => [x, z, y0])];
  for (let i = 0; i < seg; i++) {
    const [ax, az] = ring[i];
    const [bx, bz] = ring[(i + 1) % seg];
    faces.push([[ax, az, y0], [bx, bz, y0], [bx, bz, y1], [ax, az, y1]]);
  }
  return { faces };
}

/** Wedge: flat top out to run vk, then a slope down to the deck at run V. */
function wedge(ax, hh, vk) {
  const { U, V, m } = ax;
  const p = (u, v, y) => { const [x, z] = m(u, v); return [x, z, y]; };
  return {
    faces: [
      [p(0, 0, hh), p(U, 0, hh), p(U, vk, hh), p(0, vk, hh)],       // top flat
      [p(0, vk, hh), p(U, vk, hh), p(U, V, 0), p(0, V, 0)],          // slope
      [p(0, 0, 0), p(U, 0, 0), p(U, V, 0), p(0, V, 0)],              // bottom
      [p(0, 0, 0), p(U, 0, 0), p(U, 0, hh), p(0, 0, hh)],            // back
      [p(0, 0, 0), p(0, V, 0), p(0, vk, hh), p(0, 0, hh)],           // side u=0
      [p(U, 0, 0), p(U, V, 0), p(U, vk, hh), p(U, 0, hh)],           // side u=U
    ],
  };
}

/** Inverted wedge: flat studded top, underside cut away toward the run end. */
function invWedge(ax, hh) {
  const { U, V, m } = ax;
  const vk = Math.max(0, V - 1);
  const p = (u, v, y) => { const [x, z] = m(u, v); return [x, z, y]; };
  return {
    faces: [
      [p(0, 0, hh), p(U, 0, hh), p(U, V, hh), p(0, V, hh)],          // top
      [p(0, 0, 0), p(U, 0, 0), p(U, vk, 0), p(0, vk, 0)],            // bottom flat
      [p(0, vk, 0), p(U, vk, 0), p(U, V, hh), p(0, V, hh)],          // underside slope
      [p(0, 0, 0), p(U, 0, 0), p(U, 0, hh), p(0, 0, hh)],            // back
      [p(0, 0, 0), p(0, vk, 0), p(0, V, hh), p(0, 0, hh)],           // side u=0
      [p(U, 0, 0), p(U, vk, 0), p(U, V, hh), p(U, 0, hh)],           // side u=U
    ],
  };
}

/** Half-cylinder cap extruded along the piece's longer axis. */
function curvedTopSolid(w, d, hh) {
  const alongX = w >= d;
  const r = (alongX ? d : w) / 2;
  const body = box(0, w, 0, d, 0, Math.max(0, hh - r));
  const y0 = Math.max(0, hh - r);
  const seg = 10;
  const arc = [];
  for (let i = 0; i <= seg; i++) {
    const a = Math.PI * (i / seg);
    arc.push([r - r * Math.cos(a), y0 + r * Math.sin(a)]);
  }
  const faces = [];
  const at = (t, s, y) => (alongX ? [t, s, y] : [s, t, y]);
  const L = alongX ? w : d;
  for (let i = 0; i < seg; i++) {
    const [s0, ya] = arc[i];
    const [s1, yb] = arc[i + 1];
    faces.push([at(0, s0, ya), at(L, s0, ya), at(L, s1, yb), at(0, s1, yb)]);
  }
  faces.push(arc.map(([s, y]) => at(0, s, y)));
  faces.push(arc.map(([s, y]) => at(L, s, y)));
  return [body, { faces }];
}

/** Thin wall hugging the facing edge of the piece's footprint. */
function panelSolid(w, d, hh, facing, t = 0.38) {
  switch (facing) {
    case "N": return box(0, w, 0, t, 0, hh);
    case "E": return box(w - t, w, 0, d, 0, hh);
    case "W": return box(0, t, 0, d, 0, hh);
    default:  return box(0, w, d - t, d, 0, hh);
  }
}

/** Arch: two legs and a head beam (the opening reads at print scale). */
function archSolid(w, d, hh) {
  const leg = Math.max(1, Math.round(w * 0.25));
  const head = hh * 0.42;
  return [
    box(0, leg, 0, d, 0, hh - head),
    box(w - leg, w, 0, d, 0, hh - head),
    box(0, w, 0, d, hh - head, hh),
  ];
}

/** L-shaped 2x2 corner plate, as two overlapping bars. */
function cornerSolid(w, d, hh, facing) {
  switch (facing) {
    case "S": return [box(0, w, 0, 1, 0, hh), box(0, 1, 0, d, 0, hh)];
    case "W": return [box(0, w, 0, 1, 0, hh), box(w - 1, w, 0, d, 0, hh)];
    case "N": return [box(0, w, d - 1, d, 0, hh), box(w - 1, w, 0, d, 0, hh)];
    default:  return [box(0, w, d - 1, d, 0, hh), box(0, 1, 0, d, 0, hh)];
  }
}

function solidsFor(p) {
  const { kind, w, d, facing } = p;
  const hh = p.h * PLATE;
  const ax = axes(facing, w, d);
  switch (kind) {
    case "roundBrick":
    case "roundPlate":
      return [prism(w / 2, d / 2, Math.min(w, d) / 2, 0, hh)];
    case "slope45":  return [wedge(ax, hh, Math.max(0, ax.V - 1))];
    case "slope33":  return [wedge(ax, hh, 1)];
    case "cheese":   return [wedge(ax, hh, 0)];
    case "invSlope": return [invWedge(ax, hh)];
    case "curvedTop": return curvedTopSolid(w, d, hh);
    case "arch":     return archSolid(w, d, hh);
    case "cornerPlate":
    case "cornerBrick": return cornerSolid(w, d, hh, facing);
    case "panel":
    case "glassPanel":  return [panelSolid(w, d, hh, facing)];
    default: return [box(0, w, 0, d, 0, hh)];
  }
}

// ─── Symbol emission ───────────────────────────────────────────────────

const symbols = new Map(); // key -> svg markup

function symbolKey(p, variant) {
  return `p_${p.kind}_${p.w}x${p.d}_${p.h}_${p.color}_${p.facing}_${variant}`;
}

/** Build the <g> body for one piece at local origin. */
function renderPiece(p, variant) {
  const mute = variant === "o";
  const isNew = variant === "n";
  const studded = variant === "n" || variant === "i" || variant === "f";
  const base = BASE[p.color] ?? BASE.white;
  const solids = solidsFor(p);
  const drawn = [];

  for (const solid of solids) {
    // Sub-solid centre, used to orient face normals outward.
    let cx = 0, cy = 0, cz = 0, n = 0;
    for (const f of solid.faces) for (const v of f) { cx += v[0]; cz += v[1]; cy += v[2]; n++; }
    cx /= n; cz /= n; cy /= n;

    for (const f of solid.faces) {
      const [a, b, c] = f;
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
      let nx = u[1] * v[2] - u[2] * v[1];
      let ny = u[2] * v[0] - u[0] * v[2];
      let nz = u[0] * v[1] - u[1] * v[0];
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len; ny /= len; nz /= len;
      // Face centroid, then flip the normal outward.
      let fx = 0, fy = 0, fz = 0;
      for (const q of f) { fx += q[0]; fz += q[1]; fy += q[2]; }
      fx /= f.length; fz /= f.length; fy /= f.length;
      if (nx * (fx - cx) + nz * (fz - cz) + ny * (fy - cy) < 0) { nx = -nx; ny = -ny; nz = -nz; }
      // Cull back faces: the camera looks down the (1,1,1) diagonal. Note the
      // normal's world axes are (x, z, y) -> screen depth uses x + z + y.
      const facing = nx + nz + ny;
      if (facing <= 0.0005) continue;

      const lambert = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
      const shade = 0.52 + 0.48 * lambert;
      const pts = f.map(([x, z, y]) => proj(x, z, y));
      const depth = fx + fz + fy;
      drawn.push({ depth, pts, fill: shadeHex(base, shade, mute) });
    }
  }

  drawn.sort((a, b) => a.depth - b.depth);

  const edge = shadeHex(base, 0.55, mute);
  const strokeW = isNew ? 0.9 : 0.55;
  const stroke = isNew ? ACCENT : edge;
  const op = p.color === "trans" ? (mute ? 0.4 : 0.66) : 1;

  let out = `<g${op !== 1 ? ` opacity="${op}"` : ""}>`;
  for (const f of drawn) {
    const dstr = f.pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("") + "Z";
    out += `<path d="${dstr}" fill="${f.fill}" stroke="${stroke}" stroke-width="${strokeW}" stroke-linejoin="round"/>`;
  }

  // Studs, drawn only where the piece actually presents them. Omitted on
  // already-built work: at full-model scale they add noise and a large node
  // count, and the muted massing reads better for a concrete building.
  if (studded) {
    const cells = studCells({ ...p, x: 0, z: 0 });
    const top = p.h * PLATE;
    const rx = 0.3 * Math.SQRT2 * C30 * K;
    const ry = 0.3 * Math.SQRT2 * S30 * K;
    const fill = shadeHex(base, 1.02, false);
    for (const [sx, sz] of cells) {
      const [px, py] = proj(sx + 0.5, sz + 0.5, top + 0.2);
      out += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="${(strokeW * 0.8).toFixed(2)}"/>`;
    }
  }
  return out + "</g>";
}

function symbolFor(p, variant) {
  const key = symbolKey(p, variant);
  if (!symbols.has(key)) symbols.set(key, `<g id="${key}">${renderPiece(p, variant)}</g>`);
  return key;
}

// ─── Scene assembly ────────────────────────────────────────────────────

/** SNOT pieces hang into the neighbouring cell; nudge them there to draw. */
const SNOT_DELTA = { N: [0, -0.62], S: [0, 0.62], E: [0.62, 0], W: [-0.62, 0] };

function placeOf(p) {
  if (!p.attach) return [p.x, p.z];
  const [dx, dz] = SNOT_DELTA[p.facing];
  return [p.x + dx, p.z + dz];
}

/** Painter's algorithm: draw far pieces first. Min corner is the stable key
 *  for grid-aligned solids (a max-corner key hides small parts under the
 *  large baseplate they sit on). */
const depthKey = (p) => { const [x, z] = placeOf(p); return x + z + p.layer * PLATE; };

function useTag(p, variant) {
  const id = symbolFor(p, variant);
  const [x, z] = placeOf(p);
  const [sx, sy] = proj(x, z, p.layer * PLATE);
  return `<use href="#${id}" x="${sx.toFixed(1)}" y="${sy.toFixed(1)}"/>`;
}

/** Occupancy of every 1x1x1-plate cell, used for cheap occlusion culling. */
function occupancy(pieces) {
  const set = new Set();
  for (const p of pieces) {
    if (p.attach) continue;
    for (let i = 0; i < p.w; i++)
      for (let j = 0; j < p.d; j++)
        for (let l = p.layer; l < p.layer + p.h; l++)
          set.add(`${p.x + i},${p.z + j},${l}`);
  }
  return set;
}

/** A piece is invisible when every cell it owns is blocked above, to +x and
 *  to +z. Culls buried foundation and tower interior without touching
 *  anything the builder can actually see. */
function visible(p, occ) {
  if (p.attach) return true;
  const topL = p.layer + p.h;
  for (let i = 0; i < p.w; i++) {
    for (let j = 0; j < p.d; j++) {
      const x = p.x + i, z = p.z + j;
      for (let l = p.layer; l < topL; l++) {
        if (!occ.has(`${x + 1},${z},${l}`)) return true;
        if (!occ.has(`${x},${z + 1},${l}`)) return true;
      }
      if (!occ.has(`${x},${z},${topL}`)) return true;
    }
  }
  return false;
}

function sceneSvg(built, fresh, viewBox, extraMarkup = "", freshVariant = "n") {
  const occ = occupancy([...built, ...fresh]);
  const items = [];
  for (const p of built) if (visible(p, occ)) items.push({ p, v: "o" });
  for (const p of fresh) if (freshVariant !== "f" || visible(p, occ)) items.push({ p, v: freshVariant });
  items.sort((a, b) => depthKey(a.p) - depthKey(b.p) || a.p.layer - b.p.layer);
  return `<svg class="scene" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">${
    items.map(({ p, v }) => useTag(p, v)).join("")
  }${extraMarkup}</svg>`;
}

function boundsOf(pieces, pad = 1.2) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pieces) {
    const [bx, bz] = placeOf(p);
    for (const [x, z, y] of [
      [bx, bz, p.layer * PLATE], [bx + p.w, bz, p.layer * PLATE],
      [bx, bz + p.d, p.layer * PLATE], [bx + p.w, bz + p.d, p.layer * PLATE],
      [bx, bz, (p.layer + p.h) * PLATE], [bx + p.w, bz, (p.layer + p.h) * PLATE],
      [bx, bz + p.d, (p.layer + p.h) * PLATE], [bx + p.w, bz + p.d, (p.layer + p.h) * PLATE],
    ]) {
      const [sx, sy] = proj(x, z, y);
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx);
      y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
  }
  const px = pad * K, py = pad * K;
  return { x: x0 - px, y: y0 - py, w: x1 - x0 + 2 * px, h: y1 - y0 + 2 * py };
}

const vbStr = (b) => `${b.x.toFixed(1)} ${b.y.toFixed(1)} ${b.w.toFixed(1)} ${b.h.toFixed(1)}`;

/** Grow a bounding box to a target aspect ratio so it fills the stage. */
const STAGE_ASPECT = 0.83;
function fitAspect(b, aspect = STAGE_ASPECT) {
  let { x, y, w, h } = b;
  if (w / h < aspect) { const nw = h * aspect; x -= (nw - w) / 2; w = nw; }
  else { const nh = w / aspect; y -= (nh - h) * 0.74; h = nh; }
  return { x, y, w, h };
}

// ─── Part icons for callouts ───────────────────────────────────────────

const iconCache = new Map();
function partIcon(src) {
  // Callout and inventory icons must show the colour you actually pick up, so
  // they ignore the guide tint the scene uses for water, paving and planting.
  const p = { ...src, color: src.color === "trans" ? "trans" : "white" };
  const key = `${p.kind}_${p.w}x${p.d}_${p.h}_${p.color}_${p.facing}`;
  if (!iconCache.has(key)) {
    const id = `i_${key}`;
    symbols.set(id, `<g id="${id}">${renderPiece({ ...p, x: 0, z: 0, layer: 0 }, "i")}</g>`);
    const b = boundsOf([{ ...p, x: 0, z: 0, layer: 0 }], 0.35);
    iconCache.set(key, `<svg class="pico" viewBox="${vbStr(b)}" xmlns="http://www.w3.org/2000/svg"><use href="#${id}"/></svg>`);
  }
  return iconCache.get(key);
}

// ─── Data ──────────────────────────────────────────────────────────────

const model = modelFor(BUILD_ID);
const phaseOrder = phaseOrderFor(BUILD_ID);
const meta = ALL_BUILDS.find((b) => b.id === BUILD_ID);
const phaseMeta = new Map((meta?.phases ?? []).map((ph) => [ph.id, ph]));

const allPieces = phaseOrder.flatMap((id) => (model[id] ?? []).flat());
const FULL_VB = vbStr(boundsOf(allPieces, 1.6));

// The camera holds still inside a phase and re-frames at phase boundaries —
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
    const items = [...near.map((p) => ({ p, v: "i" })), ...step.pieces.map((p) => ({ p, v: "n" }))]
      .sort((a, b) => depthKey(a.p) - depthKey(b.p) || a.p.layer - b.p.layer);
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
    <div class="cmeta"><span>${allPieces.length} pieces</span><span>${steps.length} steps</span><span>LEGO&reg; Architecture Studio 21050</span></div>
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
<title>${esc(meta?.title ?? BUILD_ID)} — Building Instructions</title>
<style>${CSS}${PRINT ? PRINT_CSS : ""}</style></head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${[...symbols.values()].join("")}</defs></svg>
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

// Isometric SVG renderer for placement models, shared by the print manual
// and the review renders.
//
// Geometry comes from the engine, never from here: part bodies from
// src/engine/shapes.ts, rotation from canonicalToLocal() and studs from the
// part table, the same functions the validator uses. So a part is drawn
// exactly the way it was checked.
//
// Every solid in the shape table is convex, so each face can be shaded and
// back-face culled on its own, and pieces are ordered with a painter's sort.

import { canonicalToLocal, defOf, footprintCells, FACE_DIR } from "../../src/engine/model.ts";
import { partSolids, solidFaces } from "../../src/engine/shapes.ts";

// ─── Projection ────────────────────────────────────────────────────────
// Classic 30° isometric. 1 stud = 1 world unit in x/z; 1 plate = 0.4 units.

export const C30 = Math.cos(Math.PI / 6);
export const S30 = 0.5;
export const PLATE = 0.4;
export const K = 10; // world units -> SVG user units

export const proj = (x, z, y) => [(x - z) * C30 * K, ((x + z) * S30 - y) * K];

// Points are [x, z, y] throughout this file (plan first, then height).
// Light from above, slightly front-right, in that same [x, z, y] order.
const LIGHT = (() => {
  const v = [0.42, 0.3, 0.86];
  const m = Math.hypot(...v);
  return v.map((c) => c / m);
})();

// ─── Palette ───────────────────────────────────────────────────────────
// The 21050 set is white and trans-clear only. Models tint some pieces
// "dark" and "green" as a reading aid; renders keep the tint, callouts state
// the real set colour.

export const BASE = {
  white: [246, 246, 244],
  dark: [124, 129, 133],
  trans: [206, 231, 241],
  green: [111, 162, 79],
};
export const SET_COLOR = { white: "White", dark: "White", trans: "Trans-Clear", green: "White" };
export const ACCENT = "#E2571E";

export const shadeHex = (rgb, f, mute) => {
  const g = mute ? 0.42 : 0; // blend toward paper for already-built work
  const c = rgb.map((v) => {
    const s = Math.max(0, Math.min(255, v * f));
    return Math.round(s + (255 - s) * g);
  });
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

// ─── Geometry from the engine ──────────────────────────────────────────

/**
 * Faces of a placed part relative to its origin cell, as [x, z, y] points
 * in world units (y already scaled). Ordinary parts use canonicalToLocal;
 * an attached (SNOT) part stands on edge against its host's face: its
 * thickness points out of the face, its depth runs up the face, centred on
 * the side stud 0.75 plates above the attach layer.
 */
export function pieceSolids(p) {
  const d = defOf(p);
  if (!d) return [];
  const solids = partSolids(p.kind, d).map(solidFaces);
  if (p.attach) {
    const [fx, fz] = FACE_DIR[p.facing];
    const centre = 0.75 * PLATE;
    const map = ([u, v, y]) => {
      const out = y * PLATE; // thickness, away from the host face
      const up = centre + (0.5 - v); // canonical depth runs up the face
      // along the face: u runs across it
      if (fx === 0) return [u, fz > 0 ? 1 + out : -out, up];
      return [fx > 0 ? 1 + out : -out, u, up];
    };
    return solids.map((faces) => faces.map((f) => f.map(map)));
  }
  return solids.map((faces) =>
    faces.map((f) => f.map(([u, v, y]) => {
      const [x, z] = canonicalToLocal(p, u, v, d);
      return [x, z, y * PLATE];
    }))
  );
}

/** Top-stud centres of a placed part, relative to its origin, [x, z]. */
export function pieceStuds(p) {
  const d = defOf(p);
  if (!d || p.attach) return [];
  const pts = d.top.map(([i, j]) => canonicalToLocal(p, i + 0.5, j + 0.5, d));
  if (p.kind === "jumper") pts.push(canonicalToLocal(p, d.W / 2, d.D / 2, d));
  return pts;
}

// ─── Piece symbols ─────────────────────────────────────────────────────

/**
 * Variants: "n" new in this step (accent outline, studs), "o" already built
 * (muted, no studs), "f" finished render (studs), "i" icon (studs).
 */
export function renderPiece(p, variant) {
  const mute = variant === "o";
  const isNew = variant === "n";
  const studded = variant !== "o";
  const base = BASE[p.color] ?? BASE.white;
  const drawn = [];

  for (const faces of pieceSolids(p)) {
    let cx = 0, cy = 0, cz = 0, n = 0;
    for (const f of faces) for (const v of f) { cx += v[0]; cz += v[1]; cy += v[2]; n++; }
    cx /= n; cz /= n; cy /= n;

    for (const f of faces) {
      // Normal as a cross product in [x, z, y] index space; every component
      // below stays in that order.
      const [a, b, c] = f;
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
      let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const len = Math.hypot(...n);
      if (len < 1e-12) continue;
      n = n.map((k) => k / len);
      let fx = 0, fy = 0, fz = 0;
      for (const q of f) { fx += q[0]; fz += q[1]; fy += q[2]; }
      fx /= f.length; fz /= f.length; fy /= f.length;
      // outward: away from the convex solid's centre
      if (n[0] * (fx - cx) + n[1] * (fz - cz) + n[2] * (fy - cy) < 0) n = n.map((k) => -k);
      // The camera looks down the (1,1,1) diagonal, so a face is visible
      // when its normal has a positive x + z + y.
      if (n[0] + n[1] + n[2] <= 0.0005) continue;
      const lambert = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
      drawn.push({
        depth: fx + fz + fy,
        pts: f.map(([x, z, y]) => proj(x, z, y)),
        fill: shadeHex(base, 0.52 + 0.48 * lambert, mute),
      });
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
  // Studs only where the part table puts them; omitted on already-built
  // work, where they add noise and node count at full-model scale.
  if (studded) {
    const top = p.h * PLATE;
    const rx = 0.3 * Math.SQRT2 * C30 * K;
    const ry = 0.3 * Math.SQRT2 * S30 * K;
    const fill = shadeHex(base, 1.02, false);
    for (const [sx, sz] of pieceStuds(p)) {
      const [px, py] = proj(sx, sz, top + 0.2);
      out += `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="${(strokeW * 0.8).toFixed(2)}"/>`;
    }
  }
  return out + "</g>";
}

/** A symbol registry: each distinct piece look is emitted once as <g id>. */
export function createSymbols() {
  const symbols = new Map();
  const keyOf = (p, variant) =>
    `p_${p.kind}_${p.w}x${p.d}_${p.h}_${p.color}_${p.facing}${p.attach ? "_a" : ""}_${variant}`;
  return {
    symbols,
    idFor(p, variant) {
      const key = keyOf(p, variant);
      if (!symbols.has(key)) symbols.set(key, `<g id="${key}">${renderPiece(p, variant)}</g>`);
      return key;
    },
    defs() {
      return `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${[...symbols.values()].join("")}</defs></svg>`;
    },
  };
}

// ─── Scene assembly ────────────────────────────────────────────────────

/** Painter's key: the min corner, which is stable for grid-aligned solids. */
export const depthKey = (p) => p.x + p.z + p.layer * PLATE;

export function useTag(sym, p, variant) {
  const id = sym.idFor(p, variant);
  const [sx, sy] = proj(p.x, p.z, p.layer * PLATE);
  return `<use href="#${id}" x="${sx.toFixed(1)}" y="${sy.toFixed(1)}"/>`;
}

/** Occupied (x, z, layer) cells from real footprints. */
export function occupancy(pieces) {
  const set = new Set();
  for (const p of pieces) {
    if (p.attach) continue;
    for (const [x, z] of footprintCells(p))
      for (let l = p.layer; l < p.layer + p.h; l++) set.add(`${x},${z},${l}`);
  }
  return set;
}

/** Hidden when every cell the piece owns is covered above, to +x and to +z. */
export function visible(p, occ) {
  if (p.attach) return true;
  const topL = p.layer + p.h;
  for (const [x, z] of footprintCells(p)) {
    for (let l = p.layer; l < topL; l++) {
      if (!occ.has(`${x + 1},${z},${l}`)) return true;
      if (!occ.has(`${x},${z + 1},${l}`)) return true;
    }
    if (!occ.has(`${x},${z},${topL}`)) return true;
  }
  return false;
}

// ─── Painter's order ───────────────────────────────────────────────────

const boxCache = new WeakMap();
/** World AABB [x, z, y] min and max, plus its screen rectangle. */
function worldBox(p) {
  let b = boxCache.get(p);
  if (b) return b;
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  const oy = p.layer * PLATE;
  for (const faces of pieceSolids(p)) for (const f of faces) for (const [x, z, y] of f) {
    const q = [p.x + x, p.z + z, oy + y];
    for (let k = 0; k < 3; k++) { if (q[k] < min[k]) min[k] = q[k]; if (q[k] > max[k]) max[k] = q[k]; }
  }
  if (!Number.isFinite(min[0])) { min.fill(0); max.fill(0); }
  let sx0 = Infinity, sx1 = -Infinity, sy0 = Infinity, sy1 = -Infinity;
  for (const x of [min[0], max[0]]) for (const z of [min[1], max[1]]) for (const y of [min[2], max[2]]) {
    const [sx, sy] = proj(x, z, y);
    sx0 = Math.min(sx0, sx); sx1 = Math.max(sx1, sx); sy0 = Math.min(sy0, sy); sy1 = Math.max(sy1, sy);
  }
  b = { min, max, screen: [sx0, sy0, sx1, sy1] };
  boxCache.set(p, b);
  return b;
}

/**
 * Order pieces back to front. Two pieces whose screen footprints overlap are
 * ordered by a separating axis: the camera sits at +x, +z, +y, so a piece
 * entirely at lower x (or lower z, or below) is behind and drawn first. The
 * old single sort key (the front corner) let a long plate behind a raised
 * part paint over it. Ties and cycles fall back to the corner key.
 */
export function painterOrder(items) {
  const n = items.length;
  const boxes = items.map((it) => worldBox(it.p));
  const after = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  const E = 1e-6;
  for (let i = 0; i < n; i++) {
    const A = boxes[i];
    for (let j = i + 1; j < n; j++) {
      const B = boxes[j];
      if (A.screen[2] <= B.screen[0] || B.screen[2] <= A.screen[0] || A.screen[3] <= B.screen[1] || B.screen[3] <= A.screen[1]) continue;
      let aBehind = 0, bBehind = 0;
      for (let k = 0; k < 3; k++) {
        if (A.max[k] <= B.min[k] + E) aBehind++;
        if (B.max[k] <= A.min[k] + E) bBehind++;
      }
      if (aBehind && !bBehind) { after[i].push(j); indeg[j]++; }
      else if (bBehind && !aBehind) { after[j].push(i); indeg[i]++; }
    }
  }
  const key = (i) => depthKey(items[i].p) + items[i].p.layer * 1e-3;
  const ready = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) ready.push(i);
  const out = [];
  const done = new Array(n).fill(false);
  while (out.length < n) {
    if (!ready.length) {
      // a cycle (interlocking parts): release the remaining piece with the
      // lowest corner key
      let best = -1;
      for (let i = 0; i < n; i++) if (!done[i] && (best < 0 || key(i) < key(best))) best = i;
      ready.push(best);
      indeg[best] = 0;
    }
    let bi = 0;
    for (let r = 1; r < ready.length; r++) if (key(ready[r]) < key(ready[bi])) bi = r;
    const i = ready.splice(bi, 1)[0];
    if (done[i]) continue;
    done[i] = true;
    out.push(items[i]);
    for (const j of after[i]) if (--indeg[j] === 0 && !done[j]) ready.push(j);
  }
  return out;
}

export function sceneSvg(sym, built, fresh, viewBox, extraMarkup = "", freshVariant = "n") {
  const occ = occupancy([...built, ...fresh]);
  let items = [];
  for (const p of built) if (visible(p, occ)) items.push({ p, v: "o" });
  for (const p of fresh) if (freshVariant !== "f" || visible(p, occ)) items.push({ p, v: freshVariant });
  items = painterOrder(items);
  return `<svg class="scene" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg">${
    items.map(({ p, v }) => useTag(sym, p, v)).join("")
  }${extraMarkup}</svg>`;
}

/** Screen bounds of pieces, from their real faces. */
export function boundsOf(pieces, pad = 1.2) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pieces) {
    const oy = p.layer * PLATE;
    for (const faces of pieceSolids(p)) for (const f of faces) for (const [x, z, y] of f) {
      const [sx, sy] = proj(p.x + x, p.z + z, oy + y);
      if (sx < x0) x0 = sx;
      if (sx > x1) x1 = sx;
      if (sy < y0) y0 = sy;
      if (sy > y1) y1 = sy;
    }
  }
  if (!Number.isFinite(x0)) return { x: 0, y: 0, w: 10, h: 10 };
  const px = pad * K, py = pad * K;
  return { x: x0 - px, y: y0 - py, w: x1 - x0 + 2 * px, h: y1 - y0 + 2 * py };
}

export const vbStr = (b) => `${b.x.toFixed(1)} ${b.y.toFixed(1)} ${b.w.toFixed(1)} ${b.h.toFixed(1)}`;

/** Grow a bounding box to a target aspect ratio so it fills the stage. */
export function fitAspect(b, aspect = 0.83) {
  let { x, y, w, h } = b;
  if (w / h < aspect) { const nw = h * aspect; x -= (nw - w) / 2; w = nw; }
  else { const nh = w / aspect; y -= (nh - h) * 0.74; h = nh; }
  return { x, y, w, h };
}

// ─── Views ─────────────────────────────────────────────────────────────

const TURN = { N: "E", E: "S", S: "W", W: "N" };

/**
 * Turn a placement a quarter turn about the vertical axis (x, z) -> (-z, x).
 * Footprint, facing and SNOT direction all turn with it, so a validated
 * model stays valid; used to render the model from its other sides.
 */
export function turnPlacement(p) {
  if (p.attach) return { ...p, x: -p.z - 1, z: p.x, facing: TURN[p.facing] };
  return { ...p, x: -(p.z + p.d), z: p.x, w: p.d, d: p.w, facing: TURN[p.facing] };
}

export function turnPieces(pieces, quarters) {
  let out = pieces;
  for (let q = 0; q < ((quarters % 4) + 4) % 4; q++) out = out.map(turnPlacement);
  return out;
}

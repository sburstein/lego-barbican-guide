// Part-table check against LDraw, the community library that models every
// real LEGO part to the LDU. For each part in src/engine/parts.ts it asks:
// is there a rotation in which our part has the same footprint, the same
// height, the same studs on top, and (for slopes) falls toward the same side
// as the real part? Any mismatch fails the harness.
//
//   node scripts/check-parts.mjs            # check every part
//   node scripts/check-parts.mjs --verbose  # print every part, not just failures
//
// LDraw files are fetched one at a time from library.ldraw.org on first use
// and cached in .cache/ldraw (about 1 MB for the whole 21050 set).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzePart, ldrawRoot } from "./lib/ldraw.mjs";
import { allParts } from "../src/engine/parts.ts";
import { partSolids, topHeightAt } from "../src/engine/shapes.ts";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = ldrawRoot(REPO);
const VERBOSE = process.argv.includes("--verbose");

// Our part numbers (BrickLink style) -> LDraw file names where they differ.
const LDRAW_NAME = {
  "3024w": "3024", "3023w": "3023b", "3023": "3023b", "3040": "3040b",
  "3665": "3665a", "3660": "3660a", "4287": "4287a", "4032": "4032a",
  "4073": "6141", "60481": "60481a",
};

// ─── fetch on demand ─────────────────────────────────────────────────────
const BASE = "https://library.ldraw.org/library/official";
async function fetchFile(rel) {
  for (const dir of ["parts", "p"]) {
    const local = join(ROOT, dir, rel);
    if (existsSync(local)) return local;
  }
  for (const dir of ["parts", "p"]) {
    const res = await fetch(`${BASE}/${dir}/${rel}`);
    if (!res.ok) continue;
    const local = join(ROOT, dir, rel);
    mkdirSync(dirname(local), { recursive: true });
    writeFileSync(local, await res.text());
    return local;
  }
  return null;
}
async function ensure(name, seen = new Set()) {
  const rel = name.toLowerCase().replace(/\\/g, "/");
  if (seen.has(rel)) return;
  seen.add(rel);
  const file = await fetchFile(rel);
  if (!file) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim().split(/\s+/);
    if (t[0] === "1") await ensure(t.slice(14).join(" "), seen);
    const moved = line.match(/^0\s+~?Moved to\s+(\S+)/i);
    if (moved) await ensure(`${moved[1]}.dat`, seen);
  }
}

// ─── comparison ─────────────────────────────────────────────────────────
const keyOf = (cells) => cells.map(([i, j]) => `${i},${j}`).sort().join(" ");

/** Rotate a cell set by quarter turns within a W×D box, normalised to 0,0. */
function rotate(cells, W, D, quarter) {
  let out = cells, w = W, d = D;
  for (let q = 0; q < quarter; q++) {
    out = out.map(([i, j]) => [d - 1 - j, i]);
    [w, d] = [d, w];
  }
  return { cells: out, W: w, D: d };
}

function ldrawSets(a) {
  const occ = [];
  for (let j = 0; j < a.d; j++) for (let i = 0; i < a.w; i++) if (a.occupied[j][i]) occ.push([i, j]);
  const top = a.topStuds.filter((s) => Math.abs(s.level - a.heightPlates) < 0.4).map((s) => [s.i, s.j]);
  return { occ, top };
}

/** Mean top height of each canonical row (j), in the matched rotation. */
function rowProfile(a, quarter) {
  const pts = [];
  for (let gj = 0; gj < a.field.length; gj++)
    for (let gi = 0; gi < a.field[gj].length; gi++)
      if (a.field[gj][gi] >= 0) pts.push([gi / a.res, gj / a.res, a.field[gj][gi]]);
  let w = a.w, d = a.d;
  let rp = pts;
  for (let q = 0; q < quarter; q++) {
    rp = rp.map(([x, z, h]) => [d - z, x, h]);
    [w, d] = [d, w];
  }
  const rows = Array.from({ length: d }, () => []);
  for (const [, z, h] of rp) {
    const j = Math.min(d - 1, Math.max(0, Math.floor(z)));
    rows[j].push(h);
  }
  return rows.map((r) => (r.length ? r.reduce((s, v) => s + v, 0) / r.length : 0));
}

/** Rotate a height field (rows j, columns i) by quarter turns, like rotate(). */
function rotateField(field, quarter) {
  let f = field;
  for (let q = 0; q < quarter; q++) {
    const gd = f.length, gw = f[0].length;
    const out = Array.from({ length: gw }, () => new Array(gd).fill(-1));
    for (let gj = 0; gj < gd; gj++) for (let gi = 0; gi < gw; gi++) out[gi][gd - 1 - gj] = f[gj][gi];
    f = out;
  }
  return f;
}

/**
 * Compare the renderer shape (shapes.ts) with the real part's top surface,
 * bin by bin (4 per stud). Studded cells are compared at their corner bins
 * only, where no stud sits. Returns the share of bins off by more than one
 * plate and the mean error.
 */
function shapeError(part, a, quarter) {
  const solids = partSolids(part.kind, part);
  const real = rotateField(a.field, quarter);
  const studded = new Set(part.top.map(([i, j]) => `${i},${j}`));
  const res = a.res;
  // thresholds scale with the part, so a wrong corner on a one-plate part
  // counts as much as one on a brick
  const badAt = Math.min(1.0, 0.6 * part.h);
  let n = 0, bad = 0, sum = 0, max = 0;
  const worst = [];
  for (let gj = 0; gj < real.length; gj++) {
    for (let gi = 0; gi < real[gj].length; gi++) {
      const ci = Math.floor(gi / res), cj = Math.floor(gj / res);
      const bi = gi % res, bj = gj % res;
      const corner = (bi === 0 || bi === res - 1) && (bj === 0 || bj === res - 1);
      if (studded.has(`${ci},${cj}`) && !corner) continue;
      let ours = -1;
      // LDraw bins include their lower edge, so sample ours the same way
      for (const fu of [0, 0.5, 0.97]) for (const fv of [0, 0.5, 0.97])
        ours = Math.max(ours, topHeightAt(solids, (gi + fu) / res, (gj + fv) / res));
      const theirs = real[gj][gi];
      if (theirs < 0 && ours < 0) continue;
      let err = Math.abs(Math.max(0, ours) - Math.max(0, theirs));
      // A pocket around the studs (real top lower than ours inside a studded
      // cell) is cosmetic: the studs, which do the work, are checked above.
      if (studded.has(`${ci},${cj}`) && theirs >= 0 && theirs < ours) err = 0;
      n++;
      sum += err;
      max = Math.max(max, err);
      if (err > badAt) { bad++; worst.push(`(${((gi + 0.5) / res).toFixed(2)},${((gj + 0.5) / res).toFixed(2)}) ours ${ours.toFixed(1)} real ${theirs.toFixed(1)}`); }
    }
  }
  return { badShare: n ? bad / n : 0, mean: n ? sum / n : 0, max, maxAllowed: Math.min(1.5, 0.9 * part.h), worst };
}

const SHAPE_VERBOSE = process.argv.includes("--shapes");

const SLOPED = new Set(["slope45", "slope33", "steepSlope2", "steepSlope3", "curvedSlope", "cheese"]);

let failures = 0;
const parts = allParts();
for (const part of parts) {
  const pns = typeof part.pn === "string" ? [part.pn] : [part.pn.white, part.pn.trans];
  for (const pn of pns) {
    const ld = LDRAW_NAME[pn] ?? pn;
    await ensure(`${ld}.dat`);
    const a = analyzePart(ROOT, ld);
    const label = `${part.name.padEnd(28)} ${pn.padEnd(6)}`;
    if (!a || a.empty) {
      console.log(`✗ ${label} no LDraw geometry for ${ld}`);
      failures++;
      continue;
    }
    const problems = [];
    if (Math.abs(a.heightPlates - part.h) > 0.2)
      problems.push(`height ${part.h} plates, real part is ${a.heightPlates}`);

    const L = ldrawSets(a);
    // Every rotation in which the real part looks like ours. A studless part
    // can match in two, so the slope test below accepts either.
    const matches = [];
    for (let q = 0; q < 4; q++) {
      const ro = rotate(L.occ, a.w, a.d, q);
      const rt = rotate(L.top, a.w, a.d, q);
      if (ro.W !== part.W || ro.D !== part.D) continue;
      if (keyOf(ro.cells) === keyOf(part.occupied) && keyOf(rt.cells) === keyOf(part.top)) matches.push(q);
    }
    if (!matches.length) {
      problems.push(
        `shape/studs differ: ours ${part.W}×${part.D} body[${keyOf(part.occupied)}] studs[${keyOf(part.top)}]; ` +
          `real ${a.w}×${a.d} body[${keyOf(L.occ)}] studs[${keyOf(L.top)}]`
      );
    } else if (SLOPED.has(part.kind) && part.D > 1) {
      const profiles = matches.map((q) => rowProfile(a, q));
      if (!profiles.some((prof) => prof[0] > prof[prof.length - 1] + 0.3))
        problems.push(`slope falls the wrong way: back-to-front row heights ${profiles[0].map((v) => v.toFixed(1)).join(" → ")}`);
    }

    if (matches.length) {
      // Any matching rotation may be the right one for a symmetric shape.
      const scored = matches.map((q) => shapeError(part, a, q)).sort((x, y) => x.badShare - y.badShare || x.mean - y.mean);
      const best = scored[0];
      // Any single bin off by more than 1.5 plates is a wrong shape, not a
      // sampling edge; a few bins just over one plate are edge effects.
      if (best.badShare > 0.12 || best.mean > 0.45 || best.max > best.maxAllowed)
        problems.push(`renderer shape differs from the real part: ${(best.badShare * 100).toFixed(0)}% of the top surface off by more than a plate, worst ${best.max.toFixed(1)}, mean ${best.mean.toFixed(2)} plates; e.g. ${best.worst.slice(0, 3).join("; ")}`);
      else if (SHAPE_VERBOSE)
        console.log(`  shape ${part.name.padEnd(28)} ${pn.padEnd(6)} ${(best.badShare * 100).toFixed(0).padStart(3)}% bins off, worst ${best.max.toFixed(1)}, mean ${best.mean.toFixed(2)}`);
    }

    if (problems.length) {
      failures++;
      console.log(`✗ ${label} ${problems.join("; ")}`);
    } else if (VERBOSE) {
      console.log(`✓ ${label} ${part.W}×${part.D}×${part.h} studs ${part.top.length}`);
    }
  }
}
console.log(
  failures
    ? `\n${failures} part(s) do not match the real LEGO geometry`
    : `✓ All ${parts.length} parts match LDraw geometry (footprint, height, studs, slope direction, renderer shape).`
);
process.exit(failures ? 1 : 0);

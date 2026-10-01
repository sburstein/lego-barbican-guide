// Minimal LDraw reader used as ground truth for part geometry.
//
// The LDraw library (library.ldraw.org) models every real LEGO part to the
// LDU: 1 stud = 20 LDU, 1 plate = 8 LDU, -Y is up. We flatten a part file
// recursively, applying each subfile's transform, and collect three things:
//   - the bounding box of the body (stud primitives excluded), giving the
//     real footprint in studs and the real height in plates;
//   - every connectable stud, with its position and the direction it points,
//     so we know which cells carry studs on top and which faces carry side
//     studs (SNOT);
//   - a coarse height field of the top surface, so we can tell which way a
//     slope or curved top actually falls.
//
// Download the library once with `node scripts/harness.mjs ldraw` (cached in
// .cache/ldraw, gitignored).

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Primitives that are connectable studs (top or side). Tubes and underside
// anti-studs are excluded on purpose.
const STUD_PRIMS = new Set([
  "stud", "stud2", "stud2a", "studa", "stud-logo", "stud-logo2", "stud-logo3",
  "stud-logo4", "stud-logo5", "stud2-logo", "stud2-logo2", "stud2-logo3",
  "stud2-logo4", "stud2-logo5", "stud6", "stud6a", "stud9", "stud10", "stud13",
  "stud15", "stud17", "stud17a", "stud26", "studel", "studh", "studhl", "studhr",
  "studp01", "studx", "studxa",
]);

export function ldrawRoot(repoRoot) {
  return join(repoRoot, ".cache/ldraw/ldraw");
}

function resolveFile(root, name) {
  const n = name.toLowerCase().replace(/\\/g, "/");
  for (const dir of ["parts", "p", "models", ""]) {
    const f = join(root, dir, n);
    if (existsSync(f)) return f;
  }
  return null;
}

const fileCache = new Map();
function readLines(path) {
  let lines = fileCache.get(path);
  if (!lines) {
    lines = readFileSync(path, "utf8").split(/\r?\n/);
    fileCache.set(path, lines);
  }
  return lines;
}

// 3x4 affine transform as [a b c x; d e f y; g h i z]
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
function mul(m, n) {
  // m * n, both 3x4 affine (implicit last row 0 0 0 1)
  const r = new Array(12);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      r[row * 4 + col] =
        m[row * 4] * n[col] + m[row * 4 + 1] * n[4 + col] + m[row * 4 + 2] * n[8 + col];
    }
    r[row * 4 + 3] =
      m[row * 4] * n[3] + m[row * 4 + 1] * n[7] + m[row * 4 + 2] * n[11] + m[row * 4 + 3];
  }
  return r;
}
function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
function apply(m, x, y, z) {
  return [
    m[0] * x + m[1] * y + m[2] * z + m[3],
    m[4] * x + m[5] * y + m[6] * z + m[7],
    m[8] * x + m[9] * y + m[10] * z + m[11],
  ];
}

/**
 * Flatten a part into body points (vertices of triangles/quads/lines) and
 * studs. Returns null if the part file is missing.
 */
export function analyzePart(root, partNum, { res = 4 } = {}) {
  const file = resolveFile(root, `${partNum}.dat`);
  if (!file) return null;
  const points = [];
  const samples = [];
  const studs = [];
  let title = readLines(file)[0]?.replace(/^0\s*/, "").trim() ?? partNum;

  const walk = (path, m, depth) => {
    if (depth > 30) return;
    for (const raw of readLines(path)) {
      const line = raw.trim();
      if (!line) continue;
      const t = line.split(/\s+/);
      const type = t[0];
      if (type === "1") {
        const v = t.slice(2, 14).map(Number);
        const sub = t.slice(14).join(" ");
        const local = [v[3], v[4], v[5], v[0], v[6], v[7], v[8], v[1], v[9], v[10], v[11], v[2]];
        const mm = mul(m, local);
        const base = sub.toLowerCase().replace(/\\/g, "/").split("/").pop().replace(/\.dat$/, "");
        if (STUD_PRIMS.has(base)) {
          const o = apply(mm, 0, 0, 0);
          // stud points along its local -Y; its tip is 4 LDU out (scaled
          // studs stretch down into the part, so the base is unreliable)
          const tip = apply(mm, 0, -4, 0);
          studs.push({ pos: o, tip, dir: [tip[0] - o[0], tip[1] - o[1], tip[2] - o[2]], prim: base });
          continue;
        }
        const subPath = resolveFile(root, sub);
        if (subPath) walk(subPath, mm, depth + 1);
      } else if (type === "2" || type === "3" || type === "4") {
        const nums = t.slice(2).map(Number);
        const verts = [];
        for (let i = 0; i + 2 < nums.length; i += 3) {
          verts.push(apply(m, nums[i], nums[i + 1], nums[i + 2]));
        }
        points.push(...verts);
        // Sample the inside of faces too: a big flat quad only has vertices
        // at its corners, which would leave the middle cells looking empty.
        if (type !== "2") {
          const tris = type === "3" ? [[0, 1, 2]] : [[0, 1, 2], [0, 2, 3]];
          for (const [a, b, c] of tris) {
            const A = verts[a], B = verts[b], C = verts[c];
            const span = Math.max(dist(A, B), dist(B, C), dist(A, C));
            // sample spacing well under one height-field bin (20 / res LDU)
            const step = Math.min(3, 10 / res);
            const n = Math.min(120, Math.ceil(span / step));
            for (let u = 0; u <= n; u++) {
              for (let v = 0; v <= n - u; v++) {
                const s = u / n, r = v / n, q = 1 - s - r;
                samples.push([
                  A[0] * q + B[0] * s + C[0] * r,
                  A[1] * q + B[1] * s + C[1] * r,
                  A[2] * q + B[2] * s + C[2] * r,
                ]);
              }
            }
          }
        }
      }
    }
  };
  walk(file, IDENTITY, 0);
  if (!points.length) return { partNum, title, missing: false, empty: true };

  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const p of points) {
    for (let k = 0; k < 3; k++) {
      if (p[k] < min[k]) min[k] = p[k];
      if (p[k] > max[k]) max[k] = p[k];
    }
  }
  const w = Math.round((max[0] - min[0]) / 20);
  const d = Math.round((max[2] - min[2]) / 20);
  const heightPlates = Math.round((max[1] - min[1]) / 8 * 3) / 3; // allow thirds

  const norm = (v) => {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return v.map((c) => Math.round((c / len) * 100) / 100);
  };
  const topStuds = [];
  const sideStuds = [];
  const offGridStuds = [];
  for (const s of studs) {
    const dir = norm(s.dir);
    if (dir[1] < -0.9) {
      // A stud between two cells (jumper plates) is not on the grid: other
      // parts cannot use it, so it is reported separately.
      const fx = ((s.pos[0] - min[0]) / 20) % 1, fz = ((s.pos[2] - min[2]) / 20) % 1;
      if (Math.abs(fx - 0.5) > 0.1 || Math.abs(fz - 0.5) > 0.1) {
        offGridStuds.push(s.pos);
        continue;
      }
      topStuds.push({
        i: Math.floor((s.pos[0] - min[0]) / 20 + 1e-6),
        j: Math.floor((s.pos[2] - min[2]) / 20 + 1e-6),
        // plate level of the stud's base (tip minus a stud height), measured
        // up from the part's bottom
        level: Math.round(((max[1] - s.tip[1]) / 8 - 0.5) * 6) / 6,
        x: s.pos[0], z: s.pos[2],
      });
    } else if (Math.abs(dir[1]) < 0.1) {
      sideStuds.push({ dir, pos: s.pos });
    }
  }

  // Top-surface height field (4 samples per stud) and per-cell occupancy,
  // both built from points sampled across every face.
  const gw = Math.max(1, w * res), gd = Math.max(1, d * res);
  const field = Array.from({ length: gd }, () => new Array(gw).fill(-1));
  const occupied = Array.from({ length: Math.max(1, d) }, () => new Array(Math.max(1, w)).fill(false));
  for (const p of samples.length ? samples : points) {
    const fx = (p[0] - min[0]) / 20, fz = (p[2] - min[2]) / 20;
    const gi = Math.min(gw - 1, Math.max(0, Math.floor(fx * res)));
    const gj = Math.min(gd - 1, Math.max(0, Math.floor(fz * res)));
    const hgt = (max[1] - p[1]) / 8;
    if (hgt > field[gj][gi]) field[gj][gi] = hgt;
    // a cell counts as occupied when geometry reaches well inside it
    const ci = Math.floor(fx), cj = Math.floor(fz);
    const inset = 0.15;
    if (ci >= 0 && cj >= 0 && ci < w && cj < d && fx - ci > inset && fx - ci < 1 - inset && fz - cj > inset && fz - cj < 1 - inset) {
      occupied[cj][ci] = true;
    }
  }

  // Drop studs buried under the part's own top surface (LDraw sometimes keeps
  // a stud primitive inside a curved top as a modelling shortcut).
  const exposed = topStuds.filter((s) => {
    if (s.i < 0 || s.j < 0 || s.i >= w || s.j >= d) return false;
    let top = -1;
    for (let gj = s.j * res; gj < (s.j + 1) * res; gj++)
      for (let gi = s.i * res; gi < (s.i + 1) * res; gi++) top = Math.max(top, field[gj][gi]);
    return s.level + 0.5 > top + 0.2;
  });
  topStuds.length = 0;
  topStuds.push(...exposed);

  return {
    partNum, title, w, d, heightPlates,
    bbox: { min, max },
    topStuds, sideStuds, offGridStuds, field, res, occupied,
  };
}

/** Average top height (plates) of each stud cell, row-major [j][i]. */
export function cellHeights(a) {
  const out = [];
  for (let j = 0; j < a.d; j++) {
    const row = [];
    for (let i = 0; i < a.w; i++) {
      let best = -1;
      for (let gj = j * a.res; gj < (j + 1) * a.res; gj++)
        for (let gi = i * a.res; gi < (i + 1) * a.res; gi++)
          best = Math.max(best, a.field[gj]?.[gi] ?? -1);
      row.push(Math.round(best * 10) / 10);
    }
    out.push(row);
  }
  return out;
}

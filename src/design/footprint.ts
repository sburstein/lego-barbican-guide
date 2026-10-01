// Footprints that are not rectangles: cell sets on the stud grid, with the
// operations the compiler needs to wall them, band them and crown them.
// A triangle is rasterised from a real equilateral triangle (a cell is in
// when its centre is), so its sides step like the Barbican towers' serrated
// balcony fronts rather than at a toy-like 45°.

import type { Side } from "./spec.ts";

export type Cell = [number, number];
export const key = (x: number, z: number) => `${x},${z}`;
export const DIR: Record<Side, Cell> = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

/** Equilateral triangle pointing north, base `b` studs wide, cells from (0,0). */
function triangleNorth(b: number): Cell[] {
  const h = (b * Math.sqrt(3)) / 2;
  const out: Cell[] = [];
  for (let z = 0; z < Math.ceil(h); z++) {
    const half = ((z + 0.5) / h) * (b / 2); // half-width at this row's centre
    for (let x = 0; x < b; x++) if (Math.abs(x + 0.5 - b / 2) <= half + 1e-9) out.push([x, z]);
  }
  // drop empty rows at the apex so the plan starts at z = 0
  const minZ = Math.min(...out.map((c) => c[1]));
  return out.map(([x, z]) => [x, z - minZ]);
}

/** Turn a north-pointing cell set to point another way, normalised to (0,0). */
function turn(cells: Cell[], point: Side): Cell[] {
  const w = Math.max(...cells.map((c) => c[0])) + 1;
  const d = Math.max(...cells.map((c) => c[1])) + 1;
  const map: Record<Side, (c: Cell) => Cell> = {
    N: ([x, z]) => [x, z],
    S: ([x, z]) => [x, d - 1 - z],
    E: ([x, z]) => [d - 1 - z, x],
    W: ([x, z]) => [z, x],
  };
  void w;
  return cells.map(map[point]);
}

/** Cells of a tower plan placed with its bounding box's min corner at (x0, z0). */
export function planCells(plan: "triangle" | "square", size: number, point: Side, x0: number, z0: number): Cell[] {
  const local: Cell[] =
    plan === "square"
      ? Array.from({ length: size * size }, (_, i) => [i % size, Math.floor(i / size)] as Cell)
      : turn(triangleNorth(size), point);
  return local.map(([x, z]) => [x + x0, z + z0]);
}

export function cellSet(cells: Cell[]): Set<string> {
  return new Set(cells.map(([x, z]) => key(x, z)));
}

/** Cells with at least one 4-neighbour outside the set. */
export function boundary(cells: Cell[]): Cell[] {
  const s = cellSet(cells);
  return cells.filter(([x, z]) => Object.values(DIR).some(([dx, dz]) => !s.has(key(x + dx, z + dz))));
}

/** The set grown by one cell in the given directions. */
export function dilate(cells: Cell[], sides: Side[]): Cell[] {
  const s = cellSet(cells);
  const out = [...cells];
  for (const [x, z] of cells)
    for (const side of sides) {
      const [dx, dz] = DIR[side];
      const k = key(x + dx, z + dz);
      if (!s.has(k)) { s.add(k); out.push([x + dx, z + dz]); }
    }
  return out;
}

/**
 * Split a cell set into straight runs, preferring `axis`. Single cells left
 * over are joined along the other axis where that makes a longer run, so a
 * stepped edge is built from 1×2 and 1×3 bricks rather than 1×1s.
 */
export function runs(cells: Cell[], axis: "x" | "z"): { axis: "x" | "z"; cells: Cell[] }[] {
  const s = cellSet(cells);
  const used = new Set<string>();
  const out: { axis: "x" | "z"; cells: Cell[] }[] = [];
  const along = (c: Cell, ax: "x" | "z", dir: number): Cell => (ax === "x" ? [c[0] + dir, c[1]] : [c[0], c[1] + dir]);
  const grow = (start: Cell, ax: "x" | "z"): Cell[] => {
    let a = start;
    while (s.has(key(...along(a, ax, -1))) && !used.has(key(...along(a, ax, -1)))) a = along(a, ax, -1);
    const run: Cell[] = [];
    for (let c = a; s.has(key(...c)) && !used.has(key(...c)); c = along(c, ax, 1)) run.push(c);
    return run;
  };
  const sorted = [...cells].sort((p, q) => (axis === "x" ? p[1] - q[1] || p[0] - q[0] : p[0] - q[0] || p[1] - q[1]));
  for (const c of sorted) {
    if (used.has(key(...c))) continue;
    let run = grow(c, axis);
    if (run.length === 1) {
      const other = axis === "x" ? "z" : "x";
      const alt = grow(c, other);
      if (alt.length > 1) { alt.forEach((q) => used.add(key(...q))); out.push({ axis: other, cells: alt }); continue; }
    }
    run.forEach((q) => used.add(key(...q)));
    out.push({ axis, cells: run });
  }
  return out;
}

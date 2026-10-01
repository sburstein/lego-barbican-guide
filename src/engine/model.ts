// Placement model: a real part from parts.ts at integer stud coordinates and
// an integer plate layer. All cell math (which cells a placed part fills,
// where its studs are, what it can stand on) goes through placeCell(), so the
// validator, renderer and manual can never disagree about a rotation.
//
// Units: 1 stud = 1 unit in x/z, 1 layer = 1 plate (a brick is 3 layers).
// Cell (x, z) spans x..x+1, z..z+1. Facing N = -z, S = +z, E = +x, W = -x.

import {
  partDef,
  partName,
  partNumberFor,
  type Cell,
  type ColorKey,
  type Facing,
  type PartDef,
  type PartKind,
} from "./parts.ts";

export type { Cell, ColorKey, Facing, PartDef, PartKind } from "./parts.ts";

export type PieceInfo = {
  name: string;
  partNumber: string;
  description: string;
};

export type Placement = {
  kind: PartKind;
  w: number; // studs along x (as placed)
  d: number; // studs along z (as placed)
  x: number; // min corner cell x
  z: number; // min corner cell z
  layer: number; // bottom layer (0 = on the table)
  h: number; // height in layers (from the part table)
  color: ColorKey;
  facing: Facing;
  info: PieceInfo;
  /**
   * SNOT attachment: clipped onto a side stud of the host occupying its own
   * (x, z, layer) cell, hanging into the neighbouring cell in `facing`. It
   * claims no grid cell of its own. For a brick-tall host, `layer` is the
   * host's middle plate (side studs sit 10 LDU below the top), and a 1×1
   * tile then covers the host's face from half a plate up to its top.
   */
  attach?: boolean;
};

export type StepPlacements = Placement[];
export type PhasePlacements = StepPlacements[];
export type BuildPlacements = Record<string, PhasePlacements>;

/** Authored title + tip for each step, parallel to BuildPlacements. */
export type StepMeta = { title: string; tip?: string };
export type BuildMeta = Record<string, StepMeta[]>;

// ─── Orientation ───────────────────────────────────────────────────────

export function defOf(p: Pick<Placement, "kind" | "w" | "d">): PartDef | undefined {
  return partDef(p.kind, p.w, p.d);
}

/**
 * The rotation actually used for a placement. Directional parts use their
 * facing. Symmetric parts ignore facing; if their dims are swapped relative
 * to the canonical W×D they are turned a quarter (E).
 */
function effectiveFacing(p: Placement, d: PartDef): Facing {
  if (d.directional) return p.facing;
  if (d.W === d.D) return "S";
  return p.w === d.W && p.d === d.D ? "S" : "E";
}

/** True when (w, d) is a real orientation of the part for its facing. */
export function orientationOk(p: Placement): boolean {
  const d = defOf(p);
  if (!d) return false;
  if (d.W === d.D) return p.w === d.W && p.d === d.D;
  if (!d.directional) {
    return (p.w === d.W && p.d === d.D) || (p.w === d.D && p.d === d.W);
  }
  const ns = p.facing === "S" || p.facing === "N";
  return ns ? p.w === d.W && p.d === d.D : p.w === d.D && p.d === d.W;
}

/** The rotation a placement is drawn and checked with. */
export function facingOf(p: Placement): Facing {
  const d = defOf(p);
  return d ? effectiveFacing(p, d) : p.facing;
}

/**
 * Map a canonical point (u along x in 0..W, v along z in 0..D) to the
 * placement's local coordinates (0..w, 0..d). Renderers use this so every
 * shape turns exactly the way the validator turns its cells.
 */
export function canonicalToLocal(p: Placement, u: number, v: number, d = defOf(p)!): [number, number] {
  const { W, D } = d;
  switch (effectiveFacing(p, d)) {
    case "S": return [u, v];
    case "N": return [W - u, D - v];
    case "E": return [v, W - u];
    case "W": return [D - v, u];
  }
}

/** Map a canonical cell to world coordinates for a placement. */
export function placeCell(p: Placement, [i, j]: Cell, d = defOf(p)!): Cell {
  const { W, D } = d;
  switch (effectiveFacing(p, d)) {
    case "S": return [p.x + i, p.z + j];
    case "N": return [p.x + W - 1 - i, p.z + D - 1 - j];
    case "E": return [p.x + j, p.z + W - 1 - i];
    case "W": return [p.x + D - 1 - j, p.z + i];
  }
}

/** Rotate a canonical direction (dx, dz) by a placement's facing. */
export function placeDir(p: Placement, [dx, dz]: [number, number], d = defOf(p)!): [number, number] {
  switch (effectiveFacing(p, d)) {
    case "S": return [dx, dz];
    case "N": return [-dx, -dz];
    case "E": return [dz, -dx];
    case "W": return [-dz, dx];
  }
}

const cellsOf = (p: Placement, which: "occupied" | "top" | "bottom"): Cell[] => {
  const d = defOf(p);
  if (!d) {
    const out: Cell[] = [];
    for (let i = 0; i < p.w; i++) for (let j = 0; j < p.d; j++) out.push([p.x + i, p.z + j]);
    return which === "top" ? [] : out;
  }
  return d[which].map((c) => placeCell(p, c, d));
};

/** Cells the placed part's body fills. */
export function footprintCells(p: Placement): Cell[] {
  return cellsOf(p, "occupied");
}

/** Cells with a stud on top (at layer + h). */
export function studCells(p: Placement): Cell[] {
  return cellsOf(p, "top");
}

/** Cells whose underside can take a stud from the piece below. */
export function bottomCells(p: Placement): Cell[] {
  return cellsOf(p, "bottom");
}

/** Outward directions of the part's side studs, per world cell. */
export function sideStuds(p: Placement): { cell: Cell; dir: [number, number] }[] {
  const d = defOf(p);
  if (!d) return [];
  return d.sideStuds.map((s) => ({ cell: placeCell(p, s.cell, d), dir: placeDir(p, s.dir, d) }));
}

export const FACE_DIR: Record<Facing, [number, number]> = {
  N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0],
};

// ─── Builder ───────────────────────────────────────────────────────────

/** Accumulates phases → steps → placements, with authored titles and tips. */
export class Builder {
  build: BuildPlacements = {};
  meta: BuildMeta = {};
  private phaseId = "";
  private stepArr: StepPlacements | null = null;

  phase(id: string) {
    this.phaseId = id;
    this.build[id] = [];
    this.meta[id] = [];
  }
  step(title = "Build step", tip?: string) {
    this.stepArr = [];
    this.build[this.phaseId].push(this.stepArr);
    this.meta[this.phaseId].push({ title, tip });
  }
  put(
    kind: PartKind,
    w: number,
    d: number,
    x: number,
    z: number,
    layer: number,
    color: ColorKey,
    desc: string,
    facing: Facing = "S"
  ): Placement {
    const p = makePlacement(kind, w, d, x, z, layer, color, desc, facing);
    this.stepArr!.push(p);
    return p;
  }
  /** Clip a 1×1 finishing piece onto the side studs of the brick at (x, z, layer). */
  putAttached(
    kind: PartKind,
    x: number,
    z: number,
    layer: number,
    color: ColorKey,
    desc: string,
    facing: Facing
  ): Placement {
    const p = this.put(kind, 1, 1, x, z, layer, color, desc, facing);
    p.attach = true;
    return p;
  }
}

export function makePlacement(
  kind: PartKind,
  w: number,
  d: number,
  x: number,
  z: number,
  layer: number,
  color: ColorKey,
  desc: string,
  facing: Facing = "S"
): Placement {
  const def = partDef(kind, w, d);
  return {
    kind, w, d, x, z, layer,
    h: def ? def.h : 0,
    color,
    facing,
    info: {
      name: def ? partName(def, color) : `UNKNOWN ${kind} ${w}×${d}`,
      partNumber: (def && partNumberFor(def, color)) ?? "?",
      description: desc,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// LEGO PLACEMENT MODEL; Barbican Estate Lakeside Panorama
//
// Pure data layer (no three.js). Every piece in the build is a Placement:
// a real LEGO part from the CATALOG, positioned by integer stud coordinates
// (corner-based) and an integer plate-layer. A validator checks that every
// placement is a real part, sits on the stud grid, collides with nothing,
// and is supported by studs beneath it, exactly like physical LEGO.
// Part usage is balanced to fit the Architecture Studio 21050 inventory.
//
// Units: 1 stud = 1 unit in x/z. 1 layer = 1 plate height (0.4 units).
// A brick is 3 layers tall. Cell (x, z) spans coordinates x..x+1, z..z+1.
// ═══════════════════════════════════════════════════════════════════════

export type ColorKey = "white" | "dark" | "trans" | "green";
export type Facing = "N" | "S" | "E" | "W"; // N = -z (back), S = +z (front)

export type PartKind =
  | "brick"
  | "plate"
  | "tile"
  | "grilleTile" // 1×2 grille tile 2412b (smooth, ribbed)
  | "roundBrick"
  | "roundPlate"
  | "cornerPlate" // 2×2 L-shaped corner plate 2420
  | "cornerBrick" // 2×2 L-shaped corner brick 2357
  | "macaroni" // 2×2 quarter-arc brick 85080
  | "jumper" // 1×2 plate with a single centre stud 15573 (off-grid top)
  | "sideStud2" // 1×1 brick, studs on 2 opposite sides 47905
  | "sideStud4" // 1×1 brick, studs on 4 sides 4733
  | "sideStudBrick" // 1×4 brick with side studs on one face 30414
  | "steepSlope2" // 1×2×2 slope 65° (60481), 2 bricks tall
  | "steepSlope3" // 1×2×3 slope 75° (4460b), 3 bricks tall
  | "curvedSlope" // curved slopes 50950 (1×3) / 3045 (2×2 double)
  | "wedgeL" // wedge plate 2×4 left 41768
  | "wedgeR" // wedge plate 2×4 right 41767
  | "roundCornerPlate" // plate 4×4 round corner 30565
  | "slope45" // descends over the last stud, small top ledge, no studs
  | "slope33" // descends over 2 studs, studded back row
  | "invSlope" // inverted 45, full studded top
  | "curvedTop" // brick 1×2 with half-cylinder top (6091), no studs
  | "arch" // arch brick 1×4
  | "panel" // 1×N×1 wall panel, studded top
  | "glassPanel" // trans-clear panel 1×2×2 (87552), 2 bricks tall
  | "profile" // profile/grille brick 1×2 (2877), studded top
  | "headlight" // headlight brick 1×1 (4070), studded top
  | "cheese"; // 1×1×2/3 slope, 2 layers, no top studs

export type PieceInfo = {
  name: string;
  partNumber: string;
  description: string;
};

export type Placement = {
  kind: PartKind;
  w: number; // studs along x (as placed)
  d: number; // studs along z (as placed)
  x: number; // min corner cell x (integer)
  z: number; // min corner cell z (integer)
  layer: number; // bottom layer index (integer, 0 = on table)
  h: number; // height in layers (from catalog)
  color: ColorKey;
  facing: Facing;
  info: PieceInfo;
  /**
   * SNOT attachment: the piece is clipped onto the side studs of the brick
   * occupying its own (x, z, layer) cell and hangs into the empty cell in
   * `facing`. It claims no grid cell of its own, so the validator checks a
   * side-stud host instead of studs underneath.
   */
  attach?: boolean;
};

export type StepPlacements = Placement[];
export type PhasePlacements = StepPlacements[];
export type BuildPlacements = Record<string, PhasePlacements>;

/** Authored title + tip for each step, parallel to BuildPlacements. */
export type StepMeta = { title: string; tip?: string };
export type BuildMeta = Record<string, StepMeta[]>;

// ─── Part catalog: real parts only, with color-specific part numbers ───

type CatalogEntry = {
  name: string;
  h: number;
  pn: string | { white: string; trans: string };
};

const CAT: Record<string, CatalogEntry> = {};
function reg(kind: PartKind, a: number, b: number, h: number, name: string, pn: CatalogEntry["pn"]) {
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  CAT[`${kind}:${lo}x${hi}`] = { name, h, pn };
}

// Bricks (3 layers)
reg("brick", 1, 1, 3, "Brick 1×1", "3005");
reg("brick", 1, 2, 3, "Brick 1×2", { white: "3004", trans: "3065" });
reg("brick", 1, 3, 3, "Brick 1×3", "3622");
reg("brick", 1, 4, 3, "Brick 1×4", "3010");
reg("brick", 1, 6, 3, "Brick 1×6", "3009");
reg("brick", 1, 8, 3, "Brick 1×8", "3008");
reg("brick", 2, 2, 3, "Brick 2×2", "3003");
reg("brick", 2, 3, 3, "Brick 2×3", "3002");
reg("brick", 2, 4, 3, "Brick 2×4", "3001");
reg("brick", 2, 6, 3, "Brick 2×6", "2456");
// Plates (1 layer)
reg("plate", 1, 1, 1, "Plate 1×1", { white: "3024w", trans: "3024" });
reg("plate", 1, 2, 1, "Plate 1×2", { white: "3023w", trans: "3023" });
reg("plate", 1, 3, 1, "Plate 1×3", "3623");
reg("plate", 1, 4, 1, "Plate 1×4", "3710");
reg("plate", 1, 6, 1, "Plate 1×6", "3666");
reg("plate", 1, 10, 1, "Plate 1×10", "4477");
reg("plate", 2, 2, 1, "Plate 2×2", "3022");
reg("plate", 2, 3, 1, "Plate 2×3", "3021");
reg("plate", 2, 4, 1, "Plate 2×4", "3020");
reg("plate", 2, 6, 1, "Plate 2×6", "3795");
reg("plate", 2, 8, 1, "Plate 2×8", "3034");
reg("plate", 4, 4, 1, "Plate 4×4", "3031");
reg("plate", 4, 6, 1, "Plate 4×6", "3032");
reg("plate", 4, 8, 1, "Plate 4×8", "3035");
reg("plate", 6, 6, 1, "Plate 6×6", "3958");
reg("plate", 6, 8, 1, "Plate 6×8", "3036");
reg("plate", 6, 10, 1, "Plate 6×10", "3033");
reg("plate", 8, 8, 1, "Plate 8×8", "41539");
reg("cornerPlate", 2, 2, 1, "Plate 2×2 Corner", "2420");
// Tiles (1 layer, smooth)
reg("tile", 1, 1, 1, "Tile 1×1", "3070b");
reg("tile", 1, 2, 1, "Tile 1×2", "3069b");
reg("grilleTile", 1, 2, 1, "Tile 1×2 Grille", "2412b");
reg("tile", 1, 4, 1, "Tile 1×4", "2431");
reg("tile", 1, 6, 1, "Tile 1×6", "6636");
reg("tile", 2, 2, 1, "Tile 2×2", "3068b");
// Round parts
reg("roundBrick", 1, 1, 3, "Round Brick 1×1", "3062b");
reg("roundBrick", 2, 2, 3, "Brick 2×2 Round", "3941");
reg("roundPlate", 1, 1, 1, "Plate 1×1 Round", "4073");
reg("roundPlate", 2, 2, 1, "Plate 2×2 Round", "4032");
// Slopes
reg("slope45", 1, 2, 3, "Slope 1×2 (45°)", "3040");
reg("slope45", 2, 2, 3, "Slope 2×2 (45°)", "3039");
reg("slope45", 2, 4, 3, "Slope 2×4 (45°)", "3037");
reg("slope33", 1, 3, 3, "Slope 1×3 (25°)", "4286");
reg("slope33", 2, 3, 3, "Slope 2×3 (25°)", "3298");
reg("invSlope", 1, 2, 3, "Slope 1×2 Inverted", "3665");
reg("curvedTop", 1, 2, 3, "Curved Top Brick 1×2", "6091");
reg("arch", 1, 4, 3, "Arch 1×4", "3659");
reg("panel", 1, 1, 3, "Panel 1×1×1 Corner", "6231");
reg("panel", 1, 4, 3, "Panel 1×4×1 Rounded", "30413");
reg("glassPanel", 1, 2, 6, "Trans-Clear Panel 1×2×2", "87552");
reg("profile", 1, 2, 3, "Grille Brick 1×2", "2877");
reg("headlight", 1, 1, 3, "Headlight Brick 1×1", "4070");
reg("cheese", 1, 1, 2, "Cheese Slope 1×1×⅔", "54200");
// Parts left unused by the Lakeside Panorama; the Frobisher section's palette
reg("tile", 1, 8, 1, "Tile 1×8", "4162");
reg("roundPlate", 4, 4, 1, "Plate 4×4 Round w/ Pin", "60474");
reg("roundCornerPlate", 4, 4, 1, "Plate 4×4 Round Corner", "30565");
reg("cornerBrick", 2, 2, 3, "Brick 2×2 Corner", "2357");
reg("macaroni", 2, 2, 3, "Macaroni Brick 2×2", "85080");
reg("jumper", 1, 2, 1, "Jumper Plate 1×2", "15573");
reg("sideStud2", 1, 1, 3, "Brick 1×1 Studs 2 Sides", "47905");
reg("sideStud4", 1, 1, 3, "Brick 1×1 Studs 4 Sides", "4733");
reg("sideStudBrick", 1, 4, 3, "Brick 1×4 Side Studs", "30414");
reg("steepSlope2", 1, 2, 6, "Slope 1×2×2 (65°)", "60481");
reg("steepSlope3", 1, 2, 9, "Slope 1×2×3 (75°)", "4460b");
reg("curvedSlope", 1, 3, 3, "Curved Slope 3×1", "50950");
reg("curvedSlope", 2, 2, 2, "Slope 2×2 Double Convex", "3045");
reg("wedgeL", 2, 4, 1, "Wedge 2×4 Left", "41768");
reg("wedgeR", 2, 4, 1, "Wedge 2×4 Right", "41767");
reg("invSlope", 1, 3, 3, "Slope 1×3 Inverted", "4287");
reg("invSlope", 2, 2, 3, "Slope 2×2 Inverted", "3660");
reg("invSlope", 2, 3, 3, "Slope 2×3 Inverted", "3747b");
reg("slope33", 3, 4, 3, "Slope 3×4 (25°)", "3297");
reg("slope33", 2, 4, 3, "Slope 2×4 (18°)", "30363");

export function catalogEntry(kind: PartKind, w: number, d: number): CatalogEntry | undefined {
  const lo = Math.min(w, d);
  const hi = Math.max(w, d);
  return CAT[`${kind}:${lo}x${hi}`];
}

export function partNumberFor(entry: CatalogEntry, color: ColorKey): string | undefined {
  if (typeof entry.pn === "string") return entry.pn;
  if (color === "trans") return entry.pn.trans;
  return entry.pn.white;
}

// Kinds whose entire top face carries usable studs
const FULL_STUD_TOP = new Set<PartKind>([
  "brick", "plate", "roundBrick", "roundPlate", "cornerPlate", "invSlope",
  "panel", "glassPanel", "profile", "headlight", "arch",
  "cornerBrick", "sideStud2", "sideStud4", "sideStudBrick",
  "roundCornerPlate", "wedgeL", "wedgeR",
]);

/** L-shaped kinds: a 2×2 footprint with the inner corner cell missing. */
const L_SHAPED = new Set<PartKind>(["cornerPlate", "cornerBrick", "macaroni"]);

/** Kinds that carry studs on their vertical faces (SNOT hosts). */
const SIDE_STUD_HOSTS = new Set<PartKind>([
  "sideStud2", "sideStud4", "sideStudBrick", "headlight",
]);

/** Cell excluded from an L-shaped corner plate, by facing. */
function cornerMissing(p: Placement): [number, number] {
  switch (p.facing) {
    case "S": return [p.x + 1, p.z + 1];
    case "W": return [p.x, p.z + 1];
    case "N": return [p.x, p.z];
    case "E": return [p.x + 1, p.z];
  }
}

/**
 * A 4×4 round corner plate is a quarter disc: the three cells beyond the
 * radius (measured from the inner corner, chosen by facing) are absent.
 */
function roundCornerAbsent(p: Placement): [number, number][] {
  // Local offsets of the three clipped cells for facing "S" (inner corner at
  // the piece's min-x / min-z), then mirrored per facing.
  const local: [number, number][] = [[3, 3], [2, 3], [3, 2]];
  return local.map(([i, j]) => {
    switch (p.facing) {
      case "S": return [p.x + i, p.z + j] as [number, number];
      case "W": return [p.x + (3 - i), p.z + j] as [number, number];
      case "N": return [p.x + (3 - i), p.z + (3 - j)] as [number, number];
      case "E": return [p.x + i, p.z + (3 - j)] as [number, number];
    }
  });
}

export function footprintCells(p: Placement): [number, number][] {
  const cells: [number, number][] = [];
  for (let i = 0; i < p.w; i++) for (let j = 0; j < p.d; j++) cells.push([p.x + i, p.z + j]);
  if (L_SHAPED.has(p.kind)) {
    const [mx, mz] = cornerMissing(p);
    return cells.filter(([cx, cz]) => !(cx === mx && cz === mz));
  }
  if (p.kind === "roundCornerPlate") {
    const absent = roundCornerAbsent(p);
    return cells.filter(([cx, cz]) => !absent.some(([ax, az]) => ax === cx && az === cz));
  }
  return cells;
}

/**
 * A macaroni brick carries only two studs, at the ends of its arc; the two
 * cells of the L that are orthogonally adjacent to the missing inner corner.
 */
function macaroniStudCells(p: Placement): [number, number][] {
  const [mx, mz] = cornerMissing(p);
  return footprintCells(p).filter(([cx, cz]) => cx === mx || cz === mz);
}

/** Which cells of a placement have studs on top (absolute cells). */
export function topStudCells(p: Placement): [number, number][] {
  if (p.kind === "macaroni") return macaroniStudCells(p);
  return FULL_STUD_TOP.has(p.kind) ? footprintCells(p) : [];
}

/** Studded back row of a 25°/33° slope (opposite the facing). */
export function slopeStudCells(p: Placement): [number, number][] {
  const cells: [number, number][] = [];
  if (p.facing === "S") for (let i = 0; i < p.w; i++) cells.push([p.x + i, p.z]);
  else if (p.facing === "N") for (let i = 0; i < p.w; i++) cells.push([p.x + i, p.z + p.d - 1]);
  else if (p.facing === "E") for (let j = 0; j < p.d; j++) cells.push([p.x, p.z + j]);
  else for (let j = 0; j < p.d; j++) cells.push([p.x + p.w - 1, p.z + j]);
  return cells;
}

export function studCells(p: Placement): [number, number][] {
  if (p.kind === "slope33") return slopeStudCells(p);
  return topStudCells(p);
}

// ─── Builder ───────────────────────────────────────────────────────────

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
  ) {
    const entry = catalogEntry(kind, w, d);
    const h = entry ? entry.h : 0;
    const pn = entry ? partNumberFor(entry, color) : undefined;
    const baseName = entry ? entry.name : `UNKNOWN ${kind} ${w}×${d}`;
    const name =
      color === "trans" && entry && typeof entry.pn !== "string"
        ? `Trans-Clear ${baseName.replace("Trans-Clear ", "")}`
        : baseName;
    const info: PieceInfo = {
      name,
      partNumber: pn ?? "?",
      description: desc,
    };
    this.stepArr!.push({ kind, w, d, x, z, layer, h, color, facing, info });
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
  ) {
    this.put(kind, 1, 1, x, z, layer, color, desc, facing);
    this.stepArr![this.stepArr!.length - 1].attach = true;
  }
}

// ─── Validator ─────────────────────────────────────────────────────────

export function validateBuild(build: BuildPlacements): string[] {
  const errors: string[] = [];
  const all: { p: Placement; where: string }[] = [];
  for (const [pid, phases] of Object.entries(build)) {
    phases.forEach((step, si) => {
      step.forEach((p, pi) => {
        all.push({ p, where: `${pid} step ${si} piece ${pi} (${p.info.name} @ ${p.x},${p.z},L${p.layer})` });
      });
    });
  }

  // Static checks
  for (const { p, where } of all) {
    const entry = catalogEntry(p.kind, p.w, p.d);
    if (!entry) errors.push(`NO SUCH PART: ${p.kind} ${p.w}×${p.d}; ${where}`);
    else if (!partNumberFor(entry, p.color))
      errors.push(`NO ${p.color.toUpperCase()} VERSION of ${entry.name}; ${where}`);
    if (![p.w, p.d, p.x, p.z, p.layer].every(Number.isInteger))
      errors.push(`OFF GRID (non-integer): ${where}`);
    if (p.layer < 0) errors.push(`BELOW TABLE: ${where}`);
  }

  // Occupancy + support (order by layer so lower pieces exist first).
  // SNOT attachments are validated in a second pass: they need a side-stud
  // host in their own cell and clear air in the cell they hang into.
  const sorted = [...all]
    .filter((a) => !a.p.attach)
    .sort((a, b) => a.p.layer - b.p.layer);
  const occ = new Map<string, string>();
  const studs = new Map<string, boolean>();
  const sideHosts = new Map<string, Placement>();

  for (const { p, where } of sorted) {
    if (!Number.isInteger(p.layer) || !Number.isInteger(p.x)) continue;
    for (const [cx, cz] of footprintCells(p)) {
      for (let l = p.layer; l < p.layer + p.h; l++) {
        const k = `${cx},${cz},${l}`;
        const prev = occ.get(k);
        if (prev) errors.push(`COLLISION at cell (${cx},${cz}) layer ${l}: ${where} overlaps ${prev}`);
        else occ.set(k, where);
        if (SIDE_STUD_HOSTS.has(p.kind)) sideHosts.set(k, p);
      }
    }
    if (p.layer > 0) {
      const supported = footprintCells(p).some(([cx, cz]) => studs.get(`${cx},${cz},${p.layer}`));
      if (!supported) errors.push(`FLOATING (no studs beneath): ${where}`);
    }
    for (const [cx, cz] of studCells(p)) {
      studs.set(`${cx},${cz},${p.layer + p.h}`, true);
    }
  }

  const DELTA: Record<Facing, [number, number]> = {
    N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0],
  };
  const OPPOSITE: Record<Facing, Facing> = { N: "S", S: "N", E: "W", W: "E" };

  for (const { p, where } of all) {
    if (!p.attach) continue;
    if (p.w !== 1 || p.d !== 1)
      errors.push(`ATTACHMENT TOO LARGE (must be 1×1): ${where}`);
    const key = `${p.x},${p.z},${p.layer}`;
    const host = sideHosts.get(key);
    if (!host) {
      errors.push(`NO SIDE-STUD HOST at (${p.x},${p.z}) layer ${p.layer}: ${where}`);
      continue;
    }
    // 4733 has studs on all four sides; the others only on their facing
    // (47905 also on the opposite face).
    const ok =
      host.kind === "sideStud4" ||
      host.facing === p.facing ||
      (host.kind === "sideStud2" && OPPOSITE[host.facing] === p.facing);
    if (!ok)
      errors.push(
        `HOST HAS NO STUD FACING ${p.facing} (${host.info.name} faces ${host.facing}): ${where}`
      );
    const [dx, dz] = DELTA[p.facing];
    const blocker = occ.get(`${p.x + dx},${p.z + dz},${p.layer}`);
    if (blocker) errors.push(`ATTACHMENT BLOCKED by ${blocker}: ${where}`);
  }

  // Sequential accessibility: walking the build in authored order (phase by
  // phase, step by step), every piece must be lowerable straight down onto
  // its studs; no piece from an earlier step may occupy any cell of the
  // column above it. This is what makes the on-screen order followable with
  // real bricks. Pieces within one step may be placed in any order, and
  // side-clipped SNOT attachments are exempt (they arrive from the side).
  {
    const placedCols = new Map<string, { lo: number; hi: number; who: string }[]>();
    for (const [pid, phases] of Object.entries(build)) {
      phases.forEach((step, si) => {
        // check against earlier steps only
        for (const [pi, p] of step.entries()) {
          if (p.attach || !Number.isInteger(p.layer)) continue;
          const top = p.layer + p.h;
          for (const [cx, cz] of footprintCells(p)) {
            const col = placedCols.get(`${cx},${cz}`);
            if (!col) continue;
            const blocker = col.find((seg) => seg.lo >= top);
            if (blocker) {
              errors.push(
                `NOT REACHABLE: ${pid} step ${si} piece ${pi} (${p.info.name} @ ${p.x},${p.z},L${p.layer}) ` +
                  `slides in under ${blocker.who} already built above (L${blocker.lo})`
              );
              break;
            }
          }
        }
        // then register this step's pieces
        for (const p of step) {
          if (p.attach || !Number.isInteger(p.layer)) continue;
          for (const [cx, cz] of footprintCells(p)) {
            const key = `${cx},${cz}`;
            const col = placedCols.get(key) ?? [];
            col.push({ lo: p.layer, hi: p.layer + p.h, who: `${pid} step ${si} ${p.info.name}` });
            placedCols.set(key, col);
          }
        }
      });
    }
  }

  return errors;
}
// ═══════════════════════════════════════════════════════════════════════
// THE BUILD; Lakeside Panorama, 12 phases
// Layout key:
//   Baseplates layer 0. Base top = layer 1.
//   Lake: cells x -8..7, z 6..12.
//   Podium: 6 main 2×2 round columns (2 bricks tall) in two rows; deck L8.
//   Terrace: cells x -10..9, z -6..-3; slab L7..8; three storeys of
//     [brick course, brick course, plate band]; roof cap top = layer 29.
//   Tower: Y-plan behind terrace; core cells (-1..0, -9..-8), wings W/E/N.
//   Conservatory: on deck, cells x 3..8, z -2..1.
//
// Steps are ordered so every piece can be lowered straight down when its
// step comes; enforced by the sequential-accessibility validator pass.
// ═══════════════════════════════════════════════════════════════════════

// Terrace constants
const T_X0 = -10;
const T_W = 20;
const T_ZB = -6; // back wall row
const T_ZF = -3; // front wall row
const SLAB_L = 7; // terrace slab bottom layer (top = 8)
const STOREY = (s: number) => 8 + 7 * s; // course A bottom layer of storey s
const T_TOP = 29; // roof cap top layer

// Podium
const DECK_L = 8; // deck plate bottom layer (top = 9)
// Main 2×2 round columns sit at x corners -10, -1, 8 in two rows
const COL_ZS = [-2, 2];
const SEC_XS = [-5, 3]; // secondary 1×1 round columns
const SEC_ZS = [-1, 2];

// Tower constants
const TW_CX = -1;
const TW_CZ = -9;
const TOWER_BASE_L = 3;
const TOWER_COURSES = 30;
const wingLen = (c: number) => (c < 12 ? 3 : c < 24 ? 2 : 1);
const bandsBefore = (c: number) => Math.floor(c / 4);
export const towerLayer = (c: number) => TOWER_BASE_L + 3 * c + bandsBefore(c);
const TOWER_TOP_L = towerLayer(TOWER_COURSES - 1) + 3; // 100

// Window/spandrel course scheme (c ≥ 5):
//   c ≡ 1 (mod 4): spandrel band; grille bricks (white bricks on c25, c29)
//   c ≡ 2 (mod 4): glazing band; trans bricks (grille vents on c26)
const GRILLE_COURSES = new Set([5, 9, 13, 17, 21]);
const GLASS_COURSES = new Set([6, 10, 14, 18, 22]);

function buildFoundation(b: Builder) {
  b.phase("bp-foundation");
  const d = "Foundation platform";

  b.step(
    "Back row of baseplates",
    "The Barbican stands on the Cripplegate ward, flattened in the Blitz; by 1951 just 48 people lived here. Everything you build rises from this cleared ground, exactly as the estate did."
  );
  b.put("plate", 8, 8, -12, -12, 0, "white", d);
  b.put("plate", 8, 8, -4, -12, 0, "white", d);
  b.put("plate", 8, 8, 4, -12, 0, "white", d);

  b.step(
    "Middle row of baseplates",
    "Chamberlin, Powell and Bon won the commission after their Golden Lane Estate next door. Construction here started in 1965 and ran for eleven years."
  );
  b.put("plate", 8, 8, -12, -4, 0, "white", d);
  b.put("plate", 8, 8, -4, -4, 0, "white", d);
  b.put("plate", 8, 8, 4, -4, 0, "white", d);

  b.step(
    "Lake-zone extension",
    "The whole 40-acre estate sits on a raised concrete podium; pedestrians above, service roads and car parks below. Your baseplates are that podium deck."
  );
  for (const x of [-12, -6, 0, 6]) b.put("plate", 6, 10, x, 4, 0, "white", "Lake zone extension");

  b.step(
    "Side extensions",
    "Real baseplates, like real ground beams, want their joints staggered. The side wings widen the site for the gardens and boundary walls to come."
  );
  for (const x of [-18, 12]) for (const z of [-12, -4]) b.put("plate", 6, 8, x, z, 0, "white", "Side extension");

  b.step(
    "Seam ties, west and east",
    "Plates bridging a joint lock two baseplates into one slab; the same job the podium's expansion joints and ties do across the estate."
  );
  b.put("plate", 2, 4, -12, -6, 1, "dark", "Seam tie (west)");
  b.put("plate", 2, 4, 10, -6, 1, "dark", "Seam tie (east)");

  b.step("Ties across the side joints", "Press each tie down firmly along its whole length before moving on; a loose base joint telegraphs wobble all the way up.");
  b.put("plate", 6, 1, -15, -11, 1, "white", "Side seam tie");
  b.put("plate", 6, 1, 10, -11, 1, "white", "Side seam tie");
  b.put("plate", 6, 1, -16, -7, 1, "white", "Side seam tie");
  b.put("plate", 6, 1, 10, -7, 1, "white", "Side seam tie");

  b.step(
    "Edge beams around the rim",
    "The estate reads as a walled city; its name comes from the Latin barbecana, a fortified outer gateway. These dark beams start that defensive edge."
  );
  b.put("plate", 10, 1, -12, 13, 1, "dark", "Front edge beam");
  b.put("plate", 10, 1, -2, 13, 1, "dark", "Front edge beam");
  b.put("plate", 4, 1, 8, 13, 1, "dark", "Front edge beam");
  b.put("plate", 6, 1, -12, -12, 1, "dark", "Back edge beam");
  b.put("plate", 6, 1, 6, -12, 1, "dark", "Back edge beam");
  b.put("plate", 1, 10, -18, -12, 1, "dark", "Left edge beam");
  b.put("plate", 1, 6, -18, -2, 1, "dark", "Left edge beam");
  b.put("plate", 1, 10, 17, -12, 1, "dark", "Right edge beam");
  b.put("plate", 1, 6, 17, -2, 1, "dark", "Right edge beam");

  b.step(
    "Tower raft foundation",
    "Ove Arup's engineers gave each tower a massive raft so 43 storeys of concrete could stand beside Underground tunnels. Two stacked plate layers are your raft."
  );
  for (const x of [-6, -2, 2]) b.put("plate", 4, 6, x, -12, 1, "dark", "Tower reinforcement L1");
  for (const x of [-4, 0]) b.put("plate", 4, 6, x, -12, 2, "white", "Tower reinforcement L2");
}

function buildLake(b: Builder) {
  b.phase("bp-lake");

  b.step(
    "Lake corners",
    "The architects wanted the blocks 'reflected in the ornamental lake'. Four corner plates set out its rectangle; everything else on the estate is arranged to face it."
  );
  b.put("cornerPlate", 2, 2, -8, 6, 1, "dark", "Lake corner", "S");
  b.put("cornerPlate", 2, 2, 6, 6, 1, "dark", "Lake corner", "W");
  b.put("cornerPlate", 2, 2, -8, 11, 1, "dark", "Lake corner", "E");
  b.put("cornerPlate", 2, 2, 6, 11, 1, "dark", "Lake corner", "N");

  b.step("Lake border", "The dark border is the lake's concrete lip. In the real thing, fountains run along the terrace side and residents' balconies look straight down onto the water.");
  for (const x of [-6, -2, 2]) b.put("plate", 4, 1, x, 6, 1, "dark", "Lake border (back)");
  for (const x of [-6, -2, 2]) b.put("plate", 4, 1, x, 12, 1, "dark", "Lake border (front)");
  b.put("plate", 1, 3, -8, 8, 1, "dark", "Lake border (left)");
  b.put("plate", 1, 3, 7, 8, 1, "dark", "Lake border (right)");

  const water = (zRows: number[]) => {
    for (const z of zRows) for (let x = -6; x < 6; x += 2) b.put("plate", 2, 1, x, z, 1, "trans", "Lake water");
  };
  b.step("Water surface, first rows", "Lay the trans-clear plates in neat courses like flooring. Gaps read as missing water, so keep every row complete.");
  water([7, 8]);
  b.step("Water surface, middle rows", "The real lake holds koi, ghost carp and terrapins. It also does quiet structural work; it sits over the Barbican's service level.");
  water([9, 10]);
  b.step("Water surface, final row", "One more row closes the surface against the front border.");
  water([11]);

  b.step(
    "Ripple highlights",
    "Single trans plates catch light at a different angle than the rows beneath; an old LEGO Architecture trick for making flat water read as moving."
  );
  for (const [x, z] of [[-5, 8], [-3, 10], [-1, 7], [1, 9], [3, 8], [4, 11], [-6, 11]] as const)
    b.put("plate", 1, 1, x, z, 2, "trans", "Ripple highlight");
  for (const [x, z] of [[-4, 7], [-2, 9], [0, 11], [2, 10], [4, 7], [5, 9], [-6, 9]] as const)
    b.put("plate", 1, 1, x, z, 2, "trans", "Ripple highlight");
}

function buildPodium(b: Builder) {
  b.phase("bp-podium");

  b.step(
    "Main columns",
    "Peter Chamberlin admitted the biggest influence was Le Corbusier; and these fat round pilotis lifting the blocks over the lake are textbook Corbusier."
  );
  for (const cx of [-10, -1, 8]) for (const z of COL_ZS)
    for (const l of [1, 4]) b.put("roundBrick", 2, 2, cx, z, l, "white", "Podium column");

  b.step("Column capitals", "A round plate on each column spreads the load; and gives the deck plates a stud to bite on.");
  for (const cx of [-10, -1, 8]) for (const z of COL_ZS)
    b.put("roundPlate", 2, 2, cx, z, 7, "white", "Column capital");

  b.step("Secondary columns", "Slimmer 1×1 round columns fill the long spans between the main pilotis, just as the estate mixes column sizes under its slabs.");
  for (const x of SEC_XS) for (const z of SEC_ZS)
    for (const l of [1, 4]) b.put("roundBrick", 1, 1, x, z, l, "white", "Secondary column");

  b.step("Secondary column caps", "A single plate tops each slim column so it finishes level with the big capitals.");
  for (const x of SEC_XS) for (const z of SEC_ZS) b.put("plate", 1, 1, x, z, 7, "white", "Column cap");

  b.step(
    "Undercroft paving, rear",
    "Pave the shaded floor under the deck now, while you can still reach it; once the deck goes on, this space closes up for good, exactly like the estate's service undercrofts."
  );
  for (const [x, z] of [[-7, -2], [1, -2], [5, -2]] as const)
    b.put("tile", 2, 2, x, z, 1, "dark", "Undercroft paving");

  b.step("Undercroft paving, front", "Smooth tiles read as poured floor slab. Keep them inside the column grid.");
  for (const x of [-8, -2, 4]) b.put("tile", 2, 2, x, 0, 1, "dark", "Undercroft paving");
  for (const x of [-5, 1, 7]) b.put("tile", 2, 2, x, 0, 1, "dark", "Undercroft paving");
}

// Tower course generator ------------------------------------------------
// Places one course of the Y-plan tower, including its window-band pieces,
// so every course is complete before the next goes on top.
function towerCourse(b: Builder, c: number) {
  const l = towerLayer(c);
  const wl = wingLen(c);
  const mode = c % 4;
  const slotted = c >= 5 && (mode === 1 || mode === 2);
  const d = "Tower Y-plan course";

  if (mode === 3) {
    const w = 2 * wl + 2;
    if (w === 8) {
      b.put("brick", 6, 2, TW_CX - wl, TW_CZ, l, "white", d);
      b.put("brick", 2, 2, TW_CX - wl + 6, TW_CZ, l, "white", d);
    } else if (w === 6 && c < 20) {
      b.put("brick", 6, 1, TW_CX - wl, TW_CZ, l, "white", d);
      b.put("brick", 6, 1, TW_CX - wl, TW_CZ + 1, l, "white", d);
    } else if (w === 6) {
      b.put("brick", 4, 2, TW_CX - wl, TW_CZ, l, "white", d);
      b.put("brick", 2, 2, TW_CX - wl + 4, TW_CZ, l, "white", d);
    } else {
      b.put("brick", 4, 2, TW_CX - wl, TW_CZ, l, "white", d);
    }
    b.put("brick", 2, wl, TW_CX, TW_CZ - wl, l, "white", d);
    return;
  }
  // Core + back wing built as one vertical strip (interlocks with the bars)
  const backD = slotted ? wl - 1 : wl;
  const depth = 2 + backD;
  const z0 = TW_CZ - backD;
  if (depth === 5) {
    b.put("brick", 1, 3, TW_CX, z0, l, "white", d);
    b.put("brick", 1, 3, TW_CX + 1, z0, l, "white", d);
    b.put("brick", 2, 2, TW_CX, z0 + 3, l, "white", d);
  } else if (depth === 4) {
    b.put("brick", 2, 4, TW_CX, z0, l, "white", d);
  } else if (depth === 3) {
    b.put("brick", 1, 3, TW_CX, z0, l, "white", d);
    b.put("brick", 1, 3, TW_CX + 1, z0, l, "white", d);
  } else {
    b.put("brick", 2, 2, TW_CX, z0, l, "white", d);
  }
  const sideW = slotted ? wl - 1 : wl;
  if (sideW > 0) {
    b.put("brick", sideW, 2, TW_CX + 2, TW_CZ, l, "white", d);
    b.put("brick", sideW, 2, TW_CX - sideW, TW_CZ, l, "white", d);
  }
  // Window-band pieces at the wing tips, placed with their own course so
  // they are never trapped under a later course.
  if (slotted) {
    const ex = TW_CX + 1 + wl;
    const wx = TW_CX - wl;
    const bz = TW_CZ - wl;
    if (mode === 1) {
      if (GRILLE_COURSES.has(c)) {
        b.put("profile", 1, 2, ex, TW_CZ, l, "white", "Tower spandrel band", "E");
        b.put("profile", 1, 2, wx, TW_CZ, l, "white", "Tower spandrel band", "W");
        b.put("profile", 2, 1, TW_CX, bz, l, "white", "Tower spandrel band", "N");
      } else if (c === 25) {
        b.put("brick", 1, 2, ex, TW_CZ, l, "white", "Tower spandrel course", "E");
        b.put("brick", 1, 2, wx, TW_CZ, l, "white", "Tower spandrel course", "W");
        b.put("brick", 2, 1, TW_CX, bz, l, "white", "Tower spandrel course", "N");
      } else {
        b.put("grilleTile", 1, 2, ex, TW_CZ, l, "white", "Tower vent course", "E");
        b.put("grilleTile", 1, 2, wx, TW_CZ, l, "white", "Tower vent course", "W");
        b.put("brick", 2, 1, TW_CX, bz, l, "white", "Tower spandrel course", "N");
      }
    } else {
      if (GLASS_COURSES.has(c)) {
        b.put("brick", 1, 2, ex, TW_CZ, l, "trans", "Tower window band", "E");
        b.put("brick", 1, 2, wx, TW_CZ, l, "trans", "Tower window band", "W");
        b.put("brick", 2, 1, TW_CX, bz, l, "trans", "Tower window band", "N");
      } else {
        b.put("grilleTile", 1, 2, ex, TW_CZ, l, "white", "Tower vent course", "E");
        b.put("grilleTile", 1, 2, wx, TW_CZ, l, "white", "Tower vent course", "W");
        b.put("brick", 2, 1, TW_CX, bz, l, "white", "Tower spandrel course", "N");
      }
    }
  }
}

// Cross-shaped plate band after course c (c ≡ 3 mod 4), plus the serration
// fins that ride each upper band's overhang; placed with their band so they
// are never trapped beneath a later one.
function towerBand(b: Builder, c: number) {
  const l = towerLayer(c) + 3;
  const wl = wingLen(c);
  if (wl === 3) {
    b.put("plate", 6, 2, TW_CX - wl - 1, TW_CZ, l, "white", "Tower floor band");
    b.put("plate", 4, 2, TW_CX - wl - 1 + 6, TW_CZ, l, "white", "Tower floor band");
    b.put("plate", 2, 4, TW_CX, TW_CZ - wl - 1, l, "white", "Tower floor band");
  } else if (wl === 2) {
    b.put("plate", 8, 2, TW_CX - wl - 1, TW_CZ, l, "white", "Tower floor band");
    b.put("plate", 2, 2, TW_CX, TW_CZ - wl, l, "white", "Tower floor band");
  } else {
    b.put("plate", 6, 2, TW_CX - wl - 1, TW_CZ, l, "white", "Tower floor band");
    b.put("plate", 2, 2, TW_CX, TW_CZ - wl - 1, l, "white", "Tower floor band");
  }
  if (c >= 15) {
    b.put("cheese", 1, 1, TW_CX - wl - 1, TW_CZ, l + 1, "white", "Serrated fin", "W");
    b.put("cheese", 1, 1, TW_CX + wl + 2, TW_CZ, l + 1, "white", "Serrated fin", "E");
    if (c === 27) {
      b.put("cheese", 1, 1, TW_CX, TW_CZ - wl - 1, l + 1, "white", "Serrated fin", "N");
      b.put("cheese", 1, 1, TW_CX + 1, TW_CZ - wl - 1, l + 1, "white", "Serrated fin", "N");
    }
  }
}

function towerCourses(b: Builder, from: number, to: number) {
  for (let c = from; c <= to; c++) {
    towerCourse(b, c);
    if (c % 4 === 3 && c < TOWER_COURSES - 1) towerBand(b, c);
  }
}

// Terrace helpers --------------------------------------------------------
function terraceBackCourse(b: Builder, layer: number, offsetBond: boolean) {
  const sizes = offsetBond ? [4, 6, 4, 6] : [6, 4, 6, 4];
  let x = T_X0;
  for (const s of sizes) {
    b.put("brick", s, 1, x, T_ZB, layer, "white", "Terrace back wall");
    x += s;
  }
  b.put("brick", 1, 2, T_X0, -5, layer, "white", "Terrace end wall");
  b.put("brick", 1, 2, T_X0 + T_W - 1, -5, layer, "white", "Terrace end wall");
}

// Storey band: rear 2×3 plates + serrated balcony strip at the front.
// Storey 0 stays flush east of x = 2 to leave room for the conservatory.
function terraceBandRear(b: Builder, storey: number) {
  const l = STOREY(storey) + 6;
  for (let u = 0; u < 10; u++) {
    b.put("plate", 2, 3, T_X0 + 2 * u, T_ZB, l, "white", "Terrace floor band");
  }
}
function terraceBandFront(b: Builder, storey: number) {
  const l = STOREY(storey) + 6;
  for (let u = 0; u < 10; u++) {
    const x = T_X0 + 2 * u;
    // The east bays stay flush on both storeys so the conservatory can be
    // dropped onto the deck later without reaching under the balconies.
    const projects = u % 2 === 0 && x < 2;
    if (projects) b.put("plate", 2, 2, x, T_ZF, l, "white", "Balcony slab (projecting)");
    else b.put("plate", 2, 1, x, T_ZF, l, "white", "Balcony slab (flush)");
  }
}

const PIER_XS = [-10, -7, -4, -1, 2, 5, 8, 9];
const GLASS_XS = [-9, -6, -3, 0, 3, 6];

function buildTerraceCore(b: Builder) {
  b.phase("bp-terrace-core");
  const WALL_XS = [-10, -4, 2, 8];

  b.step(
    "Bearing walls",
    "Four dark cross-walls carry the terrace block, echoing the estate's in-situ concrete party walls. Everything above lands on these."
  );
  for (const x of WALL_XS) for (const l of [1, 4]) b.put("brick", 2, 4, x, T_ZB, l, "dark", "Bearing wall");

  b.step("Bond course", "A plate course across the wall heads ties them into one structure before the slab arrives.");
  for (const x of WALL_XS) b.put("plate", 2, 4, x, T_ZB, SLAB_L, "white", "Bond course");

  b.step(
    "Arts Centre arcade",
    "The Barbican Centre; Europe's largest performing-arts centre when the Queen opened it in 1982, calling the complex 'one of the modern wonders of the world'; announces itself at ground level with arched openings."
  );
  for (const px of [-8, -5, -2, 1, 4, 7]) b.put("brick", 1, 1, px, T_ZF, 1, "white", "Arcade pier");
  for (const ax of [-8, -2, 4]) b.put("arch", 4, 1, ax, T_ZF, 4, "white", "Arts Centre arch");

  b.step(
    "Foyer glazing",
    "Full-height trans-clear panels behind the arcade are the foyer's glass line. Slide each one down between the bearing walls."
  );
  b.put("glassPanel", 2, 1, -7, -4, 1, "trans", "Foyer glazing");
  b.put("glassPanel", 2, 1, -1, -4, 1, "trans", "Foyer glazing");
  b.put("glassPanel", 2, 1, 5, -4, 1, "trans", "Foyer glazing");

  b.step("Landscaped banks", "Green slopes soften the estate's flanks; the Barbican's landscaping was specified as deliberately as its concrete.");
  b.put("slope33", 2, 3, -15, -1, 1, "green", "Landscaped bank", "S");
  b.put("slope33", 2, 3, 12, -1, 1, "green", "Landscaped bank", "S");

  b.step("Terrace ground slab", "Plates over the arcade close the ground floor. From here up, the terrace block is residential.");
  for (const x of [-8, -2, 4]) b.put("plate", 4, 4, x, T_ZB, SLAB_L, "white", "Terrace ground slab");

  b.step(
    "Waterside plinth and steps",
    "Inverted slopes form the podium's battered edge above the lake, with step plates tying the waterfront to the main platform. Place these before the deck goes on; afterwards you can't reach them."
  );
  for (const x of [-2, -1, 0, 1]) b.put("invSlope", 1, 2, x, 4, 1, "white", "Waterside plinth", "S");
  for (const x of [-4, -3, 2, 3]) b.put("plate", 1, 2, x, 3, 1, "white", "Lakeside step");

  b.step(
    "Podium deck",
    "The deck drops onto the column capitals and turns the colonnade into an undercroft. On the estate this level is where all pedestrian life happens; no cars anywhere above ground."
  );
  for (const x of [-10, -6, -2, 2, 6]) b.put("plate", 4, 6, x, -2, DECK_L, "white", "Podium deck");

  b.step("Deck parapet", "Rounded panels edge the deck where it faces the lake; the estate's highwalks all carry this same continuous rail line.");
  for (const x of [-10, -6, -2, 2, 6]) b.put("panel", 4, 1, x, 3, DECK_L + 1, "white", "Deck parapet", "S");

  b.step("Parapet corners", "Corner panels turn the rail around the deck's back corners.");
  for (const [x, z] of [[-10, -2], [9, -2], [-10, -1], [9, -1]] as const)
    b.put("panel", 1, 1, x, z, DECK_L + 1, "white", "Parapet corner", "S");

  b.step(
    "Tower courses 1-2",
    "Lauderdale Tower begins. The real towers are triangular in plan with a service core; ours is a Y; three wings around a 2×2 core, which keeps every course self-bracing."
  );
  towerCourses(b, 0, 1);
  b.step("Tower courses 3-4", "Alternating course patterns interlock the wings into the core; running bond, the oldest trick in masonry, in concrete and in LEGO.");
  towerCourses(b, 2, 3);
  b.step("Tower courses 5-6", "From here up the wing tips alternate: ribbed spandrel courses, then trans-clear window bands. Each course carries its own facade pieces.");
  towerCourses(b, 4, 5);
  b.step("Tower courses 7-8", "A plate band after every fourth course marks a floor line, just as the towers' balcony slabs stripe their elevations.");
  towerCourses(b, 6, 7);
}

function buildTerraceFacade(b: Builder) {
  b.phase("bp-terrace-facade");
  
  for (let s = 0; s < 3; s++) {
    const L = STOREY(s);

    b.step(
      `Storey ${s + 1}: walls and spandrels`,
      s === 0
        ? "The terrace blocks are seven storeys in real life; three here. The spandrel course uses 1×4 bricks; read them as the pick-hammered concrete panels between windows."
        : s === 1
        ? "The estate's exposed concrete was hand-finished: after 21 days' curing, workers with pick hammers chipped the whole surface to expose the Penlee granite aggregate; over 200,000 m² of it, reportedly by a team of six."
        : "Top storey. In the real blocks the uppermost flats are the prized ones, tucked directly under the barrel vaults."
    );
    terraceBackCourse(b, L, false);
    for (const x of [-10, -6, -2, 2, 6]) b.put("brick", 4, 1, x, T_ZF, L, "white", "Spandrel course");

    b.step(
      `Storey ${s + 1}: window piers`,
      s === 1
        ? "This storey's piers are headlight bricks; their recessed faces read as the deep window reveals that give the facades their shadow."
        : "Single-stud piers set the window rhythm. The gaps between them take the glazing next."
    );
    for (const x of PIER_XS) {
      if (s === 1) b.put("headlight", 1, 1, x, T_ZF, L + 3, "white", "Window pier (headlight)", "S");
      else b.put("brick", 1, 1, x, T_ZF, L + 3, "white", "Window pier");
    }

    b.step(
      `Storey ${s + 1}: glazing`,
      "Trans-clear 1×2 bricks drop between the piers. Narrow vertical slots of glass in deep concrete are the terrace blocks' signature."
    );
    for (const x of GLASS_XS) b.put("brick", 2, 1, x, T_ZF, L + 3, "trans", "Window glazing");

    b.step(`Storey ${s + 1}: rear bond course`, "The back wall bonds over the course below; stagger every joint.");
    terraceBackCourse(b, L + 3, true);

    if (s < 2) {
      b.step(
        `Storey ${s + 1}: floor band`,
        "A full plate band is this storey's floor slab. The rear plates span to the back wall; the front strip alternates flush and projecting."
      );
      terraceBandRear(b, s);
      terraceBandFront(b, s);

      b.step(
        `Storey ${s + 1}: balcony finishing`,
        "Grille tiles deck the projecting balconies, and round green plates are the residents' planters; balcony gardening is practically a competitive sport at the Barbican. Do this now: the next storey will close off the reach."
      );
      for (const x of [-10, -2]) b.put("grilleTile", 2, 1, x, -2, STOREY(s) + 7, "white", "Balcony grille decking");
      for (const dx of [0, 1]) b.put("roundPlate", 1, 1, -6 + dx, -2, STOREY(s) + 7, "green", "Balcony planter");
    }
  }

  b.step("Shear walls", "Two interior walls stiffen the top storey against the roof load.");
  for (const x of [-6, 5]) b.put("brick", 1, 2, x, -5, STOREY(2), "white", "Shear wall");

  b.step(
    "Roof cap",
    "Large plates close the block and give the vault roof its bed. The 13 real terrace blocks all finish this way; flat slab, then the white vaults."
  );
  b.put("plate", 8, 4, -10, T_ZB, T_TOP - 1, "white", "Roof cap plate");
  b.put("plate", 8, 4, -2, T_ZB, T_TOP - 1, "white", "Roof cap plate");
  b.put("plate", 4, 4, 6, T_ZB, T_TOP - 1, "white", "Roof cap plate");
}

function buildBalconies(b: Builder) {
  b.phase("bp-terrace-balconies");

  b.step(
    "Highwalk plates",
    "The estate's highwalks were meant to seed a city-wide network of walkways above the traffic; the 'pedway'. Only fragments were ever built, but the Barbican's stretch still works exactly as drawn."
  );
  for (const x of [-10, -6, -2, 2, 6]) b.put("plate", 4, 1, x, 3, DECK_L + 4, "white", "Highwalk plate");

  b.step("Highwalk paving", "Dark tiles give the elevated walk its smooth deck. Yellow lines painted on the real ones guide visitors to the Centre.");
  for (const x of [-10, -6, -2, 2, 6]) b.put("tile", 4, 1, x, 3, DECK_L + 5, "dark", "Highwalk tile");

  b.step("Deck planters", "Round planters with greenery break up the podium paving, matching the estate's raised beds.");
  for (const x of [-1, 0]) {
    b.put("roundPlate", 1, 1, x, 0, DECK_L + 1, "white", "Deck planter");
    b.put("roundPlate", 1, 1, x, 0, DECK_L + 2, "green", "Deck planting");
  }

  b.step("Lakeside benches", "Benches face the water on the lakeside walk; the estate's best free seats.");
  b.put("tile", 2, 1, -8, 5, 1, "dark", "Lakeside bench");
  b.put("tile", 2, 1, 6, 5, 1, "dark", "Lakeside bench");
  b.put("tile", 2, 1, -10, 5, 1, "dark", "Lakeside bench");
  b.put("tile", 2, 1, 8, 5, 1, "dark", "Lakeside bench");
}

function buildBarrelVault(b: Builder) {
  b.phase("bp-barrel-vault");
  const L = T_TOP;

  b.step(
    "Rear roof pitch",
    "The terrace roofs trace back to Le Corbusier's Maison Jaoul vaults and Greek island church roofs; Mediterranean curves over London concrete."
  );
  for (const x of [-10, -8, -6, -4]) b.put("slope45", 2, 2, x, -6, L, "white", "Roof pitch (rear)", "N");
  for (const x of [-2, 0, 2]) b.put("slope45", 2, 2, x, -6, L, "white", "Roof pitch (rear)", "N");

  b.step("Front roof pitch", "The south pitch meets the rear at the ridge. Seen from the lake this is the terrace's skyline.");
  for (const x of [-10, -6]) b.put("slope45", 4, 2, x, -4, L, "white", "Roof pitch (front)", "S");
  b.put("slope45", 4, 2, -2, -4, L, "white", "Roof pitch (front)", "S");
  for (const x of [2, 3]) b.put("slope45", 1, 2, x, -4, L, "white", "Roof pitch (front)", "S");

  b.step("Plant room walls", "A rooftop plant room anchors the east end; the estate hides all its machinery in blocks like this one.");
  b.put("brick", 3, 1, 4, -6, L, "white", "Plant room wall (rear)");
  b.put("brick", 3, 1, 7, -6, L, "white", "Plant room wall (rear)");
  b.put("brick", 1, 2, 4, -5, L, "white", "Plant room wall (side)");
  b.put("brick", 1, 2, 9, -5, L, "white", "Plant room wall (side)");

  b.step("Plant room glazing", "Corner bricks and trans-clear infill give the plant room its clerestory band.");
  b.put("brick", 1, 1, 4, -3, L, "white", "Plant room corner");
  b.put("brick", 1, 1, 9, -3, L, "white", "Plant room corner");
  b.put("brick", 2, 1, 5, -3, L, "trans", "Plant room glazing");
  b.put("brick", 2, 1, 7, -3, L, "trans", "Plant room glazing");

  b.step("Plant room roof", "Plates cap the box, ready for the vaults.");
  b.put("plate", 4, 4, 4, -6, L + 3, "white", "Plant room roof");
  b.put("plate", 2, 4, 8, -6, L + 3, "white", "Plant room roof");

  b.step(
    "Barrel vaults, rear row",
    "Curved-top bricks laid side by side are the Barbican's most famous motif in miniature: the repeated white barrel vaults that crown all thirteen terrace blocks."
  );
  for (let x = 4; x < 10; x++) b.put("curvedTop", 1, 2, x, -6, L + 4, "white", "Barrel vault cap", "E");

  b.step("Barrel vaults, front row", "A second row completes the vaulted roofscape.");
  for (let x = 4; x < 10; x++) b.put("curvedTop", 1, 2, x, -4, L + 4, "white", "Barrel vault cap", "E");
}

function buildTowerCore(b: Builder) {
  b.phase("bp-tower-core");
  const tips: (string | undefined)[] = [
    "The three real towers; Cromwell, Shakespeare and Lauderdale; rise 43 and 44 storeys to about 123 metres, among the tallest residential towers in Europe when they topped out.",
    "Keep pressing each course fully home; a tall thin tower amplifies any gap below.",
    "The window bands continue automatically as you climb; grille spandrels, then glass.",
    "The towers' floors were cast around slip-formed cores; your plate bands play the part of the floor slabs.",
    undefined,
    "First setback: the wings shorten as the tower rises, sharpening the silhouette.",
    undefined,
    undefined,
    "Second setback; from here the wings are single studs, all point.",
    undefined,
    "Top courses. Each real tower finishes with two or three floors of penthouses.",
  ];
  let i = 0;
  for (let c = 8; c < 30; c += 2) {
    const first = c;
    b.step(`Tower courses ${first + 1}-${first + 2}`, tips[i++]);
    towerCourses(b, c, c + 1);
  }
  b.step("Top platform", "Plates cap the shaft and carry the penthouse block.");
  b.put("plate", 4, 2, -2, -9, TOWER_TOP_L, "white", "Tower top platform");
  b.put("plate", 2, 2, -1, -11, TOWER_TOP_L, "white", "Tower top platform (rear)");
}

function buildTowerFacade(b: Builder) {
  b.phase("bp-tower-facade");

  b.step(
    "Penthouse base course",
    "The top floors of each tower hold three penthouse flats apiece; the Barbican's grandest addresses. A solid course starts ours."
  );
  b.put("brick", 4, 2, -2, -9, TOWER_TOP_L + 1, "white", "Crown base");
  b.put("brick", 2, 2, -1, -11, TOWER_TOP_L + 1, "white", "Crown base (rear)");

  b.step("Penthouse upper course", "A second course brings the penthouse to height.");
  b.put("brick", 4, 2, -2, -9, TOWER_TOP_L + 4, "white", "Crown course");
  b.put("brick", 2, 2, -1, -11, TOWER_TOP_L + 4, "white", "Crown course (rear)");

  b.step("Band edge tiles", "Smooth tiles trim the topmost band where it shows.");
  b.put("tile", 1, 1, -3, -8, towerLayer(27) + 4, "white", "Band edge tile");
  b.put("tile", 1, 1, 2, -8, towerLayer(27) + 4, "white", "Band edge tile");
}

function buildTowerCrown(b: Builder) {
  b.phase("bp-tower-crown");
  const L = TOWER_TOP_L + 7;

  b.step("Crown platform", "Plates over the penthouse form the roof terrace.");
  b.put("plate", 4, 2, -2, -9, L, "white", "Crown platform");
  b.put("plate", 2, 2, -1, -11, L, "white", "Crown platform (rear)");

  b.step("Crown core, first course", "The lift motor room rises from the centre of the platform.");
  b.put("brick", 2, 2, -1, -9, L + 1, "white", "Crown core");
  b.step("Crown core, second course", "One more course; the real towers' crowns hold plant, tanks and window-washing rigs.");
  b.put("brick", 2, 2, -1, -9, L + 4, "white", "Crown core");

  b.step("Crown serrations", "Cheese slopes ring the core so even the crown keeps the saw-tooth profile.");
  b.put("cheese", 1, 1, -2, -8, L + 1, "white", "Crown serration", "S");
  b.put("cheese", 1, 1, 1, -8, L + 1, "white", "Crown serration", "S");
  b.put("cheese", 1, 1, -2, -9, L + 1, "white", "Crown serration", "W");
  b.put("cheese", 1, 1, 1, -9, L + 1, "white", "Crown serration", "E");

  b.step("Rear platform trim", "Tiles finish the rear terrace smooth.");
  b.put("tile", 1, 1, -1, -11, L + 1, "white", "Platform trim tile");
  b.put("tile", 1, 1, 0, -11, L + 1, "white", "Platform trim tile");

  b.step("Crown ridge", "Paired slopes close the motor room with a tiny duo-pitch.");
  b.put("slope45", 2, 1, -1, -9, L + 7, "white", "Crown ridge", "N");
  b.put("slope45", 2, 1, -1, -8, L + 7, "white", "Crown ridge", "S");

  b.step(
    "Mast and beacon",
    "A slim mast with its aircraft beacon tops out at the equivalent of 123 metres. Cromwell Tower's real beacon blinks over the City every night."
  );
  b.put("roundBrick", 1, 1, -1, -10, L + 1, "white", "Mast base");
  b.put("roundPlate", 1, 1, -1, -10, L + 4, "white", "Mast ring");
  b.put("roundPlate", 1, 1, -1, -10, L + 5, "white", "Mast ring");
  b.put("roundPlate", 1, 1, -1, -10, L + 6, "dark", "Mast beacon");
}

function buildConservatory(b: Builder) {
  b.phase("bp-conservatory");
  const X = 3, Z = -2, L = DECK_L + 1;

  b.step(
    "Conservatory base",
    "London's second-largest conservatory (after Kew's Princess of Wales house) exists for a sly reason: to hide the Barbican Theatre's fly tower. Scenery drops from inside it to a stage six storeys below."
  );
  b.put("plate", 4, 4, X, Z, L, "white", "Conservatory base");
  b.put("plate", 2, 4, X + 4, Z, L, "white", "Conservatory base");

  b.step("Corner posts, lower", "Four posts set out the steel frame.");
  for (const [x, z] of [[X, Z], [X + 5, Z], [X, Z + 3], [X + 5, Z + 3]] as const)
    b.put("brick", 1, 1, x, z, L + 1, "white", "Corner post");
  b.step("Corner posts, upper", "Double-height posts match the glazing panels' height.");
  for (const [x, z] of [[X, Z], [X + 5, Z], [X, Z + 3], [X + 5, Z + 3]] as const)
    b.put("brick", 1, 1, x, z, L + 4, "white", "Corner post");

  b.step(
    "Glazing panels all round",
    "Trans-clear wall panels close the glass house. The real steel-and-glass roof covers 23,000 square feet over hand-mixed soil beds."
  );
  b.put("glassPanel", 1, 2, X, Z + 1, L + 1, "trans", "Side glazing", "E");
  b.put("glassPanel", 1, 2, X + 5, Z + 1, L + 1, "trans", "Side glazing", "W");
  b.put("glassPanel", 2, 1, X + 1, Z + 3, L + 1, "trans", "Rear glazing");
  b.put("glassPanel", 2, 1, X + 3, Z + 3, L + 1, "trans", "Rear glazing");
  b.put("glassPanel", 2, 1, X + 1, Z, L + 1, "trans", "Front glazing");
  b.put("glassPanel", 2, 1, X + 3, Z, L + 1, "trans", "Front glazing");

  b.step("Ring beam", "Plates over the panels form the ring beam that carries the glass roof.");
  b.put("plate", 6, 1, X, Z, L + 7, "white", "Ring plate (front)");
  b.put("plate", 6, 1, X, Z + 3, L + 7, "white", "Ring plate (back)");
  b.put("plate", 1, 2, X, Z + 1, L + 7, "white", "Ring plate (side)");
  b.put("plate", 1, 2, X + 5, Z + 1, L + 7, "white", "Ring plate (side)");

  b.step(
    "Planting",
    "Around 1,500 species grow inside, planted in 1980-81 before opening in 1984; some now rare or extinct in the wild. Green round plates are your finger palms and tree ferns."
  );
  for (const [x, z] of [[X + 1, Z + 1], [X + 2, Z + 2], [X + 4, Z + 1], [X + 3, Z + 2], [X + 4, Z + 2]] as const)
    b.put("roundPlate", 1, 1, x, z, L + 1, "green", "Conservatory planting");

  b.step("Paths and entry", "Dark tiles thread a visitor path through the beds and mark the entrance outside.");
  b.put("tile", 2, 1, X + 2, Z + 1, L + 1, "dark", "Interior path");
  b.put("tile", 1, 1, X + 1, Z + 2, L + 1, "dark", "Interior path");
  b.put("tile", 2, 1, 6, 2, DECK_L + 1, "dark", "Conservatory entry");

  b.step("Glass roof, front half", "Trans-clear plates lie flat across the ring beam; each pane anchors on the ring at one end.");
  for (let x = X; x < X + 6; x++) b.put("plate", 1, 2, x, Z, L + 8, "trans", "Glass roof");
  b.step("Glass roof, rear half", "The rear panes complete the canopy over the planting.");
  for (let x = X; x < X + 6; x++) b.put("plate", 1, 2, x, Z + 2, L + 8, "trans", "Glass roof");
}

function buildLandscaping(b: Builder) {
  b.phase("bp-landscaping");
  const tree = (x: number, z: number) => {
    b.put("roundBrick", 1, 1, x, z, 1, "dark", "Tree trunk");
    b.put("roundPlate", 2, 2, x, z, 4, "green", "Tree canopy");
    b.put("roundPlate", 1, 1, x, z, 5, "green", "Tree crown");
  };

  b.step("Deck paving", "Dark tile runs across the podium mark the pedestrian desire lines to the Centre.");
  for (const x of [-10, -6, -2]) b.put("tile", 4, 1, x, 2, DECK_L + 1, "dark", "Deck paving");
  for (const x of [-10, -6]) b.put("tile", 4, 1, x, 0, DECK_L + 1, "dark", "Deck paving");

  b.step("Lakeside promenade", "The promenade along the water is the estate's social spine; cafe tables from the Centre spill onto the real one.");
  b.put("tile", 4, 1, -12, 4, 1, "dark", "Promenade (west)");
  b.put("tile", 2, 1, -8, 4, 1, "dark", "Promenade (west)");
  b.put("tile", 4, 1, 6, 4, 1, "dark", "Promenade (east)");
  b.put("tile", 2, 1, 10, 4, 1, "dark", "Promenade (east)");

  b.step("Bollards", "Round plates as bollards edge the water; the only traffic they stop is pigeons.");
  for (const z of [7, 9, 11]) b.put("roundPlate", 1, 1, -10, z, 1, "dark", "Bollard");
  for (const z of [7, 9, 11]) b.put("roundPlate", 1, 1, 9, z, 1, "dark", "Bollard");

  b.step("Lakeside walks", "Long tiles run the walks down both lake flanks.");
  b.put("tile", 1, 6, -11, 6, 1, "dark", "Lakeside walk");
  b.put("tile", 1, 6, 10, 6, 1, "dark", "Lakeside walk");

  b.step("Waterfront trim", "Short tiles finish the water's outer edges, including strips on the front edge beams.");
  b.put("tile", 1, 2, -12, 6, 1, "dark", "Waterfront trim");
  b.put("tile", 1, 2, -12, 9, 1, "dark", "Waterfront trim");
  b.put("tile", 1, 2, 11, 6, 1, "dark", "Waterfront trim");
  b.put("tile", 1, 2, 11, 9, 1, "dark", "Waterfront trim");
  b.put("tile", 1, 2, -12, 13, 2, "dark", "Waterfront strip");
  b.put("tile", 1, 2, 10, 13, 2, "dark", "Waterfront strip");

  b.step("Highwalk extensions", "Two more tile runs extend the podium routes westward.");
  b.put("tile", 2, 1, -10, 1, DECK_L + 1, "dark", "Highwalk extension");
  b.put("tile", 2, 1, -8, 1, DECK_L + 1, "dark", "Highwalk extension");

  b.step(
    "Boundary wall",
    "A low wall closes the western edge. Fragments of the Roman and medieval London Wall survive inside the real estate; the ancient barbican that named the place."
  );
  for (const z of [-12, -9, -6, -3]) b.put("brick", 1, 3, -18, z, 2, "white", "Boundary wall");
  b.put("brick", 1, 2, -18, 0, 2, "white", "Boundary wall");

  b.step("Boundary details", "A junction block, an eastern marker and a service block behind the tower finish the estate edge.");
  b.put("brick", 2, 2, -18, 2, 2, "white", "Boundary junction");
  b.put("brick", 1, 1, 17, 2, 2, "white", "Boundary marker");
  b.put("brick", 3, 1, 1, -12, 3, "white", "Service block");

  b.step("Threshold and walkway cap", "Dark tiles mark the Centre's entrance threshold on the deck.");
  b.put("tile", 2, 1, 2, 2, DECK_L + 1, "dark", "Entrance threshold");
  b.put("tile", 2, 1, 4, 2, DECK_L + 1, "dark", "Walkway cap");

  b.step("Waterside trees, west", "Trees soften the hard landscape; every planting position on the estate was specified by the architects.");
  tree(-16, -9);
  tree(-14, -4);
  b.step("Waterside trees, east", "The eastern pair mirrors the west bank.");
  tree(13, -4);
  tree(15, -9);

  b.step("Landscaped banks", "Two more green banks blend the boundary into the gardens.");
  b.put("slope33", 2, 3, -17, -5, 1, "green", "Landscaped bank", "S");
  b.put("slope33", 2, 3, 15, -6, 1, "green", "Landscaped bank", "S");

  b.step("Plinth extensions", "Extra inverted slopes stretch the waterside plinth along the deck front.");
  for (const x of [-6, -5]) b.put("invSlope", 1, 2, x, 4, 1, "white", "Plinth extension", "S");
  for (const x of [4, 5]) b.put("invSlope", 1, 2, x, 4, 1, "white", "Plinth extension", "S");

  b.step(
    "Rear trees",
    "Two last trees behind the tower complete the estate; home today to more than 4,000 residents in over 2,000 flats, Grade II listed since September 2001."
  );
  tree(-9, -11);
  tree(7, -11);
}

// ─── Entry point ───────────────────────────────────────────────────────

let cached: BuildPlacements | null = null;
let cachedMeta: BuildMeta | null = null;

function generate(): { build: BuildPlacements; meta: BuildMeta } {
  const b = new Builder();
  buildFoundation(b);
  buildLake(b);
  buildPodium(b);
  buildTerraceCore(b);
  buildTerraceFacade(b);
  buildBalconies(b);
  buildBarrelVault(b);
  buildTowerCore(b);
  buildTowerFacade(b);
  buildTowerCrown(b);
  buildConservatory(b);
  buildLandscaping(b);
  return { build: b.build, meta: b.meta };
}

export function generateBuild(): BuildPlacements {
  if (!cached) {
    const g = generate();
    cached = g.build;
    cachedMeta = g.meta;
  }
  return cached;
}

export function generateBuildMeta(): BuildMeta {
  generateBuild();
  return cachedMeta!;
}

export const BP_PHASE_ORDER = [
  "bp-foundation",
  "bp-lake",
  "bp-podium",
  "bp-terrace-core",
  "bp-terrace-facade",
  "bp-terrace-balconies",
  "bp-barrel-vault",
  "bp-tower-core",
  "bp-tower-facade",
  "bp-tower-crown",
  "bp-conservatory",
  "bp-landscaping",
];

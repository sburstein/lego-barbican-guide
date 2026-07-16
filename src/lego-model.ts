// ═══════════════════════════════════════════════════════════════════════
// LEGO PLACEMENT MODEL — Barbican Estate Lakeside Panorama
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
};

export type StepPlacements = Placement[];
export type PhasePlacements = StepPlacements[];
export type BuildPlacements = Record<string, PhasePlacements>;

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

export function footprintCells(p: Placement): [number, number][] {
  const cells: [number, number][] = [];
  for (let i = 0; i < p.w; i++) for (let j = 0; j < p.d; j++) cells.push([p.x + i, p.z + j]);
  if (p.kind === "cornerPlate") {
    const [mx, mz] = cornerMissing(p);
    return cells.filter(([cx, cz]) => !(cx === mx && cz === mz));
  }
  return cells;
}

/** Which cells of a placement have studs on top (absolute cells). */
export function topStudCells(p: Placement): [number, number][] {
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

class Builder {
  build: BuildPlacements = {};
  private phaseId = "";
  private stepArr: StepPlacements | null = null;

  phase(id: string) {
    this.phaseId = id;
    this.build[id] = [];
  }
  step() {
    this.stepArr = [];
    this.build[this.phaseId].push(this.stepArr);
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
    if (!entry) errors.push(`NO SUCH PART: ${p.kind} ${p.w}×${p.d} — ${where}`);
    else if (!partNumberFor(entry, p.color))
      errors.push(`NO ${p.color.toUpperCase()} VERSION of ${entry.name} — ${where}`);
    if (![p.w, p.d, p.x, p.z, p.layer].every(Number.isInteger))
      errors.push(`OFF GRID (non-integer): ${where}`);
    if (p.layer < 0) errors.push(`BELOW TABLE: ${where}`);
  }

  // Occupancy + support (order by layer so lower pieces exist first)
  const sorted = [...all].sort((a, b) => a.p.layer - b.p.layer);
  const occ = new Map<string, string>();
  const studs = new Map<string, boolean>();

  for (const { p, where } of sorted) {
    if (!Number.isInteger(p.layer) || !Number.isInteger(p.x)) continue;
    for (const [cx, cz] of footprintCells(p)) {
      for (let l = p.layer; l < p.layer + p.h; l++) {
        const k = `${cx},${cz},${l}`;
        const prev = occ.get(k);
        if (prev) errors.push(`COLLISION at cell (${cx},${cz}) layer ${l}: ${where} overlaps ${prev}`);
        else occ.set(k, where);
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

  return errors;
}

// ═══════════════════════════════════════════════════════════════════════
// THE BUILD — 12 phases, 167 steps
// Layout key:
//   Baseplates layer 0. Base top = layer 1.
//   Lake: cells x -8..7, z 6..12.
//   Podium: 6 main 2×2 round columns (2 bricks tall) in two rows; deck L8.
//   Terrace: cells x -10..9, z -6..-3; slab L7..8; three storeys of
//     [brick course, brick course, plate band]; roof cap top = layer 29.
//   Tower: Y-plan behind terrace; core cells (-1..0, -9..-8), wings W/E/N.
//   Conservatory: on deck, cells x 3..8, z -2..1.
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

// Tower constants (unchanged from the terrace re-scale — it reads taller now)
const TW_CX = -1;
const TW_CZ = -9;
const TOWER_BASE_L = 3;
const TOWER_COURSES = 30;
const wingLen = (c: number) => (c < 12 ? 3 : c < 24 ? 2 : 1);
const bandsBefore = (c: number) => Math.floor(c / 4);
export const towerLayer = (c: number) => TOWER_BASE_L + 3 * c + bandsBefore(c);
const TOWER_TOP_L = towerLayer(TOWER_COURSES - 1) + 3; // 100

// Window/spandrel course scheme (c ≥ 5):
//   c ≡ 1 (mod 4): spandrel band — grille bricks (white bricks on c25, c29)
//   c ≡ 2 (mod 4): glazing band — trans bricks (white brick on c26)
const GRILLE_COURSES = new Set([5, 9, 13, 17, 21]);
const GLASS_COURSES = new Set([6, 10, 14, 18, 22]);

function buildFoundation(b: Builder) {
  b.phase("bp-foundation");
  const d = "Foundation platform";

  b.step(); // 0: back row
  b.put("plate", 8, 8, -12, -12, 0, "white", d);
  b.put("plate", 8, 8, -4, -12, 0, "white", d);
  b.step(); // 1
  b.put("plate", 8, 8, 4, -12, 0, "white", d);
  b.step(); // 2: middle row
  b.put("plate", 8, 8, -12, -4, 0, "white", d);
  b.put("plate", 8, 8, -4, -4, 0, "white", d);
  b.step(); // 3
  b.put("plate", 8, 8, 4, -4, 0, "white", d);
  b.step(); // 4: lake extension
  for (const x of [-12, -6, 0, 6]) b.put("plate", 6, 10, x, 4, 0, "white", "Lake zone extension");
  b.step(); // 5: side extensions
  for (const x of [-18, 12]) for (const z of [-12, -4]) b.put("plate", 6, 8, x, z, 0, "white", "Side extension");
  b.step(); // 6: seam ties across the z = -4 joint
  b.put("plate", 2, 4, -12, -6, 1, "dark", "Seam tie (west)");
  b.put("plate", 2, 4, 10, -6, 1, "dark", "Seam tie (east)");
  b.step(); // 7: seam ties across the x = ±12 joints
  b.put("plate", 6, 1, -15, -11, 1, "white", "Side seam tie");
  b.put("plate", 6, 1, 10, -11, 1, "white", "Side seam tie");
  b.put("plate", 6, 1, -16, -7, 1, "white", "Side seam tie");
  b.put("plate", 6, 1, 10, -7, 1, "white", "Side seam tie");
  b.step(); // 8: edge beams
  b.put("plate", 10, 1, -12, 13, 1, "dark", "Front edge beam");
  b.put("plate", 10, 1, -2, 13, 1, "dark", "Front edge beam");
  b.put("plate", 4, 1, 8, 13, 1, "dark", "Front edge beam");
  b.put("plate", 6, 1, -12, -12, 1, "dark", "Back edge beam");
  b.put("plate", 6, 1, 6, -12, 1, "dark", "Back edge beam");
  b.put("plate", 1, 10, -18, -12, 1, "dark", "Left edge beam");
  b.put("plate", 1, 6, -18, -2, 1, "dark", "Left edge beam");
  b.put("plate", 1, 10, 17, -12, 1, "dark", "Right edge beam");
  b.put("plate", 1, 6, 17, -2, 1, "dark", "Right edge beam");
  b.step(); // 9: tower reinforcement
  for (const x of [-6, -2, 2]) b.put("plate", 4, 6, x, -12, 1, "dark", "Tower reinforcement L1");
  for (const x of [-4, 0]) b.put("plate", 4, 6, x, -12, 2, "white", "Tower reinforcement L2");
}

function buildLake(b: Builder) {
  b.phase("bp-lake");
  b.step(); // 0: L-shaped corner plates wrap the lake corners
  b.put("cornerPlate", 2, 2, -8, 6, 1, "dark", "Lake corner", "S");
  b.put("cornerPlate", 2, 2, 6, 6, 1, "dark", "Lake corner", "W");
  b.put("cornerPlate", 2, 2, -8, 11, 1, "dark", "Lake corner", "E");
  b.put("cornerPlate", 2, 2, 6, 11, 1, "dark", "Lake corner", "N");
  b.step(); // 1: border
  for (const x of [-6, -2, 2]) b.put("plate", 4, 1, x, 6, 1, "dark", "Lake border (back)");
  for (const x of [-6, -2, 2]) b.put("plate", 4, 1, x, 12, 1, "dark", "Lake border (front)");
  b.put("plate", 1, 3, -8, 8, 1, "dark", "Lake border (left)");
  b.put("plate", 1, 3, 7, 8, 1, "dark", "Lake border (right)");
  // 2-5: water surface, fully tiled — no holes
  const water = (zRows: number[]) => {
    b.step();
    for (const z of zRows) for (let x = -6; x < 6; x += 2) b.put("plate", 2, 1, x, z, 1, "trans", "Lake water");
  };
  water([7, 8]);
  water([9]);
  water([10]);
  water([11]);
  b.step(); // 6: ripple highlights
  for (const [x, z] of [[-5, 8], [-3, 10], [-1, 7], [1, 9], [3, 8], [4, 11], [-6, 11]] as const)
    b.put("plate", 1, 1, x, z, 2, "trans", "Ripple highlight");
  b.step(); // 7
  for (const [x, z] of [[-4, 7], [-2, 9], [0, 11], [2, 10], [4, 7], [5, 9], [-6, 9]] as const)
    b.put("plate", 1, 1, x, z, 2, "trans", "Ripple highlight");
}

function buildPodium(b: Builder) {
  b.phase("bp-podium");
  const col = (x: number, z: number) => {
    for (const l of [1, 4]) b.put("roundBrick", 2, 2, x, z, l, "white", "Podium column");
  };
  b.step(); // 0
  for (const z of COL_ZS) col(-10, z);
  b.step(); // 1
  for (const z of COL_ZS) col(-1, z);
  b.step(); // 2
  for (const z of COL_ZS) col(8, z);
  b.step(); // 3: capitals west + centre
  for (const x of [-10, -1]) for (const z of COL_ZS) {
    if (x === -1 && z === 2) continue;
    b.put("roundPlate", 2, 2, x, z, 7, "white", "Column capital");
  }
  b.step(); // 4: capitals east + remaining
  b.put("roundPlate", 2, 2, -1, 2, 7, "white", "Column capital");
  for (const z of COL_ZS) b.put("roundPlate", 2, 2, 8, z, 7, "white", "Column capital");
  b.step(); // 5: secondary columns, rear row
  for (const x of SEC_XS) for (const l of [1, 4]) b.put("roundBrick", 1, 1, x, SEC_ZS[0], l, "white", "Secondary column");
  b.step(); // 6: secondary columns, front row
  for (const x of SEC_XS) for (const l of [1, 4]) b.put("roundBrick", 1, 1, x, SEC_ZS[1], l, "white", "Secondary column");
  b.step(); // 7: secondary column caps
  for (const x of SEC_XS) for (const z of SEC_ZS) b.put("plate", 1, 1, x, z, 7, "white", "Column cap");
}

// Tower course generator ------------------------------------------------
function towerCourse(b: Builder, c: number) {
  const l = towerLayer(c);
  const wl = wingLen(c);
  const mode = c % 4;
  const slotted = c >= 5 && (mode === 1 || mode === 2);
  const d = "Tower Y-plan course";

  if (mode === 3) {
    // interlocking bar across both side wings + core (split into set parts)
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
}

// Cross-shaped plate band after course c (c ≡ 3 mod 4)
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
function terraceBand(b: Builder, storey: number) {
  const l = STOREY(storey) + 6;
  for (let u = 0; u < 10; u++) {
    const x = T_X0 + 2 * u;
    b.put("plate", 2, 3, x, T_ZB, l, "white", "Terrace floor band");
    const projects = u % 2 === 0 && !(storey === 0 && x >= 2);
    if (projects) b.put("plate", 2, 2, x, T_ZF, l, "white", "Balcony slab (projecting)");
    else b.put("plate", 2, 1, x, T_ZF, l, "white", "Balcony slab (flush)");
  }
}

function buildTerraceCore(b: Builder) {
  b.phase("bp-terrace-core");
  const WALL_XS = [-10, -4, 2, 8];

  b.step(); // 0: bearing walls west (2 courses of 2×4)
  for (const x of [-10, -4]) for (const l of [1, 4]) b.put("brick", 2, 4, x, T_ZB, l, "dark", "Bearing wall");
  b.step(); // 1: bearing walls east
  for (const x of [2, 8]) for (const l of [1, 4]) b.put("brick", 2, 4, x, T_ZB, l, "dark", "Bearing wall");
  b.step(); // 2: bond course over the walls
  for (const x of WALL_XS) b.put("plate", 2, 4, x, T_ZB, SLAB_L, "white", "Bond course");
  b.step(); // 3: arcade — piers and arches
  for (const px of [-8, -5, -2, 1, 4, 7]) b.put("brick", 1, 1, px, T_ZF, 1, "white", "Arcade pier");
  for (const ax of [-8, -2, 4]) b.put("arch", 4, 1, ax, T_ZF, 4, "white", "Arts Centre arch");
  b.step(); // 4: foyer glazing panels (full height behind the arcade)
  b.put("glassPanel", 2, 1, -7, -4, 1, "trans", "Foyer glazing");
  b.put("glassPanel", 2, 1, -1, -4, 1, "trans", "Foyer glazing");
  b.step(); // 5
  b.put("glassPanel", 2, 1, 5, -4, 1, "trans", "Foyer glazing");
  b.step(); // 6: landscaped banks at the flanks
  b.put("slope33", 2, 3, -15, -1, 1, "green", "Landscaped bank", "S");
  b.put("slope33", 2, 3, 12, -1, 1, "green", "Landscaped bank", "S");
  b.step(); // 7: podium deck west
  for (const x of [-10, -6]) b.put("plate", 4, 6, x, -2, DECK_L, "white", "Podium deck");
  b.step(); // 8: podium deck east
  for (const x of [-2, 2, 6]) b.put("plate", 4, 6, x, -2, DECK_L, "white", "Podium deck");
  b.step(); // 9: terrace ground slab over the arcade
  for (const x of [-8, -2, 4]) b.put("plate", 4, 4, x, T_ZB, SLAB_L, "white", "Terrace ground slab");
  b.step(); // 10: lakeside plinth + step plates tying the front extension
  for (const x of [-2, -1, 0, 1]) b.put("invSlope", 1, 2, x, 4, 1, "white", "Waterside plinth", "S");
  for (const x of [-4, -3, 2, 3]) b.put("plate", 1, 2, x, 3, 1, "white", "Lakeside step");
  b.step(); // 11: deck parapet panels
  for (const x of [-10, -6, -2, 2, 6]) b.put("panel", 4, 1, x, 3, DECK_L + 1, "white", "Deck parapet", "S");
  b.step(); // 12: parapet corner panels
  for (const [x, z] of [[-10, -2], [9, -2], [-10, -1], [9, -1]] as const)
    b.put("panel", 1, 1, x, z, DECK_L + 1, "white", "Parapet corner", "S");
  b.step(); towerCourses(b, 0, 1); // 13
  b.step(); towerCourses(b, 2, 3); // 14
  b.step(); towerCourses(b, 4, 5); // 15
  b.step(); towerCourses(b, 6, 7); // 16
  b.step(); terraceBackCourse(b, STOREY(0), false); // 17
  b.step(); terraceBackCourse(b, STOREY(0) + 3, true); // 18
  b.step(); terraceBand(b, 0); // 19
  b.step(); terraceBackCourse(b, STOREY(1), false); // 20
  b.step(); terraceBackCourse(b, STOREY(1) + 3, true); // 21
  b.step(); terraceBand(b, 1); // 22
  b.step(); towerCourses(b, 8, 9); // 23
  b.step(); towerCourses(b, 10, 11); // 24
  b.step(); // 25: terrace storey 3 walls
  terraceBackCourse(b, STOREY(2), false);
  terraceBackCourse(b, STOREY(2) + 3, true);
  b.step(); // 26: interior shear walls
  for (const x of [-6, 5]) b.put("brick", 1, 2, x, -5, STOREY(2), "white", "Shear wall");
  b.step(); // 27: roof cap — vault bed
  b.put("plate", 8, 4, -10, T_ZB, T_TOP - 1, "white", "Roof cap plate");
  b.put("plate", 8, 4, -2, T_ZB, T_TOP - 1, "white", "Roof cap plate");
  b.put("plate", 4, 4, 6, T_ZB, T_TOP - 1, "white", "Roof cap plate");
}

function buildTerraceFacade(b: Builder) {
  b.phase("bp-terrace-facade");
  // Front wall pattern per storey: spandrel course of 1×4 bricks, then a
  // course of piers (1×1) with trans 1×2 window slots between them.
  const PIER_XS = [-10, -7, -4, -1, 2, 5, 8, 9];
  const GLASS_XS = [-9, -6, -3, 0, 3, 6];
  const spandrels = (storey: number, xs: number[]) => {
    b.step();
    for (const x of xs) b.put("brick", 4, 1, x, T_ZF, STOREY(storey), "white", "Spandrel course");
  };
  const piers = (storey: number, headlights: boolean) => {
    b.step();
    for (const x of PIER_XS) {
      if (headlights) b.put("headlight", 1, 1, x, T_ZF, STOREY(storey) + 3, "white", "Window pier (headlight)", "S");
      else b.put("brick", 1, 1, x, T_ZF, STOREY(storey) + 3, "white", "Window pier");
    }
  };
  const glass = (storey: number) => {
    b.step();
    for (const x of GLASS_XS) b.put("brick", 2, 1, x, T_ZF, STOREY(storey) + 3, "trans", "Window glazing");
  };
  spandrels(0, [-10, -6, -2]); // 0
  spandrels(0, [2, 6]); // 1 — completes storey 1 spandrel row
  piers(0, false); // 2
  glass(0); // 3
  spandrels(1, [-10, -6, -2, 2, 6]); // 4
  piers(1, true); // 5
  glass(1); // 6
  spandrels(2, [-10, -6, -2, 2, 6]); // 7
  piers(2, false); // 8
  glass(2); // 9
  b.step(); // 10: undercroft paving (rear)
  for (const [x, z] of [[-7, -2], [1, -2], [5, -2]] as const)
    b.put("tile", 2, 2, x, z, 1, "dark", "Undercroft paving");
  b.step(); // 11: undercroft paving (mid)
  for (const x of [-8, -2, 4]) b.put("tile", 2, 2, x, 0, 1, "dark", "Undercroft paving");
  b.step(); // 12: undercroft paving (front)
  for (const x of [-5, 1, 7]) b.put("tile", 2, 2, x, 0, 1, "dark", "Undercroft paving");
}

function buildBalconies(b: Builder) {
  b.phase("bp-terrace-balconies");
  b.step(); // 0: balcony grille decking, storey 1
  for (const x of [-10, -2]) b.put("grilleTile", 2, 1, x, -2, STOREY(0) + 7, "white", "Balcony grille decking");
  b.step(); // 1: storey 2
  for (const x of [-10, -2, 6]) b.put("grilleTile", 2, 1, x, -2, STOREY(1) + 7, "white", "Balcony grille decking");
  b.step(); // 2: planters, storey 1
  for (const dx of [0, 1]) b.put("roundPlate", 1, 1, -6 + dx, -2, STOREY(0) + 7, "green", "Balcony planter");
  b.step(); // 3: planters, storey 2
  for (const x of [-6, 2]) for (const dx of [0, 1])
    b.put("roundPlate", 1, 1, x + dx, -2, STOREY(1) + 7, "green", "Balcony planter");
  b.step(); // 4: highwalk plates on the parapet
  for (const x of [-10, -6, -2]) b.put("plate", 4, 1, x, 3, DECK_L + 4, "white", "Highwalk plate");
  b.step(); // 5
  for (const x of [2, 6]) b.put("plate", 4, 1, x, 3, DECK_L + 4, "white", "Highwalk plate");
  b.step(); // 6: highwalk surface tiles
  for (const x of [-10, -6, -2]) b.put("tile", 4, 1, x, 3, DECK_L + 5, "dark", "Highwalk tile");
  b.step(); // 7
  for (const x of [2, 6]) b.put("tile", 4, 1, x, 3, DECK_L + 5, "dark", "Highwalk tile");
  b.step(); // 8: deck planters
  for (const x of [-1, 0]) {
    b.put("roundPlate", 1, 1, x, 0, DECK_L + 1, "white", "Deck planter");
    b.put("roundPlate", 1, 1, x, 0, DECK_L + 2, "green", "Deck planting");
  }
  b.step(); // 9: lakeside benches
  b.put("tile", 2, 1, -8, 5, 1, "dark", "Lakeside bench");
  b.put("tile", 2, 1, 6, 5, 1, "dark", "Lakeside bench");
  b.step(); // 10
  b.put("tile", 2, 1, -10, 5, 1, "dark", "Lakeside bench");
  b.put("tile", 2, 1, 8, 5, 1, "dark", "Lakeside bench");
}

function buildBarrelVault(b: Builder) {
  b.phase("bp-barrel-vault");
  const L = T_TOP;
  // Pitched roof across x -10..3; rooftop plant room x 4..9 crowned with
  // curved-top bricks reading as the Barbican's repeated barrel vaults.
  b.step(); // 0: rear pitch, west
  for (const x of [-10, -8, -6, -4]) b.put("slope45", 2, 2, x, -6, L, "white", "Roof pitch (rear)", "N");
  b.step(); // 1: rear pitch, east
  for (const x of [-2, 0, 2]) b.put("slope45", 2, 2, x, -6, L, "white", "Roof pitch (rear)", "N");
  b.step(); // 2: front pitch, west
  for (const x of [-10, -6]) b.put("slope45", 4, 2, x, -4, L, "white", "Roof pitch (front)", "S");
  b.step(); // 3: front pitch, east
  b.put("slope45", 4, 2, -2, -4, L, "white", "Roof pitch (front)", "S");
  for (const x of [2, 3]) b.put("slope45", 1, 2, x, -4, L, "white", "Roof pitch (front)", "S");
  b.step(); // 4: plant room walls, rear
  b.put("brick", 3, 1, 4, -6, L, "white", "Plant room wall (rear)");
  b.put("brick", 3, 1, 7, -6, L, "white", "Plant room wall (rear)");
  b.step(); // 5: plant room walls, sides
  b.put("brick", 1, 2, 4, -5, L, "white", "Plant room wall (side)");
  b.put("brick", 1, 2, 9, -5, L, "white", "Plant room wall (side)");
  b.step(); // 6: plant room front — corners + glazing
  b.put("brick", 1, 1, 4, -3, L, "white", "Plant room corner");
  b.put("brick", 1, 1, 9, -3, L, "white", "Plant room corner");
  b.put("brick", 2, 1, 5, -3, L, "trans", "Plant room glazing");
  b.put("brick", 2, 1, 7, -3, L, "trans", "Plant room glazing");
  b.step(); // 7: plant room roof plates
  b.put("plate", 4, 4, 4, -6, L + 3, "white", "Plant room roof");
  b.put("plate", 2, 4, 8, -6, L + 3, "white", "Plant room roof");
  b.step(); // 8: barrel vault caps, rear row
  for (let x = 4; x < 10; x++) b.put("curvedTop", 1, 2, x, -6, L + 4, "white", "Barrel vault cap", "E");
  b.step(); // 9: barrel vault caps, front row
  for (let x = 4; x < 10; x++) b.put("curvedTop", 1, 2, x, -4, L + 4, "white", "Barrel vault cap", "E");
}

function buildTowerCore(b: Builder) {
  b.phase("bp-tower-core");
  for (let c = 12; c < 30; c += 2) {
    b.step();
    towerCourses(b, c, c + 1);
  }
  b.step(); // 9: top platform plates
  b.put("plate", 4, 2, -2, -9, TOWER_TOP_L, "white", "Tower top platform");
  b.put("plate", 2, 2, -1, -11, TOWER_TOP_L, "white", "Tower top platform (rear)");
  b.step(); // 10: crown base course
  b.put("brick", 4, 2, -2, -9, TOWER_TOP_L + 1, "white", "Crown base");
  b.put("brick", 2, 2, -1, -11, TOWER_TOP_L + 1, "white", "Crown base (rear)");
  b.step(); // 11: crown second course
  b.put("brick", 4, 2, -2, -9, TOWER_TOP_L + 4, "white", "Crown course");
  b.put("brick", 2, 2, -1, -11, TOWER_TOP_L + 4, "white", "Crown course (rear)");
}

function buildTowerFacade(b: Builder) {
  b.phase("bp-tower-facade");
  const fillSlots = (c: number, kind: PartKind, color: ColorKey, desc: string, ventSides = false) => {
    const l = towerLayer(c);
    const wl = wingLen(c);
    const ex = TW_CX + 1 + wl;
    const wx = TW_CX - wl;
    const sideKind: PartKind = ventSides ? "grilleTile" : kind;
    b.put(sideKind, 1, 2, ex, TW_CZ, l, ventSides ? "white" : color, desc, "E");
    b.put(sideKind, 1, 2, wx, TW_CZ, l, ventSides ? "white" : color, desc, "W");
    b.put(kind, 2, 1, TW_CX, TW_CZ - wl, l, color, desc, "N");
  };
  // Steps 0-6: window bands — one spandrel + one glazing course per step.
  // The plant-level courses (c26, c29) get recessed grille vents instead.
  const pairs: [number, number][] = [[5, 6], [9, 10], [13, 14], [17, 18], [21, 22], [25, 26], [29, -1]];
  for (const [cs, cg] of pairs) {
    b.step();
    if (GRILLE_COURSES.has(cs)) fillSlots(cs, "profile", "white", "Tower spandrel band");
    else fillSlots(cs, "brick", "white", "Tower spandrel course", cs !== 25);
    if (cg > 0) {
      if (GLASS_COURSES.has(cg)) fillSlots(cg, "brick", "trans", "Tower window band");
      else fillSlots(cg, "brick", "white", "Tower vent course", true);
    }
  }
  // Steps 7-9: serration cheese fins on band overhangs
  b.step();
  for (const c of [15, 19]) {
    const l = towerLayer(c) + 4;
    const wl = wingLen(c);
    b.put("cheese", 1, 1, TW_CX - wl - 1, TW_CZ, l, "white", "Serrated fin", "W");
    b.put("cheese", 1, 1, TW_CX + wl + 2, TW_CZ, l, "white", "Serrated fin", "E");
  }
  b.step();
  for (const c of [23, 27]) {
    const l = towerLayer(c) + 4;
    const wl = wingLen(c);
    b.put("cheese", 1, 1, TW_CX - wl - 1, TW_CZ, l, "white", "Serrated fin", "W");
    b.put("cheese", 1, 1, TW_CX + wl + 2, TW_CZ, l, "white", "Serrated fin", "E");
  }
  b.step();
  {
    const c = 27; // only the top band's rear plate overhangs
    const l = towerLayer(c) + 4;
    const wl = wingLen(c);
    b.put("cheese", 1, 1, TW_CX, TW_CZ - wl - 1, l, "white", "Serrated fin", "N");
    b.put("cheese", 1, 1, TW_CX + 1, TW_CZ - wl - 1, l, "white", "Serrated fin", "N");
  }
  b.step(); // 10: edge tiles on the topmost floor band
  b.put("tile", 1, 1, -3, -8, towerLayer(27) + 4, "white", "Band edge tile");
  b.put("tile", 1, 1, 2, -8, towerLayer(27) + 4, "white", "Band edge tile");
}

function buildTowerCrown(b: Builder) {
  b.phase("bp-tower-crown");
  const L = TOWER_TOP_L + 7;
  b.step(); // 0: crown platform
  b.put("plate", 4, 2, -2, -9, L, "white", "Crown platform");
  b.put("plate", 2, 2, -1, -11, L, "white", "Crown platform (rear)");
  b.step(); // 1: crown core
  b.put("brick", 2, 2, -1, -9, L + 1, "white", "Crown core");
  b.step(); // 2
  b.put("brick", 2, 2, -1, -9, L + 4, "white", "Crown core");
  b.step(); // 3: serrations, front
  b.put("cheese", 1, 1, -2, -8, L + 1, "white", "Crown serration", "S");
  b.put("cheese", 1, 1, 1, -8, L + 1, "white", "Crown serration", "S");
  b.step(); // 4: serrations, sides
  b.put("cheese", 1, 1, -2, -9, L + 1, "white", "Crown serration", "W");
  b.put("cheese", 1, 1, 1, -9, L + 1, "white", "Crown serration", "E");
  b.step(); // 5: rear platform trim
  b.put("tile", 1, 1, -1, -11, L + 1, "white", "Platform trim tile");
  b.put("tile", 1, 1, 0, -11, L + 1, "white", "Platform trim tile");
  b.step(); // 6: crown ridge slopes
  b.put("slope45", 2, 1, -1, -9, L + 7, "white", "Crown ridge", "N");
  b.put("slope45", 2, 1, -1, -8, L + 7, "white", "Crown ridge", "S");
  b.step(); // 7: mast base
  b.put("roundBrick", 1, 1, -1, -10, L + 1, "white", "Mast base");
  b.step(); // 8: mast rings
  b.put("roundPlate", 1, 1, -1, -10, L + 4, "white", "Mast ring");
  b.put("roundPlate", 1, 1, -1, -10, L + 5, "white", "Mast ring");
  b.step(); // 9: beacon
  b.put("roundPlate", 1, 1, -1, -10, L + 6, "dark", "Mast beacon");
}

function buildConservatory(b: Builder) {
  b.phase("bp-conservatory");
  const X = 3, Z = -2, L = DECK_L + 1; // on the podium deck (top = 9)
  b.step(); // 0: base plates
  b.put("plate", 4, 4, X, Z, L, "white", "Conservatory base");
  b.put("plate", 2, 4, X + 4, Z, L, "white", "Conservatory base");
  b.step(); // 1: corner posts, lower
  for (const [x, z] of [[X, Z], [X + 5, Z], [X, Z + 3], [X + 5, Z + 3]] as const)
    b.put("brick", 1, 1, x, z, L + 1, "white", "Corner post");
  b.step(); // 2: corner posts, upper
  for (const [x, z] of [[X, Z], [X + 5, Z], [X, Z + 3], [X + 5, Z + 3]] as const)
    b.put("brick", 1, 1, x, z, L + 4, "white", "Corner post");
  b.step(); // 3: side glazing panels
  b.put("glassPanel", 1, 2, X, Z + 1, L + 1, "trans", "Side glazing", "E");
  b.put("glassPanel", 1, 2, X + 5, Z + 1, L + 1, "trans", "Side glazing", "W");
  b.step(); // 4: rear glazing panels
  b.put("glassPanel", 2, 1, X + 1, Z + 3, L + 1, "trans", "Rear glazing");
  b.put("glassPanel", 2, 1, X + 3, Z + 3, L + 1, "trans", "Rear glazing");
  b.step(); // 5: front glazing panels
  b.put("glassPanel", 2, 1, X + 1, Z, L + 1, "trans", "Front glazing");
  b.put("glassPanel", 2, 1, X + 3, Z, L + 1, "trans", "Front glazing");
  b.step(); // 6: ring plates over the glazing
  b.put("plate", 6, 1, X, Z, L + 7, "white", "Ring plate (front)");
  b.put("plate", 6, 1, X, Z + 3, L + 7, "white", "Ring plate (back)");
  b.put("plate", 1, 2, X, Z + 1, L + 7, "white", "Ring plate (side)");
  b.put("plate", 1, 2, X + 5, Z + 1, L + 7, "white", "Ring plate (side)");
  b.step(); // 7: interior planting
  for (const [x, z] of [[X + 1, Z + 1], [X + 2, Z + 2], [X + 4, Z + 1]] as const)
    b.put("roundPlate", 1, 1, x, z, L + 1, "green", "Conservatory planting");
  b.step(); // 8: more planting
  for (const [x, z] of [[X + 3, Z + 2], [X + 4, Z + 2]] as const)
    b.put("roundPlate", 1, 1, x, z, L + 1, "green", "Conservatory planting");
  b.step(); // 9: interior path tiles
  b.put("tile", 2, 1, X + 2, Z + 1, L + 1, "dark", "Interior path");
  b.put("tile", 1, 1, X + 1, Z + 2, L + 1, "dark", "Interior path");
  b.step(); // 10: glass roof, front half (each pane anchors on the ring)
  for (let x = X; x < X + 6; x++) b.put("plate", 1, 2, x, Z, L + 8, "trans", "Glass roof");
  b.step(); // 11: glass roof, rear half
  for (let x = X; x < X + 6; x++) b.put("plate", 1, 2, x, Z + 2, L + 8, "trans", "Glass roof");
  b.step(); // 12: entry tile
  b.put("tile", 2, 1, 6, 2, DECK_L + 1, "dark", "Conservatory entry");
}

function buildLandscaping(b: Builder) {
  b.phase("bp-landscaping");
  const tree = (x: number, z: number) => {
    b.put("roundBrick", 1, 1, x, z, 1, "dark", "Tree trunk");
    b.put("roundPlate", 2, 2, x, z, 4, "green", "Tree canopy");
    b.put("roundPlate", 1, 1, x, z, 5, "green", "Tree crown");
  };
  b.step(); // 0: deck paving
  for (const x of [-10, -6, -2]) b.put("tile", 4, 1, x, 2, DECK_L + 1, "dark", "Deck paving");
  b.step(); // 1
  for (const x of [-10, -6]) b.put("tile", 4, 1, x, 0, DECK_L + 1, "dark", "Deck paving");
  b.step(); // 2: promenade west
  b.put("tile", 4, 1, -12, 4, 1, "dark", "Promenade (west)");
  b.put("tile", 2, 1, -8, 4, 1, "dark", "Promenade (west)");
  b.step(); // 3: promenade east
  b.put("tile", 4, 1, 6, 4, 1, "dark", "Promenade (east)");
  b.put("tile", 2, 1, 10, 4, 1, "dark", "Promenade (east)");
  b.step(); // 4: bollards west
  for (const z of [7, 9, 11]) b.put("roundPlate", 1, 1, -10, z, 1, "dark", "Bollard");
  b.step(); // 5: bollards east
  for (const z of [7, 9, 11]) b.put("roundPlate", 1, 1, 9, z, 1, "dark", "Bollard");
  b.step(); // 6: lakeside walk west
  b.put("tile", 1, 6, -11, 6, 1, "dark", "Lakeside walk");
  b.step(); // 7: east
  b.put("tile", 1, 6, 10, 6, 1, "dark", "Lakeside walk");
  b.step(); b.put("tile", 1, 2, -12, 6, 1, "dark", "Waterfront trim"); // 8
  b.step(); b.put("tile", 1, 2, -12, 9, 1, "dark", "Waterfront trim"); // 9
  b.step(); b.put("tile", 1, 2, 11, 6, 1, "dark", "Waterfront trim"); // 10
  b.step(); b.put("tile", 1, 2, 11, 9, 1, "dark", "Waterfront trim"); // 11
  b.step(); b.put("tile", 2, 1, -10, 1, DECK_L + 1, "dark", "Highwalk extension"); // 12
  b.step(); b.put("tile", 2, 1, -8, 1, DECK_L + 1, "dark", "Highwalk extension"); // 13
  // 14-18: boundary wall along the west rim
  for (const z of [-12, -9, -6, -3]) {
    b.step();
    b.put("brick", 1, 3, -18, z, 2, "white", "Boundary wall");
  }
  b.step();
  b.put("brick", 1, 2, -18, 0, 2, "white", "Boundary wall");
  b.step(); // 19: boundary junction
  b.put("brick", 2, 2, -18, 2, 2, "white", "Boundary junction");
  b.step(); // 20: east boundary marker
  b.put("brick", 1, 1, 17, 2, 2, "white", "Boundary marker");
  b.step(); // 21: service block behind the tower
  b.put("brick", 3, 1, 1, -12, 3, "white", "Service block");
  b.step(); // 22: entrance threshold
  b.put("tile", 2, 1, 2, 2, DECK_L + 1, "dark", "Entrance threshold");
  b.step(); // 23: walkway cap
  b.put("tile", 2, 1, 4, 2, DECK_L + 1, "dark", "Walkway cap");
  b.step(); // 24: waterside trees west
  tree(-16, -9);
  tree(-14, -4);
  b.step(); // 25: waterside trees east
  tree(13, -4);
  tree(15, -9);
  b.step(); // 26: landscaped bank west
  b.put("slope33", 2, 3, -17, -5, 1, "green", "Landscaped bank", "S");
  b.step(); // 27: landscaped bank east
  b.put("slope33", 2, 3, 15, -6, 1, "green", "Landscaped bank", "S");
  b.step(); // 28: plinth extension west
  for (const x of [-6, -5]) b.put("invSlope", 1, 2, x, 4, 1, "white", "Plinth extension", "S");
  b.step(); // 29: plinth extension east
  for (const x of [4, 5]) b.put("invSlope", 1, 2, x, 4, 1, "white", "Plinth extension", "S");
  b.step(); b.put("tile", 1, 2, -12, 13, 2, "dark", "Waterfront strip"); // 30 (on the edge beam)
  b.step(); b.put("tile", 1, 2, 10, 13, 2, "dark", "Waterfront strip"); // 31
  b.step(); // 32: rear trees
  tree(-9, -11);
  tree(7, -11);
}

// ─── Entry point ───────────────────────────────────────────────────────

let cached: BuildPlacements | null = null;

export function generateBuild(): BuildPlacements {
  if (cached) return cached;
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
  cached = b.build;
  return cached;
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

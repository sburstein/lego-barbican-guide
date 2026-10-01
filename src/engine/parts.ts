// ═══════════════════════════════════════════════════════════════════════
// PART TABLE: every Architecture Studio 21050 part the engine can place.
//
// Each part is described once, in a canonical frame, and everything else
// (validator, 3D renderer, print manual, AI design compiler) derives from
// this table. The geometry is checked against the LDraw library's measured
// parts by `node scripts/check-parts.mjs` (part of the harness), so a wrong
// height or a stud that does not exist fails the build instead of shipping.
//
// Canonical frame ("facing S"): the part occupies cells i = 0..W-1 along +x
// and j = 0..D-1 along +z. +z is the part's front. A slope descends toward
// its front, so its studded ledge is the back row j = 0; a panel's wall and a
// headlight's side stud face the front. Heights are in plate layers (a brick
// is 3). Other facings rotate the canonical cells (see geometry.ts).
// ═══════════════════════════════════════════════════════════════════════

export type ColorKey = "white" | "dark" | "trans" | "green";
export type Facing = "N" | "S" | "E" | "W"; // N = -z (back), S = +z (front)

export type PartKind =
  | "brick"
  | "plate"
  | "tile"
  | "grilleTile" // 1×2 grille tile 2412b (studless, ribbed)
  | "roundBrick"
  | "roundPlate"
  | "cornerPlate" // 2×2 L plate 2420
  | "cornerBrick" // 2×2 L brick 2357
  | "macaroni" // 2×2 quarter-arc brick 85080
  | "jumper" // 1×2 plate with one centre stud 15573 (stud is off the grid)
  | "sideStud2" // 1×1 brick, studs on 2 opposite sides 47905
  | "sideStud4" // 1×1 brick, studs on 4 sides 4733
  | "sideStudBrick" // 1×4 brick, 4 studs on its front face 30414
  | "steepSlope2" // slope 65° 2×1×2, 60481
  | "steepSlope3" // slope 75° 2×1×3, 4460b
  | "curvedSlope" // curved slope 3×1, 50950 (studless)
  | "slopeCorner" // slope 45° 2×2 double convex, 3045
  | "wedgeL" // wedge BRICK 4×2 left, 41768
  | "wedgeR" // wedge BRICK 4×2 right, 41767
  | "roundCornerPlate" // plate 4×4 quarter disc, 30565
  | "slope45" // 45° slope, one-stud ledge with studs at the back
  | "slope33" // 33°/25°/18° slope, one-stud studded back row
  | "invSlope" // inverted slope: full studded top, narrow foot at the back
  | "curvedTop" // curved slope 2×1×1⅓ with recessed stud, 6091 (4 plates)
  | "arch" // arch 1×4, 3659 (stands on its two legs only)
  | "panel" // panels 6231 / 30413: thin walls, NO studs on top
  | "glassPanel" // panel 1×2×2, 87552 (2 bricks tall, studded top)
  | "profile" // grille brick 1×2, 2877 (ribs on its front face)
  | "headlight" // headlight brick 1×1, 4070 (one recessed side stud in front)
  | "cheese"; // slope 1×1×⅔, 54200 (studless)

export type Cell = [number, number];

export type PartDef = {
  kind: PartKind;
  /** Canonical size: W along x, D along z (the slope/facing axis). */
  W: number;
  D: number;
  /** Height in plate layers. */
  h: number;
  name: string;
  pn: string | { white: string; trans: string };
  /** Facing changes the part's shape or look (slopes, panels, corners...). */
  directional: boolean;
  /** Cells the part's body fills (canonical). Defaults to the full rectangle. */
  occupied: Cell[];
  /** Cells carrying a stud on top, at height h. */
  top: Cell[];
  /** Cells whose underside accepts a stud from below. */
  bottom: Cell[];
  /** Side studs (SNOT), as canonical outward directions per cell. */
  sideStuds: { cell: Cell; dir: [number, number] }[];
};

const KEY = (kind: PartKind, a: number, b: number) => `${kind}:${Math.min(a, b)}x${Math.max(a, b)}`;
const TABLE = new Map<string, PartDef>();

function rect(W: number, D: number): Cell[] {
  const out: Cell[] = [];
  for (let i = 0; i < W; i++) for (let j = 0; j < D; j++) out.push([i, j]);
  return out;
}
const row = (W: number, j: number): Cell[] => Array.from({ length: W }, (_, i) => [i, j] as Cell);

type Opts = {
  directional?: boolean;
  occupied?: Cell[];
  top?: Cell[] | "none";
  bottom?: Cell[];
  sideStuds?: { cell: Cell; dir: [number, number] }[];
};

function def(
  kind: PartKind,
  W: number,
  D: number,
  h: number,
  name: string,
  pn: PartDef["pn"],
  o: Opts = {}
) {
  const occupied = o.occupied ?? rect(W, D);
  const top = o.top === "none" ? [] : o.top ?? occupied;
  TABLE.set(KEY(kind, W, D), {
    kind, W, D, h, name, pn,
    directional: o.directional ?? false,
    occupied,
    top,
    bottom: o.bottom ?? occupied,
    sideStuds: o.sideStuds ?? [],
  });
}

const FRONT: [number, number] = [0, 1];
const BACK: [number, number] = [0, -1];
const LEFT: [number, number] = [-1, 0];
const RIGHT: [number, number] = [1, 0];

// Bricks
def("brick", 1, 1, 3, "Brick 1×1", "3005");
def("brick", 1, 2, 3, "Brick 1×2", { white: "3004", trans: "3065" });
def("brick", 1, 3, 3, "Brick 1×3", "3622");
def("brick", 1, 4, 3, "Brick 1×4", "3010");
def("brick", 1, 6, 3, "Brick 1×6", "3009");
def("brick", 1, 8, 3, "Brick 1×8", "3008");
def("brick", 2, 2, 3, "Brick 2×2", "3003");
def("brick", 2, 3, 3, "Brick 2×3", "3002");
def("brick", 2, 4, 3, "Brick 2×4", "3001");
def("brick", 2, 6, 3, "Brick 2×6", "2456");
// Plates
def("plate", 1, 1, 1, "Plate 1×1", { white: "3024w", trans: "3024" });
def("plate", 1, 2, 1, "Plate 1×2", { white: "3023w", trans: "3023" });
def("plate", 1, 3, 1, "Plate 1×3", "3623");
def("plate", 1, 4, 1, "Plate 1×4", "3710");
def("plate", 1, 6, 1, "Plate 1×6", "3666");
def("plate", 1, 10, 1, "Plate 1×10", "4477");
def("plate", 2, 2, 1, "Plate 2×2", "3022");
def("plate", 2, 3, 1, "Plate 2×3", "3021");
def("plate", 2, 4, 1, "Plate 2×4", "3020");
def("plate", 2, 6, 1, "Plate 2×6", "3795");
def("plate", 2, 8, 1, "Plate 2×8", "3034");
def("plate", 4, 4, 1, "Plate 4×4", "3031");
def("plate", 4, 6, 1, "Plate 4×6", "3032");
def("plate", 4, 8, 1, "Plate 4×8", "3035");
def("plate", 6, 6, 1, "Plate 6×6", "3958");
def("plate", 6, 8, 1, "Plate 6×8", "3036");
def("plate", 6, 10, 1, "Plate 6×10", "3033");
def("plate", 8, 8, 1, "Plate 8×8", "41539");
// L-shaped parts: canonical inner corner (1,1) is the missing cell.
const L3: Cell[] = [[0, 0], [1, 0], [0, 1]];
def("cornerPlate", 2, 2, 1, "Plate 2×2 Corner", "2420", { directional: true, occupied: L3 });
def("cornerBrick", 2, 2, 3, "Brick 2×2 Corner", "2357", { directional: true, occupied: L3 });
// Macaroni: a quarter ring about the outer corner of canonical cell (1,1).
// The band crosses all four cells (nothing else fits in any of them), but
// only the two arc ends carry studs and grip the studs below.
def("macaroni", 2, 2, 3, "Macaroni Brick 2×2", "85080", {
  directional: true, top: [[1, 0], [0, 1]], bottom: [[1, 0], [0, 1]],
});
// Tiles (studless)
def("tile", 1, 1, 1, "Tile 1×1", "3070b", { top: "none" });
def("tile", 1, 2, 1, "Tile 1×2", "3069b", { top: "none" });
def("grilleTile", 1, 2, 1, "Tile 1×2 Grille", "2412b", { top: "none" });
def("tile", 1, 4, 1, "Tile 1×4", "2431", { top: "none" });
def("tile", 1, 6, 1, "Tile 1×6", "6636", { top: "none" });
def("tile", 1, 8, 1, "Tile 1×8", "4162", { top: "none" });
def("tile", 2, 2, 1, "Tile 2×2", "3068b", { top: "none" });
// Round parts
def("roundBrick", 1, 1, 3, "Round Brick 1×1", "3062b");
def("roundBrick", 2, 2, 3, "Brick 2×2 Round", "3941");
def("roundPlate", 1, 1, 1, "Plate 1×1 Round", "4073");
def("roundPlate", 2, 2, 1, "Plate 2×2 Round", "4032");
// 4×4 round plate: a disc, so the four corner cells carry no stud.
def("roundPlate", 4, 4, 1, "Plate 4×4 Round", "60474", {
  top: rect(4, 4).filter(([i, j]) => !((i === 0 || i === 3) && (j === 0 || j === 3))),
});
// 4×4 round corner plate: a quarter disc of radius 4 about canonical corner
// (0,0). The far corner cell is cut away; cells crossed by the curve keep
// some body but have no room for a stud (11 studs, as the real part).
def("roundCornerPlate", 4, 4, 1, "Plate 4×4 Round Corner", "30565", {
  directional: true,
  occupied: rect(4, 4).filter(([i, j]) => !(i === 3 && j === 3)),
  top: rect(4, 4).filter(([i, j]) => (i + 0.5) ** 2 + (j + 0.5) ** 2 <= 3.7 ** 2),
});
// 45° slopes: depth 2, studs on the back ledge.
def("slope45", 1, 2, 3, "Slope 1×2 (45°)", "3040", { directional: true, top: row(1, 0) });
def("slope45", 2, 2, 3, "Slope 2×2 (45°)", "3039", { directional: true, top: row(2, 0) });
def("slope45", 4, 2, 3, "Slope 2×4 (45°)", "3037", { directional: true, top: row(4, 0) });
// Shallow slopes: depth 3 (33°) or 4 (18°), studs on the back row.
def("slope33", 1, 3, 3, "Slope 1×3 (25°)", "4286", { directional: true, top: row(1, 0) });
def("slope33", 2, 3, 3, "Slope 2×3 (25°)", "3298", { directional: true, top: row(2, 0) });
def("slope33", 4, 3, 3, "Slope 3×4 (25°)", "3297", { directional: true, top: row(4, 0) });
def("slope33", 2, 4, 3, "Slope 2×4 (18°)", "30363", { directional: true, top: row(2, 0) });
// Steep slopes: one stud on top at the back.
def("steepSlope2", 1, 2, 6, "Slope 1×2×2 (65°)", "60481", { directional: true, top: row(1, 0) });
def("steepSlope3", 1, 2, 9, "Slope 1×2×3 (75°)", "4460b", { directional: true, top: row(1, 0) });
// Inverted slopes: full studded top; only the back row stands on anything,
// the underside rises toward the front (facing = the overhang side).
def("invSlope", 1, 2, 3, "Slope 1×2 Inverted", "3665", { directional: true, bottom: row(1, 0) });
def("invSlope", 1, 3, 3, "Slope 1×3 Inverted", "4287", { directional: true, bottom: row(1, 0) });
def("invSlope", 2, 2, 3, "Slope 2×2 Inverted", "3660", { directional: true, bottom: row(2, 0) });
def("invSlope", 2, 3, 3, "Slope 2×3 Inverted", "3747b", { directional: true, bottom: row(2, 0) });
// Studless shaped tops
def("curvedSlope", 1, 3, 3, "Curved Slope 3×1", "50950", { directional: true, top: "none" });
def("cheese", 1, 1, 2, "Cheese Slope 1×1×⅔", "54200", { directional: true, top: "none" });
// Double convex corner: one stud at the high back-left corner, falls toward
// the front and the right.
def("slopeCorner", 2, 2, 3, "Slope 2×2 Double Convex", "3045", {
  directional: true, top: [[0, 0]],
});
// 6091 (BrickLink "Slope, Curved 2×1×1⅓ with Recessed Stud"): the front
// cell is a quarter-round hump peaking at 4 plates; the back cell is a
// cutout at brick height with a recessed stud. Nothing standard can sit on
// that recessed stud beside the hump, so the engine treats it as studless.
def("curvedTop", 1, 2, 4, "Slope Curved 2×1×1⅓", "6091", { directional: true, top: "none" });
// Wedge BRICKS (not plates): studs only along the straight long side.
def("wedgeL", 2, 4, 3, "Wedge Brick 4×2 Left", "41768", {
  directional: true, top: [[0, 0], [0, 1], [0, 2], [0, 3]],
});
def("wedgeR", 2, 4, 3, "Wedge Brick 4×2 Right", "41767", {
  directional: true, top: [[1, 0], [1, 1], [1, 2], [1, 3]],
});
// Arch: studded top, but it stands only on its two end legs.
def("arch", 4, 1, 3, "Arch 1×4", "3659", { bottom: [[0, 0], [3, 0]] });
// Panels: thin walls with no studs on top (verified against LDraw).
def("panel", 1, 1, 3, "Panel 1×1×1 Corner", "6231", { directional: true, top: "none" });
def("panel", 4, 1, 3, "Panel 1×4×1 Rounded", "30413", { directional: true, top: "none" });
def("glassPanel", 2, 1, 6, "Panel 1×2×2", "87552", { directional: true });
def("profile", 2, 1, 3, "Grille Brick 1×2", "2877", { directional: true });
def("headlight", 1, 1, 3, "Headlight Brick 1×1", "4070", {
  directional: true, sideStuds: [{ cell: [0, 0], dir: FRONT }],
});
def("jumper", 2, 1, 1, "Jumper Plate 1×2", "15573", { top: "none" });
def("sideStud2", 1, 1, 3, "Brick 1×1 Studs 2 Sides", "47905", {
  directional: true, sideStuds: [{ cell: [0, 0], dir: FRONT }, { cell: [0, 0], dir: BACK }],
});
def("sideStud4", 1, 1, 3, "Brick 1×1 Studs 4 Sides", "4733", {
  sideStuds: [FRONT, BACK, LEFT, RIGHT].map((dir) => ({ cell: [0, 0] as Cell, dir })),
});
def("sideStudBrick", 4, 1, 3, "Brick 1×4 Side Studs", "30414", {
  directional: true,
  sideStuds: row(4, 0).map((cell) => ({ cell, dir: FRONT })),
});

export function partDef(kind: PartKind, w: number, d: number): PartDef | undefined {
  return TABLE.get(KEY(kind, w, d));
}

export function allParts(): PartDef[] {
  return [...TABLE.values()];
}

export function partNumberFor(def: PartDef, color: ColorKey): string | undefined {
  if (typeof def.pn === "string") return def.pn;
  return color === "trans" ? def.pn.trans : def.pn.white;
}

/** Display name, with the trans-clear prefix where the colour has its own part. */
export function partName(def: PartDef, color: ColorKey): string {
  // Trans-only parts (87552) are trans too; the app colours swatches by name.
  return color === "trans" && !def.name.startsWith("Trans-Clear") ? `Trans-Clear ${def.name}` : def.name;
}

/** Canonical depth along the facing axis for directional parts. */
export function slopeDepth(def: PartDef): number {
  return def.D;
}

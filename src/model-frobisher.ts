// ═══════════════════════════════════════════════════════════════════════
// LEGO PLACEMENT MODEL — Frobisher Crescent, Facade Bay Section
//
// A companion build to the Lakeside Panorama, drawn entirely from the parts
// the panorama leaves in the box (539 pieces). Where the panorama is a wide
// shot of the whole estate, this is a cutaway slice through one block: two
// party walls, three flats deep in section, the recessed window bands and
// projecting balconies of the crescent facade, and the barrel-vaulted roof
// over the central spine.
//
// Same conventions as lego-model.ts: 1 stud = 1 unit in x/z, 1 layer = one
// plate (0.4 units), a brick is 3 layers, S = +z = the plaza side.
//
// Layout key:
//   Site      x 0..17, z 0..11 — six 6×6 plates at layer 0.
//   Building  x 2..13, z 2..7.
//   Party walls (2×6 bricks) at x 2..3 and x 12..13, running the full depth
//     and projecting one stud past the facade as fins.
//   Back wall (1×8 brick) at z 2, spanning x 4..11 between the party walls.
//   Facade piers at z 6, x 4/6/8/10 — side-stud bricks carrying SNOT panel
//     tiles, with 1-stud glazing slots between them.
//   Level pitch is 4 layers: 3-layer brick course + 1-layer floor slab.
//     Undercroft L2..L4, podium deck L5, storeys at L6 / L10 / L14,
//     roof deck L17, roof L18.
// ═══════════════════════════════════════════════════════════════════════

import { Builder, type BuildPlacements, type PartKind } from "./lego-model.ts";

// ─── Constants ─────────────────────────────────────────────────────────

const BX0 = 2; // building west edge
const BX1 = 13; // building east edge
const Z_BACK = 2; // back wall row
const Z_FACE = 6; // facade pier row
const Z_BALC = 7; // balcony / party-wall fin row

const PIER_XS = [4, 6, 8, 10];
const SLOT_XS = [5, 7, 9, 11]; // glazing slots between the piers
const DECK_L = 5; // podium deck plate layer (top = 6)
const STOREY = (s: number) => 6 + 4 * s; // 6, 10, 14
const ROOF_L = 18;
const VAULT_XS = [5, 6, 7, 8, 9, 10]; // barrel-vaulted central spine

// Each storey's piers use a different side-stud brick, so the three courses
// read differently up close while all doing the same job.
const PIER_KIND: PartKind[] = ["sideStud2", "sideStud4", "headlight"];

// ─── Phase 1: base platform ────────────────────────────────────────────

function buildBase(b: Builder) {
  b.phase("fc-base");
  const d = "Site platform";

  b.step(); // 0: back row of baseplates
  for (const x of [0, 6, 12]) b.put("plate", 6, 6, x, 0, 0, "white", d);
  b.step(); // 1: front row of baseplates
  for (const x of [0, 6, 12]) b.put("plate", 6, 6, x, 6, 0, "white", d);
  b.step(); // 2: mid tie course, bridging the z = 6 and x = 6/12 seams
  for (const x of [1, 9]) b.put("plate", 8, 4, x, 4, 1, "dark", "Seam tie (mid)");
  b.step(); // 3: back and front tie courses
  for (const x of [1, 9]) b.put("plate", 8, 2, x, 1, 1, "dark", "Seam tie (back)");
  for (const x of [1, 9]) b.put("plate", 8, 2, x, 8, 1, "dark", "Seam tie (front)");
}

// ─── Phase 2: undercroft and podium deck ───────────────────────────────

function buildUndercroft(b: Builder) {
  b.phase("fc-undercroft");

  b.step(); // 0: the two party walls, full depth
  for (const x of [BX0, 12])
    b.put("brick", 2, 6, x, Z_BACK, 2, "white", "Party wall");
  b.step(); // 1: back wall between them
  b.put("brick", 8, 1, 4, Z_BACK, 2, "white", "Undercroft back wall");
  b.step(); // 2: colonnade columns on the facade line
  for (const x of PIER_XS) b.put("brick", 1, 1, x, Z_FACE, 2, "white", "Undercroft column");
  b.step(); // 3: podium deck, rear span
  b.put("plate", 8, 4, BX0, Z_BACK, DECK_L, "white", "Podium deck (rear)");
  b.put("plate", 4, 4, 10, Z_BACK, DECK_L, "white", "Podium deck (rear)");
  b.step(); // 4: podium deck, front span over the colonnade
  for (const x of [BX0, 8])
    b.put("plate", 6, 2, x, Z_FACE, DECK_L, "white", "Podium deck (front)");
  b.step(); // 5: undercroft paving
  for (const x of [4, 6, 8]) b.put("tile", 2, 2, x, 4, 2, "dark", "Undercroft paving");
  b.step(); // 6: service shafts flanking the block
  for (const x of [1, 14])
    b.put("steepSlope3", 1, 2, x, 4, 2, "white", "Service shaft", "S");
}

// ─── Phases 3-5: the three residential storeys ─────────────────────────

function buildStorey(b: Builder, s: number) {
  b.phase(`fc-storey-${s + 1}`);
  const L = STOREY(s);
  const slab = L + 3;
  const ord = ["first", "second", "third"][s];

  b.step(); // 0: party walls
  for (const x of [BX0, 12])
    b.put("brick", 2, 6, x, Z_BACK, L, "white", `Party wall (${ord} floor)`);
  b.step(); // 1: back wall
  b.put("brick", 8, 1, 4, Z_BACK, L, "white", `Back wall (${ord} floor)`);
  b.step(); // 2: facade piers
  for (const x of PIER_XS)
    b.put(PIER_KIND[s], 1, 1, x, Z_FACE, L, "white", "Facade pier", "S");
  b.step(); // 3: SNOT panel tiles clipped to the pier side studs
  for (const x of PIER_XS)
    b.putAttached("tile", x, Z_FACE, L + 1, "dark", "Facade panel", "S");
  b.step(); // 4: glazing, lower pane
  for (const x of SLOT_XS)
    b.put("plate", 1, 1, x, Z_FACE, L, "trans", "Window glazing");
  b.step(); // 5: glazing, upper pane
  for (const x of SLOT_XS)
    b.put("plate", 1, 1, x, Z_FACE, L + 1, "trans", "Window glazing");
  b.step(); // 6: floor slab over the flats
  b.put("plate", 8, 4, 4, Z_BACK, slab, "white", "Floor slab");
  b.step(); // 7: capping the party walls so the next course sits level
  if (s < 2) {
    for (const x of [BX0, 3, 12, BX1]) {
      b.put("plate", 1, 3, x, Z_BACK, slab, "white", "Party wall cap");
      b.put("plate", 1, 1, x, Z_BACK + 3, slab, "white", "Party wall cap");
    }
  } else {
    for (const x of [BX0, 3, 12, BX1])
      b.put("plate", 1, 4, x, Z_BACK, slab, "white", "Party wall cap");
  }
  b.step(); // 8: balcony slab, projecting one stud past the facade
  for (const x of [BX0, 8])
    b.put("plate", 6, 2, x, Z_FACE, slab, "white", "Balcony slab");
  if (s < 2) {
    b.step(); // 9: balcony grille decking
    for (const x of PIER_XS)
      b.put("grilleTile", 2, 1, x, Z_BALC, slab + 1, "white", "Balcony grille decking");
  }
}

// ─── Phase 6: barrel-vaulted roof ──────────────────────────────────────

function buildRoof(b: Builder) {
  b.phase("fc-roof");
  const d = "Barrel vault rib";

  b.step(); // 0: rear half of the vault, west ribs
  for (const x of VAULT_XS.slice(0, 3))
    b.put("curvedSlope", 1, 3, x, Z_BACK, ROOF_L, "white", d, "N");
  b.step(); // 1: rear half, east ribs
  for (const x of VAULT_XS.slice(3))
    b.put("curvedSlope", 1, 3, x, Z_BACK, ROOF_L, "white", d, "N");
  b.step(); // 2: front half, west ribs
  for (const x of VAULT_XS.slice(0, 3))
    b.put("curvedSlope", 1, 3, x, 5, ROOF_L, "white", d, "S");
  b.step(); // 3: front half, east ribs
  for (const x of VAULT_XS.slice(3))
    b.put("curvedSlope", 1, 3, x, 5, ROOF_L, "white", d, "S");
  b.step(); // 4: west flat roof over the end flat
  for (const x of [2, 3, 4]) b.put("tile", 1, 6, x, Z_BACK, ROOF_L, "dark", "Flat roof deck");
  b.step(); // 5: east flat roof
  for (const x of [11, 12, BX1]) b.put("tile", 1, 6, x, Z_BACK, ROOF_L, "dark", "Flat roof deck");
}

// ─── Phase 7: podium plaza ─────────────────────────────────────────────

function buildPlaza(b: Builder) {
  b.phase("fc-plaza");

  b.step(); // 0: promenade paving, back run
  b.put("tile", 8, 1, 2, 10, 1, "dark", "Promenade paving");
  b.put("tile", 6, 1, 10, 10, 1, "dark", "Promenade paving");
  b.step(); // 1: promenade paving, front run
  b.put("tile", 8, 1, 2, 11, 1, "dark", "Promenade paving");
  b.put("tile", 6, 1, 10, 11, 1, "dark", "Promenade paving");
  b.step(); // 2: podium retaining wall, west run
  for (const x of [2, 3]) b.put("steepSlope2", 1, 2, x, 8, 2, "white", "Podium retaining wall", "S");
  b.step(); // 3: podium retaining wall, east run
  for (const x of [13, 14]) b.put("steepSlope2", 1, 2, x, 8, 2, "white", "Podium retaining wall", "S");
  b.step(); // 4: rounded plaza aprons
  b.put("roundCornerPlate", 4, 4, 5, 8, 2, "dark", "Plaza apron", "S");
  b.put("roundCornerPlate", 4, 4, 9, 8, 2, "dark", "Plaza apron", "W");
  b.step(); // 5: circular planting bed on the west apron
  b.put("roundPlate", 4, 4, 5, 8, 3, "green", "Plaza planting bed");
  b.step(); // 6: rounded site corners, back
  b.put("macaroni", 2, 2, 0, 0, 1, "white", "Rounded site corner", "S");
  b.put("macaroni", 2, 2, 16, 0, 1, "white", "Rounded site corner", "W");
  b.step(); // 7: rounded site corners, flanks
  b.put("macaroni", 2, 2, 0, 2, 1, "white", "Rounded site corner", "E");
  b.put("macaroni", 2, 2, 16, 2, 1, "white", "Rounded site corner", "N");
  b.step(); // 8: planter walls at the promenade ends
  b.put("cornerBrick", 2, 2, 0, 10, 1, "white", "Planter wall", "S");
  b.put("cornerBrick", 2, 2, 16, 10, 1, "white", "Planter wall", "W");
  b.step(); // 9: bollards along the back service strip
  for (const x of [1, 3, 14, 16]) b.put("panel", 1, 1, x, 1, 2, "white", "Bollard", "S");
  b.step(); // 10: podium benches
  for (const x of [5, 10]) b.put("panel", 4, 1, x, 1, 2, "white", "Podium bench", "S");
  b.step(); // 11: gratings and lamps at the podium edge
  for (const x of [1, 16]) b.put("grilleTile", 1, 2, x, 8, 2, "dark", "Podium grating");
  for (const x of [4, 15]) b.put("plate", 1, 2, x, 8, 2, "trans", "Plaza lamp");
}

// ─── Entry point ───────────────────────────────────────────────────────

let cached: BuildPlacements | null = null;

export function generateFrobisher(): BuildPlacements {
  if (cached) return cached;
  const b = new Builder();
  buildBase(b);
  buildUndercroft(b);
  buildStorey(b, 0);
  buildStorey(b, 1);
  buildStorey(b, 2);
  buildRoof(b);
  buildPlaza(b);
  cached = b.build;
  return cached;
}

export const FC_PHASE_ORDER = [
  "fc-base",
  "fc-undercroft",
  "fc-storey-1",
  "fc-storey-2",
  "fc-storey-3",
  "fc-roof",
  "fc-plaza",
];

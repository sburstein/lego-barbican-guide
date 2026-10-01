// ═══════════════════════════════════════════════════════════════════════
// LEGO PLACEMENT MODEL; Frobisher Crescent, Facade Bay Section
//
// A companion build to the Lakeside Panorama, drawn entirely from the parts
// the panorama leaves in the box. Where the panorama is a wide shot of the
// whole estate, this is a cutaway slice through one block: two party walls,
// three flats deep in section, the recessed window bands and projecting
// balconies of the crescent facade, and the barrel-vaulted roof over the
// central spine.
//
// Same conventions as lego-model.ts: 1 stud = 1 unit in x/z, 1 layer = one
// plate (0.4 units), a brick is 3 layers, S = +z = the plaza side.
// Steps are ordered so every piece drops straight down when its turn comes.
//
// Layout key:
//   Site      x 0..17, z 0..11; six 6×6 plates at layer 0.
//   Building  x 2..13, z 2..7.
//   Party walls (2×6 bricks) at x 2..3 and x 12..13, running the full depth
//     and projecting one stud past the facade as fins.
//   Back wall (1×8 brick) at z 2, spanning x 4..11 between the party walls.
//   Facade piers at z 6, x 4/6/8/10; side-stud bricks carrying SNOT panel
//     tiles, with 1-stud glazing slots between them.
//   Level pitch is 4 layers: 3-layer brick course + 1-layer floor slab.
//     Undercroft L2..L4, podium deck L5, storeys at L6 / L10 / L14,
//     roof deck L17, roof L18.
// ═══════════════════════════════════════════════════════════════════════

import { Builder, type BuildPlacements, type BuildMeta, type PartKind } from "./lego-model.ts";

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

  b.step(
    "Site baseplates",
    "Frobisher Crescent curves between the two podium levels of the estate, on the line of Jewin Crescent; a street destroyed in the Blitz whose sweep the architects kept."
  );
  for (const x of [0, 6, 12]) b.put("plate", 6, 6, x, 0, 0, "white", "Site platform");
  for (const x of [0, 6, 12]) b.put("plate", 6, 6, x, 6, 0, "white", "Site platform");

  b.step("Mid seam ties", "Plates across the joints lock the six baseplates into one site slab.");
  for (const x of [1, 9]) b.put("plate", 8, 4, x, 4, 1, "dark", "Seam tie (mid)");

  b.step("Back and front seam ties", "Two more tie courses finish the raft. Press every tie down along its full length.");
  for (const x of [1, 9]) b.put("plate", 8, 2, x, 1, 1, "dark", "Seam tie (back)");
  for (const x of [1, 9]) b.put("plate", 8, 2, x, 8, 1, "dark", "Seam tie (front)");
}

// ─── Phase 2: undercroft and podium deck ───────────────────────────────

function buildUndercroft(b: Builder) {
  b.phase("fc-undercroft");

  b.step(
    "Party walls and back wall",
    "In-situ concrete cross-walls carry every terrace block; the two party walls here will run unbroken to the roof. The back wall closes the section."
  );
  for (const x of [BX0, 12]) b.put("brick", 2, 6, x, Z_BACK, 2, "white", "Party wall");
  b.put("brick", 8, 1, 4, Z_BACK, 2, "white", "Undercroft back wall");

  b.step("Colonnade columns", "Four slim columns hold the facade line over the open undercroft; the crescent stands on legs, like most of the estate.");
  for (const x of PIER_XS) b.put("brick", 1, 1, x, Z_FACE, 2, "white", "Undercroft column");

  b.step(
    "Undercroft paving",
    "Pave the undercroft floor NOW, while it is still open from above. Once the podium deck goes on in the next step, these three tiles become unreachable; the deck seals the space for good."
  );
  for (const x of [4, 6, 8]) b.put("tile", 2, 2, x, 4, 2, "dark", "Undercroft paving");

  b.step(
    "Podium deck",
    "The deck spans walls and columns and becomes the level everyone walks on. Below it: services, parking, and your freshly-paved undercroft."
  );
  b.put("plate", 8, 4, BX0, Z_BACK, DECK_L, "white", "Podium deck (rear)");
  b.put("plate", 4, 4, 10, Z_BACK, DECK_L, "white", "Podium deck (rear)");
  for (const x of [BX0, 8]) b.put("plate", 6, 2, x, Z_FACE, DECK_L, "white", "Podium deck (front)");

  b.step("Service shafts", "Steep slopes flank the block as vent shafts; the estate breathes through towers like these.");
  for (const x of [1, 14]) b.put("steepSlope3", 1, 2, x, 4, 2, "white", "Service shaft", "S");
}

// ─── Phases 3-5: the three residential storeys ─────────────────────────

function buildStorey(b: Builder, s: number) {
  b.phase(`fc-storey-${s + 1}`);
  const L = STOREY(s);
  const slab = L + 3;
  const ord = ["first", "second", "third"][s];
  const wallTips = [
    "Frobisher Crescent was built mainly as offices; only in 2010-11 were its top three floors converted into 69 flats.",
    "Below the real crescent you can still find the architects' concrete test panels: sample finishes hammered up for the Corporation to choose from.",
    "Top floor. The crescent's uppermost flats have barrel-vaulted ceilings following the roof above your next phase.",
  ];

  b.step(`Walls, ${ord} floor`, wallTips[s]);
  for (const x of [BX0, 12]) b.put("brick", 2, 6, x, Z_BACK, L, "white", `Party wall (${ord} floor)`);
  b.put("brick", 8, 1, 4, Z_BACK, L, "white", `Back wall (${ord} floor)`);

  b.step(
    `Facade piers, ${ord} floor`,
    s === 0
      ? "These piers carry studs on their sides; SNOT (studs not on top) work. The facade panels will clip onto them facing outward."
      : s === 1
      ? "This floor's piers have studs on all four sides; the model uses a different side-stud brick each storey so the coursing reads up close."
      : "Headlight bricks finish the pier set; their recessed faces double as window reveals."
  );
  for (const x of PIER_XS) b.put(PIER_KIND[s], 1, 1, x, Z_FACE, L, "white", "Facade pier", "S");

  b.step(
    `Facade panels, ${ord} floor`,
    "Clip a smooth tile onto each pier's side studs, face outward. These are the pick-hammered concrete panels; on the estate, six men hand-hammered over 200,000 square metres of them."
  );
  for (const x of PIER_XS) b.putAttached("tile", x, Z_FACE, L + 1, "dark", "Facade panel", "S");

  b.step(
    `Glazing, ${ord} floor`,
    "Two panes stack in each slot between the piers. Deep reveals and narrow glass are what make the crescent's windows read as arrow slits in a concrete wall."
  );
  for (const x of SLOT_XS) b.put("plate", 1, 1, x, Z_FACE, L, "trans", "Window glazing");
  for (const x of SLOT_XS) b.put("plate", 1, 1, x, Z_FACE, L + 1, "trans", "Window glazing");

  b.step(`Floor slab, ${ord} floor`, "One big plate is this storey's cast floor slab.");
  b.put("plate", 8, 4, 4, Z_BACK, slab, "white", "Floor slab");

  b.step(`Party wall caps, ${ord} floor`, "Cap plates keep the party walls level with the slab so the next course seats cleanly.");
  if (s < 2) {
    for (const x of [BX0, 3, 12, BX1]) {
      b.put("plate", 1, 3, x, Z_BACK, slab, "white", "Party wall cap");
      b.put("plate", 1, 1, x, Z_BACK + 3, slab, "white", "Party wall cap");
    }
  } else {
    for (const x of [BX0, 3, 12, BX1]) b.put("plate", 1, 4, x, Z_BACK, slab, "white", "Party wall cap");
  }

  b.step(
    `Balcony slab, ${ord} floor`,
    "The balcony projects one stud past the facade; every flat in the estate got private outdoor space, radical for its day."
  );
  for (const x of [BX0, 8]) b.put("plate", 6, 2, x, Z_FACE, slab, "white", "Balcony slab");

  if (s < 2) {
    b.step(
      `Balcony decking, ${ord} floor`,
      "Tile the balcony in front of each window slot now, before the next storey closes over it. Leave the stud in front of each pier bare: the next storey's clip-on panels hang down to just above it, and a tile there would block them."
    );
    for (const x of SLOT_XS) b.put("tile", 1, 1, x, Z_BALC, slab + 1, "white", "Balcony decking");
  }
}

// ─── Phase 6: barrel-vaulted roof ──────────────────────────────────────

function buildRoof(b: Builder) {
  b.phase("fc-roof");

  b.step(
    "Vault ribs, rear half",
    "The white barrel vaults come straight from Le Corbusier's Maison Jaoul and the church roofs of the Greek islands; the crowning motif of all thirteen terrace blocks."
  );
  for (const x of VAULT_XS) b.put("curvedSlope", 1, 3, x, Z_BACK, ROOF_L, "white", "Barrel vault rib", "N");

  b.step("Vault ribs, front half", "The opposing ribs meet at the crown to complete the vault.");
  for (const x of VAULT_XS) b.put("curvedSlope", 1, 3, x, 5, ROOF_L, "white", "Barrel vault rib", "S");

  b.step("Flat roof decks", "Dark tiles finish the end bays flat, framing the vault the way the real roofline alternates.");
  for (const x of [2, 3, 4]) b.put("tile", 1, 6, x, Z_BACK, ROOF_L, "dark", "Flat roof deck");
  for (const x of [11, 12, BX1]) b.put("tile", 1, 6, x, Z_BACK, ROOF_L, "dark", "Flat roof deck");
}

// ─── Phase 7: podium plaza ─────────────────────────────────────────────

function buildPlaza(b: Builder) {
  b.phase("fc-plaza");

  b.step(
    "Promenade paving",
    "The crescent wraps a raised court that was drawn as a Sculpture Court; never fully realised, and used today for installations and performances."
  );
  b.put("tile", 8, 1, 2, 10, 1, "dark", "Promenade paving");
  b.put("tile", 6, 1, 10, 10, 1, "dark", "Promenade paving");
  b.put("tile", 8, 1, 2, 11, 1, "dark", "Promenade paving");
  b.put("tile", 6, 1, 10, 11, 1, "dark", "Promenade paving");

  b.step("Podium retaining walls", "Steep slopes step the podium down toward the promenade; the two podium levels of the estate differ by several metres.");
  for (const x of [2, 3]) b.put("steepSlope2", 1, 2, x, 8, 2, "white", "Podium retaining wall", "S");
  for (const x of [13, 14]) b.put("steepSlope2", 1, 2, x, 8, 2, "white", "Podium retaining wall", "S");

  b.step("Plaza aprons and planting", "Quarter-round plates sweep the plaza's corners, with a circular planting bed set into the western one.");
  b.put("roundCornerPlate", 4, 4, 5, 8, 2, "dark", "Plaza apron", "S");
  b.put("roundCornerPlate", 4, 4, 9, 8, 2, "dark", "Plaza apron", "W");
  b.put("roundPlate", 4, 4, 5, 8, 3, "green", "Plaza planting bed");

  b.step("Podium furniture", "Planter walls, bollards and benches; the estate's street furniture was designed by the same hands as its towers.");
  b.put("cornerBrick", 2, 2, 0, 10, 1, "white", "Planter wall", "S");
  b.put("cornerBrick", 2, 2, 16, 10, 1, "white", "Planter wall", "W");
  for (const x of [1, 3, 14, 16]) b.put("panel", 1, 1, x, 1, 2, "white", "Bollard", "S");
  for (const x of [5, 10]) b.put("panel", 4, 1, x, 1, 2, "white", "Podium bench", "S");

  b.step("Gratings and lamps", "Grille gratings vent the undercroft, and trans plates stand in for the podium's globe lamps.");
  for (const x of [1, 16]) b.put("grilleTile", 1, 2, x, 8, 2, "dark", "Podium grating");
  for (const x of [4, 15]) b.put("plate", 1, 2, x, 8, 2, "trans", "Plaza lamp");
}

// ─── Entry point ───────────────────────────────────────────────────────

let cached: BuildPlacements | null = null;
let cachedMeta: BuildMeta | null = null;

function generate(): { build: BuildPlacements; meta: BuildMeta } {
  const b = new Builder();
  buildBase(b);
  buildUndercroft(b);
  buildStorey(b, 0);
  buildStorey(b, 1);
  buildStorey(b, 2);
  buildRoof(b);
  buildPlaza(b);
  return { build: b.build, meta: b.meta };
}

export function generateFrobisher(): BuildPlacements {
  if (!cached) {
    const g = generate();
    cached = g.build;
    cachedMeta = g.meta;
  }
  return cached;
}

export function generateFrobisherMeta(): BuildMeta {
  generateFrobisher();
  return cachedMeta!;
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

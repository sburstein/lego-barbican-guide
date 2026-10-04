// ═══════════════════════════════════════════════════════════════════════
// LAKESIDE PANORAMA: the hand-authored Barbican Estate model.
//
// The part table, placement maths and validator live in src/engine/; this
// file re-exports them so older imports keep working, and holds only the
// Panorama's placements. Every piece is a real 21050 part on the integer
// stud grid; `node scripts/validate-geometry.mjs` proves the build stands up
// and can be followed step by step.
// ═══════════════════════════════════════════════════════════════════════

import { Builder, type BuildMeta, type BuildPlacements } from "./engine/model.ts";

export * from "./engine/parts.ts";
export * from "./engine/model.ts";
export { validateBuild, analyzeBuild, connectionGraph, components } from "./engine/validate.ts";

// ═══════════════════════════════════════════════════════════════════════
// THE BUILD; Lakeside Panorama, 12 phases
// Layout key:
//   Baseplates layer 0. Base top = layer 1.
//   Lake: cells x -8..7, z 6..12.
//   Podium: 6 main 2×2 round columns (2 bricks tall) in two rows; deck L8.
//   Terrace: cells x -10..9, z -6..-3; slab L7..8; three storeys of
//     [brick course, brick course, plate band]; roof cap top = layer 29.
//   Tower: triangular plan, free-standing in the north-east corner on a
//     two-plate raft; core cells x 10..15, z -11..-6; 11 levels to L80.
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

// Tower constants. The core is a triangle pointing south, toward the lake.
// Cells relative to (TW_X, TW_Z), rows from the flat north face:
//   rows 0-1: x 0..5     rows 2-3: x 1..4     rows 4-5: x 2..3
// Each level is two brick courses and a balcony slab one stud proud of the
// core. The slabs alternate, north-south then east-west, so their ends step
// in and out up the corners: the towers' saw-tooth balcony profile.
const TW_X = 10;
const TW_Z = -11;
const TW_BASE_L = 3; // raft top
const TW_LEVELS = 11;
const levelL = (k: number) => TW_BASE_L + 7 * k;
const TW_TOP_L = levelL(TW_LEVELS); // 80

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

  b.step(
    "Edge beams around the rim",
    "The estate reads as a walled city; its name comes from the Latin barbecana, a fortified outer gateway. These dark beams start that defensive edge."
  );
  b.put("plate", 10, 1, -12, 13, 1, "dark", "Front edge beam");
  b.put("plate", 10, 1, -2, 13, 1, "dark", "Front edge beam");
  b.put("plate", 4, 1, 8, 13, 1, "dark", "Front edge beam");
  b.put("plate", 6, 1, -12, -12, 1, "dark", "Back edge beam");
  b.put("plate", 6, 1, -6, -12, 1, "dark", "Back edge beam");
  b.put("plate", 6, 1, 0, -12, 1, "dark", "Back edge beam");
  b.put("plate", 6, 1, 6, -12, 1, "dark", "Back edge beam");
  b.put("plate", 1, 10, -18, -12, 1, "dark", "Left edge beam");
  b.put("plate", 1, 6, -18, -2, 1, "dark", "Left edge beam");
  b.put("plate", 1, 10, 17, -12, 1, "dark", "Right edge beam");
  b.put("plate", 1, 6, 17, -2, 1, "dark", "Right edge beam");

  b.step(
    "Tower raft foundation",
    "Ove Arup's engineers gave each tower a massive raft so 43 storeys of concrete could stand beside Underground tunnels. Two stacked plate layers are your raft."
  );
  for (const z of [-10, -8]) b.put("plate", 6, 2, 10, z, 1, "dark", "Tower raft L1");
  b.put("plate", 6, 6, 10, -11, 2, "white", "Tower raft L2");
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

// Tower levels ------------------------------------------------------------
// One level of the triangular tower: two brick courses laid at right angles,
// so each bridges the joints of the other, then a balcony slab. Glass marks
// the lobby (level 1) and the penthouses (the top two levels); grille bricks
// rib the two sloping faces in between.
function towerLevel(b: Builder, k: number) {
  const L = levelL(k);
  const X = TW_X, Z = TW_Z;
  const d = "Tower wall";

  // course 1: blocks across the plan; the set's 2×6 bricks run out after
  // level 4, so the back block becomes two 2×3s from there
  if (k < 4) b.put("brick", 6, 2, X, Z, L, "white", d);
  else for (const x of [X, X + 3]) b.put("brick", 3, 2, x, Z, L, "white", d);
  b.put("brick", 4, 2, X + 1, Z + 2, L, "white", d);
  b.put("brick", 2, 2, X + 2, Z + 4, L, "white", d);

  // course 2: a 2×6 spine runs north-south across the course-1 joints
  b.put("brick", 2, 2, X, Z, L + 3, "white", d);
  b.put("brick", 2, 6, X + 2, Z, L + 3, "white", d);
  b.put("brick", 2, 2, X + 4, Z, L + 3, "white", d);
  const glass = k === 0 || k >= TW_LEVELS - 2;
  const glassDesc = k === 0 ? "Tower lobby glazing" : "Penthouse glazing";
  for (const [x, side] of [[X + 1, "W"], [X + 4, "E"]] as const) {
    if (glass) b.put("brick", 1, 2, x, Z + 2, L + 3, "trans", glassDesc);
    else b.put("profile", 1, 2, x, Z + 2, L + 3, "white", "Tower ribbed face", side);
  }

  towerSlab(b, k, L + 6);
}

// Balcony slab k at layer L. North-south slabs (even k) reach one stud north
// of the core and one stud past each step of the prow; east-west slabs (odd
// k) reach one stud east and west. Where the set runs short of one plate,
// another mix fills the same outline.
function towerSlab(b: Builder, k: number, L: number) {
  const X = TW_X, Z = TW_Z;
  const d = "Tower balcony slab";
  const strip = (z: number) => {
    // the 4-stud strip across rows 3-4 (north-south) or 4-5 (east-west)
    if (k === 7 || k === 9) for (const x of [X + 1, X + 3]) b.put("plate", 2, 2, x, z, L, "white", d);
    else if (k === 10) for (const zz of [z, z + 1]) b.put("plate", 4, 1, X + 1, zz, L, "white", d);
    else b.put("plate", 4, 2, X + 1, z, L, "white", d);
  };
  if (k % 2 === 1) {
    b.put("plate", 8, 2, X - 1, Z, L, "white", d);
    b.put("plate", 6, 2, X, Z + 2, L, "white", d);
    strip(Z + 4);
    return;
  }
  if (k === 0) for (const z of [Z - 1, Z + 1]) b.put("plate", 6, 2, X, z, L, "white", d);
  else b.put("plate", 6, 4, X, Z - 1, L, "white", d);
  strip(Z + 3);
  b.put("plate", 2, 2, X + 2, Z + 5, L, "white", d);
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

  b.step(
    "Deck upstand",
    "A course of 1×4 bricks edges the deck where it faces the lake. It carries the highwalk later, so it has to be studded: a studless panel here would leave the walkway with nothing to grip."
  );
  for (const x of [-10, -6, -2, 2, 6]) b.put("brick", 4, 1, x, 3, DECK_L + 1, "white", "Deck upstand");

  b.step("Parapet corners", "Corner panels turn the rail around the deck's back corners.");
  for (const [x, z] of [[-10, -2], [9, -2], [-10, -1], [9, -1]] as const)
    b.put("panel", 1, 1, x, z, DECK_L + 1, "white", "Parapet corner", "S");
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
    "Curved-top bricks laid side by side are the Barbican's most famous motif in miniature: the white barrel vaults that crown the terrace blocks. Point each hump north, away from the lake; the flat end with the recessed stud faces the ridge."
  );
  for (let x = 4; x < 10; x++) b.put("curvedTop", 1, 2, x, -6, L + 4, "white", "Barrel vault cap", "N");

  b.step(
    "Barrel vaults, front row",
    "The front row faces the other way, humps toward the lake, so the two rows meet back to back and read as one continuous vault."
  );
  for (let x = 4; x < 10; x++) b.put("curvedTop", 1, 2, x, -4, L + 4, "white", "Barrel vault cap", "S");
}

const TOWER_TIPS: (string | undefined)[] = [
  "Lauderdale Tower stands on its own raft, clear of the terrace, as the real towers stand apart from the blocks around them. The clear bricks are the glazed entrance lobby.",
  "Course 1 runs east-west and course 2 north-south, so every joint is bridged. The slab on top reaches one stud past the walls: a balcony.",
  "This slab juts north and toward the prow; the last one jutted east and west. Stacked, they step in and out up the corners, the towers' saw-tooth balcony edge.",
  "The grille bricks on the two sloping faces stand in for the towers' bush-hammered concrete, hacked by hand to expose the stone in the mix.",
  "From this level the back block of course 1 is two 2×3 bricks instead of one 2×6. The towers are named for local history: Cromwell Tower recalls Oliver Cromwell, married in 1620 at St Giles' Cripplegate, the church beside the lake.",
  "Shakespeare Tower recalls the playwright, who lodged on Silver Street, just south of the estate, in the early 1600s.",
  "Lauderdale Tower takes its name from the Earls of Lauderdale, whose London house stood on nearby Aldersgate Street.",
  "Two 2×2 plates fill the slab's narrow strip on this level, where the 2×4s run short; the outline is the same as before.",
  "The three real towers rise 43 and 44 storeys to about 123 metres, among the tallest residential towers in Europe when they topped out.",
  "Penthouses. The top floors of each tower hold just three flats apiece, with terraces all round; clear bricks at the corners are their glazing.",
  "The last level. Two 1×4 plates fill the narrow strip, and the slab carries the crown, so check it sits flat before you go on.",
];

function buildTowerCore(b: Builder) {
  b.phase("bp-tower-core");
  for (let k = 0; k < 6; k++) {
    b.step(k === 0 ? "Tower level 1: lobby" : `Tower level ${k + 1}`, TOWER_TIPS[k]);
    towerLevel(b, k);
  }
}

function buildTowerFacade(b: Builder) {
  b.phase("bp-tower-facade");
  for (let k = 6; k < TW_LEVELS; k++) {
    b.step(k >= TW_LEVELS - 2 ? `Tower level ${k + 1}: penthouse` : `Tower level ${k + 1}`, TOWER_TIPS[k]);
    towerLevel(b, k);
  }
}

// Crown: steep-slope fins round the top slab, every one leaning out; tall
// and short alternate for a jagged skyline. A 2×2 plant room fills the middle.
function buildTowerCrown(b: Builder) {
  b.phase("bp-tower-crown");
  const X = TW_X, Z = TW_Z, L = TW_TOP_L;
  const fin = (tall: boolean, w: number, d: number, x: number, z: number, side: "N" | "S" | "E" | "W") =>
    b.put(tall ? "steepSlope3" : "steepSlope2", w, d, x, z, L, "white", "Crown fin", side);

  b.step(
    "Crown: north fins and plant room",
    "The towers finish in a jagged crown: plant rooms, tanks and window-cleaning rigs wrapped in the same serrated concrete as the balconies. Each fin leans outward."
  );
  [true, false, true, true, false, true].forEach((tall, i) => fin(tall, 1, 2, X + i, Z - 1, "N"));
  b.put("brick", 2, 2, X + 2, Z + 1, L, "white", "Crown plant room");

  b.step(
    "Crown: side and prow fins",
    "Tall fins and short ones alternate round the sides and the prow, giving the crown its broken skyline, readable from across the City."
  );
  for (const [z, tall] of [[Z + 1, false], [Z + 2, true]] as const) {
    fin(tall, 2, 1, X, z, "W");
    fin(tall, 2, 1, X + 4, z, "E");
  }
  for (const [z, tall] of [[Z + 3, false], [Z + 4, true]] as const) {
    fin(tall, 2, 1, X + 1, z, "W");
    fin(tall, 2, 1, X + 3, z, "E");
  }
  fin(true, 1, 2, X + 2, Z + 5, "S");
  fin(true, 1, 2, X + 3, Z + 5, "S");
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

  b.step("Boundary details", "A junction block, an eastern marker and a service block behind the terrace finish the estate edge.");
  b.put("brick", 2, 2, -18, 2, 2, "white", "Boundary junction");
  b.put("brick", 1, 1, 17, 2, 2, "white", "Boundary marker");
  b.put("brick", 3, 1, 1, -12, 2, "white", "Service block");

  b.step("Threshold and walkway cap", "Dark tiles mark the Centre's entrance threshold on the deck.");
  b.put("tile", 2, 1, 2, 2, DECK_L + 1, "dark", "Entrance threshold");
  b.put("tile", 2, 1, 4, 2, DECK_L + 1, "dark", "Walkway cap");

  b.step("Waterside trees, west", "Trees soften the hard landscape; every planting position on the estate was specified by the architects.");
  tree(-16, -9);
  tree(-14, -4);
  b.step("Waterside tree, east", "A single tree on the east bank, in front of the tower's raft.");
  tree(13, -4);

  b.step("Landscaped banks", "Two more green banks blend the boundary into the gardens.");
  b.put("slope33", 2, 3, -17, -5, 1, "green", "Landscaped bank", "S");
  b.put("slope33", 2, 3, 15, -5, 1, "green", "Landscaped bank", "S");

  b.step("Plinth extensions", "Extra inverted slopes stretch the waterside plinth along the deck front.");
  for (const x of [-6, -5]) b.put("invSlope", 1, 2, x, 4, 1, "white", "Plinth extension", "S");
  for (const x of [4, 5]) b.put("invSlope", 1, 2, x, 4, 1, "white", "Plinth extension", "S");

  b.step(
    "Rear trees",
    "Three last trees behind the terrace complete the estate; home today to more than 4,000 residents in over 2,000 flats, Grade II listed since September 2001."
  );
  tree(-9, -11);
  tree(-3, -9);
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

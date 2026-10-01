// ═══════════════════════════════════════════════════════════════════════
// LEGO PLACEMENT MODEL; London Wall & Bastion
//
// The third Barbican build, designed around what the other two leave in the
// box: slopes, wedges, corner pieces and macaroni bricks, with almost no
// straight bricks. Which happens to be exactly the palette of a ruin.
//
// Subject: the fragment of Roman and medieval London Wall that stands
// inside the estate, with a round bastion, a ruined gateway, and the
// wall-side garden. This is the ancient barbican (fortified gateway) the
// whole estate is named after. All three builds stand together from one set.
//
// Conventions as lego-model.ts. Site x 0..16, z 0..8. N (-z) = the wall,
// S (+z) = the garden. Steps ordered for straight-down placement.
//
// Layout key:
//   Bastion   x 0..4,  z 0..4  (macaroni ring, pads beneath)
//   Wall      x 4..16, z 0..2  (courses L1/L4/L7, gate opening x 10..12)
//   Plaza     x 4..16, z 2..4  (paving, rubble, fallen blocks)
//   Garden    x 0..16, z 4..8  (lawn, fig tree, cold frames, gate path,
//             front walk, embankment)
//
// The garden's base is seven plates. Nothing at layer 1 may leave one of
// them loose, so the lawn plates, the gate path and the front walk are laid
// across their joints: they are the garden's tie course.
// ═══════════════════════════════════════════════════════════════════════

import { Builder, type BuildPlacements, type BuildMeta } from "./lego-model.ts";

const WALL_L = (c: number) => 1 + 3 * c; // wall course layers: 1, 4, 7

// ─── Phase 1: the site ─────────────────────────────────────────────────

function buildSite(b: Builder) {
  b.phase("lw-base");

  b.step(
    "Plaza pads",
    "This corner of the estate is the Barbican's oldest resident: a stretch of the Roman and medieval city wall that survived the Great Fire, the Victorians and the Blitz."
  );
  b.put("plate", 8, 2, 0, 0, 0, "white", "Plaza pad");
  b.put("plate", 8, 2, 8, 0, 0, "white", "Plaza pad");
  b.put("plate", 8, 2, 0, 2, 0, "white", "Plaza pad");
  b.put("plate", 8, 2, 8, 2, 0, "white", "Plaza pad");

  b.step(
    "Garden pads",
    "The garden side gets a long plate, two squares and four small plates. They are separate for now; the lawn and paths you lay in the garden phase bridge every joint."
  );
  b.put("plate", 8, 2, 0, 4, 0, "white", "Garden pad");
  b.put("plate", 4, 4, 8, 4, 0, "white", "Garden pad");
  b.put("plate", 4, 4, 12, 4, 0, "white", "Garden pad");
  for (const x of [0, 2, 4, 6]) b.put("plate", 2, 2, x, 6, 0, "white", "Garden pad");
}

// ─── Phase 2: the bastion ──────────────────────────────────────────────

function buildBastion(b: Builder) {
  b.phase("lw-bastion");
  // Ring of four macaroni quarters, inner corners meeting at (2,2)
  const RING: [number, number, "N" | "E" | "S" | "W"][] = [
    [0, 0, "N"],
    [2, 0, "E"],
    [2, 2, "S"],
    [0, 2, "W"],
  ];

  b.step(
    "Bastion ring, first course",
    "Bastion 12 is a round medieval tower on the wall line, kept as a garden feature after the war. Four macaroni bricks make a perfect drum; point each arc outward."
  );
  for (const [x, z, f] of RING) b.put("macaroni", 2, 2, x, z, 1, "white", "Bastion wall", f);

  b.step(
    "Bastion ring, second course",
    "Stack the second ring directly on the first, arcs aligned; each quarter grips the two studs at its neighbour's arc ends."
  );
  for (const [x, z, f] of RING) b.put("macaroni", 2, 2, x, z, 4, "white", "Bastion wall", f);

  b.step("Bastion cap", "A square plate caps the drum. Medieval bastions were open platforms for archers, so the top stays low and flat.");
  b.put("plate", 4, 4, 0, 0, 7, "white", "Bastion cap");

  b.step("Parapet stubs", "Single plates at the corners are the eroded parapet; two tiles smooth the fighting platform.");
  for (const [x, z] of [[0, 0], [3, 0], [0, 3], [3, 3]] as const)
    b.put("plate", 1, 1, x, z, 8, "white", "Parapet stub");
  b.put("tile", 1, 1, 1, 1, 8, "white", "Platform tile");
  b.put("tile", 1, 1, 2, 2, 8, "white", "Platform tile");
}

// ─── Phase 3: the wall and gate ────────────────────────────────────────

function buildWall(b: Builder) {
  b.phase("lw-wall");

  b.step(
    "Wall, first course",
    "The wall runs east from the bastion, two studs thick, with a two-stud gap for the ruined gateway. London's wall was begun by the Romans around 200 AD and patched for 1,500 years."
  );
  b.put("brick", 6, 2, 4, 0, WALL_L(0), "white", "Wall course");
  b.put("brick", 4, 2, 12, 0, WALL_L(0), "white", "Wall course");

  b.step(
    "Wall, second course with putlog bricks",
    "The side-stud bricks go in studs-out: read the exposed studs as putlog holes, the scaffolding sockets medieval masons left in every wall they raised."
  );
  b.put("sideStudBrick", 4, 1, 4, 0, WALL_L(1), "white", "Putlog course", "N");
  b.put("sideStudBrick", 4, 1, 4, 1, WALL_L(1), "white", "Putlog course", "S");
  b.put("brick", 1, 1, 8, 0, WALL_L(1), "white", "Wall course");
  b.put("brick", 1, 1, 8, 1, WALL_L(1), "white", "Wall course");
  b.put("brick", 3, 2, 13, 0, WALL_L(1), "white", "Wall course");

  b.step(
    "The ruined gate",
    "Two arches span the gap, one behind the other: a fortified gateway. 'Barbican' comes from the Latin barbecana, an outer defence of a city gate. This little ruin is the piece of history the whole estate is named for."
  );
  b.put("arch", 4, 1, 9, 0, WALL_L(1), "white", "Gate arch");
  b.put("arch", 4, 1, 9, 1, WALL_L(1), "white", "Gate arch");

  b.step("Wall, third course", "Two long bricks bond over the gate and the putlog course; only this western stretch survives to full height.");
  b.put("brick", 8, 1, 4, 0, WALL_L(2), "white", "Wall course");
  b.put("brick", 8, 1, 4, 1, WALL_L(2), "white", "Wall course");

  b.step(
    "Standing shards",
    "Steep slopes rise from the eastern stump as freestanding shards, the way the real fragment breaks off mid-air where the bombs bit through. Alternate their faces, garden side, city side, garden side, so the break reads ragged from both sides."
  );
  b.put("steepSlope2", 1, 2, 13, 0, WALL_L(2), "white", "Wall shard", "S");
  b.put("steepSlope3", 1, 2, 14, 0, WALL_L(2), "white", "Wall shard", "N");
  b.put("steepSlope2", 1, 2, 15, 0, WALL_L(2), "white", "Wall shard", "S");

  b.step(
    "Weathered head and battlement",
    "Slopes cascade the intact wall head down toward the break, with one corner plate as the last tooth of battlement."
  );
  b.put("slope33", 3, 1, 4, 0, WALL_L(3), "white", "Weathered wall head", "E");
  b.put("slope33", 3, 1, 4, 1, WALL_L(3), "white", "Weathered wall head", "E");
  b.put("cornerPlate", 2, 2, 8, 0, WALL_L(3), "white", "Battlement tooth", "N");
  b.put("slope45", 1, 2, 10, 0, WALL_L(3), "white", "Weathered wall head", "S");
}

// ─── Phase 4: the garden ───────────────────────────────────────────────

function buildGarden(b: Builder) {
  b.phase("lw-garden");

  b.step(
    "The lawn",
    "Two quarter-round plates make one lawn with rounded front corners, and they bridge the joints in the garden base below. The estate's gardeners keep this bed green so the masonry always reads against planting."
  );
  b.put("roundCornerPlate", 4, 4, 0, 4, 1, "green", "Lawn", "W");
  b.put("roundCornerPlate", 4, 4, 4, 4, 1, "green", "Lawn", "S");

  b.step(
    "Gate path and front walk",
    "A path runs south from the ruined gate, then the front walk turns east along the garden edge. Both are laid across plate joints, so they hold the garden to the plaza and to itself."
  );
  b.put("tile", 2, 2, 10, 3, 1, "dark", "Gate path");
  b.put("tile", 2, 2, 10, 5, 1, "dark", "Gate path");
  b.put("tile", 8, 1, 7, 7, 1, "dark", "Front walk");

  b.step(
    "The fig tree",
    "The estate's fig tree roots in the lawn beside the bastion; gardeners planted figs here because the old wall traps warmth like a Roman courtyard."
  );
  b.put("roundBrick", 1, 1, 2, 5, 2, "dark", "Fig tree trunk");
  b.put("roundPlate", 1, 1, 2, 5, 5, "green", "Fig tree crown");
  b.put("roundPlate", 1, 1, 2, 5, 6, "green", "Fig tree crown");

  b.step("Stepping stones", "Jumper plates, one centred stud each, cross the lawn from the front walk toward the fig tree.");
  for (const z of [5, 6, 7]) b.put("jumper", 2, 1, 3, z, 2, "dark", "Stepping stone");

  b.step("Grass embankment", "A long slope banks the garden up toward the podium behind the wall.");
  b.put("slope33", 4, 3, 12, 4, 1, "green", "Grass embankment", "S");

  b.step(
    "Cold frames",
    "Two trans-clear cold frames grow salad crops against the south light: one on the paving by the path, one on the lawn. Each is two glass panels back to back, walls outward."
  );
  for (const [x, l] of [[8, 1], [5, 2]] as const) {
    b.put("glassPanel", 2, 1, x, 4, l, "trans", "Cold frame back", "N");
    b.put("glassPanel", 2, 1, x, 5, l, "trans", "Cold frame front", "S");
  }

  b.step("Cold frame lids", "Trans plates lie flat across the panel tops as the frames' glass lids.");
  for (const [x, l] of [[8, 1], [5, 2]] as const) {
    b.put("plate", 2, 1, x, 4, l + 6, "trans", "Cold frame lid");
    b.put("plate", 2, 1, x, 5, l + 6, "trans", "Cold frame lid");
  }

  b.step(
    "Globe lamps",
    "Two trans studs on white bases are the estate's globe lamps, which floodlight the fragment at night."
  );
  b.put("plate", 1, 1, 9, 6, 1, "white", "Lamp post");
  b.put("plate", 1, 1, 9, 6, 2, "trans", "Globe lamp");
  b.put("plate", 1, 1, 15, 7, 1, "white", "Lamp post");
  b.put("plate", 1, 1, 15, 7, 2, "trans", "Globe lamp");
}

// ─── Phase 5: plaza and rubble ─────────────────────────────────────────

function buildPlaza(b: Builder) {
  b.phase("lw-plaza");

  b.step(
    "Plaza paving",
    "Long tiles pave the walk along the wall's city side, where office workers eat lunch against fifteen centuries of masonry."
  );
  b.put("tile", 8, 1, 4, 2, 1, "dark", "Plaza paving");
  b.put("tile", 6, 1, 4, 3, 1, "dark", "Plaza paving");
  b.put("grilleTile", 2, 1, 12, 2, 1, "dark", "Plaza drain");

  b.step(
    "Fallen rubble",
    "Cheese slopes and loose blocks scatter where the wall failed; the side-stud blocks lie stud-out like ashlar tipped off the wall head."
  );
  b.put("cheese", 1, 1, 14, 2, 1, "white", "Rubble", "S");
  b.put("cheese", 1, 1, 15, 3, 1, "white", "Rubble", "E");
  b.put("cheese", 1, 1, 12, 3, 1, "white", "Rubble", "W");
  b.put("cheese", 1, 1, 14, 3, 1, "white", "Rubble", "N");
  b.put("sideStud4", 1, 1, 15, 2, 1, "white", "Fallen block", "S");
  b.put("sideStud2", 1, 1, 13, 3, 1, "white", "Fallen block", "E");
}

// ─── Entry point ───────────────────────────────────────────────────────

let cached: BuildPlacements | null = null;
let cachedMeta: BuildMeta | null = null;

function generate(): { build: BuildPlacements; meta: BuildMeta } {
  const b = new Builder();
  buildSite(b);
  buildBastion(b);
  buildWall(b);
  buildGarden(b);
  buildPlaza(b);
  return { build: b.build, meta: b.meta };
}

export function generateLondonWall(): BuildPlacements {
  if (!cached) {
    const g = generate();
    cached = g.build;
    cachedMeta = g.meta;
  }
  return cached;
}

export function generateLondonWallMeta(): BuildMeta {
  generateLondonWall();
  return cachedMeta!;
}

export const LW_PHASE_ORDER = ["lw-base", "lw-bastion", "lw-wall", "lw-garden", "lw-plaza"];

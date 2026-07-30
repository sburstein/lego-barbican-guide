// One-shot generator for the Frobisher Crescent entry in src/builds.ts.
// Titles, tips and phase copy are authored here; piece lists and step
// instructions are generated from the validated model so the guide text and
// the 3D model can never drift apart. Re-running it rewrites the block
// between the FROBISHER markers in builds.ts.
// Run: node scripts/gen-frobisher-build.mjs

import { readFileSync, writeFileSync } from "fs";
import { generateFrobisher, FC_PHASE_ORDER } from "../src/model-frobisher.ts";

const PHASES = {
  "fc-base": {
    title: "Phase 1 — Site Platform",
    concept: "Datum & Foundation",
    color: "#6B7280",
    icon: "🧱",
    time: "10–15 min",
    location:
      "Frobisher Crescent sits on the same raised podium as the rest of the estate, so this build starts where the panorama started: with a flat datum. Six 6×8-stud plates make an 18×12 platform. These six plates are the largest pieces the Lakeside Panorama never touches, which is exactly why this build can stand beside it rather than replace it.",
    steps: [
      ["Back Row — Three Baseplates", "Lay the back row first and press every stud home. A base that rocks will telegraph all the way up to the roofline eighteen layers later."],
      ["Front Row — Three Baseplates", "Butt the front row hard against the back row. The seam along z = 6 runs the full width; the next two steps exist purely to lock it."],
      ["Mid Seam Ties", "Two 4×8 plates laid across the middle bridge the long seam and both short ones at once. This is the standard LEGO fix for a plate-tiled base: never let a seam run uninterrupted through a load path."],
      ["Back and Front Seam Ties", "Four more plates finish the tie course. Everything above lands on this layer, so check now that the platform sits dead flat on the table."],
    ],
  },
  "fc-undercroft": {
    title: "Phase 2 — Undercroft & Podium Deck",
    concept: "Piloti & Raised Ground",
    color: "#8B5CF6",
    icon: "🏛️",
    time: "20–25 min",
    location:
      "The Barbican's ground floor is not the ground. Chamberlin, Powell & Bon lifted the whole estate onto a podium and left the real ground level as a shadowed undercroft of columns and service routes. You are building that condition literally: two full-depth party walls, a back wall between them, four slender columns on the facade line, and a deck slab over the top.",
    steps: [
      ["Party Walls — Full Depth", "The two 2×6 bricks are the spine of this build. Every level repeats them in exactly the same place, and they project one stud past the facade line as the fins you see running up the real crescent."],
      ["Undercroft Back Wall", "One 1×8 brick spans between the party walls. Slot it in flush — the deck slab above needs its studs to land on."],
      ["Colonnade Columns", "Four 1×1 bricks on the facade line. They look impossibly thin under a whole block, which is precisely the effect the architects wanted at street level."],
      ["Podium Deck — Rear Span", "The rear slab bears on the back wall and both party walls. Note how the 4×8 and 4×4 plates split at x = 10 rather than mid-span; a joint over a support is stronger than a joint over air."],
      ["Podium Deck — Over the Colonnade", "Two 2×6 plates finish the deck, carried on the four columns. The deck top is layer 6, and every storey above is pitched four layers: three for the brick course, one for the floor slab."],
      ["Undercroft Paving", "Grey 2×2 tiles read as the poured concrete of the service level. Tiles have no studs, so nothing will ever be built on them — they are the finished floor."],
      ["Service Shafts", "Two 75° slopes flank the block as the tall ventilation shafts that punctuate the real estate. At nine layers each they rise past the second floor, which is the correct, slightly alarming proportion."],
    ],
  },
  "fc-storey-1": {
    title: "Phase 3 — First Floor",
    concept: "Repetition & the SNOT Facade",
    color: "#0EA5E9",
    icon: "🪟",
    time: "25–30 min",
    location:
      "Now the section proper begins. Each floor is the same seven moves: two party walls, a back wall, four facade piers, panel tiles clipped to the piers, glazing in the slots between, a floor slab, and a balcony. The interior is deliberately left open — this is a cutaway, and you should be able to look straight through the flats from the plaza to the back wall.",
    steps: [
      ["Party Walls", "Same position, same part, every floor. Building the repeat elements first gives you the datum to align everything else against."],
      ["Back Wall", "One brick, spanning between the party walls, stacked directly on the one below."],
      ["Facade Piers", "These 1×1 bricks with studs on two sides are the reason the panorama left them in the box. Point the side studs out toward the plaza — they are about to carry the facade skin."],
      ["Facade Panels — Studs Not On Top", "Clip a 1×1 tile onto each pier's side stud. The tile face is smooth and vertical, giving you the poured-concrete panel that a top-studded brick never can. This is the whole SNOT technique in one move."],
      ["Window Glazing — Lower Pane", "Trans-clear plates drop into the one-stud slots between the piers. Barbican windows are deep, narrow and recessed, not picture windows."],
      ["Window Glazing — Upper Pane", "A second course of trans plates finishes each slot. Leave the top layer of the slot empty: that shadow gap is what makes the window read as recessed."],
      ["Floor Slab", "A single 4×8 plate roofs the flats and becomes the floor above. It bears on the back wall — check it is fully down before you load it."],
      ["Party Wall Caps", "Plates over the party walls bring them level with the floor slab. Without these the next brick course would sit a plate low and the whole facade would step."],
      ["Balcony Slab", "Two 2×6 plates project one stud past the facade. That single stud of overhang is the entire balcony, and it casts the horizontal shadow line that defines the elevation."],
      ["Balcony Grille Decking", "Grille tiles give the balcony floor its ribbed texture and read at this scale as the open metal decking on the real building."],
    ],
  },
  "fc-storey-2": {
    title: "Phase 4 — Second Floor",
    concept: "Variation Within Repetition",
    color: "#14B8A6",
    icon: "🏢",
    time: "25–30 min",
    location:
      "The second floor repeats the first exactly, with one substitution: the piers are 1×1 bricks with studs on all four sides instead of two. Nothing changes structurally, but up close the middle band of the facade catches light differently. Real repetitive housing does this constantly — the module holds, the detail shifts.",
    steps: [
      ["Party Walls", "Straight onto the caps you laid at the end of the last phase. If they rock, the caps are not fully seated."],
      ["Back Wall", "One brick again. Four identical courses of this by the time you top out."],
      ["Facade Piers", "Four-sided side-stud bricks this time. Only the plaza face gets used here, but the extra studs catch light in the window reveals."],
      ["Facade Panels — Studs Not On Top", "Same clip-on tiles as the floor below. Line them up by eye against the first-floor panels — a half-millimetre of tilt is visible across four bays."],
      ["Window Glazing — Lower Pane", "Trans plates into the slots."],
      ["Window Glazing — Upper Pane", "And the second course. The glazing band should now read as a continuous horizontal line across both floors."],
      ["Floor Slab", "The 4×8 plate again. This is the last floor with a balcony above it."],
      ["Party Wall Caps", "Level the party walls off ready for the top storey."],
      ["Balcony Slab", "Second balcony, identical projection. Sight along the facade from the side: the two overhangs should be exactly aligned."],
      ["Balcony Grille Decking", "Grille tiles to finish."],
    ],
  },
  "fc-storey-3": {
    title: "Phase 5 — Third Floor",
    concept: "Topping Out",
    color: "#F59E0B",
    icon: "🔝",
    time: "20–25 min",
    location:
      "The top floor loses its balcony — above it there is roof instead. The piers change again, this time to headlight bricks, whose recessed side stud pulls the panel tiles a fraction deeper into the wall. On the real crescent the uppermost band sits slightly shadowed under the vaults, and this is the cheapest way to suggest it.",
    steps: [
      ["Party Walls", "Third and final brick course for the spine."],
      ["Back Wall", "The last 1×8. Four courses, four bricks, one for each level."],
      ["Facade Piers", "Headlight bricks. The side stud is recessed into the body, so the panel tiles will sit marginally deeper than on the floors below."],
      ["Facade Panels — Studs Not On Top", "Clip the last four tiles on. Step back and look along the facade: three bands, three subtly different depths."],
      ["Window Glazing — Lower Pane", "Trans plates into the top-floor slots."],
      ["Window Glazing — Upper Pane", "Twenty-four trans plates across the whole facade by now, and not one of them is holding anything up."],
      ["Floor Slab", "This slab is also the roof deck. The barrel vault lands on it in the next phase, so it needs to be fully seated."],
      ["Party Wall Caps", "Four 1×4 plates rather than the 1×3-and-1×1 pairs used below, because the panorama leaves exactly four of them."],
      ["Balcony Slab", "No balcony above this one, so this projection becomes the eaves the vault springs from."],
    ],
  },
  "fc-roof": {
    title: "Phase 6 — Barrel Vault Roof",
    concept: "The Crescent's Signature",
    color: "#DC2626",
    icon: "🌓",
    time: "15–20 min",
    location:
      "This is the reason to build Frobisher rather than any other block. The crescent is capped with barrel vaults running the length of the building, and the set's twelve curved 3×1 slopes — untouched by the panorama — make exactly six ribs. Two slopes back to back form one vault: one facing the plaza, one facing the rear, meeting at a ridge over the middle of the plan.",
    steps: [
      ["Barrel Vault — Rear Ribs, West", "Each rib is two curved slopes meeting at a ridge. Lay all the rear-facing halves first; getting them in a straight line is easier before the front halves crowd them."],
      ["Barrel Vault — Rear Ribs, East", "Three more. The curve should now read continuously across six studs of width."],
      ["Barrel Vault — Front Ribs, West", "Now the plaza-facing halves, back to back with the rear ones. The ridge line falls between z = 4 and z = 5."],
      ["Barrel Vault — Front Ribs, East", "The last three ribs. All twelve curved slopes in the set are now on this roof, which is the clearest possible argument that this build and the panorama were meant to coexist."],
      ["West Flat Roof", "The end flats get a flat roof rather than a vault — true of the real crescent, where the vaults run over the central spine only. Three 1×6 tiles cover it in one pass."],
      ["East Flat Roof", "Three more tiles and the building is topped out. Look at it end-on: flat, vaulted, flat. That silhouette is Frobisher."],
    ],
  },
  "fc-plaza": {
    title: "Phase 7 — Podium Plaza",
    concept: "Landscape & Threshold",
    color: "#059669",
    icon: "🌿",
    time: "20–25 min",
    location:
      "The last phase is everything that is not the building: the promenade in front, the retaining wall holding the podium up, and the planting and street furniture that make the estate habitable. It is also where the remaining odd parts finally get used — macaroni bricks for the rounded site corners, round corner plates for the aprons, corner bricks for the planters.",
    steps: [
      ["Promenade Paving — Back Run", "Long tiles along the front edge of the site. Tiles rather than plates because a promenade should read as smooth and finished."],
      ["Promenade Paving — Front Run", "The second run completes the walkway."],
      ["Podium Retaining Wall — West", "Steep 65° slopes hold up the podium edge. The Barbican's podium walls are near-vertical with a slight batter, and this is that angle in one part."],
      ["Podium Retaining Wall — East", "Two more to finish the run."],
      ["Rounded Plaza Aprons", "Round corner plates sweep the paving out into the plaza. Set the two facings opposite each other so the curves mirror."],
      ["Circular Planting Bed", "A 4×4 round plate on top of the west apron makes a raised bed. Tiering a round plate onto a round corner plate is a cheap way to get a two-level landscape feature."],
      ["Rounded Site Corners — Back", "Macaroni bricks round off the corners of the site. Their missing inner cell tucks neatly over the tie-plate edge, which is why they fit here and nowhere else."],
      ["Rounded Site Corners — Flanks", "Two more on the flanks. Watch the facing on each: the arc has to open outward or the corner reads inside out."],
      ["Planter Walls", "L-shaped corner bricks at the promenade ends. Three cells of brick from one part, and no seam at the corner."],
      ["Bollards", "Corner panels along the back service strip. At this scale a 1×1 panel is convincingly a bollard."],
      ["Podium Benches", "Two rounded 1×4 panels become benches facing the block. Every Barbican photograph has someone sitting on one of these."],
      ["Gratings and Lamps", "Grille tiles for the drainage gratings, trans plates for the lamps. Stand the finished section next to the panorama: same set, same estate, opposite ends of the zoom lens."],
    ],
  },
};

const build = generateFrobisher();

function stepEntries(step) {
  const groups = new Map();
  for (const p of step) {
    const key = `${p.info.name}|${p.info.partNumber}|${p.info.description}|${p.attach ? 1 : 0}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  return [...groups.entries()].map(([key, qty]) => {
    const [name, part, desc, attach] = key.split("|");
    return { name, part, qty, desc, attach: attach === "1" };
  });
}

function instructionFor(entries) {
  const parts = entries.map(
    (e) => `${e.qty}× ${e.name} — ${e.desc.toLowerCase()}${e.attach ? ", clipped onto the side studs" : ""}`
  );
  const list =
    parts.length === 1
      ? parts[0]
      : parts.length === 2
        ? `${parts[0]}, then ${parts[1]}`
        : parts.slice(0, -1).join("; ") + "; and " + parts[parts.length - 1];
  const grid = entries.some((e) => e.attach)
    ? "The clipped pieces face outward, not upward — press them squarely onto the studs."
    : "Every piece sits on the stud grid — press each one down fully before moving on.";
  return `Place ${list}. ${grid}`;
}

const q = (s) => JSON.stringify(s);
let total = 0;
const phaseSrc = FC_PHASE_ORDER.map((pid) => {
  const meta = PHASES[pid];
  const steps = build[pid];
  if (steps.length !== meta.steps.length)
    throw new Error(`${pid}: model has ${steps.length} steps, copy has ${meta.steps.length}`);
  const stepSrc = steps
    .map((step, i) => {
      const entries = stepEntries(step);
      total += step.length;
      const [title, tip] = meta.steps[i];
      const last = pid === FC_PHASE_ORDER[FC_PHASE_ORDER.length - 1] && i === steps.length - 1;
      return `        {
          title: ${q(title)},
          instruction:
            ${q(instructionFor(entries))},
          pieces: [
${entries.map((e) => `            { name: ${q(e.name)}, part: ${q(e.part)}, qty: ${e.qty} },`).join("\n")}
          ],
          tip: ${q(tip)},${last ? "\n          highlight: true," : ""}
        },`;
    })
    .join("\n");
  return `    {
      id: ${q(pid)},
      title: ${q(meta.title)},
      concept: ${q(meta.concept)},
      color: ${q(meta.color)},
      icon: ${q(meta.icon)},
      time: ${q(meta.time)},
      location:
        ${q(meta.location)},
      steps: [
${stepSrc}
      ],
    },`;
}).join("\n");

const src = `// ═══════════════════════════════════════════════════════════════════════
// FROBISHER CRESCENT — FACADE BAY SECTION
// A cutaway slice through one block: party walls, three floors of flats,
// the SNOT facade, projecting balconies and the barrel-vaulted roof.
// Built entirely from parts the Lakeside Panorama leaves in the box, so the
// two models can stand side by side. Generated by
// scripts/gen-frobisher-build.mjs — do not hand-edit the phases below.
// ═══════════════════════════════════════════════════════════════════════

const frobisherSection: Build = {
  id: "frobisher-section",
  title: "Frobisher Crescent — Facade Bay Section",
  subtitle:
    "A cutaway slice through one block: party walls, three floors, and the barrel vault",
  description:
    "The Lakeside Panorama is the wide shot. This is the close-up: a single bay of Frobisher Crescent cut open like an architect's section drawing, so you can read the podium undercroft, three floors of flats, the recessed window bands and the barrel-vaulted roof all at once. It uses ${total} pieces, every one of them left over after the panorama is built — including the twelve curved slopes, the side-stud bricks and the macaroni bricks the panorama never touches. Build it second and the two models sit together as a pair; build it alone and you still have most of the set spare.",
  difficulty: 2,
  estimatedTime: "2–3 hours",
  pieceCount: ${total},
  concept: "Section, Surface & Repetition",
  heroPhoto: SHARED_PHOTOS.terrace.url,
  photos: {
    terrace: SHARED_PHOTOS.terrace,
    balconies: SHARED_PHOTOS.balconies,
    podium: SHARED_PHOTOS.podium,
    lakeside: SHARED_PHOTOS.lakeside,
    aerial: SHARED_PHOTOS.aerial,
  },
  phasePhotos: {
    "fc-base": ["aerial", "podium"],
    "fc-undercroft": ["podium", "terrace"],
    "fc-storey-1": ["balconies", "terrace"],
    "fc-storey-2": ["balconies", "terrace"],
    "fc-storey-3": ["terrace", "balconies"],
    "fc-roof": ["terrace", "lakeside"],
    "fc-plaza": ["podium", "aerial"],
  },
  phases: [
${phaseSrc}
  ],
};
`;

const path = new URL("../src/builds.ts", import.meta.url).pathname;
let file = readFileSync(path, "utf8");
const START = "// <<< FROBISHER START >>>";
const END = "// <<< FROBISHER END >>>";
const block = `${START}\n${src}${END}`;
if (file.includes(START)) {
  file = file.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
} else {
  file = file.replace("// ─── Export ─", `${block}\n\n// ─── Export ─`);
}
file = file.replace(
  "export const ALL_BUILDS: Build[] = [barbicanPanorama];",
  "export const ALL_BUILDS: Build[] = [barbicanPanorama, frobisherSection];"
);
writeFileSync(path, file);
console.log(`Frobisher build written: ${total} pieces, ${FC_PHASE_ORDER.length} phases.`);

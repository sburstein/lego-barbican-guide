// Regenerates every phase's `steps: [...]` array in src/builds.ts for both
// builds, from the validated placement models. Step titles and tips are
// authored in the model files (Builder.step(title, tip)); instructions and
// piece lists are derived from the placements. Phase-level copy (title,
// concept, location, photos) stays hand-authored in builds.ts.
// Run: node scripts/gen-builds.mjs

import { readFileSync, writeFileSync } from "fs";
import { generateBuild, generateBuildMeta, BP_PHASE_ORDER } from "../src/lego-model.ts";

const buildsPath = new URL("../src/builds.ts", import.meta.url).pathname;
let src = readFileSync(buildsPath, "utf8");

const GENERIC_TIPS = [
  "Press every piece fully home before moving on; gaps low down telegraph all the way up.",
  "Check the row against the 3D view before seating it; sliding bricks sideways to correct is harder than placing them right.",
  "Line the pieces up on the table in order first; real LEGO designers call this presorting, and it halves build time.",
  "Rotate the 3D model to see this step from behind before you place anything.",
];

/** Group a step's placements into piece-list entries (physical set is
 * white + trans only; dark/green tints are 3D visual coding). */
function stepEntries(step) {
  const groups = new Map();
  for (const p of step) {
    const key = `${p.info.name}|${p.info.partNumber}|${p.info.description}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  return [...groups.entries()].map(([key, qty]) => {
    const [name, part, desc] = key.split("|");
    return { name, part, qty, desc };
  });
}

function areaPhrase(step, bounds) {
  if (step.length === 0) return "";
  let sx = 0, sz = 0;
  for (const p of step) {
    sx += p.x + p.w / 2;
    sz += p.z + p.d / 2;
  }
  const mx = sx / step.length;
  const mz = sz / step.length;
  const fx = (mx - bounds.minX) / (bounds.maxX - bounds.minX || 1);
  const fz = (mz - bounds.minZ) / (bounds.maxZ - bounds.minZ || 1);
  const xPart = fx < 0.34 ? "west" : fx > 0.66 ? "east" : "";
  const zPart = fz < 0.34 ? "rear" : fz > 0.66 ? "front" : "";
  if (!xPart && !zPart) return "in the centre of the model";
  if (xPart && zPart) return `at the ${zPart} ${xPart} of the model`;
  return xPart ? `on the ${xPart} side` : `toward the ${zPart} of the model`;
}

function layerPhrase(step) {
  const lo = Math.min(...step.map((p) => p.layer));
  if (lo === 0) return "directly on the table";
  if (lo <= 2) return "on the baseplate studs";
  return `about ${Math.max(1, Math.round(lo / 3))} brick${lo >= 5 ? "s" : ""} up`; // 3 plate-layers = 1 brick
}

function instructionFor(step, bounds) {
  const entries = stepEntries(step);
  const parts = entries.map((e) => `${e.qty}× ${e.name} (${e.desc.toLowerCase()})`);
  let list;
  if (parts.length === 1) list = parts[0];
  else if (parts.length === 2) list = `${parts[0]} and ${parts[1]}`;
  else list = parts.slice(0, -1).join("; ") + "; and " + parts[parts.length - 1];
  return `Place ${list}; ${areaPhrase(step, bounds)}, ${layerPhrase(step)}. Match the coral pieces in the 3D view for exact positions.`;
}

function boundsOf(model) {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const phase of Object.values(model)) for (const step of phase) for (const p of step) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x + p.w);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z + p.d);
  }
  return { minX, maxX, minZ, maxZ };
}

function stepsSource(phaseSteps, phaseMeta, bounds, indent) {
  let genericIdx = 0;
  const stepsSrc = phaseSteps
    .map((step, si) => {
      const meta = phaseMeta[si] ?? { title: `Step ${si + 1}` };
      const tip = meta.tip ?? GENERIC_TIPS[genericIdx++ % GENERIC_TIPS.length];
      // The parts list merges entries that differ only in their role (a
      // 1×10 plate used as a seam tie and as a deck edge is one pile to grab).
      const merged = new Map();
      for (const e of stepEntries(step)) {
        const k = `${e.name}|${e.part}`;
        merged.set(k, { ...e, qty: (merged.get(k)?.qty ?? 0) + e.qty });
      }
      const pieces = [...merged.values()]
        .map((e) => `${indent}    { name: ${JSON.stringify(e.name)}, part: ${JSON.stringify(e.part)}, qty: ${e.qty} },`)
        .join("\n");
      return (
        `${indent}{\n` +
        `${indent}  title: ${JSON.stringify(meta.title)},\n` +
        `${indent}  instruction: ${JSON.stringify(instructionFor(step, bounds))},\n` +
        `${indent}  pieces: [\n${pieces}\n${indent}  ],\n` +
        `${indent}  tip: ${JSON.stringify(tip)},\n` +
        `${indent}},`
      );
    })
    .join("\n");
  return `[\n${stepsSrc}\n${indent.slice(2)}]`;
}

function replaceSteps(buildModel, buildMeta, phaseOrder) {
  for (const pid of phaseOrder) {
    const idIdx = src.indexOf(`id: "${pid}"`);
    if (idIdx < 0) throw new Error(`phase ${pid} not found in builds.ts`);
    const stepsIdx = src.indexOf("steps:", idIdx);
    const open = src.indexOf("[", stepsIdx);
    let depth = 0;
    let j = open;
    do {
      if (src[j] === "[") depth++;
      else if (src[j] === "]") depth--;
      j++;
    } while (depth > 0 && j < src.length);
    const bounds = boundsOf(buildModel);
    const gen = stepsSource(buildModel[pid], buildMeta[pid], bounds, "        ");
    src = src.slice(0, open) + gen + src.slice(j);
  }
}

const panorama = generateBuild();
replaceSteps(panorama, generateBuildMeta(), BP_PHASE_ORDER);

// Update the headline piece counts per build (count within each Build block)
function countPieces(model) {
  return Object.values(model).reduce(
    (s, phase) => s + phase.reduce((t, step) => t + step.length, 0),
    0
  );
}
function setPieceCount(anchor, count) {
  const a = src.indexOf(anchor);
  const pcIdx = src.indexOf("pieceCount:", a);
  const end = src.indexOf(",", pcIdx);
  src = src.slice(0, pcIdx) + `pieceCount: ${count}` + src.slice(end);
}
setPieceCount("const barbicanPanorama", countPieces(panorama));

// Keep each phase's banner comment, "// PHASE n: NAME (s steps, p pieces)", in step
for (const pid of BP_PHASE_ORDER) {
  const at = src.indexOf(`id: "${pid}"`);
  const banner = src.lastIndexOf("// PHASE", at);
  const m = /\(\d+ steps, \d+ pieces\)/.exec(src.slice(banner, at));
  if (!m) continue;
  const phase = panorama[pid];
  const counts = `(${phase.length} steps, ${phase.reduce((t, st) => t + st.length, 0)} pieces)`;
  src = src.slice(0, banner + m.index) + counts + src.slice(banner + m.index + m[0].length);
}

writeFileSync(buildsPath, src);
console.log(
  `builds.ts regenerated: panorama ${countPieces(panorama)} pieces.`
);

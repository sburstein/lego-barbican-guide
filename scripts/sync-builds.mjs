// Regenerate builds.ts step piece lists (and instructions) from the
// validated geometry model, so the guide text always matches the 3D model.
// Titles and tips are preserved. Run: node scripts/sync-builds.mjs

import { readFileSync, writeFileSync } from "fs";
import { generateBuild, BP_PHASE_ORDER } from "../src/lego-model.ts";

const buildsPath = new URL("../src/builds.ts", import.meta.url).pathname;
let src = readFileSync(buildsPath, "utf8");

const build = generateBuild();

// Group a step's placements into piece-list entries
function stepEntries(step) {
  const groups = new Map();
  for (const p of step) {
    const key = `${p.info.name}|${p.info.partNumber}|${p.color}|${p.info.description}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  // The physical 21050 set is white + trans-clear only; dark/green in the 3D
  // model are visual coding for the same white parts, so names stay real.
  return [...groups.entries()].map(([key, qty]) => {
    const [name, part, , desc] = key.split("|");
    const displayName = name.startsWith("Trans-Clear") || !part.match(/^(3023|3024|3065|87552)$/)
      ? name
      : `Trans-Clear ${name}`;
    return { name: displayName, part, qty, desc };
  });
}

function instructionFor(entries) {
  const parts = entries.map((e) => `${e.qty}× ${e.name} — ${e.desc.toLowerCase()}`);
  let list;
  if (parts.length === 1) list = parts[0];
  else if (parts.length === 2) list = `${parts[0]}, then ${parts[1]}`;
  else list = parts.slice(0, -1).join("; ") + "; and " + parts[parts.length - 1];
  return `Place ${list}. Every piece sits on the stud grid — press each one down fully before moving on.`;
}

// Walk each phase block in builds.ts and rewrite its steps' pieces/instruction
let totalPieces = 0;
for (const pid of BP_PHASE_ORDER) {
  const steps = build[pid];
  const phaseStart = src.indexOf(`id: "${pid}"`);
  if (phaseStart < 0) throw new Error(`phase ${pid} not found`);
  const nextIdx = BP_PHASE_ORDER.indexOf(pid) + 1;
  const phaseEnd =
    nextIdx < BP_PHASE_ORDER.length ? src.indexOf(`id: "${BP_PHASE_ORDER[nextIdx]}"`) : src.length;

  let segment = src.slice(phaseStart, phaseEnd);

  // Find each step object's pieces: [...] and instruction: "..." in order
  let cursor = 0;
  for (let si = 0; si < steps.length; si++) {
    const entries = stepEntries(steps[si]);
    totalPieces += steps[si].length;

    // instruction
    const instIdx = segment.indexOf("instruction:", cursor);
    if (instIdx < 0) throw new Error(`step ${si} instruction not found in ${pid}`);
    const instStart = segment.indexOf('"', instIdx);
    let i = instStart + 1;
    while (i < segment.length && !(segment[i] === '"' && segment[i - 1] !== "\\")) i++;
    const newInst = JSON.stringify(instructionFor(entries)).slice(1, -1);
    segment = segment.slice(0, instStart + 1) + newInst + segment.slice(i);

    // pieces array (follows the instruction)
    const piecesIdx = segment.indexOf("pieces:", instIdx);
    if (piecesIdx < 0) throw new Error(`step ${si} pieces not found in ${pid}`);
    const openBracket = segment.indexOf("[", piecesIdx);
    let depth = 0;
    let j = openBracket;
    do {
      if (segment[j] === "[") depth++;
      else if (segment[j] === "]") depth--;
      j++;
    } while (depth > 0 && j < segment.length);
    const piecesSrc =
      "[\n" +
      entries
        .map((e) => `          { name: "${e.name}", part: "${e.part}", qty: ${e.qty} },`)
        .join("\n") +
      "\n        ]";
    segment = segment.slice(0, openBracket) + piecesSrc + segment.slice(j);
    cursor = segment.indexOf("]", openBracket) + 1;
  }

  src = src.slice(0, phaseStart) + segment + src.slice(phaseEnd);
}

// Update the headline piece count
src = src.replace(/pieceCount: \d+,/, `pieceCount: ${totalPieces},`);

writeFileSync(buildsPath, src);
console.log(`Synced builds.ts: ${totalPieces} pieces across ${BP_PHASE_ORDER.length} phases.`);

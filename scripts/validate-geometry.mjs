// Physical-buildability validator for the Barbican LEGO model.
// Run: node scripts/validate-geometry.mjs
// Requires Node 23.6+ (native TypeScript type stripping).

import { generateBuild, validateBuild, BP_PHASE_ORDER } from "../src/lego-model.ts";

const EXPECTED_STEPS = {
  "bp-foundation": 10,
  "bp-lake": 8,
  "bp-podium": 8,
  "bp-terrace-core": 28,
  "bp-terrace-facade": 13,
  "bp-terrace-balconies": 11,
  "bp-barrel-vault": 10,
  "bp-tower-core": 12,
  "bp-tower-facade": 11,
  "bp-tower-crown": 10,
  "bp-conservatory": 13,
  "bp-landscaping": 33,
};

const build = generateBuild();
let totalPieces = 0;
let stepMismatch = false;

console.log("── Step counts ──");
for (const pid of BP_PHASE_ORDER) {
  const steps = build[pid] ?? [];
  const pieces = steps.reduce((s, st) => s + st.length, 0);
  totalPieces += pieces;
  const exp = EXPECTED_STEPS[pid];
  const ok = steps.length === exp;
  if (!ok) stepMismatch = true;
  console.log(
    `${ok ? "  " : "✗ "}${pid}: ${steps.length} steps (expected ${exp}), ${pieces} pieces`
  );
}
console.log(`Total pieces: ${totalPieces}\n`);

console.log("── Physical validation ──");
const errors = validateBuild(build);
if (errors.length === 0) {
  console.log("✓ All placements are real parts, on-grid, collision-free, and supported.");
} else {
  for (const e of errors.slice(0, 80)) console.log("✗ " + e);
  if (errors.length > 80) console.log(`… and ${errors.length - 80} more`);
  console.log(`\n${errors.length} violations`);
}

process.exit(errors.length || stepMismatch ? 1 : 0);

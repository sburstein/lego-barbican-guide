// Physical-buildability validator for both Barbican LEGO models.
// Run: node scripts/validate-geometry.mjs
// Requires Node 23.6+ (native TypeScript type stripping).

import { validateBuild } from "../src/lego-model.ts";
import { BUILD_IDS, modelFor, phaseOrderFor } from "../src/build-models.ts";

const EXPECTED_STEPS = {
  "barbican-panorama": {
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
  },
  "frobisher-section": {
    "fc-base": 4,
    "fc-undercroft": 7,
    "fc-storey-1": 10,
    "fc-storey-2": 10,
    "fc-storey-3": 9,
    "fc-roof": 6,
    "fc-plaza": 12,
  },
};

let failed = false;

for (const buildId of BUILD_IDS) {
  const build = modelFor(buildId);
  const expected = EXPECTED_STEPS[buildId] ?? {};
  let totalPieces = 0;

  console.log(`\n══ ${buildId} ══`);
  console.log("── Step counts ──");
  for (const pid of phaseOrderFor(buildId)) {
    const steps = build[pid] ?? [];
    const pieces = steps.reduce((s, st) => s + st.length, 0);
    totalPieces += pieces;
    const exp = expected[pid];
    const ok = steps.length === exp;
    if (!ok) failed = true;
    console.log(
      `${ok ? "  " : "✗ "}${pid}: ${steps.length} steps (expected ${exp}), ${pieces} pieces`
    );
  }
  console.log(`Total pieces: ${totalPieces}`);

  console.log("── Physical validation ──");
  const errors = validateBuild(build);
  if (errors.length === 0) {
    console.log("✓ All placements are real parts, on-grid, collision-free, and supported.");
  } else {
    failed = true;
    for (const e of errors.slice(0, 80)) console.log("✗ " + e);
    if (errors.length > 80) console.log(`… and ${errors.length - 80} more`);
    console.log(`${errors.length} violations`);
  }
}

process.exit(failed ? 1 : 0);

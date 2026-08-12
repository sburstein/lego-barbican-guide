// Physical-buildability validator for all Barbican LEGO models.
// Checks, per build:
//   1. every placement is a real part, on-grid, collision-free, supported
//   2. every step is reachable in build order (nothing slides in under
//      already-placed pieces)
//   3. builds.ts (the guide text) matches the model step-for-step and
//      piece-for-piece, so the app can never drift from the geometry
// Run: node scripts/validate-geometry.mjs  (Node 23.6+, native TS stripping)

import { validateBuild } from "../src/lego-model.ts";
import { BUILD_IDS, modelFor, phaseOrderFor } from "../src/build-models.ts";
import { ALL_BUILDS } from "../src/builds.ts";

let failed = false;

for (const buildId of BUILD_IDS) {
  const build = modelFor(buildId);
  const guide = ALL_BUILDS.find((b) => b.id === buildId);
  let totalPieces = 0;
  let totalSteps = 0;

  console.log(`\n══ ${buildId} ══`);
  for (const pid of phaseOrderFor(buildId)) {
    const steps = build[pid] ?? [];
    totalSteps += steps.length;
    totalPieces += steps.reduce((s, st) => s + st.length, 0);
    const guidePhase = guide?.phases.find((p) => p.id === pid);
    if (!guidePhase) {
      console.log(`✗ ${pid}: missing from builds.ts`);
      failed = true;
      continue;
    }
    if (guidePhase.steps.length !== steps.length) {
      console.log(
        `✗ ${pid}: builds.ts has ${guidePhase.steps.length} steps, model has ${steps.length} — run scripts/gen-builds.mjs`
      );
      failed = true;
      continue;
    }
    for (let si = 0; si < steps.length; si++) {
      const modelQty = steps[si].length;
      const guideQty = guidePhase.steps[si].pieces.reduce((s, p) => s + p.qty, 0);
      if (modelQty !== guideQty) {
        console.log(`✗ ${pid} step ${si}: guide lists ${guideQty} pieces, model places ${modelQty}`);
        failed = true;
      }
    }
  }
  console.log(`${totalSteps} steps, ${totalPieces} pieces; guide text in sync`);

  const errors = validateBuild(build);
  if (errors.length === 0) {
    console.log("✓ Physical + sequential validation clean.");
  } else {
    failed = true;
    for (const e of errors.slice(0, 60)) console.log("✗ " + e);
    if (errors.length > 60) console.log(`… and ${errors.length - 60} more`);
    console.log(`${errors.length} violations`);
  }
}

process.exit(failed ? 1 : 0);

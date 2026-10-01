#!/usr/bin/env node
// One entry point to rebuild and verify the whole project.
//
//   node scripts/harness.mjs <command>      (or: npm run harness -- <command>)
//
// Commands
//   doctor    environment: Node version, Chrome for renders, disk, LDraw cache
//   parts     every part in the engine against real LDraw geometry
//   validate  every build: physics, build order, guide text in sync
//   audit     all builds together against one 21050 inventory
//   test      unit tests (renderer/validator agreement, validator regressions)
//   guide     regenerate src/builds.ts step lists from the models
//   manual    regenerate the three print manuals (manual/, gitignored)
//   render    four-side review renders of each build (.cache/renders)
//   build     typecheck and bundle the web app (dist/)
//   all       doctor, parts, validate, audit, test, manual, render, build
//
// Nothing here talks to an outside service except the LDraw library fetch
// in `parts`, which only runs for files missing from .cache/ldraw.

import { spawnSync } from "node:child_process";
import { existsSync, statfsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUILDS = ["barbican-panorama", "frobisher-section", "london-wall"];
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit" });
  return r.status === 0;
};
const node = (...args) => run(process.execPath, args);

const COMMANDS = {
  doctor() {
    const problems = [];
    const [maj, min] = process.versions.node.split(".").map(Number);
    if (maj < 23 || (maj === 23 && min < 6)) problems.push(`Node ${process.versions.node}: need 23.6+ to run the TypeScript models directly`);
    if (!existsSync(join(ROOT, "node_modules/three"))) problems.push("node_modules missing: install dependencies (pnpm install)");
    if (!existsSync(CHROME)) problems.push("Google Chrome not found: review renders will be HTML only");
    if (!existsSync(join(ROOT, ".cache/ldraw/ldraw/parts"))) problems.push("LDraw cache empty: `parts` will fetch about 1 MB from library.ldraw.org");
    try {
      const s = statfsSync(ROOT);
      const gb = (s.bavail * s.bsize) / 1e9;
      if (gb < 2) problems.push(`only ${gb.toFixed(1)} GB free on this disk`);
      console.log(`disk free  ${gb.toFixed(1)} GB`);
    } catch {}
    console.log(`node       ${process.versions.node}`);
    for (const p of problems) console.log(`! ${p}`);
    // Warnings only: a missing Chrome or a small disk should not stop checks.
    return !problems.some((p) => p.startsWith("Node") || p.startsWith("node_modules"));
  },
  parts: () => node("scripts/check-parts.mjs"),
  validate: () => node("scripts/validate-geometry.mjs"),
  audit: () => node("audit.mjs"),
  test: () => node("--test", "tests/agreement.test.mjs", "tests/validator.test.mjs"),
  guide: () => node("scripts/gen-builds.mjs"),
  manual: () => BUILDS.every((b) => node("scripts/generate-manual.mjs", b)),
  render: () => BUILDS.every((b) => node("scripts/render-views.mjs", b)),
  build: () => run("npm", ["run", "build", "--silent"]),
};
COMMANDS.all = () => {
  const steps = ["doctor", "parts", "validate", "audit", "test", "manual", "render", "build"];
  const results = [];
  for (const s of steps) {
    console.log(`\n━━ ${s} ━━`);
    const t = Date.now();
    const ok = COMMANDS[s]();
    results.push([s, ok, Date.now() - t]);
    if (!ok) break;
  }
  console.log("\n━━ summary ━━");
  for (const [s, ok, ms] of results) console.log(`${ok ? "✓" : "✗"} ${s.padEnd(9)} ${(ms / 1000).toFixed(1)}s`);
  return results.every(([, ok]) => ok) && results.length === steps.length;
};

const cmd = process.argv[2];
if (!COMMANDS[cmd]) {
  console.log("usage: node scripts/harness.mjs <doctor|parts|validate|audit|test|guide|manual|render|build|all>");
  process.exit(cmd ? 1 : 0);
}
process.exit(COMMANDS[cmd]() ? 0 : 1);

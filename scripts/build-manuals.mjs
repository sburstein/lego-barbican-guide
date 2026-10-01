#!/usr/bin/env node
// Downloadable instruction booklets for every build (hand-built and approved
// AI designs), generated from the same placements as the 3D guide, so the
// booklet and the site can never disagree. Part of `npm run build`.
//
//   node scripts/build-manuals.mjs [--no-pdf] [buildId ...]
//
// Writes public/manuals/<id>.html, <id>.pdf (headless Chrome, A4 landscape)
// and index.json, which the app reads to show only booklets that exist.
// Without Chrome the PDFs are skipped and the HTML booklets still ship.

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BUILD_IDS } from "../src/build-models.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public/manuals");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const args = process.argv.slice(2);
const wantPdf = !args.includes("--no-pdf") && existsSync(CHROME);
const ids = args.filter((a) => !a.startsWith("--"));
const builds = ids.length ? ids : BUILD_IDS;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const index = { version: pkg.version, builtAt: new Date().toISOString(), builds: {} };

for (const id of builds) {
  const log = execFileSync(process.execPath, [join(ROOT, "scripts/generate-manual.mjs"), id], { cwd: ROOT }).toString();
  const pages = Number(log.match(/pages\s+(\d+)/)?.[1] ?? 0);
  const src = join(ROOT, "manual", `${id}-manual.html`);
  copyFileSync(src, join(OUT, `${id}.html`));
  const entry = { html: `/manuals/${id}.html`, pages };
  if (wantPdf) {
    const pdf = join(OUT, `${id}.pdf`);
    try {
      execFileSync("perl", ["-e", "alarm shift; exec @ARGV", "240", CHROME, "--headless=new", "--disable-gpu", "--no-first-run",
        "--no-pdf-header-footer", `--print-to-pdf=${pdf}`, `file://${src}`], { stdio: "ignore" });
      if (existsSync(pdf)) entry.pdf = `/manuals/${id}.pdf`;
    } catch {
      console.log(`  ! ${id}: PDF timed out; shipping HTML only`);
    }
  }
  index.builds[id] = entry;
  const mb = (f) => (existsSync(f) ? (statSync(f).size / 1048576).toFixed(1) : "-");
  console.log(`${id.padEnd(28)} ${String(pages).padStart(3)} pages  html ${mb(join(OUT, `${id}.html`))} MB  pdf ${mb(join(OUT, `${id}.pdf`))} MB`);
}
writeFileSync(join(OUT, "index.json"), JSON.stringify(index, null, 2));
// version stamp for post-deploy checks
let commit = "local";
try { commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: ROOT }).toString().trim(); } catch {}
writeFileSync(join(ROOT, "public/version.json"), JSON.stringify({ version: pkg.version, commit, builtAt: index.builtAt, builds: builds.length }, null, 2));
console.log(`manuals → public/manuals (${wantPdf ? "HTML + PDF" : "HTML only"})`);

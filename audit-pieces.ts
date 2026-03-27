// Piece Audit Script — run with: npx tsx audit-pieces.ts
import { ALL_BUILDS } from "./src/builds";
import { FULL_INVENTORY } from "./src/inventory";

// 1. Aggregate piece usage across all builds
const usageMap = new Map<string, { name: string; total: number; byBuild: Record<string, number> }>();

for (const entry of FULL_INVENTORY) {
  usageMap.set(entry.partNumber, { name: entry.name, total: 0, byBuild: {} });
}

let grandTotal = 0;
const buildTotals: Record<string, number> = {};
const unknownParts: string[] = [];

for (const build of ALL_BUILDS) {
  let buildTotal = 0;
  for (const phase of build.phases) {
    for (const step of phase.steps) {
      for (const piece of step.pieces) {
        buildTotal += piece.qty;
        const entry = usageMap.get(piece.part);
        if (!entry) {
          unknownParts.push(`${piece.part} (${piece.name}) in build "${build.id}"`);
          continue;
        }
        entry.total += piece.qty;
        entry.byBuild[build.id] = (entry.byBuild[build.id] || 0) + piece.qty;
      }
    }
  }
  buildTotals[build.id] = buildTotal;
  grandTotal += buildTotal;
}

// 2. Check for unknown part numbers
console.log("═══ PIECE AUDIT REPORT ═══\n");

if (unknownParts.length > 0) {
  console.log("❌ UNKNOWN PART NUMBERS (not in inventory):");
  for (const p of unknownParts) console.log(`   ${p}`);
  console.log();
} else {
  console.log("✅ All part numbers exist in inventory.\n");
}

// 3. Check for over-budget pieces
const overBudget: string[] = [];
for (const entry of FULL_INVENTORY) {
  const usage = usageMap.get(entry.partNumber)!;
  if (usage.total > entry.totalInSet) {
    overBudget.push(
      `   ${entry.partNumber} ${entry.name}: used ${usage.total} / ${entry.totalInSet} available (OVER by ${usage.total - entry.totalInSet})`
    );
  }
}

if (overBudget.length > 0) {
  console.log("❌ OVER-BUDGET PIECES:");
  for (const line of overBudget) console.log(line);
  console.log();
} else {
  console.log("✅ No piece exceeds its inventory total.\n");
}

// 4. Per-build piece counts
console.log("── Build Piece Counts ──");
for (const [id, count] of Object.entries(buildTotals)) {
  const status = count >= 120 ? "✅" : "❌ UNDER 120";
  console.log(`   ${id}: ${count} pieces ${status}`);
}
console.log(`\n   GRAND TOTAL: ${grandTotal} pieces`);
const pct = ((grandTotal / 1210) * 100).toFixed(1);
const rangeOk = grandTotal >= 800 && grandTotal <= 950;
console.log(`   Utilization: ${pct}% of 1,210 ${rangeOk ? "✅" : "⚠️  outside 800-950 target"}\n`);

// 5. Declared pieceCount vs actual
console.log("── Declared vs Actual pieceCount ──");
for (const build of ALL_BUILDS) {
  const actual = buildTotals[build.id];
  const match = actual === build.pieceCount ? "✅" : `⚠️  declared ${build.pieceCount}`;
  console.log(`   ${build.id}: actual=${actual} ${match}`);
}
console.log();

// 6. Unused pieces
const unused = FULL_INVENTORY.filter((e) => usageMap.get(e.partNumber)!.total === 0);
if (unused.length > 0) {
  console.log("── Unused Pieces (0 usage) ──");
  for (const e of unused) console.log(`   ${e.partNumber} ${e.name} (${e.totalInSet} available)`);
  console.log();
}

// 7. Full usage table
console.log("── Full Usage Table ──");
console.log("Part     | Name                       | InSet | Used | Remain | %Used");
console.log("---------|----------------------------|-------|------|--------|------");
for (const entry of FULL_INVENTORY) {
  const u = usageMap.get(entry.partNumber)!;
  const remain = entry.totalInSet - u.total;
  const pctUsed = ((u.total / entry.totalInSet) * 100).toFixed(0);
  const nameStr = entry.name.padEnd(26);
  const flag = remain < 0 ? " ❌" : "";
  console.log(
    `${entry.partNumber.padEnd(9)}| ${nameStr} | ${String(entry.totalInSet).padStart(5)} | ${String(u.total).padStart(4)} | ${String(remain).padStart(6)} | ${pctUsed.padStart(4)}%${flag}`
  );
}

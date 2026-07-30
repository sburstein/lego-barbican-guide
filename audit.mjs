// Audit script: verify builds.ts against inventory.ts
// Reports each build separately and both together, because the two builds are
// designed to be buildable at the same time from one copy of set 21050.
// Run with: node audit.mjs

import { readFileSync } from 'fs';

// Parse inventory
const invSrc = readFileSync('./src/inventory.ts', 'utf8');
const invEntries = [];
const invRe = /partNumber:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*totalInSet:\s*(\d+)/g;
let m;
while ((m = invRe.exec(invSrc)) !== null) {
  invEntries.push({ partNumber: m[1], name: m[2], category: m[3], totalInSet: parseInt(m[4]) });
}

console.log(`Inventory: ${invEntries.length} part types, ${invEntries.reduce((s, e) => s + e.totalInSet, 0)} total pieces\n`);

// Parse builds
const buildSrc = readFileSync('./src/builds.ts', 'utf8');

// Split the file into per-build regions so each can be counted separately
const buildStarts = [...buildSrc.matchAll(/const (\w+): Build = \{[\s\S]*?\n  id: "([^"]+)"/g)]
  .map((m) => ({ id: m[2], at: m.index }));
const regions = buildStarts.map((b, i) => ({
  id: b.id,
  src: buildSrc.slice(b.at, i + 1 < buildStarts.length ? buildStarts[i + 1].at : buildSrc.length),
}));

// Extract all piece references: { name: "...", part: "...", qty: N }
const pieceRe = /\{\s*name:\s*"[^"]*",\s*part:\s*"([^"]+)",\s*qty:\s*(\d+)\s*\}/g;
function countPieces(src) {
  const map = new Map();
  let total = 0;
  for (const m of src.matchAll(pieceRe)) {
    const qty = parseInt(m[2]);
    if (qty === 0) continue;
    map.set(m[1], (map.get(m[1]) || 0) + qty);
    total += qty;
  }
  return { map, total };
}

const perBuild = regions.map((r) => ({ id: r.id, ...countPieces(r.src) }));
const usage = new Map();
let totalPieces = 0;
for (const b of perBuild) {
  for (const [part, qty] of b.map) usage.set(part, (usage.get(part) || 0) + qty);
  totalPieces += b.total;
}

for (const b of perBuild)
  console.log(`  ${b.id.padEnd(20)} ${String(b.total).padStart(4)} pieces, ${b.map.size} distinct part types`);
console.log(`\nBoth builds use ${usage.size} distinct part types`);
console.log(`Both builds use ${totalPieces} total pieces\n`);

// Check 1: All parts exist in inventory
const invParts = new Set(invEntries.map(e => e.partNumber));
const unknownParts = [];
for (const part of usage.keys()) {
  if (!invParts.has(part)) {
    unknownParts.push(part);
  }
}
if (unknownParts.length > 0) {
  console.log(`ERROR: ${unknownParts.length} parts NOT in inventory:`);
  unknownParts.forEach(p => console.log(`  - ${p} (used ${usage.get(p)})`));
} else {
  console.log(`PASS: All parts exist in inventory`);
}

// Check 2: No part exceeds totalInSet
const overused = [];
for (const entry of invEntries) {
  const used = usage.get(entry.partNumber) || 0;
  if (used > entry.totalInSet) {
    overused.push({ ...entry, used });
  }
}
if (overused.length > 0) {
  console.log(`\nERROR: ${overused.length} parts EXCEED inventory limit:`);
  overused.forEach(p => console.log(`  - ${p.partNumber} "${p.name}": used ${p.used} / ${p.totalInSet}`));
} else {
  console.log(`PASS: No part exceeds its totalInSet limit — both builds fit the set at once`);
}

// Check 3: Unused part types
const unused = invEntries.filter(e => !usage.has(e.partNumber));
if (unused.length > 0) {
  console.log(`\nWARNING: ${unused.length} part types UNUSED:`);
  unused.forEach(p => console.log(`  - ${p.partNumber} "${p.name}" (${p.totalInSet} available)`));
} else {
  console.log(`PASS: All ${invEntries.length} part types are used`);
}

// Summary
console.log(`\n═══════════════════════════════════════`);
console.log(`SUMMARY`);
console.log(`  Total pieces used: ${totalPieces} / 1210 (${(totalPieces/1210*100).toFixed(1)}%)`);
console.log(`  Distinct parts used: ${usage.size} / ${invEntries.length}`);
console.log(`  Unused part types: ${unused.length}`);
console.log(`  Overused parts: ${overused.length}`);
console.log(`  Unknown parts: ${unknownParts.length}`);
console.log(`  Set capacity: 1210`);
console.log(`  Spare after both builds: ${1210 - totalPieces}`);
console.log(`═══════════════════════════════════════`);

// Detailed usage table
console.log(`\nDETAILED USAGE:`);
for (const entry of invEntries) {
  const used = usage.get(entry.partNumber) || 0;
  const pct = entry.totalInSet > 0 ? (used / entry.totalInSet * 100).toFixed(0) : '0';
  const flag = used > entry.totalInSet ? ' *** OVER ***' : used === 0 ? ' --- UNUSED ---' : '';
  console.log(`  ${entry.partNumber.padEnd(8)} ${entry.name.padEnd(30)} ${String(used).padStart(3)} / ${String(entry.totalInSet).padStart(3)} (${pct.padStart(3)}%)${flag}`);
}

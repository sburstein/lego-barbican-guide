// Audit script: verify builds.ts against inventory.ts
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

// Extract all piece references: { name: "...", part: "...", qty: N }
const pieceRe = /\{\s*name:\s*"[^"]*",\s*part:\s*"([^"]+)",\s*qty:\s*(\d+)\s*\}/g;
const usage = new Map();
let totalPieces = 0;
let m2;
while ((m2 = pieceRe.exec(buildSrc)) !== null) {
  const part = m2[1];
  const qty = parseInt(m2[2]);
  if (qty === 0) continue; // skip zero-qty entries
  usage.set(part, (usage.get(part) || 0) + qty);
  totalPieces += qty;
}

console.log(`Build uses ${usage.size} distinct part types`);
console.log(`Build uses ${totalPieces} total pieces\n`);

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
  console.log(`PASS: No part exceeds its totalInSet limit`);
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
console.log(`  Target range: 950-1050`);
console.log(`  In range: ${totalPieces >= 950 && totalPieces <= 1050 ? 'YES' : 'NO'}`);
console.log(`═══════════════════════════════════════`);

// Detailed usage table
console.log(`\nDETAILED USAGE:`);
for (const entry of invEntries) {
  const used = usage.get(entry.partNumber) || 0;
  const pct = entry.totalInSet > 0 ? (used / entry.totalInSet * 100).toFixed(0) : '0';
  const flag = used > entry.totalInSet ? ' *** OVER ***' : used === 0 ? ' --- UNUSED ---' : '';
  console.log(`  ${entry.partNumber.padEnd(8)} ${entry.name.padEnd(30)} ${String(used).padStart(3)} / ${String(entry.totalInSet).padStart(3)} (${pct.padStart(3)}%)${flag}`);
}

// Architecture compiler: valid by construction, honest about what the set
// cannot supply, and specific about what is wrong with a spec.
//
//   node --test tests/

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compileDesign } from "../src/design/compile.ts";
import { validateBuild } from "../src/engine/validate.ts";

const hand = JSON.parse(readFileSync(new URL("./fixtures/barbican-hand.json", import.meta.url), "utf8"));
const spec = (elements, site = { w: 24, d: 16 }) => ({ id: "test-site", title: "T", subtitle: "s", description: "d", concept: "c", site, elements });
const has = (c, re) => c.errors.some((e) => re.test(e));

test("the hand-written Barbican spec compiles to a valid build within one set", () => {
  const c = compileDesign(hand);
  assert.deepEqual(c.errors, []);
  assert.equal(c.ok, true);
  assert.deepEqual(validateBuild(c.build), []);
  assert.ok(c.stats.pieces > 200);
  assert.deepEqual(c.stats.shortages, []);
});

test("compiling is deterministic", () => {
  assert.equal(JSON.stringify(compileDesign(hand).build), JSON.stringify(compileDesign(hand).build));
});

test("every element type compiles together into one valid model", () => {
  const c = compileDesign(spec([
    { type: "surface", id: "pool", name: "Pool", material: "water", rects: [{ x: 1, z: 12, w: 8, d: 3 }] },
    { type: "surface", id: "lawn", name: "Lawn", material: "lawn", rects: [{ x: 18, z: 12, w: 5, d: 3 }] },
    { type: "podium", id: "deck", name: "Deck", rect: { x: 1, z: 1, w: 10, d: 8 }, style: "colonnade" },
    { type: "block", id: "tower", name: "Tower", rect: { x: 3, z: 2, w: 6, d: 6 }, levels: 4, balconies: "all", serrate: true, facade: { S: "glass" }, roof: { type: "flat", finish: "tiles" } },
    { type: "block", id: "hall", name: "Hall", rect: { x: 13, z: 1, w: 8, d: 4 }, levels: 2, facade: "grille", roof: { type: "pitched" } },
    { type: "block", id: "pav", name: "Pavilion", rect: { x: 13, z: 7, w: 6, d: 4 }, levels: 1, groundFacade: { S: "arches" }, roof: { type: "rounded" } },
    { type: "glasshouse", id: "gh", name: "Glasshouse", rect: { x: 20, z: 6, w: 4, d: 4 } },
    { type: "walkway", id: "walk", name: "Walkway", rect: { x: 10, z: 11, w: 8, d: 1 }, levels: 1 },
    { type: "trees", id: "trees", name: "Trees", at: [[19, 13], [21, 13]] },
    { type: "parts", id: "bench", name: "Bench", items: [{ kind: "tile", w: 2, d: 1, x: 10, z: 13 }] },
  ]));
  assert.deepEqual(c.errors, []);
  assert.deepEqual(validateBuild(c.build), []);
});

test("shortage: a lake bigger than the set's trans-clear plates is reported by part", () => {
  const c = compileDesign(spec([{ type: "surface", id: "lake", name: "Lake", material: "water", rects: [{ x: 0, z: 0, w: 20, d: 10 }] }]));
  assert.equal(c.ok, false);
  assert.ok(has(c, /short of trans-clear plates/), c.errors.join("\n"));
});

test("shortage: more glass than the set holds names the part and the count", () => {
  const c = compileDesign(spec([{ type: "block", id: "glass", name: "Glass box", rect: { x: 2, z: 2, w: 12, d: 8 }, levels: 6, facade: "ribbon" }], { w: 20, d: 14 }));
  assert.equal(c.ok, false);
  assert.ok(has(c, /stock: needs \d+ × Trans-Clear Brick 1×2 \(3065\); the set has 40/), c.errors.join("\n"));
});

test("shortage: vaults beyond the 12 curved slopes are reported", () => {
  const c = compileDesign(spec([{ type: "block", id: "v", name: "Vaults", rect: { x: 0, z: 0, w: 18, d: 6 }, levels: 1, roof: { type: "vaults", rows: 6 } }], { w: 20, d: 10 }));
  assert.ok(has(c, /Curved Slope/), c.errors.join("\n"));
});

test("a malformed spec is refused before compiling, with field-level messages", () => {
  const c = compileDesign({ id: "Bad Id", title: "", site: { w: 100, d: 4 }, elements: [{ type: "block", id: "a", rect: { x: 0, z: 0, w: 4, d: 4 } }] });
  assert.equal(c.ok, false);
  assert.ok(has(c, /spec.id/) && has(c, /site.w and site.d/) && has(c, /name is required/) && has(c, /levels must be/), c.errors.join("\n"));
});

test("a building straddling two heights is refused", () => {
  const c = compileDesign(spec([
    { type: "surface", id: "pool", name: "Pool", material: "water", rects: [{ x: 0, z: 0, w: 4, d: 4 }] },
    { type: "block", id: "b", name: "Block", rect: { x: 2, z: 2, w: 6, d: 4 }, levels: 1 },
  ]));
  assert.ok(has(c, /uneven/), c.errors.join("\n"));
});

test("a walkway driven through a building says what is in the way", () => {
  const c = compileDesign(spec([
    { type: "block", id: "pav", name: "Pavilion", rect: { x: 13, z: 7, w: 6, d: 4 }, levels: 2 },
    { type: "walkway", id: "walk", name: "Walkway", rect: { x: 11, z: 10, w: 8, d: 1 }, levels: 1 },
  ]));
  assert.ok(has(c, /already taken by Pavilion|cannot stand a pier/), c.errors.join("\n"));
});

test("overlapping elements collide with a named culprit", () => {
  const c = compileDesign(spec([
    { type: "block", id: "a", name: "A", rect: { x: 2, z: 2, w: 6, d: 4 }, levels: 2 },
    { type: "trees", id: "t", name: "Tree", at: [[1, 1]] },
    { type: "block", id: "b", name: "B", rect: { x: 0, z: 0, w: 4, d: 4 }, levels: 1 },
  ]));
  assert.ok(has(c, /uneven|hits/), c.errors.join("\n"));
});

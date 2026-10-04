// Non-rectangular geometry from the first live review: triangular towers
// with serrated slabs and fin crowns, a fine vault rhythm, deck parapets.
// Each must be stock-honest, collision-free, connected, supported and
// buildable in order, and must render and print.
//
//   node --test tests/

import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { compileDesign } from "../src/design/compile.ts";
import { planCells, boundary } from "../src/design/footprint.ts";
import { validateBuild } from "../src/engine/validate.ts";
import { pieceSolids, PLATE } from "../scripts/lib/iso.mjs";

const fixture = (f) => JSON.parse(readFileSync(new URL(`./fixtures/${f}`, import.meta.url), "utf8"));
const spec = (elements, site = { w: 24, d: 20 }) => ({ id: "geometry-test", title: "T", subtitle: "s", description: "d", concept: "c", site, elements });
const pieces = (c) => c.phaseOrder.flatMap((id) => c.build[id].flat());
const has = (c, re) => c.errors.some((e) => re.test(e));

test("triangular plans are symmetric, stepped and turn cleanly", () => {
  for (const size of [4, 6, 8, 10, 12]) {
    const n = planCells("triangle", size, "N", 0, 0);
    const rows = new Map();
    for (const [x, z] of n) rows.set(z, [...(rows.get(z) ?? []), x]);
    for (const xs of rows.values()) assert.equal(Math.min(...xs) + Math.max(...xs), size - 1, `size ${size}: row not centred`);
    const widths = [...rows.keys()].sort((a, b) => a - b).map((z) => rows.get(z).length);
    assert.ok(widths.every((w, i) => i === 0 || w >= widths[i - 1]), `size ${size}: widths should grow from the apex`);
    assert.equal(widths.at(-1), size);
    for (const p of ["S", "E", "W"]) assert.equal(planCells("triangle", size, p, 0, 0).length, n.length);
  }
});

test("a triangular tower compiles clean: hollow walls, serrated slabs, fin crown", () => {
  const c = compileDesign(spec([{ type: "tower", id: "t", name: "Tower", at: [8, 6], plan: "triangle", size: 8, levels: 4, crown: "fins" }]));
  assert.deepEqual(c.errors, []);
  assert.deepEqual(validateBuild(c.build), []);
  const ps = pieces(c);
  // serration: alternate slabs project on different sides
  const slab = (l) => new Set(ps.filter((p) => p.info.description === "Tower balcony slab" && p.layer === l).flatMap((p) => {
    const out = [];
    for (let i = 0; i < p.w; i++) for (let j = 0; j < p.d; j++) out.push(`${p.x + i},${p.z + j}`);
    return out;
  }));
  const s1 = slab(4), s2 = slab(8);
  assert.ok(s1.size && s2.size && [...s1].some((k) => !s2.has(k)) && [...s2].some((k) => !s1.has(k)), "slabs should alternate");
  // the core is covered by every slab
  for (const [x, z] of planCells("triangle", 8, "N", 8, 6)) assert.ok(s1.has(`${x},${z}`) && s2.has(`${x},${z}`));
  assert.ok(ps.some((p) => p.info.description === "Tower crown fin"));
});

test("crown fins lean outward: the low face of every fin is on the slab edge", () => {
  const c = compileDesign(spec([{ type: "tower", id: "t", name: "Tower", at: [8, 6], plan: "triangle", size: 8, levels: 2, crown: "fins" }]));
  const fins = pieces(c).filter((p) => p.info.description === "Tower crown fin");
  assert.ok(fins.length >= 4);
  const centre = planCells("triangle", 8, "N", 8, 6).reduce((a, [x, z], _, all) => [a[0] + (x + 0.5) / all.length, a[1] + (z + 0.5) / all.length], [0, 0]);
  for (const f of fins) {
    // a slope falls toward its facing, so its facing must point away from the centre
    const mid = [f.x + f.w / 2, f.z + f.d / 2];
    const out = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }[f.facing];
    assert.ok((mid[0] - centre[0]) * out[0] + (mid[1] - centre[1]) * out[1] > 0, `fin at ${f.x},${f.z} faces ${f.facing}, toward the middle`);
  }
});

test("two courses per level halve the slabs for the same height", () => {
  const one = compileDesign(spec([{ type: "tower", id: "t", name: "Tower", at: [8, 6], plan: "square", size: 6, levels: 4 }]));
  const two = compileDesign(spec([{ type: "tower", id: "t", name: "Tower", at: [8, 6], plan: "square", size: 6, levels: 2, courses: 2 }]));
  assert.ok(one.ok && two.ok, [...one.errors, ...two.errors].join("\n"));
  const slabs = (c) => new Set(pieces(c).filter((p) => p.info.description.endsWith("balcony slab")).map((p) => p.layer)).size;
  assert.equal(slabs(one), 4);
  assert.equal(slabs(two), 2);
});

// A stepped plan tiles into the same blocks every course: on size 6 the rows
// are 6, 6, 4, 2, 2 wide, and nothing used to cross the joint between the
// third and fourth rows, so the apex stood as its own stack the full height
// of the tower. The validator checks connection, not stiffness, so it passed.
test("every level of a triangular tower lays a part across each joint between plan rows", () => {
  const across = (p, axis, r) => (axis === "x" ? p.x <= r && r + 1 <= p.x + p.w - 1 : p.z <= r && r + 1 <= p.z + p.d - 1);
  const check = (el, site) => {
    const c = compileDesign(spec([el], site));
    const what = `size ${el.size} pointing ${el.point}, ${el.courses} course(s)${el.lobby ? ", lobby" : ""}`;
    assert.deepEqual(c.errors, [], what);
    assert.ok(!c.warnings.some((w) => /less stiff/.test(w)), `${what}: ${c.warnings.join("; ")}`);
    const core = planCells("triangle", el.size, el.point, ...el.at);
    const rowAxis = el.point === "E" || el.point === "W" ? "x" : "z";
    const levelH = 3 * el.courses + 1;
    const ps = pieces(c).filter((p) => p.info.description.startsWith(`${el.name} `));
    for (let k = 0; k < el.levels; k++) {
      const level = ps.filter((p) => p.layer >= 1 + levelH * k && p.layer < 1 + levelH * (k + 1));
      // rows of the steps, as asked; columns too, which the slab sees to
      for (const axis of [rowAxis, rowAxis === "x" ? "z" : "x"]) {
        const lines = [...new Set(core.map(([x, z]) => (axis === "x" ? x : z)))].sort((a, b) => a - b);
        for (const r of lines.slice(0, -1))
          assert.ok(level.some((p) => across(p, axis, r)), `${what}: level ${k + 1} has no part across the joint between ${axis === rowAxis ? "rows" : "columns"} ${axis} = ${r} and ${r + 1}`);
      }
    }
  };
  for (const size of [4, 5, 6, 7, 8])
    for (const point of ["N", "S", "E", "W"])
      for (const courses of [1, 2]) check({ type: "tower", id: "t", name: "Tower", at: [8, 6], plan: "triangle", size, point, levels: 2, courses });
  // a glazed lobby takes the first course, so the second ties the level
  for (const point of ["N", "E"]) check({ type: "tower", id: "t", name: "Tower", at: [8, 6], plan: "triangle", size: 6, point, levels: 2, courses: 2, lobby: true });
  // the reported case: 14 levels, more than 90 layers of bricks and plates
  check({ type: "tower", id: "t", name: "Tower", at: [1, 1], plan: "triangle", size: 6, point: "S", levels: 14, courses: 2 }, { w: 12, d: 12 });
});

test("towers that are too tall for the set say which parts run out", () => {
  const c = compileDesign(spec([
    { type: "tower", id: "a", name: "A", at: [1, 1], plan: "triangle", size: 10, levels: 30 },
    { type: "tower", id: "b", name: "B", at: [12, 1], plan: "triangle", size: 10, levels: 30 },
  ]));
  assert.equal(c.ok, false);
  assert.ok(has(c, /stock: needs|ran out of plates|small plates are used up/), c.errors.join("\n"));
});

test("overlapping or off-site towers are refused with a reason", () => {
  const clash = compileDesign(spec([
    { type: "tower", id: "a", name: "A", at: [4, 4], plan: "square", size: 6, levels: 2 },
    { type: "tower", id: "b", name: "B", at: [7, 4], plan: "square", size: 6, levels: 2 },
  ]));
  assert.ok(has(clash, /hits|uneven|already taken/), clash.errors.join("\n"));
  const off = compileDesign(spec([{ type: "tower", id: "a", name: "A", at: [20, 4], plan: "triangle", size: 8, levels: 2 }]));
  assert.ok(has(off, /runs off the site/), off.errors.join("\n"));
});

test("scallops: one hump every 2 studs, leaning outward from the middle, within stock", () => {
  const c = compileDesign(spec([{ type: "block", id: "b", name: "Terrace", rect: { x: 2, z: 4, w: 16, d: 4 }, levels: 1, roof: { type: "scallops" } }]));
  assert.deepEqual(c.errors, []);
  const sc = pieces(c).filter((p) => p.info.description === "Terrace scallop").sort((a, b) => a.x - b.x);
  assert.equal(sc.length, 8);
  assert.ok(sc.slice(0, 4).every((p) => p.facing === "W") && sc.slice(4).every((p) => p.facing === "E"));
  const over = compileDesign(spec([{ type: "block", id: "b", name: "Terrace", rect: { x: 0, z: 4, w: 24, d: 4 }, levels: 1, roof: { type: "scallops", edges: "both" } }]));
  assert.ok(has(over, /stock: needs 24 × Curved Top Brick/), over.errors.join("\n"));
});

test("parapet panels stand on the deck edge with their walls facing out", () => {
  const rect = { x: 2, z: 2, w: 14, d: 10 };
  const c = compileDesign(spec([{ type: "podium", id: "p", name: "Deck", rect, parapet: true }]));
  assert.deepEqual(c.errors, []);
  assert.deepEqual(validateBuild(c.build), []);
  const panels = pieces(c).filter((p) => p.info.description === "Deck parapet");
  assert.ok(panels.length >= 6);
  for (const p of panels) {
    const wall = pieceSolids(p)[1].flat(); // [x, z, y] points of the thin wall
    const xs = wall.map((q) => p.x + q[0]), zs = wall.map((q) => p.z + q[1]);
    const touches = { N: Math.min(...zs) === rect.z, S: Math.max(...zs) === rect.z + rect.d, E: Math.max(...xs) === rect.x + rect.w, W: Math.min(...xs) === rect.x };
    if (p.kind === "panel" && p.w * p.d > 1) assert.ok(touches[p.facing], `panel at ${p.x},${p.z} facing ${p.facing} is not on the outer edge`);
  }
});

test("the review-led Barbican fixture compiles clean and stays buildable in order", () => {
  const c = compileDesign(fixture("barbican-critique.json"));
  assert.deepEqual(c.errors, []);
  assert.deepEqual(validateBuild(c.build), []);
  const towerTops = ["Cromwell", "Shakespeare", "Lauderdale"].map((n) =>
    Math.max(...pieces(c).filter((p) => p.info.description.startsWith(`${n} Tower`) && !p.info.description.endsWith("crown fin")).map((p) => p.layer + p.h)));
  assert.equal(new Set(towerTops).size, 1, `tower heights differ: ${towerTops}`);
});

test("the live run's reviewed spec still compiles clean (regression)", () => {
  const c = compileDesign(fixture("live-run-2026-10-01/submitted-spec.json"));
  assert.deepEqual(c.errors, []);
  const review = fixture("live-run-2026-10-01/review-1.json");
  assert.match(review.guess, /Barbican/);
});

test("a spec booklet prints every new recipe", () => {
  const log = execFileSync(process.execPath, ["scripts/generate-manual.mjs", "--spec", "tests/fixtures/barbican-critique.json"], { cwd: new URL("..", import.meta.url) }).toString();
  const pages = Number(log.match(/pages\s+(\d+)/)[1]);
  assert.ok(pages >= 40, `only ${pages} pages`);
  const html = readFileSync(new URL("../manual/barbican-critique-manual.html", import.meta.url), "utf8");
  for (const title of ["Cromwell Tower: crown", "Gilbert House: scalloped roof", "Podium: parapet", "Shakespeare Tower: level 2 balcony slab"])
    assert.ok(html.includes(title), `booklet lacks "${title}"`);
  void PLATE;
  void boundary;
});

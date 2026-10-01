// Validator regression tests: each case is a defect found in a real build
// (see REVIEW.md). If the validator ever stops catching one, a test fails.
//
//   node --test tests/

import test from "node:test";
import assert from "node:assert/strict";
import { Builder, validateBuild } from "../src/lego-model.ts";

/** Build a tiny model: a 6×6 plate on the table, then whatever `body` adds. */
function model(body) {
  const b = new Builder();
  b.phase("t");
  b.step("base");
  b.put("plate", 6, 6, 0, 0, 0, "white", "base");
  body(b);
  return validateBuild(b.build);
}
const has = (errs, kind) => errs.some((e) => e.startsWith(kind));

test("clean baseline: a brick on a plate", () => {
  assert.deepEqual(model((b) => { b.step("s"); b.put("brick", 2, 4, 0, 0, 1, "white", "x"); }), []);
});

test("Panorama crown: 1×2 slopes laid 2×1 facing N/S are misoriented", () => {
  const errs = model((b) => {
    b.step("s");
    b.put("brick", 2, 2, 0, 0, 1, "white", "core");
    b.step("s");
    b.put("slope45", 2, 1, 0, 0, 4, "white", "ridge", "N");
  });
  assert.ok(has(errs, "MISORIENTED"), errs.join("\n"));
});

test("Panorama vault: a 6091 placed 1×2 facing E is misoriented", () => {
  const errs = model((b) => { b.step("s"); b.put("curvedTop", 1, 2, 0, 0, 1, "white", "vault", "E"); });
  assert.ok(has(errs, "MISORIENTED"), errs.join("\n"));
});

test("Panorama highwalk: a plate on a studless panel floats", () => {
  const errs = model((b) => {
    b.step("s");
    b.put("panel", 4, 1, 0, 0, 1, "white", "parapet", "S");
    b.step("s");
    b.put("plate", 4, 1, 0, 0, 4, "white", "walk");
  });
  assert.ok(has(errs, "FLOATING"), errs.join("\n"));
});

test("Frobisher decking: a tile in front of a side-stud host blocks the clip-on tile", () => {
  const errs = model((b) => {
    b.step("s");
    b.put("tile", 1, 1, 2, 3, 1, "white", "deck");
    b.put("headlight", 1, 1, 2, 2, 1, "white", "pier", "S");
    b.step("s");
    b.putAttached("tile", 2, 2, 2, "white", "panel", "S");
  });
  assert.ok(has(errs, "ATTACHMENT BLOCKED"), errs.join("\n"));
});

test("a clip-on tile keyed to the wrong plate of its host is caught", () => {
  const errs = model((b) => {
    b.step("s");
    b.put("headlight", 1, 1, 2, 2, 1, "white", "pier", "S");
    b.step("s");
    b.putAttached("tile", 2, 2, 1, "white", "panel", "S");
  });
  assert.ok(has(errs, "SIDE STUD HEIGHT"), errs.join("\n"));
});

test("a clip-on tile over bare studs is fine (it clears them by design)", () => {
  const errs = model((b) => {
    b.step("s");
    b.put("headlight", 1, 1, 2, 2, 1, "white", "pier", "S");
    b.step("s");
    b.putAttached("tile", 2, 2, 2, "white", "panel", "S");
  });
  assert.deepEqual(errs, []);
});

test("Frobisher plaza: a macaroni brick overlapping a plate collides", () => {
  const errs = model((b) => {
    b.step("s");
    b.put("plate", 2, 2, 1, 1, 1, "white", "tie");
    b.put("macaroni", 2, 2, 0, 0, 1, "white", "corner", "S");
  });
  assert.ok(has(errs, "COLLISION"), errs.join("\n"));
});

test("London Wall: wedge bricks laid 4×2 facing S are misoriented", () => {
  const errs = model((b) => { b.step("s"); b.put("wedgeL", 4, 2, 0, 0, 1, "green", "lawn", "S"); });
  assert.ok(has(errs, "MISORIENTED"), errs.join("\n"));
});

test("London Wall: separate base pads with nothing across the joint fall apart", () => {
  const b = new Builder();
  b.phase("t");
  b.step("s");
  b.put("plate", 4, 4, 0, 0, 0, "white", "a");
  b.put("plate", 4, 4, 4, 0, 0, "white", "b");
  assert.ok(has(validateBuild(b.build), "LOOSE PARTS"));
});

test("an arch stands on its legs only", () => {
  const errs = model((b) => {
    b.step("s");
    b.put("brick", 1, 1, 1, 0, 1, "white", "middle prop");
    b.step("s");
    b.put("arch", 4, 1, 0, 0, 4, "white", "arch");
  });
  assert.ok(has(errs, "FLOATING"), errs.join("\n"));
});

test("a piece slid in under one already placed is caught", () => {
  const errs = model((b) => {
    b.step("s");
    b.put("brick", 2, 2, 0, 0, 1, "white", "a");
    b.put("plate", 4, 2, 0, 0, 4, "white", "deck");
    b.step("s");
    b.put("brick", 2, 2, 2, 0, 1, "white", "late");
  });
  assert.ok(has(errs, "NOT REACHABLE") || has(errs, "PLACED BEFORE"), errs.join("\n"));
});

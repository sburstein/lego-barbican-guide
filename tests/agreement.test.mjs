// Renderer and validator agreement. The validator, the 3D viewer and the
// print manual each place parts; these tests prove they place every part of
// every build the same way, so what a builder sees is what was checked.
//
//   node --test tests/

import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { BUILD_IDS, modelFor } from "../src/build-models.ts";
import { canonicalToLocal, defOf, footprintCells, validateBuild } from "../src/lego-model.ts";
import { partSolids, topHeightAt } from "../src/engine/shapes.ts";
import { buildPiece } from "../src/lego-geometry.ts";
import { pieceSolids, turnPieces, PLATE } from "../scripts/lib/iso.mjs";

const pieces = (id) => Object.values(modelFor(id)).flatMap((ph) => ph.flat());
const label = (p) => `${p.info.name} @ ${p.x},${p.z},L${p.layer} facing ${p.facing}`;

for (const id of BUILD_IDS) {
  test(`${id}: validates with no errors`, () => {
    assert.deepEqual(validateBuild(modelFor(id)), []);
  });

  test(`${id}: stays valid when turned a quarter, half and three-quarter turn`, () => {
    for (const q of [1, 2, 3]) {
      const turned = {};
      for (const [ph, steps] of Object.entries(modelFor(id))) turned[ph] = steps.map((st) => turnPieces(st, q));
      assert.deepEqual(validateBuild(turned), [], `turn ${q}`);
    }
  });

  test(`${id}: 3D viewer heights match the shape table under the validator's rotation`, () => {
    const ray = new THREE.Raycaster();
    const down = new THREE.Vector3(0, -1, 0);
    let checked = 0;
    for (const p of pieces(id)) {
      if (p.attach) continue;
      const d = defOf(p);
      const solids = partSolids(p.kind, d);
      const g = buildPiece(p);
      g.updateMatrixWorld(true);
      const bodies = [];
      g.traverse((o) => { if (o.userData?.body) bodies.push(o); });
      for (let i = 0; i < d.W; i++) for (let j = 0; j < d.D; j++) {
        const [lx, lz] = canonicalToLocal(p, i + 0.5, j + 0.5, d);
        const want = topHeightAt(solids, i + 0.5, j + 0.5);
        ray.set(new THREE.Vector3(p.x + lx, 1000, p.z + lz), down);
        const hit = ray.intersectObjects(bodies, false)[0];
        const got = hit ? (hit.point.y / PLATE) - p.layer : -1;
        if (want < 0) assert.ok(!hit || got < 0.2, `${label(p)}: expected a gap over canonical cell ${i},${j}, 3D has ${got.toFixed(2)} plates`);
        else assert.ok(Math.abs(got - want) < 0.15, `${label(p)}: canonical cell ${i},${j} should be ${want.toFixed(2)} plates high, 3D has ${got.toFixed(2)}`);
        checked++;
      }
    }
    assert.ok(checked > 50);
  });

  test(`${id}: 3D viewer and print manual agree on every part's bounds`, () => {
    for (const p of pieces(id)) {
      const g = buildPiece(p);
      g.updateMatrixWorld(true);
      const box = new THREE.Box3();
      g.traverse((o) => { if (o.userData?.body) box.expandByObject(o); });
      const iso = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
      for (const faces of pieceSolids(p)) for (const f of faces) for (const [x, z, y] of f) {
        const v = [p.x + x, p.layer * PLATE + y, p.z + z];
        for (let k = 0; k < 3; k++) { iso.min[k] = Math.min(iso.min[k], v[k]); iso.max[k] = Math.max(iso.max[k], v[k]); }
      }
      const tol = 0.08; // the 3D seam inset is 0.03 a side
      for (let k = 0; k < 3; k++) {
        assert.ok(Math.abs(box.min.getComponent(k) - iso.min[k]) < tol && Math.abs(box.max.getComponent(k) - iso.max[k]) < tol,
          `${label(p)}${p.attach ? " (attached)" : ""}: axis ${"xyz"[k]} 3D ${box.min.getComponent(k).toFixed(2)}..${box.max.getComponent(k).toFixed(2)} vs manual ${iso.min[k].toFixed(2)}..${iso.max[k].toFixed(2)}`);
      }
      if (!p.attach) {
        // and both stay inside the cells the validator says the part fills
        const cells = footprintCells(p);
        const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
        assert.ok(iso.min[0] >= Math.min(...xs) - 1e-6 && iso.max[0] <= Math.max(...xs) + 1 + 1e-6 &&
          iso.min[2] >= Math.min(...zs) - 1e-6 && iso.max[2] <= Math.max(...zs) + 1 + 1e-6, `${label(p)}: drawn outside its footprint`);
      }
    }
  });
}

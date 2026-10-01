import * as THREE from "three";
import {
  defOf,
  facingOf,
  validateBuild,
  FACE_DIR,
  type PartDef,
  type Placement,
  type ColorKey,
  type Facing,
  type PieceInfo,
} from "./lego-model.ts";
import { partSolids, type Pt3 } from "./engine/shapes.ts";
import { BUILD_IDS, modelFor, phaseOrderFor } from "./build-models.ts";

export type { PieceInfo } from "./lego-model.ts";

// ═══════════════════════════════════════════════════════════════════════
// LEGO RENDERER — Barbican Estate Lakeside Panorama
// Renders the validated placement model from lego-model.ts.
// Units: 1 stud = 1 unit. Plate height 0.4. Brick height 1.2.
// Real proportions: stud Ø 0.6 (4.8mm), stud height 0.22 (1.8mm),
// seam 0.03 per side (real bricks have ~0.1mm clearance).
// ═══════════════════════════════════════════════════════════════════════

const LAYER_H = 0.4;
const STUD_R = 0.3;
const STUD_H = 0.22;
const SEAM = 0.03; // per-side inset so adjacent pieces read as separate bricks

// ─── Materials ─────────────────────────────────────────────────────────

function bodyMat(color: number, roughness = 0.4): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.0 });
}

const MATS: Record<ColorKey, { body: THREE.MeshStandardMaterial; stud: THREE.MeshStandardMaterial }> = {
  white: { body: bodyMat(0xf4f4ee), stud: bodyMat(0xf4f4ee, 0.25) },
  dark: { body: bodyMat(0xb9b9b1), stud: bodyMat(0xb9b9b1, 0.25) },
  green: { body: bodyMat(0x79b06f), stud: bodyMat(0x79b06f, 0.25) },
  trans: {
    body: new THREE.MeshStandardMaterial({
      color: 0xbcd8ee, roughness: 0.05, metalness: 0.05, transparent: true, opacity: 0.55,
    }),
    stud: new THREE.MeshStandardMaterial({
      color: 0xbcd8ee, roughness: 0.05, metalness: 0.05, transparent: true, opacity: 0.55,
    }),
  },
};

export const HIGHLIGHT_MAT = new THREE.MeshStandardMaterial({
  color: 0xfbbf24,
  roughness: 0.3,
  metalness: 0.0,
  emissive: 0xfbbf24,
  emissiveIntensity: 0.15,
});

// Active-step materials (LEGO instruction coral)
const ACTIVE_BODY = bodyMat(0xf0a0a0, 0.35);
const ACTIVE_STUD = bodyMat(0xe89090, 0.2);
const ACTIVE_TRANS = new THREE.MeshStandardMaterial({
  color: 0xf0b0b0, roughness: 0.1, metalness: 0.05, transparent: true, opacity: 0.55,
});

const ACTIVE_OF = new Map<THREE.Material, THREE.Material>();
for (const c of Object.keys(MATS) as ColorKey[]) {
  ACTIVE_OF.set(MATS[c].body, c === "trans" ? ACTIVE_TRANS : ACTIVE_BODY);
  ACTIVE_OF.set(MATS[c].stud, c === "trans" ? ACTIVE_TRANS : ACTIVE_STUD);
}

const RED_EDGE_MAT = new THREE.LineBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.6 });
const EDGE_LINE_MAT = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.1 });

// ─── Shared geometry ───────────────────────────────────────────────────

const STUD_GEO = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 20);

// Geometry caches: pieces of the same part reuse one geometry, and each
// cached geometry gets one cached EdgesGeometry. The viewer must NOT
// dispose these (they are shared across rebuilds).
const GEO_CACHE = new Map<string, THREE.BufferGeometry>();
const EDGE_CACHE = new Map<THREE.BufferGeometry, THREE.EdgesGeometry>();

function cachedGeo(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = GEO_CACHE.get(key);
  if (!g) {
    g = make();
    GEO_CACHE.set(key, g);
  }
  return g;
}

function cachedEdges(geo: THREE.BufferGeometry): THREE.EdgesGeometry {
  let e = EDGE_CACHE.get(geo);
  if (!e) {
    e = new THREE.EdgesGeometry(geo, 30);
    EDGE_CACHE.set(geo, e);
  }
  return e;
}

/**
 * Yaw that turns a part's canonical frame (front = +z) to its facing. This
 * is the same rotation the validator applies to cells (engine/model.ts
 * placeCell), so what you see is what was checked.
 */
function dirYaw(f: Facing): number {
  switch (f) {
    case "S": return 0;
    case "N": return Math.PI;
    case "E": return Math.PI / 2;
    case "W": return -Math.PI / 2;
  }
}

// ─── Piece mesh factory ────────────────────────────────────────────────

function addEdges(group: THREE.Object3D, geo: THREE.BufferGeometry, mesh: THREE.Mesh) {
  const lines = new THREE.LineSegments(cachedEdges(geo), EDGE_LINE_MAT);
  lines.position.copy(mesh.position);
  lines.rotation.copy(mesh.rotation);
  group.add(lines);
}

function addMesh(
  group: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  info: PieceInfo,
  y = 0,
  edges = true
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  (mesh as any).pieceInfo = info;
  group.add(mesh);
  if (edges) addEdges(group, geo, mesh);
  return mesh;
}

/**
 * Body geometry for a part, from the shared shape table (engine/shapes.ts),
 * in the canonical frame centred on the part: x = u - W/2, z = v - D/2,
 * y up in world units. A small seam inset keeps neighbours visibly apart.
 * Each convex face is wound outward so front-face culling works.
 */
function bodyGeometry(p: Placement, def: PartDef): { geo: THREE.BufferGeometry; smooth: boolean }[] {
  const W = def.W, D = def.D;
  const sx = (W - 2 * SEAM) / W, sz = (D - 2 * SEAM) / D;
  const toXYZ = ([u, v, y]: Pt3): [number, number, number] => [(u - W / 2) * sx, y * LAYER_H, (v - D / 2) * sz];
  return partSolids(p.kind, def).map((solid, idx) => {
    const key = `${p.kind}:${W}x${D}x${def.h}#${idx}`;
    if (solid.type === "cylinder") {
      const r = solid.r - SEAM;
      const h = (solid.y1 - solid.y0) * LAYER_H;
      return {
        smooth: true,
        geo: cachedGeo(key, () => {
          const g = new THREE.CylinderGeometry(r, r, h, 28);
          g.translate((solid.u - W / 2) * sx, solid.y0 * LAYER_H + h / 2, (solid.v - D / 2) * sz);
          return g;
        }),
      };
    }
    return {
      smooth: solid.faces.length > 12, // curved strips: skip the edge lines
      geo: cachedGeo(key, () => {
        const faces = solid.faces.map((f) => f.map(toXYZ));
        const c = [0, 0, 0];
        let n = 0;
        for (const f of faces) for (const q of f) { c[0] += q[0]; c[1] += q[1]; c[2] += q[2]; n++; }
        c[0] /= n; c[1] /= n; c[2] /= n;
        const pos: number[] = [];
        for (let f of faces) {
          const [a, b, d] = f;
          const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
          const e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
          const nx = e1[1] * e2[2] - e1[2] * e2[1];
          const ny = e1[2] * e2[0] - e1[0] * e2[2];
          const nz = e1[0] * e2[1] - e1[1] * e2[0];
          const fc = f.reduce((acc, q) => [acc[0] + q[0] / f.length, acc[1] + q[1] / f.length, acc[2] + q[2] / f.length], [0, 0, 0]);
          if (nx * (fc[0] - c[0]) + ny * (fc[1] - c[1]) + nz * (fc[2] - c[2]) < 0) f = [...f].reverse();
          for (let i = 1; i + 1 < f.length; i++) pos.push(...f[0], ...f[i], ...f[i + 1]);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        g.computeVertexNormals();
        return g;
      }),
    };
  });
}

/** Build one placement as a THREE.Group positioned in world space. */
export function buildPiece(p: Placement): THREE.Group {
  const outer = new THREE.Group();
  const g = new THREE.Group(); // canonical frame, rotated to the facing
  outer.add(g);
  const { body, stud } = MATS[p.color];
  const def = defOf(p);
  const H = p.h * LAYER_H;
  const cx = p.x + p.w / 2;
  const cz = p.z + p.d / 2;
  if (!def) return outer;
  const W = def.W, D = def.D;
  const facing = facingOf(p);

  for (const { geo, smooth } of bodyGeometry(p, def)) {
    addMesh(g, geo, body, p.info, 0, !smooth).userData.body = true; // tests tell bodies from studs
  }

  // Surface detail that sells the part
  if (p.kind === "grilleTile") {
    const barGeo = cachedGeo(`gbar:${D}`, () => new THREE.BoxGeometry(0.12, 0.06, D - SEAM * 4));
    for (let i = 0; i < W * 3; i++) {
      const bar = new THREE.Mesh(barGeo, stud);
      bar.position.set(-W / 2 + (i + 0.5) * (W / (W * 3)), H + 0.03, 0);
      (bar as any).pieceInfo = p.info;
      g.add(bar);
    }
  }
  if (p.kind === "profile") {
    const ribGeo = cachedGeo(`rib:${W}`, () => new THREE.BoxGeometry(W - SEAM * 2, 0.12, 0.06));
    for (let i = 0; i < 4; i++) {
      const rib = new THREE.Mesh(ribGeo, body);
      rib.position.set(0, 0.15 + i * 0.29, D / 2 - SEAM + 0.03);
      (rib as any).pieceInfo = p.info;
      g.add(rib);
    }
  }

  // Side studs (SNOT hosts), from the part table
  const sideGeo = cachedGeo("sidestud", () => new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 16));
  const recessGeo = cachedGeo("hlstud", () => new THREE.CylinderGeometry(0.18, 0.18, 0.08, 14));
  for (const s of def.sideStuds) {
    const [i, j] = s.cell;
    const [dx, dz] = s.dir;
    const cxl = i + 0.5 - W / 2, czl = j + 0.5 - D / 2;
    const recessed = p.kind === "headlight";
    const m = new THREE.Mesh(recessed ? recessGeo : sideGeo, stud);
    const out = recessed ? 0.5 - SEAM : 0.5 + STUD_H / 2 - SEAM;
    m.position.set(cxl + dx * out, H / 2, czl + dz * out);
    m.rotation.set(Math.PI / 2, Math.atan2(dx, dz), 0, "YXZ");
    (m as any).pieceInfo = p.info;
    g.add(m);
  }

  // Top studs, from the part table (canonical cells)
  for (const [i, j] of def.top) {
    const s = new THREE.Mesh(STUD_GEO, stud);
    s.position.set(i + 0.5 - W / 2, H + STUD_H / 2, j + 0.5 - D / 2);
    s.castShadow = true;
    (s as any).pieceInfo = p.info;
    g.add(s);
  }
  if (p.kind === "jumper") {
    // single centre stud, half a stud off the grid
    const s = new THREE.Mesh(STUD_GEO, stud);
    s.position.set(0, H + STUD_H / 2, 0);
    (s as any).pieceInfo = p.info;
    g.add(s);
  }

  g.rotation.y = dirYaw(facing);

  if (p.attach) {
    // SNOT: stand the piece on edge against the host brick's side stud.
    // Rotating maps its local +y (the piece's "up") onto the facing
    // direction, so the flat face ends up parallel to the wall.
    const [dx, dz] = FACE_DIR[p.facing];
    g.rotation.set(0, 0, 0);
    outer.rotation.set(Math.PI / 2, dirYaw(p.facing), 0, "YXZ");
    // The attach layer is the host's middle plate; a side stud sits 10 LDU
    // below the host's top, i.e. 0.75 plates above the attach layer.
    outer.position.set(cx + dx * 0.5, (p.layer + 0.75) * LAYER_H, cz + dz * 0.5);
  } else {
    outer.position.set(cx, p.layer * LAYER_H, cz);
  }
  return outer;
}

// ─── Active step highlight ─────────────────────────────────────────────

export function applyActiveStepStyle(group: THREE.Group): void {
  const meshes: THREE.Mesh[] = [];
  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh && (obj as THREE.Mesh).geometry) meshes.push(obj as THREE.Mesh);
  });
  for (const mesh of meshes) {
    (mesh as any)._originalMaterial = mesh.material;
    const active = ACTIVE_OF.get(mesh.material as THREE.Material);
    if (active) mesh.material = active;
    const lines = new THREE.LineSegments(cachedEdges(mesh.geometry), RED_EDGE_MAT);
    lines.position.copy(mesh.position);
    lines.rotation.copy(mesh.rotation);
    lines.scale.copy(mesh.scale);
    (lines as any)._isActiveEdge = true;
    mesh.parent?.add(lines);
  }
}

// ─── Progressive model builder ─────────────────────────────────────────

// Dev-time physical validation: warn loudly if a model ever regresses.
if (import.meta.env?.DEV) {
  for (const id of BUILD_IDS) {
    const errs = validateBuild(modelFor(id));
    if (errs.length) {
      console.warn(`[lego-model] ${id}: ${errs.length} physical violations:`);
      for (const e of errs.slice(0, 20)) console.warn("  " + e);
    }
  }
}

export function buildPhaseModel(
  phaseId: string,
  completedSteps: Set<string>,
  buildId: string = "barbican-panorama",
  stepIndex?: number
): THREE.Group {
  const model = new THREE.Group();
  const build = modelFor(buildId);
  const order = phaseOrderFor(buildId);
  const currentIdx = order.indexOf(phaseId);

  const phaseStatus = (pid: string): "current" | "past" | "future" => {
    if (pid === phaseId) return "current";
    return order.indexOf(pid) < currentIdx ? "past" : "future";
  };

  const isPhaseFullyCompleted = (pid: string): boolean => {
    const steps = build[pid];
    if (!steps || steps.length === 0) return false;
    for (let i = 0; i < steps.length; i++) {
      if (!completedSteps.has(`${pid}-${i}`)) return false;
    }
    return true;
  };

  const effectiveStepIndex = stepIndex ?? Infinity;
  let activeStepGroup: THREE.Group | null = null;

  for (const pid of order) {
    const status = phaseStatus(pid);
    const fullyCompleted = isPhaseFullyCompleted(pid);
    if (status === "future" && !fullyCompleted) {
      // future phases appear only for steps individually completed
      const anyDone = build[pid].some((_, i) => completedSteps.has(`${pid}-${i}`));
      if (!anyDone) continue;
    }

    const pg = new THREE.Group();
    pg.userData.phaseId = pid;
    model.add(pg);

    build[pid].forEach((step, si) => {
      const sg = new THREE.Group();
      sg.userData.stepIndex = si;
      sg.userData.phaseId = pid;
      for (const placement of step) sg.add(buildPiece(placement));
      pg.add(sg);

      if (status === "current") {
        sg.visible = effectiveStepIndex >= 0 && si <= effectiveStepIndex;
      } else if (status === "past" || fullyCompleted) {
        sg.visible = true;
      } else {
        sg.visible = completedSteps.has(`${pid}-${si}`);
      }
    });

    if (status === "current") {
      let maxVisible = -1;
      pg.children.forEach((child) => {
        const sg = child as THREE.Group;
        if (sg.visible && (sg.userData.stepIndex as number) > maxVisible) {
          maxVisible = sg.userData.stepIndex as number;
        }
      });
      pg.children.forEach((child) => {
        const sg = child as THREE.Group;
        if (sg.userData.stepIndex === maxVisible && sg.visible) {
          activeStepGroup = sg;
          applyActiveStepStyle(sg);
        }
      });
    }
  }

  (model as any)._activeStepGroup = activeStepGroup;
  return model;
}

import * as THREE from "three";
import {
  validateBuild,
  studCells,
  footprintCells,
  type Placement,
  type ColorKey,
  type Facing,
  type PieceInfo,
} from "./lego-model";
import { BUILD_IDS, modelFor, phaseOrderFor } from "./build-models.ts";

export type { PieceInfo } from "./lego-model";

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

// Geometry caches — pieces of the same part reuse one geometry, and each
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

function yawOf(f: Facing): number {
  switch (f) {
    case "S": return 0;
    case "N": return Math.PI;
    case "E": return -Math.PI / 2;
    case "W": return Math.PI / 2;
  }
}

/** Unit vector of a facing in model coordinates (matches the validator). */
const FACE_DIR: Record<Facing, [number, number]> = {
  N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0],
};

/** Yaw that swings local +z onto FACE_DIR[f]. */
function dirYaw(f: Facing): number {
  switch (f) {
    case "S": return 0;
    case "N": return Math.PI;
    case "E": return Math.PI / 2;
    case "W": return -Math.PI / 2;
  }
}

/** Extrude a 2D profile (depth-axis = shape X, height = shape Y) across a width. */
function prism(points: [number, number][], width: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
  // Shape X = depth (z), extrusion = width (x)
  geo.rotateY(-Math.PI / 2); // extrusion axis → -x, shape X → +z
  geo.translate(width / 2, 0, 0);
  return geo;
}

/** Curved-top brick profile: half-cylinder across the piece width. */
function curvedTopProfile(width: number, h: number): [number, number][] {
  const half = width / 2 - SEAM;
  const r = half;
  const base = h - r;
  const pts: [number, number][] = [[-half, 0], [-half, base]];
  const steps = 12;
  for (let i = 1; i < steps; i++) {
    const a = Math.PI - (i / steps) * Math.PI;
    pts.push([Math.cos(a) * r, base + Math.sin(a) * r]);
  }
  pts.push([half, base], [half, 0]);
  return pts;
}

// ─── Piece mesh factory ────────────────────────────────────────────────

/** Tag an object with the part it belongs to, for click-to-identify. */
function tag<T extends THREE.Object3D>(obj: T, info: PieceInfo): T {
  (obj as T & { pieceInfo?: PieceInfo }).pieceInfo = info;
  return obj;
}

function addEdges(group: THREE.Group, geo: THREE.BufferGeometry, mesh: THREE.Mesh) {
  const lines = new THREE.LineSegments(cachedEdges(geo), EDGE_LINE_MAT);
  lines.position.copy(mesh.position);
  lines.rotation.copy(mesh.rotation);
  group.add(lines);
}

function addMesh(
  group: THREE.Group,
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

/** Build one placement as a THREE.Group positioned in world space. */
function buildPiece(p: Placement): THREE.Group {
  const g = new THREE.Group();
  const { body, stud } = MATS[p.color];
  const H = p.h * LAYER_H;
  const cx = p.x + p.w / 2;
  const cz = p.z + p.d / 2;
  const yaw = yawOf(p.facing);
  // For rotated asymmetric parts, build with swapped dims then rotate.
  const swap = p.facing === "E" || p.facing === "W";
  const bw = (swap ? p.d : p.w) - SEAM * 2;
  const bd = (swap ? p.w : p.d) - SEAM * 2;
  const pw = swap ? p.d : p.w;
  const pd = swap ? p.w : p.d;

  switch (p.kind) {
    case "brick":
    case "plate":
    case "tile": {
      const geo = cachedGeo(`box:${p.w}x${H}x${p.d}`, () =>
        new THREE.BoxGeometry(p.w - SEAM * 2, H, p.d - SEAM * 2));
      addMesh(g, geo, body, p.info, H / 2);
      break;
    }
    case "grilleTile": {
      const geo = cachedGeo(`gtile:${p.w}x${p.d}`, () =>
        new THREE.BoxGeometry(p.w - SEAM * 2, 0.24, p.d - SEAM * 2));
      addMesh(g, geo, body, p.info, 0.12);
      const barGeo = cachedGeo(`gbar:${p.d}`, () =>
        new THREE.BoxGeometry(0.22, 0.16, p.d - SEAM * 2));
      const n = p.w * 2;
      for (let i = 0; i < n; i++) {
        const bar = new THREE.Mesh(barGeo, body);
        bar.position.set(-p.w / 2 + (i + 0.5) * (p.w / n), 0.32, 0);
        bar.castShadow = true;
        (bar as any).pieceInfo = p.info;
        g.add(bar);
      }
      break;
    }
    case "cornerPlate":
    case "cornerBrick":
    case "roundCornerPlate": {
      // Cell-by-cell body for the L-shaped and quarter-disc plates
      const cellGeo = cachedGeo(`cornercell:${H}`, () => new THREE.BoxGeometry(0.97, H, 0.97));
      for (const [cx2, cz2] of footprintCells(p)) {
        const m = new THREE.Mesh(cellGeo, body);
        m.position.set(cx2 + 0.5 - cx, H / 2, cz2 + 0.5 - cz);
        m.castShadow = true;
        m.receiveShadow = true;
        g.add(tag(m, p.info));
      }
      break;
    }
    case "macaroni": {
      // Quarter-arc brick: a ring segment swept about the missing inner corner
      const geo = cachedGeo(`macaroni:${H}`, () => {
        const shape = new THREE.Shape();
        shape.absarc(0, 0, 2, 0, Math.PI / 2, false);
        shape.absarc(0, 0, 1, Math.PI / 2, 0, true);
        shape.closePath();
        const eg = new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: false });
        eg.rotateX(-Math.PI / 2); // extrude along +y
        return eg;
      });
      const m = addMesh(g, geo, body, p.info, 0, false);
      // Place the arc's origin at the missing inner corner of the 2×2 cell
      const [mx, mz] = (() => {
        switch (p.facing) {
          case "S": return [p.x + 2, p.z + 2];
          case "W": return [p.x, p.z + 2];
          case "N": return [p.x, p.z];
          case "E": return [p.x + 2, p.z];
        }
      })();
      m.position.set(mx - cx, 0, mz - cz);
      m.rotation.y =
        p.facing === "S" ? Math.PI : p.facing === "W" ? Math.PI / 2 :
        p.facing === "N" ? 0 : -Math.PI / 2;
      break;
    }
    case "jumper": {
      const geo = cachedGeo(`jumper:${bw}x${bd}`, () => new THREE.BoxGeometry(bw, H, bd));
      const m = addMesh(g, geo, body, p.info, H / 2);
      m.rotation.y = yaw;
      // single centre stud, off the grid by half a stud
      const centre = new THREE.Mesh(STUD_GEO, stud);
      centre.position.y = H + STUD_H / 2;
      g.add(tag(centre, p.info));
      break;
    }
    case "sideStud2":
    case "sideStud4":
    case "sideStudBrick": {
      const geo = cachedGeo(`ssb:${bw}x${H}x${bd}`, () => new THREE.BoxGeometry(bw, H, bd));
      const m = addMesh(g, geo, body, p.info, H / 2);
      m.rotation.y = yaw;
      // Side studs: 4733 on all four faces, the others on their facing
      // (47905 also on the opposite face).
      const faces: Facing[] =
        p.kind === "sideStud4"
          ? ["N", "S", "E", "W"]
          : p.kind === "sideStud2"
            ? [p.facing, ({ N: "S", S: "N", E: "W", W: "E" } as const)[p.facing]]
            : [p.facing];
      const sideGeo = cachedGeo("sidestud", () =>
        new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 16));
      const count = p.kind === "sideStudBrick" ? Math.max(pw, pd) : 1;
      for (const f of faces) {
        for (let i = 0; i < count; i++) {
          const s = new THREE.Mesh(sideGeo, stud);
          const along = count === 1 ? 0 : i - (count - 1) / 2;
          const out = new THREE.Vector3(along, 0, 0.5 + STUD_H / 2 - SEAM);
          out.applyAxisAngle(new THREE.Vector3(0, 1, 0), dirYaw(f));
          s.position.set(out.x, H / 2, out.z);
          s.rotation.set(Math.PI / 2, dirYaw(f), 0, "YXZ");
          g.add(tag(s, p.info));
        }
      }
      break;
    }
    case "steepSlope2":
    case "steepSlope3": {
      // Near-vertical slope: rises the full height over a single stud of depth
      const pts: [number, number][] = [
        [-pd / 2 + SEAM, 0],
        [-pd / 2 + SEAM, H],
        [-pd / 2 + SEAM + 0.5, H],
        [pd / 2 - SEAM, 0.2],
        [pd / 2 - SEAM, 0],
      ];
      const geo = cachedGeo(`steep:${pw}x${pd}x${H}`, () => prism(pts, pw - SEAM * 2));
      const m = addMesh(g, geo, body, p.info);
      m.rotation.y = yaw;
      break;
    }
    case "curvedSlope": {
      // Convex quarter-round: vertical at the back, tangent to the base in front
      const pts: [number, number][] = [[-pd / 2 + SEAM, 0], [-pd / 2 + SEAM, H]];
      const steps = 12;
      const span = pd - SEAM * 2;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        pts.push([-pd / 2 + SEAM + span * t, H * Math.cos((t * Math.PI) / 2)]);
      }
      pts.push([pd / 2 - SEAM, 0]);
      const geo = cachedGeo(`curveslope:${pw}x${pd}x${H}`, () => prism(pts, pw - SEAM * 2));
      const m = addMesh(g, geo, body, p.info);
      m.rotation.y = yaw;
      break;
    }
    case "wedgeL":
    case "wedgeR": {
      // Plate with one corner cut away on a diagonal
      const hw = pw / 2 - SEAM;
      const hd = pd / 2 - SEAM;
      const mirror = p.kind === "wedgeL" ? -1 : 1;
      const geo = cachedGeo(`wedge:${p.kind}:${pw}x${pd}`, () => {
        const shape = new THREE.Shape();
        shape.moveTo(-hw * mirror, -hd);
        shape.lineTo(hw * mirror, -hd);
        shape.lineTo(hw * mirror, hd - 1);
        shape.lineTo(-hw * mirror, hd);
        shape.closePath();
        const eg = new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: false });
        eg.rotateX(-Math.PI / 2);
        return eg;
      });
      const m = addMesh(g, geo, body, p.info, 0, false);
      m.rotation.y = yaw;
      break;
    }
    case "glassPanel": {
      // Trans-clear panel: thin full-height pane
      const geo = cachedGeo(`gpanel:${bw}x${H}`, () => new THREE.BoxGeometry(bw, H, 0.35));
      const m = addMesh(g, geo, body, p.info, H / 2, false);
      m.rotation.y = yaw;
      break;
    }
    case "headlight": {
      const geo = cachedGeo(`hl:${H}`, () => new THREE.BoxGeometry(1 - SEAM * 2, H, 1 - SEAM * 2));
      addMesh(g, geo, body, p.info, H / 2);
      const front = new THREE.Mesh(
        cachedGeo("hlstud", () => new THREE.CylinderGeometry(0.18, 0.18, 0.08, 14)),
        stud
      );
      const local = new THREE.Vector3(0, 0, 0.5 - SEAM);
      local.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      front.position.set(local.x, H / 2, local.z);
      front.rotation.x = Math.PI / 2;
      front.rotation.y = yaw;
      (front as any).pieceInfo = p.info;
      g.add(front);
      break;
    }
    case "profile": {
      // Ribbed profile brick: body + horizontal ridges on the outer face
      const geo = cachedGeo(`pbody:${bw}x${H}x${bd}`, () =>
        new THREE.BoxGeometry(bw, H, bd - 0.08));
      const m = addMesh(g, geo, body, p.info, H / 2);
      m.position.z = -0.04;
      m.rotation.y = yaw;
      const ribGeo = cachedGeo(`rib:${bw}`, () => new THREE.BoxGeometry(bw, 0.16, 0.1));
      for (let i = 0; i < 4; i++) {
        const rib = new THREE.Mesh(ribGeo, body);
        const local = new THREE.Vector3(0, 0, bd / 2 - 0.05);
        local.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        rib.position.set(local.x, 0.12 + i * 0.29, local.z);
        rib.rotation.y = yaw;
        rib.castShadow = true;
        (rib as any).pieceInfo = p.info;
        g.add(rib);
      }
      break;
    }
    case "roundBrick":
    case "roundPlate": {
      const r = p.w === 1 ? 0.38 : p.w / 2 - 0.04;
      const geo = cachedGeo(`cyl:${r}x${H}`, () => new THREE.CylinderGeometry(r, r, H, 24));
      addMesh(g, geo, body, p.info, H / 2, false);
      break;
    }
    case "slope45": {
      const pts: [number, number][] = [
        [-pd / 2 + SEAM, 0],
        [-pd / 2 + SEAM, H],
        [-pd / 2 + SEAM + 0.22, H],
        [pd / 2 - SEAM, 0.25],
        [pd / 2 - SEAM, 0],
      ];
      const geo = cachedGeo(`s45:${pw}x${pd}x${H}`, () => prism(pts, pw - SEAM * 2));
      const m = addMesh(g, geo, body, p.info);
      m.rotation.y = yaw;
      break;
    }
    case "slope33": {
      const pts: [number, number][] = [
        [-pd / 2 + SEAM, 0],
        [-pd / 2 + SEAM, H],
        [-pd / 2 + 1, H],
        [pd / 2 - SEAM, 0.25],
        [pd / 2 - SEAM, 0],
      ];
      const geo = cachedGeo(`s33:${pw}x${pd}x${H}`, () => prism(pts, pw - SEAM * 2));
      const m = addMesh(g, geo, body, p.info);
      m.rotation.y = yaw;
      break;
    }
    case "invSlope": {
      const pts: [number, number][] = [
        [-pd / 2 + SEAM, 0],
        [-pd / 2 + SEAM, H],
        [pd / 2 - SEAM, H],
        [pd / 2 - SEAM, H - 0.25],
        [-pd / 2 + SEAM + 0.4, 0],
      ];
      const geo = cachedGeo(`inv:${pw}x${pd}x${H}`, () => prism(pts, pw - SEAM * 2));
      const m = addMesh(g, geo, body, p.info);
      m.rotation.y = yaw;
      break;
    }
    case "curvedTop": {
      // Half-cylinder top across the 1-stud width, running along the depth
      const geo = cachedGeo(`ctop:${pw}x${pd}x${H}`, () =>
        prism(curvedTopProfile(pd, H), pw - SEAM * 2));
      const m = addMesh(g, geo, body, p.info, 0, false);
      m.rotation.y = yaw;
      break;
    }
    case "cheese": {
      const pts: [number, number][] = [
        [-0.5 + SEAM, 0],
        [-0.5 + SEAM, H],
        [-0.5 + SEAM + 0.24, H],
        [0.5 - SEAM, 0.1],
        [0.5 - SEAM, 0],
      ];
      const geo = cachedGeo(`chz:${pw}x${H}`, () => prism(pts, pw - SEAM * 2));
      const m = addMesh(g, geo, body, p.info);
      m.rotation.y = yaw;
      break;
    }
    case "arch": {
      // 1×4 arch: extruded face with a semi-elliptical opening
      const half = 2 - SEAM;
      const shape = new THREE.Shape();
      shape.moveTo(-half, 0);
      shape.lineTo(-half, H);
      shape.lineTo(half, H);
      shape.lineTo(half, 0);
      shape.lineTo(1.5, 0);
      shape.absellipse(0, 0, 1.5, 0.82, 0, Math.PI, false, 0);
      shape.lineTo(-half, 0);
      const geo = cachedGeo(`arch:${H}`, () => {
        const eg = new THREE.ExtrudeGeometry(shape, { depth: 1 - SEAM * 2, bevelEnabled: false });
        eg.translate(0, 0, -(1 - SEAM * 2) / 2);
        return eg;
      });
      const m = addMesh(g, geo, body, p.info, 0, false);
      m.rotation.y = yaw;
      break;
    }
    case "panel": {
      // Thin base + wall on the facing side, studs along the wall top
      const base = cachedGeo(`pbase:${bw}x${bd}`, () => new THREE.BoxGeometry(bw, 0.12, bd));
      addMesh(g, base, body, p.info, 0.06);
      const wallGeo = cachedGeo(`pwall:${bw}x${H}`, () =>
        new THREE.BoxGeometry(bw, H - 0.12, 0.24));
      const wall = new THREE.Mesh(wallGeo, body);
      const local = new THREE.Vector3(0, 0, bd / 2 - 0.12);
      local.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      wall.position.set(local.x, 0.12 + (H - 0.12) / 2, local.z);
      wall.rotation.y = yaw;
      wall.castShadow = true;
      (wall as any).pieceInfo = p.info;
      g.add(wall);
      break;
    }
  }

  // Studs (absolute cell positions → local offsets)
  for (const [sx, sz] of studCells(p)) {
    const s = new THREE.Mesh(STUD_GEO, stud);
    let lx = sx + 0.5 - cx;
    let lz = sz + 0.5 - cz;
    if (p.kind === "panel") {
      // studs sit on the wall top
      const local = new THREE.Vector3(lx, 0, bd / 2 - 0.12);
      local.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      lx = local.x;
      lz = local.z;
    }
    s.position.set(lx, H + STUD_H / 2, lz);
    s.castShadow = true;
    (s as any).pieceInfo = p.info;
    g.add(s);
  }

  if (p.attach) {
    // SNOT: stand the piece on edge against the host brick's side stud.
    // Rotating the group maps its local +y (the piece's "up") onto the
    // facing direction, so the flat face ends up parallel to the wall.
    const [dx, dz] = FACE_DIR[p.facing];
    g.rotation.set(Math.PI / 2, dirYaw(p.facing), 0, "YXZ");
    g.position.set(cx + dx * 0.5, (p.layer + 0.5) * LAYER_H, cz + dz * 0.5);
  } else {
    g.position.set(cx, p.layer * LAYER_H, cz);
  }
  return g;
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

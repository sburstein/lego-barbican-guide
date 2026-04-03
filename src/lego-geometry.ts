import * as THREE from "three";

// ═══════════════════════════════════════════════════════════════════════
// LEGO GEOMETRY ENGINE — Barbican Estate Lakeside Panorama
// All dimensions in "stud units": 1 unit = 1 stud = 8mm real
// ═══════════════════════════════════════════════════════════════════════

// LEGO dimensions in stud units
const PLATE_HEIGHT = 0.4; // 3.2mm / 8mm
const BRICK_HEIGHT = 1.2; // 9.6mm / 8mm (= 3 plates)
const STUD_RADIUS = 0.3;
const STUD_HEIGHT = 0.2;
const TOLERANCE = 0.05; // visible seam gap per side

// ─── Materials ─────────────────────────────────────────────────────────

const WHITE_MAT = new THREE.MeshStandardMaterial({
  color: 0xf5f5f0,
  roughness: 0.35,
  metalness: 0.0,
});

const TRANS_MAT = new THREE.MeshStandardMaterial({
  color: 0xc8ddf0,
  roughness: 0.1,
  metalness: 0.05,
  transparent: true,
  opacity: 0.45,
});

export const HIGHLIGHT_MAT = new THREE.MeshStandardMaterial({
  color: 0xfbbf24,
  roughness: 0.3,
  metalness: 0.0,
  emissive: 0xfbbf24,
  emissiveIntensity: 0.15,
});

const GRILLE_MAT = new THREE.MeshStandardMaterial({
  color: 0xe8e8e3,
  roughness: 0.6,
  metalness: 0.0,
});

const GREEN_MAT = new THREE.MeshStandardMaterial({
  color: 0x6dbe6d,
  roughness: 0.7,
  metalness: 0.0,
});

const DARK_MAT = new THREE.MeshStandardMaterial({
  color: 0xd0d0cc,
  roughness: 0.5,
  metalness: 0.0,
});

const RED_EDGE_MAT = new THREE.LineBasicMaterial({
  color: 0xff2222,
  transparent: true,
  opacity: 0.6,
  linewidth: 1,
});

const EDGE_LINE_MAT = new THREE.LineBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 0.08,
});

const GROOVE_LINE_MAT = new THREE.MeshStandardMaterial({
  color: 0x999990,
  roughness: 0.8,
  metalness: 0.0,
});

// ─── Active Step Materials (LEGO instruction coral) ───────────────────

const ACTIVE_STEP_MAT = new THREE.MeshStandardMaterial({
  color: 0xf0a0a0,
  roughness: 0.35,
  metalness: 0.0,
});

const ACTIVE_STUD_MAT = new THREE.MeshStandardMaterial({
  color: 0xe89090,
  roughness: 0.2,
  metalness: 0.0,
});

const ACTIVE_TRANS_MAT = new THREE.MeshStandardMaterial({
  color: 0xf0b0b0,
  roughness: 0.1,
  metalness: 0.05,
  transparent: true,
  opacity: 0.5,
});

// ─── Types ─────────────────────────────────────────────────────────────

export type PieceInfo = {
  name: string;
  partNumber: string;
  description: string;
};

// ─── Shared Stud Geometry ─────────────────────────────────────────────

const STUD_MAT = new THREE.MeshStandardMaterial({
  color: 0xf5f5f0,
  roughness: 0.2,
  metalness: 0.0,
});

const STUD_RING_GEO = new THREE.TorusGeometry(STUD_RADIUS, 0.03, 6, 12);
const STUD_RING_MAT = new THREE.MeshStandardMaterial({
  color: 0xc0c0b8,
  roughness: 0.6,
  metalness: 0.0,
});

const _studGeo = new THREE.CylinderGeometry(
  STUD_RADIUS * 0.92,
  STUD_RADIUS,
  STUD_HEIGHT,
  12
);

// ─── Helper: Add studs on top of a piece ──────────────────────────────

function addStudsToGroup(
  group: THREE.Group,
  width: number,
  depth: number,
  yTop: number,
  info?: PieceInfo
): void {
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      const stud = new THREE.Mesh(_studGeo, STUD_MAT);
      stud.position.set(
        x - (width - 1) / 2,
        yTop + STUD_HEIGHT / 2,
        z - (depth - 1) / 2
      );
      stud.castShadow = true;
      if (info) (stud as any).pieceInfo = info;
      group.add(stud);

      const ring = new THREE.Mesh(STUD_RING_GEO, STUD_RING_MAT);
      ring.position.set(
        x - (width - 1) / 2,
        yTop + 0.01,
        z - (depth - 1) / 2
      );
      ring.rotation.x = -Math.PI / 2;
      group.add(ring);
    }
  }
}

// ─── Helper: Add edge lines ───────────────────────────────────────────

function addEdgeLines(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  position: THREE.Vector3
): void {
  const edgesGeo = new THREE.EdgesGeometry(geometry);
  const edgeLines = new THREE.LineSegments(edgesGeo, EDGE_LINE_MAT);
  edgeLines.position.copy(position);
  group.add(edgeLines);
}

// ═══════════════════════════════════════════════════════════════════════
// PIECE PRIMITIVES — Geometrically accurate to real LEGO pieces
// All w/d parameters are INTEGER stud counts.
// ═══════════════════════════════════════════════════════════════════════

export function createBrick(
  w: number,
  d: number,
  h: number = 1,
  material?: THREE.Material,
  info?: PieceInfo,
  noStuds?: boolean
): THREE.Group {
  const mat = material || WHITE_MAT;
  const height = h * BRICK_HEIGHT;
  const group = new THREE.Group();

  const bw = w - TOLERANCE * 2;
  const bd = d - TOLERANCE * 2;
  const bodyGeo = new THREE.BoxGeometry(bw, height, bd);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  if (info) (body as any).pieceInfo = info;
  group.add(body);

  addEdgeLines(group, bodyGeo, body.position);

  if (!noStuds && mat !== TRANS_MAT) {
    addStudsToGroup(group, w, d, height, info);
  }

  return group;
}

export function createPlate(
  w: number,
  d: number,
  material?: THREE.Material,
  info?: PieceInfo,
  smooth?: boolean
): THREE.Group {
  const mat = material || WHITE_MAT;
  const height = PLATE_HEIGHT;
  const group = new THREE.Group();

  const bw = w - TOLERANCE * 2;
  const bd = d - TOLERANCE * 2;
  const bodyGeo = new THREE.BoxGeometry(bw, height, bd);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  if (info) (body as any).pieceInfo = info;
  group.add(body);

  addEdgeLines(group, bodyGeo, body.position);

  if (!smooth) {
    addStudsToGroup(group, w, d, height, info);
  }

  return group;
}

export function createTile(
  w: number,
  d: number,
  material?: THREE.Material,
  info?: PieceInfo
): THREE.Group {
  const mat = material || WHITE_MAT;
  const height = PLATE_HEIGHT;
  const group = new THREE.Group();

  const bw = w - TOLERANCE * 2;
  const bd = d - TOLERANCE * 2;
  const bodyGeo = new THREE.BoxGeometry(bw, height, bd);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  if (info) (body as any).pieceInfo = info;
  group.add(body);

  addEdgeLines(group, bodyGeo, body.position);

  return group;
}

export function createGrilleTile(
  w: number,
  d: number,
  info?: PieceInfo
): THREE.Group {
  const group = new THREE.Group();
  const height = PLATE_HEIGHT;

  const bw = w - TOLERANCE * 2;
  const bd = d - TOLERANCE * 2;
  const bodyGeo = new THREE.BoxGeometry(bw, height, bd);
  const body = new THREE.Mesh(bodyGeo, GRILLE_MAT);
  body.position.y = height / 2;
  body.castShadow = true;
  if (info) (body as any).pieceInfo = info;
  group.add(body);

  addEdgeLines(group, bodyGeo, body.position);

  const ridgeGeo = new THREE.BoxGeometry(bw * 0.9, 0.03, bd * 0.12);
  const ridgeSpacing = bw * 0.25;
  for (let i = -1; i <= 1; i++) {
    const ridge = new THREE.Mesh(ridgeGeo, GROOVE_LINE_MAT);
    ridge.position.set(i * ridgeSpacing, height + 0.015, 0);
    ridge.castShadow = true;
    if (info) (ridge as any).pieceInfo = info;
    group.add(ridge);
  }

  return group;
}

export function createHeadlightBrick(info?: PieceInfo): THREE.Group {
  const group = new THREE.Group();

  const lowerGeo = new THREE.BoxGeometry(
    1.0 - TOLERANCE * 2,
    PLATE_HEIGHT,
    1.0 - TOLERANCE * 2
  );
  const lower = new THREE.Mesh(lowerGeo, WHITE_MAT);
  lower.position.set(0, PLATE_HEIGHT / 2, 0);
  lower.castShadow = true;
  if (info) (lower as any).pieceInfo = info;
  group.add(lower);

  const upperHeight = 2 * PLATE_HEIGHT;
  const upperGeo = new THREE.BoxGeometry(
    1.0 - TOLERANCE * 2,
    upperHeight,
    0.6 - TOLERANCE * 2
  );
  const upper = new THREE.Mesh(upperGeo, WHITE_MAT);
  upper.position.set(0, PLATE_HEIGHT + upperHeight / 2, -0.2);
  upper.castShadow = true;
  if (info) (upper as any).pieceInfo = info;
  group.add(upper);

  addEdgeLines(group, lowerGeo, lower.position);
  addEdgeLines(group, upperGeo, upper.position);

  const topStud = new THREE.Mesh(_studGeo, STUD_MAT);
  topStud.position.set(0, BRICK_HEIGHT + STUD_HEIGHT / 2, -0.2);
  topStud.castShadow = true;
  if (info) (topStud as any).pieceInfo = info;
  group.add(topStud);

  const frontStud = new THREE.Mesh(_studGeo, STUD_MAT);
  frontStud.rotation.x = Math.PI / 2;
  frontStud.position.set(0, PLATE_HEIGHT + upperHeight / 2, 0.5 - TOLERANCE + STUD_HEIGHT / 2);
  frontStud.castShadow = true;
  if (info) (frontStud as any).pieceInfo = info;
  group.add(frontStud);

  return group;
}

export function createSideStudBrick(
  w: number,
  info?: PieceInfo
): THREE.Group {
  const material = WHITE_MAT;
  const height = BRICK_HEIGHT;
  const d = 1;
  const group = new THREE.Group();

  const bw = w - TOLERANCE * 2;
  const bd = d - TOLERANCE * 2;
  const bodyGeo = new THREE.BoxGeometry(bw, height, bd);
  const body = new THREE.Mesh(bodyGeo, material);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  if (info) (body as any).pieceInfo = info;
  group.add(body);

  addEdgeLines(group, bodyGeo, body.position);

  addStudsToGroup(group, w, d, height, info);

  for (let x = 0; x < Math.floor(w); x++) {
    const stud = new THREE.Mesh(_studGeo, STUD_MAT);
    stud.rotation.x = Math.PI / 2;
    stud.position.set(
      x - (Math.floor(w) - 1) / 2,
      height / 2,
      bd / 2 + STUD_HEIGHT / 2
    );
    stud.castShadow = true;
    if (info) (stud as any).pieceInfo = info;
    group.add(stud);
  }

  return group;
}

export function createTravisBrick(info?: PieceInfo): THREE.Group {
  const group = new THREE.Group();
  const height = BRICK_HEIGHT;
  const bw = 1 - TOLERANCE * 2;

  const bodyGeo = new THREE.BoxGeometry(bw, height, bw);
  const body = new THREE.Mesh(bodyGeo, WHITE_MAT);
  body.position.y = height / 2;
  body.castShadow = true;
  if (info) (body as any).pieceInfo = info;
  group.add(body);

  addEdgeLines(group, bodyGeo, body.position);

  const topStud = new THREE.Mesh(_studGeo, STUD_MAT);
  topStud.position.set(0, height + STUD_HEIGHT / 2, 0);
  topStud.castShadow = true;
  if (info) (topStud as any).pieceInfo = info;
  group.add(topStud);

  const dirs: [number, number, number][] = [
    [0, 0, 1], [0, 0, -1], [1, 0, 0], [-1, 0, 0],
  ];
  for (const [dx, , dz] of dirs) {
    const stud = new THREE.Mesh(_studGeo, STUD_MAT);
    if (dz !== 0) {
      stud.rotation.x = Math.PI / 2 * dz;
    } else {
      stud.rotation.z = -Math.PI / 2 * dx;
    }
    stud.position.set(
      dx * (bw / 2 + STUD_HEIGHT / 2),
      height / 2,
      dz * (bw / 2 + STUD_HEIGHT / 2)
    );
    stud.castShadow = true;
    if (info) (stud as any).pieceInfo = info;
    group.add(stud);
  }

  return group;
}

export function createRoundBrick(
  h: number = 1,
  info?: PieceInfo,
  diameter: number = 2
): THREE.Group {
  const group = new THREE.Group();
  const height = h * BRICK_HEIGHT;
  const radius = diameter === 1 ? 0.45 : 1.0;

  const cylGeo = new THREE.CylinderGeometry(
    radius - TOLERANCE,
    radius - TOLERANCE,
    height,
    16
  );
  const cyl = new THREE.Mesh(cylGeo, WHITE_MAT);
  cyl.position.y = height / 2;
  cyl.castShadow = true;
  if (info) (cyl as any).pieceInfo = info;
  group.add(cyl);

  const edgesGeo = new THREE.EdgesGeometry(cylGeo);
  const edgeLines = new THREE.LineSegments(edgesGeo, EDGE_LINE_MAT);
  edgeLines.position.y = height / 2;
  group.add(edgeLines);

  const stud = new THREE.Mesh(_studGeo, STUD_MAT);
  stud.position.y = height + STUD_HEIGHT / 2;
  stud.castShadow = true;
  if (info) (stud as any).pieceInfo = info;
  group.add(stud);

  return group;
}

export function createMacaroniBrick(info?: PieceInfo): THREE.Group {
  const group = new THREE.Group();
  const outerR = 2.0;
  const innerR = 1.6;

  const shape = new THREE.Shape();
  const segments = 12;

  shape.moveTo(outerR, 0);
  for (let i = 1; i <= segments; i++) {
    const angle = (Math.PI / 2) * (i / segments);
    shape.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
  }
  shape.lineTo(Math.cos(Math.PI / 2) * innerR, Math.sin(Math.PI / 2) * innerR);
  for (let i = segments - 1; i >= 0; i--) {
    const angle = (Math.PI / 2) * (i / segments);
    shape.lineTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: BRICK_HEIGHT,
    bevelEnabled: false,
  });
  const mesh = new THREE.Mesh(geo, WHITE_MAT);
  mesh.rotation.x = -Math.PI / 2;
  mesh.castShadow = true;
  if (info) (mesh as any).pieceInfo = info;
  group.add(mesh);

  const eGeo = new THREE.EdgesGeometry(geo);
  const eLines = new THREE.LineSegments(eGeo, EDGE_LINE_MAT);
  eLines.rotation.x = -Math.PI / 2;
  group.add(eLines);

  return group;
}

export function createCurvedSlope(
  direction: "left" | "right",
  info?: PieceInfo
): THREE.Group {
  const group = new THREE.Group();
  const len = 3.0;

  const shape = new THREE.Shape();
  if (direction === "left") {
    shape.moveTo(0, 0);
    shape.lineTo(len, 0);
    shape.lineTo(len, PLATE_HEIGHT);
    shape.bezierCurveTo(
      len, BRICK_HEIGHT * 0.7,
      len * 0.3, BRICK_HEIGHT,
      0, BRICK_HEIGHT
    );
    shape.closePath();
  } else {
    shape.moveTo(0, 0);
    shape.lineTo(-len, 0);
    shape.lineTo(-len, PLATE_HEIGHT);
    shape.bezierCurveTo(
      -len, BRICK_HEIGHT * 0.7,
      -len * 0.3, BRICK_HEIGHT,
      0, BRICK_HEIGHT
    );
    shape.closePath();
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 1 - TOLERANCE * 2,
    bevelEnabled: false,
  });
  const mesh = new THREE.Mesh(geo, WHITE_MAT);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.z = -(1 - TOLERANCE * 2) / 2;
  mesh.castShadow = true;
  if (info) (mesh as any).pieceInfo = info;
  group.add(mesh);

  const eGeo = new THREE.EdgesGeometry(geo);
  const eLines = new THREE.LineSegments(eGeo, EDGE_LINE_MAT);
  eLines.rotation.x = -Math.PI / 2;
  eLines.position.z = -(1 - TOLERANCE * 2) / 2;
  group.add(eLines);

  return group;
}

export function createArch(info?: PieceInfo): THREE.Group {
  const group = new THREE.Group();
  const w = 4;
  const d = 1;
  const bw = w - TOLERANCE * 2;
  const bd = d - TOLERANCE * 2;

  const shape = new THREE.Shape();
  shape.moveTo(-bw / 2, 0);
  shape.lineTo(-bw / 2, BRICK_HEIGHT);
  shape.lineTo(bw / 2, BRICK_HEIGHT);
  shape.lineTo(bw / 2, 0);

  const archRadius = 1.0;
  shape.lineTo(archRadius, 0);
  shape.absarc(0, 0, archRadius, 0, Math.PI, false);
  shape.lineTo(-bw / 2, 0);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: bd,
    bevelEnabled: false,
  });
  const mesh = new THREE.Mesh(geo, WHITE_MAT);
  mesh.position.z = -bd / 2;
  mesh.castShadow = true;
  if (info) (mesh as any).pieceInfo = info;
  group.add(mesh);

  const eGeo = new THREE.EdgesGeometry(geo);
  const eLines = new THREE.LineSegments(eGeo, EDGE_LINE_MAT);
  eLines.position.z = -bd / 2;
  group.add(eLines);

  addStudsToGroup(group, w, d, BRICK_HEIGHT, info);

  return group;
}

export function createPanel(
  w: number,
  h: number,
  info?: PieceInfo
): THREE.Group {
  const group = new THREE.Group();
  const panelHeight = h * BRICK_HEIGHT;
  const panelDepth = 0.3;

  const bw = w - TOLERANCE * 2;
  const bodyGeo = new THREE.BoxGeometry(bw, panelHeight, panelDepth);
  const body = new THREE.Mesh(bodyGeo, WHITE_MAT);
  body.position.y = panelHeight / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  if (info) (body as any).pieceInfo = info;
  group.add(body);

  addEdgeLines(group, bodyGeo, body.position);

  const footGeo = new THREE.BoxGeometry(0.4, PLATE_HEIGHT, 0.4);
  for (const sx of [-1, 1]) {
    const foot = new THREE.Mesh(footGeo, WHITE_MAT);
    foot.position.set(
      sx * (bw / 2 - 0.2),
      PLATE_HEIGHT / 2,
      -(panelDepth / 2 + 0.2)
    );
    foot.castShadow = true;
    if (info) (foot as any).pieceInfo = info;
    group.add(foot);
  }

  return group;
}

export function createInvertedSlope(
  w: number,
  d: number,
  info?: PieceInfo
): THREE.Group {
  const group = new THREE.Group();
  const h = BRICK_HEIGHT;

  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, h);
  shape.lineTo(w / 2, h);
  shape.lineTo(w / 2, 0);
  shape.lineTo(-w / 2, h * 0.4);
  shape.closePath();

  const bd = d - TOLERANCE * 2;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: bd,
    bevelEnabled: false,
  });
  const mesh = new THREE.Mesh(geo, WHITE_MAT);
  mesh.position.z = -bd / 2;
  mesh.castShadow = true;
  if (info) (mesh as any).pieceInfo = info;
  group.add(mesh);

  const eGeo = new THREE.EdgesGeometry(geo);
  const eLines = new THREE.LineSegments(eGeo, EDGE_LINE_MAT);
  eLines.position.z = -bd / 2;
  group.add(eLines);

  addStudsToGroup(group, w, d, h, info);

  return group;
}

export function createSlope(
  w: number,
  d: number,
  _angle: number = 45,
  info?: PieceInfo
): THREE.Group {
  const group = new THREE.Group();

  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(w / 2, 0);
  shape.lineTo(w / 2, PLATE_HEIGHT);
  shape.lineTo(-w / 2, BRICK_HEIGHT);
  shape.closePath();

  const bd = d - TOLERANCE * 2;
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: bd,
    bevelEnabled: false,
  });
  const mesh = new THREE.Mesh(geo, WHITE_MAT);
  mesh.position.z = -bd / 2;
  mesh.castShadow = true;
  if (info) (mesh as any).pieceInfo = info;
  group.add(mesh);

  const eGeo = new THREE.EdgesGeometry(geo);
  const eLines = new THREE.LineSegments(eGeo, EDGE_LINE_MAT);
  eLines.position.z = -bd / 2;
  group.add(eLines);

  return group;
}

// ═══════════════════════════════════════════════════════════════════════
// BARBICAN PANORAMA — STUD-GRID-ACCURATE SCENE ASSEMBLY
// ═══════════════════════════════════════════════════════════════════════
//
// COORDINATE SYSTEM:
// Base plates (8×8) centered at integer positions → studs at half-integers.
//   Even-width pieces: group center at INTEGER position
//   Odd-width pieces: group center at HALF-INTEGER position
//
// Y=0 is the table surface. Foundation plates sit at Y=0.
// Everything builds upward from there.

const BP_PHASES = [
  "bp-foundation",
  "bp-lake",
  "bp-podium",
  "bp-terrace-core",
  "bp-terrace-facade",
  "bp-terrace-balconies",
  "bp-barrel-vault",
  "bp-tower-core",
  "bp-tower-facade",
  "bp-tower-crown",
  "bp-conservatory",
  "bp-landscaping",
];

export function buildPhaseModel(
  phaseId: string,
  completedSteps: Set<string>,
  _buildId: string = "barbican-panorama",
  stepIndex?: number
): THREE.Group {
  return buildBarbicanPanorama(phaseId, completedSteps, stepIndex);
}

// ─── Active Step Highlight ────────────────────────────────────────────

export function applyActiveStepStyle(group: THREE.Group): void {
  const meshesToProcess: THREE.Mesh[] = [];
  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh && (obj as THREE.Mesh).geometry) {
      meshesToProcess.push(obj as THREE.Mesh);
    }
  });

  for (const mesh of meshesToProcess) {
    (mesh as any)._originalMaterial = mesh.material;

    if (mesh.material === WHITE_MAT || mesh.material === DARK_MAT) {
      mesh.material = ACTIVE_STEP_MAT;
    } else if (mesh.material === STUD_MAT || mesh.material === STUD_RING_MAT) {
      mesh.material = ACTIVE_STUD_MAT;
    } else if (mesh.material === TRANS_MAT) {
      mesh.material = ACTIVE_TRANS_MAT;
    } else if (mesh.material === GRILLE_MAT || mesh.material === GROOVE_LINE_MAT) {
      mesh.material = ACTIVE_STEP_MAT;
    } else if (mesh.material === GREEN_MAT) {
      mesh.material = ACTIVE_STEP_MAT;
    }

    const edgesGeo = new THREE.EdgesGeometry(mesh.geometry);
    const lines = new THREE.LineSegments(edgesGeo, RED_EDGE_MAT);
    lines.position.copy(mesh.position);
    lines.rotation.copy(mesh.rotation);
    lines.scale.copy(mesh.scale);
    (lines as any)._isActiveEdge = true;
    group.add(lines);
  }
}

// ─── Progressive Model Builder ─────────────────────────────────────────

function buildBarbicanPanorama(
  phaseId: string,
  completedSteps: Set<string>,
  stepIndex?: number
): THREE.Group {
  const model = new THREE.Group();
  const currentIdx = BP_PHASES.indexOf(phaseId);

  const getPhaseStatus = (pid: string): "current" | "past" | "future" => {
    if (pid === phaseId) return "current";
    const idx = BP_PHASES.indexOf(pid);
    if (idx < currentIdx) return "past";
    return "future";
  };

  const phaseStepCounts: Record<string, number> = {};
  const isPhaseFullyCompleted = (pid: string): boolean => {
    const count = phaseStepCounts[pid];
    if (count === undefined || count === 0) return false;
    for (let i = 0; i < count; i++) {
      if (!completedSteps.has(`${pid}-${i}`)) return false;
    }
    return true;
  };

  const show = (pid: string): boolean => {
    const status = getPhaseStatus(pid);
    if (status === "current") return true;
    if (status === "past") return true;
    return isPhaseFullyCompleted(pid);
  };

  let stepCounterMap: Record<string, number> = {};
  let activeStepGroupRef: THREE.Group | null = null;

  const beginPhase = (pid: string): THREE.Group => {
    const pg = new THREE.Group();
    pg.userData.phaseId = pid;
    model.add(pg);
    stepCounterMap[pid] = 0;
    return pg;
  };

  const startStep = (phaseGroup: THREE.Group): THREE.Group => {
    const pid = phaseGroup.userData.phaseId as string;
    const sg = new THREE.Group();
    const idx = stepCounterMap[pid] || 0;
    sg.userData.stepIndex = idx;
    sg.userData.phaseId = pid;
    stepCounterMap[pid] = idx + 1;
    phaseStepCounts[pid] = idx + 1;
    phaseGroup.add(sg);
    return sg;
  };

  const addToStep = (stepGroup: THREE.Group, obj: THREE.Object3D) => {
    stepGroup.add(obj);
  };

  // ─── Layout Constants ────────────────────────────────────────────────
  // All positions computed to land on the stud grid.
  // 8×8 plates at centers (-8,0,-4), (0,0,-4), (8,0,-4), (-8,0,4), (0,0,4), (8,0,4)
  // → studs at half-integers from -11.5 to +11.5 in X, -7.5 to +7.5 in Z
  // Extensions add studs beyond this core.

  const PODIUM_DECK_Y = PLATE_HEIGHT + 3 * BRICK_HEIGHT; // 0.4 + 3.6 = 4.0
  const TERRACE_X = 0;        // terrace center X (even-width → integer center)
  const TERRACE_W = 20;       // terrace width in studs
  const TERRACE_D = 4;        // terrace depth in studs (even → integer center Z)
  const TERRACE_Z = -4;       // terrace center Z
  const TERRACE_H = 7;        // terrace height in brick courses
  const TOWER_X = 0;          // tower center X
  const TOWER_Z = -9;         // tower center Z
  // Y-plan tower: 2×2 core + 3 wings (back, left, right)
  const TOWER_CORE = 2;       // central core size
  const TOWER_WING_W = 2;     // wing width in studs
  const TOWER_WING_D = 3;     // wing depth in studs (base, decreases with setbacks)
  const TOWER_W = 6;          // bounding box width (kept for balcony slab sizing)
  const TOWER_D = 4;          // bounding box depth (kept for compatibility)
  const TOWER_COURSES = 25;
  const TOWER_BASE_Y = PLATE_HEIGHT;
  const LAKE_Z = 6;           // lake center Z (front zone)

  // Tower setback: every 6 courses, wing depth shrinks by 0.5
  const towerWingDepth = (course: number): number => {
    const setback = Math.floor(course / 6) * 0.5;
    return Math.max(2, TOWER_WING_D - setback);
  };

  // Build one course of the Y-plan tower
  const buildYTowerCourse = (sg: THREE.Group, course: number) => {
    const cy = TOWER_BASE_Y + course * BRICK_HEIGHT;
    const wingD = towerWingDepth(course);
    const sizes = course % 2 === 0 ? [2] : [1, 1]; // running bond
    const brickInfo = (sz: number): PieceInfo => ({
      name: sz === 2 ? "Brick 1×2" : "Brick 1×1",
      partNumber: sz === 2 ? "3004" : "3005",
      description: "Tower Y-plan",
    });

    // Central core: 2×2 solid
    const core = createBrick(TOWER_CORE, TOWER_CORE, 1, WHITE_MAT, {
      name: "Brick 2×2", partNumber: "3003", description: "Tower core",
    }, true);
    core.position.set(TOWER_X, cy, TOWER_Z);
    addToStep(sg, core);

    // Wing A: extends -Z (back)
    for (const sz of sizes) {
      const wingA = createBrick(TOWER_WING_W, sz, 1, WHITE_MAT, brickInfo(sz), true);
      wingA.position.set(TOWER_X, cy, TOWER_Z - TOWER_CORE / 2 - wingD / 2);
      addToStep(sg, wingA);
    }

    // Wing B: extends +X (right)
    for (const sz of sizes) {
      const wingB = createBrick(sz, TOWER_WING_W, 1, WHITE_MAT, brickInfo(sz), true);
      wingB.position.set(TOWER_X + TOWER_CORE / 2 + wingD / 2, cy, TOWER_Z);
      addToStep(sg, wingB);
    }

    // Wing C: extends -X (left)
    for (const sz of sizes) {
      const wingC = createBrick(sz, TOWER_WING_W, 1, WHITE_MAT, brickInfo(sz), true);
      wingC.position.set(TOWER_X - TOWER_CORE / 2 - wingD / 2, cy, TOWER_Z);
      addToStep(sg, wingC);
    }
  };

  // ════════════════════════════════════════════════════════════════════
  // PHASE 1: Foundation Platform (10 steps)
  // ════════════════════════════════════════════════════════════════════
  if (show("bp-foundation")) {
    const pg1 = beginPhase("bp-foundation");
    const p88: PieceInfo = { name: "Plate 8×8", partNumber: "41539", description: "Foundation plate" };

    // Step 0: Back Row — First Two 8×8 Plates
    const s0 = startStep(pg1);
    for (const cx of [-8, 0]) {
      const plate = createPlate(8, 8, WHITE_MAT, p88);
      plate.position.set(cx, 0, -4);
      addToStep(s0, plate);
    }

    // Step 1: Back Row — Third 8×8 Plate
    const s1 = startStep(pg1);
    {
      const plate = createPlate(8, 8, WHITE_MAT, p88);
      plate.position.set(8, 0, -4);
      addToStep(s1, plate);
    }

    // Step 2: Front Row — Two 8×8 Plates
    const s2 = startStep(pg1);
    for (const cx of [-8, 0]) {
      const plate = createPlate(8, 8, WHITE_MAT, p88);
      plate.position.set(cx, 0, 4);
      addToStep(s2, plate);
    }

    // Step 3: Front Row — Sixth 8×8 Plate
    const s3 = startStep(pg1);
    {
      const plate = createPlate(8, 8, WHITE_MAT, p88);
      plate.position.set(8, 0, 4);
      addToStep(s3, plate);
    }

    // Step 4: Front Extension — 4× Plate 6×10 (lake zone)
    const s4 = startStep(pg1);
    const p610: PieceInfo = { name: "Plate 6×10", partNumber: "3033", description: "Lake zone extension" };
    // 4 plates of 6×10 extending forward from front row
    // 6 wide × 10 deep; centers at half-integers for odd dims
    for (const cx of [-9, -3, 3, 9]) {
      const ext = createPlate(6, 10, WHITE_MAT, p610);
      ext.position.set(cx, 0, 12); // extending forward, center at Z=12
      addToStep(s4, ext);
    }

    // Step 5: Side Extensions — 4× Plate 6×8
    const s5 = startStep(pg1);
    const p68: PieceInfo = { name: "Plate 6×8", partNumber: "3036", description: "Side extension" };
    // 2 per side, widening the base
    for (const sx of [-1, 1]) {
      for (const zc of [-4, 4]) {
        const side = createPlate(6, 8, WHITE_MAT, p68);
        side.position.set(sx * 15, 0, zc); // at X=±15
        addToStep(s5, side);
      }
    }

    // Step 6: Infill — 8× Plate 4×8 (middle zone fill)
    const s6 = startStep(pg1);
    const p48: PieceInfo = { name: "Plate 4×8", partNumber: "3035", description: "Infill plate" };
    // Fill gaps across the middle. Stagger placement.
    for (let i = 0; i < 4; i++) {
      const fill = createPlate(4, 8, DARK_MAT, p48, true);
      fill.position.set(-6 + i * 4, PLATE_HEIGHT, 0); // second layer, staggered over joint
      addToStep(s6, fill);
    }
    for (let i = 0; i < 4; i++) {
      const fill = createPlate(4, 8, DARK_MAT, p48, true);
      fill.position.set(-8 + i * 4 + 2, PLATE_HEIGHT, 8); // second layer, lake-side
      addToStep(s6, fill);
    }

    // Step 7: Infill — Corner Zones 6× Plate 6×6
    const s7 = startStep(pg1);
    const p66: PieceInfo = { name: "Plate 6×6", partNumber: "3958", description: "Corner plate" };
    for (const cx of [-9, 9]) {
      for (const cz of [-7, 0, 7]) {
        const corner = createPlate(6, 6, WHITE_MAT, p66);
        corner.position.set(cx, 0, cz);
        addToStep(s7, corner);
      }
    }

    // Step 8: Edge Beams — 8× Plate 1×10 on top of base
    const s8 = startStep(pg1);
    const p110: PieceInfo = { name: "Plate 1×10", partNumber: "4477", description: "Edge beam" };
    // Front edge: 2 plates
    for (const cx of [-4.5, 4.5]) {
      const edge = createPlate(10, 1, DARK_MAT, p110);
      edge.position.set(cx, PLATE_HEIGHT, 7.5);
      addToStep(s8, edge);
    }
    // Back edge: 2 plates
    for (const cx of [-4.5, 4.5]) {
      const edge = createPlate(10, 1, DARK_MAT, p110);
      edge.position.set(cx, PLATE_HEIGHT, -7.5);
      addToStep(s8, edge);
    }
    // Left edge: 2 plates (rotated — 1×10 running front-to-back)
    for (const cz of [-2.5, 6.5]) {
      const edge = createPlate(1, 10, DARK_MAT, p110);
      edge.position.set(-11.5, PLATE_HEIGHT, cz);
      addToStep(s8, edge);
    }
    // Right edge: 2 plates
    for (const cz of [-2.5, 6.5]) {
      const edge = createPlate(1, 10, DARK_MAT, p110);
      edge.position.set(11.5, PLATE_HEIGHT, cz);
      addToStep(s8, edge);
    }

    // Step 9: Tower Reinforcement — 6× Plate 4×6 (stacked layers)
    const s9 = startStep(pg1);
    const p46: PieceInfo = { name: "Plate 4×6", partNumber: "3032", description: "Tower reinforcement" };
    // Layer 1: 3 plates across the rear
    for (const cx of [-4, 0, 4]) {
      const tz = createPlate(4, 6, DARK_MAT, p46);
      tz.position.set(cx, PLATE_HEIGHT, -7);
      addToStep(s9, tz);
    }
    // Layer 2: 3 plates offset, on top of layer 1
    for (const cx of [-2, 2, 6]) {
      const tz = createPlate(4, 6, WHITE_MAT, p46);
      tz.position.set(cx, 2 * PLATE_HEIGHT, -7);
      addToStep(s9, tz);
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // PHASE 2: The Lake (8 steps)
  // ════════════════════════════════════════════════════════════════════
  if (show("bp-lake")) {
    const pg2 = beginPhase("bp-lake");
    const lakeY = PLATE_HEIGHT;

    // Step 0: Lake Corners — 8× Plate 2×2 Corner
    const s0 = startStep(pg2);
    const cornerInfo: PieceInfo = { name: "Plate 2×2 Corner", partNumber: "2420", description: "Lake corner" };
    // 4 corners of the lake (roughly 16×8 studs, Z=3 to Z=11)
    for (const [cx, cz] of [[-7, 3], [7, 3], [-7, 9], [7, 9], [-5, 3], [5, 3], [-5, 9], [5, 9]] as [number, number][]) {
      const c = createPlate(2, 2, DARK_MAT, cornerInfo);
      c.position.set(cx, lakeY, cz);
      addToStep(s0, c);
    }

    // Step 1: Lake Border — 8× Plate 1×4
    const s1 = startStep(pg2);
    const borderInfo: PieceInfo = { name: "Plate 1×4", partNumber: "3710", description: "Lake border" };
    // Front and back borders
    for (const cx of [-3.5, 0.5]) {
      const fb = createPlate(4, 1, DARK_MAT, borderInfo);
      fb.position.set(cx, lakeY, 2.5);
      addToStep(s1, fb);
      const bb = createPlate(4, 1, DARK_MAT, borderInfo);
      bb.position.set(cx, lakeY, 9.5);
      addToStep(s1, bb);
    }
    // Side borders
    for (const sx of [-7.5, 7.5]) {
      const lb = createPlate(1, 4, DARK_MAT, borderInfo);
      lb.position.set(sx, lakeY, 4);
      addToStep(s1, lb);
      const rb = createPlate(1, 4, DARK_MAT, borderInfo);
      rb.position.set(sx, lakeY, 8);
      addToStep(s1, rb);
    }

    // Steps 2-5: Water Surface — 40× Trans-Clear Plate 1×2 (10 per step)
    const waterInfo: PieceInfo = { name: "Trans-Clear Plate 1×2", partNumber: "3023", description: "Lake water surface" };
    for (let stepNum = 0; stepNum < 4; stepNum++) {
      const sg = startStep(pg2);
      const zStart = 3 + stepNum * 2;
      for (let x = -6; x <= 4; x += 2) {
        for (let z = zStart; z < zStart + 2; z++) {
          if ((x + z) % 5 === 0) continue;
          const p = createPlate(2, 1, TRANS_MAT, waterInfo);
          p.position.set(x, lakeY, z + 0.5);
          addToStep(sg, p);
        }
      }
    }

    // Step 6: Depth Variation — 7× Trans-Clear Plate 1×1 (near edges)
    const s6 = startStep(pg2);
    const scatterInfo: PieceInfo = { name: "Trans-Clear Plate 1×1", partNumber: "3024", description: "Depth variation" };
    const edgePosns: [number, number][] = [
      [-5.5, 3.5], [-4.5, 3.5], [-3.5, 9.5], [-2.5, 4.5], [-1.5, 9.5], [-0.5, 3.5], [-5.5, 8.5],
    ];
    for (const [x, z] of edgePosns) {
      const sp = createPlate(1, 1, TRANS_MAT, scatterInfo);
      sp.position.set(x, 2 * PLATE_HEIGHT, z);
      addToStep(s6, sp);
    }

    // Step 7: Depth Variation — 7× Trans-Clear Plate 1×1 (centre)
    const s7 = startStep(pg2);
    const centrePosns: [number, number][] = [
      [0.5, 5.5], [1.5, 4.5], [2.5, 7.5], [3.5, 3.5], [4.5, 6.5], [5.5, 4.5], [4.5, 5.5],
    ];
    for (const [x, z] of centrePosns) {
      const sp = createPlate(1, 1, TRANS_MAT, scatterInfo);
      sp.position.set(x, 2 * PLATE_HEIGHT, z);
      addToStep(s7, sp);
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // PHASE 3: Podium Colonnade (8 steps)
  // 12 main columns at integer X positions (2×2 round = even width)
  // ════════════════════════════════════════════════════════════════════
  if (show("bp-podium")) {
    const pg3 = beginPhase("bp-podium");
    const colInfo: PieceInfo = { name: "Brick 2×2 Round", partNumber: "3941", description: "Podium column" };
    const capInfo: PieceInfo = { name: "Plate 2×2 Round", partNumber: "4032", description: "Column capital" };
    const secInfo: PieceInfo = { name: "Round Brick 1×1", partNumber: "3062b", description: "Secondary column" };
    const braceInfo: PieceInfo = { name: "Plate 1×2", partNumber: "3023w", description: "Column bracing" };

    // 12 columns in 2 rows, 6 per row, at integer X positions
    // Row Z=1, Row Z=3; columns at X = -10, -6, -2, 2, 6, 10
    const colXs = [-10, -6, -2, 2, 6, 10];
    const colZs = [1, 3];

    // Step 0: First 4 columns (left 2 X positions × 2 rows)
    const s0 = startStep(pg3);
    for (let i = 0; i < 2; i++) {
      for (const z of colZs) {
        const col = createRoundBrick(3, colInfo);
        col.position.set(colXs[i], PLATE_HEIGHT, z);
        addToStep(s0, col);
      }
    }

    // Step 1: Middle 4 columns
    const s1 = startStep(pg3);
    for (let i = 2; i < 4; i++) {
      for (const z of colZs) {
        const col = createRoundBrick(3, colInfo);
        col.position.set(colXs[i], PLATE_HEIGHT, z);
        addToStep(s1, col);
      }
    }

    // Step 2: Last 4 columns
    const s2 = startStep(pg3);
    for (let i = 4; i < 6; i++) {
      for (const z of colZs) {
        const col = createRoundBrick(3, colInfo);
        col.position.set(colXs[i], PLATE_HEIGHT, z);
        addToStep(s2, col);
      }
    }

    // Step 3: Capitals — left 6
    const s3 = startStep(pg3);
    for (let i = 0; i < 3; i++) {
      for (const z of colZs) {
        const cap = createPlate(2, 2, WHITE_MAT, capInfo, true);
        cap.position.set(colXs[i], PLATE_HEIGHT + 3 * BRICK_HEIGHT, z);
        addToStep(s3, cap);
      }
    }

    // Step 4: Capitals — right 6
    const s4 = startStep(pg3);
    for (let i = 3; i < 6; i++) {
      for (const z of colZs) {
        const cap = createPlate(2, 2, WHITE_MAT, capInfo, true);
        cap.position.set(colXs[i], PLATE_HEIGHT + 3 * BRICK_HEIGHT, z);
        addToStep(s4, cap);
      }
    }

    // Step 5: Secondary columns — left 6 (1×1 round between main pairs)
    const s5 = startStep(pg3);
    for (let i = 0; i < 3; i++) {
      const midX = (colXs[i] + colXs[i + 1]) / 2;
      for (const z of colZs) {
        const sec = createRoundBrick(2, secInfo, 1);
        sec.position.set(midX, PLATE_HEIGHT, z);
        addToStep(s5, sec);
      }
    }

    // Step 6: Secondary columns — right 6
    const s6 = startStep(pg3);
    for (let i = 3; i < 6; i++) {
      const midX = i < 5 ? (colXs[i] + colXs[i + 1]) / 2 : colXs[i] + 2;
      for (const z of colZs) {
        const sec = createRoundBrick(2, secInfo, 1);
        sec.position.set(midX, PLATE_HEIGHT, z);
        addToStep(s6, sec);
      }
    }

    // Step 7: Lateral Bracing — 4× Plate 1×2
    const s7 = startStep(pg3);
    for (let i = 0; i < 4; i++) {
      const brace = createPlate(1, 2, WHITE_MAT, braceInfo, true);
      brace.position.set(colXs[i * 2 < 6 ? i : i + 1] || colXs[i], PLATE_HEIGHT + 1.5 * BRICK_HEIGHT, 2);
      addToStep(s7, brace);
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // PHASE 4: Ground Level & Structural Cores (28 steps)
  // Interleaved terrace + tower construction
  // ════════════════════════════════════════════════════════════════════
  if (show("bp-terrace-core")) {
    const pg4 = beginPhase("bp-terrace-core");
    const bearingCoursesBelow = Math.round((PODIUM_DECK_Y - PLATE_HEIGHT) / BRICK_HEIGHT); // 3
    const facadeZ = TERRACE_Z + TERRACE_D / 2 + 1; // front face of terrace

    // Steps 0-1: Terrace Ground — Bearing Walls (8× Brick 2×6)
    // 4 bearing walls from foundation to podium deck level
    const wallXs = [-8, -2, 4, 8]; // integer positions for 2-wide walls
    const s4_0 = startStep(pg4);
    for (let w = 0; w < 2; w++) {
      for (let course = 0; course < bearingCoursesBelow; course++) {
        const cy = PLATE_HEIGHT + course * BRICK_HEIGHT;
        const wall = createBrick(2, 6, 1, DARK_MAT, {
          name: "Brick 2×6", partNumber: "2456", description: "Bearing wall",
        }, true);
        wall.position.set(wallXs[w], cy, TERRACE_Z);
        addToStep(s4_0, wall);
      }
    }

    const s4_1 = startStep(pg4);
    for (let w = 2; w < 4; w++) {
      for (let course = 0; course < bearingCoursesBelow; course++) {
        const cy = PLATE_HEIGHT + course * BRICK_HEIGHT;
        const wall = createBrick(2, 6, 1, DARK_MAT, {
          name: "Brick 2×6", partNumber: "2456", description: "Bearing wall",
        }, true);
        wall.position.set(wallXs[w], cy, TERRACE_Z);
        addToStep(s4_1, wall);
      }
    }

    // Step 2: Bond Course — 6× Brick 2×4 offset
    const s4_2 = startStep(pg4);
    for (let i = 0; i < 6; i++) {
      const bond = createBrick(2, 4, 1, WHITE_MAT, {
        name: "Brick 2×4", partNumber: "3001", description: "Bond course",
      }, true);
      bond.position.set(TERRACE_X - 5 + i * 2, PLATE_HEIGHT + bearingCoursesBelow * BRICK_HEIGHT, TERRACE_Z);
      addToStep(s4_2, bond);
    }

    // Step 3: Arts Centre Arches — 6× Arch 1×4 (NO SCALING)
    const s4_3 = startStep(pg4);
    for (let i = 0; i < 6; i++) {
      const arch = createArch({
        name: "Arch 1×4", partNumber: "3659", description: "Arts Centre arch",
      });
      arch.position.set(-9 + i * 4, PLATE_HEIGHT, facadeZ);
      addToStep(s4_3, arch);
    }

    // Steps 4-5: Ground-Floor Windows — 10× Trans-Clear Panel 1×2×2
    const s4_4 = startStep(pg4);
    for (let i = 0; i < 5; i++) {
      const panel = createPanel(2, 2, {
        name: "Trans-Clear Panel 1×2×2", partNumber: "87552", description: "Foyer window",
      });
      panel.position.set(-8 + i * 2, PLATE_HEIGHT, facadeZ + 1);
      addToStep(s4_4, panel);
    }

    const s4_5 = startStep(pg4);
    for (let i = 5; i < 10; i++) {
      const panel = createPanel(2, 2, {
        name: "Trans-Clear Panel 1×2×2", partNumber: "87552", description: "Foyer window",
      });
      panel.position.set(-8 + i * 2, PLATE_HEIGHT, facadeZ + 1);
      addToStep(s4_5, panel);
    }

    // Step 6: Ground Landscaping — 4× Slope 2×3 + 2× Slope 3×4
    const s4_6 = startStep(pg4);
    for (let i = 0; i < 4; i++) {
      const slope = createSlope(2, 3, 25, {
        name: "Slope 2×3 (25°)", partNumber: "3298", description: "Terrain slope",
      });
      slope.position.set(-3 + i * 2, PLATE_HEIGHT, facadeZ - 1);
      addToStep(s4_6, slope);
    }
    for (let i = 0; i < 2; i++) {
      const slope = createSlope(3, 4, 25, {
        name: "Slope 3×4 (25°)", partNumber: "3297", description: "Terrain slope",
      });
      slope.position.set(-6.5 + i * 13, PLATE_HEIGHT, facadeZ - 1);
      addToStep(s4_6, slope);
    }

    // Steps 7-8: Podium Deck — 10× Plate 2×4
    const s4_7 = startStep(pg4);
    const deckInfo: PieceInfo = { name: "Plate 2×4", partNumber: "3020", description: "Podium deck" };
    for (let i = 0; i < 5; i++) {
      const dp = createPlate(2, 4, WHITE_MAT, deckInfo);
      dp.position.set(-8 + i * 4, PODIUM_DECK_Y, 2);
      addToStep(s4_7, dp);
    }

    const s4_8 = startStep(pg4);
    for (let i = 0; i < 5; i++) {
      const dp = createPlate(2, 4, WHITE_MAT, deckInfo);
      dp.position.set(-6 + i * 4, PODIUM_DECK_Y, 2);
      addToStep(s4_8, dp);
    }

    // Step 9: Podium Deck Wide — 6× Plate 2×6
    const s4_9 = startStep(pg4);
    const wdInfo: PieceInfo = { name: "Plate 2×6", partNumber: "3795", description: "Podium deck wide" };
    for (let i = 0; i < 6; i++) {
      const dp = createPlate(2, 6, WHITE_MAT, wdInfo);
      dp.position.set(-9 + i * 4, PODIUM_DECK_Y, -1);
      addToStep(s4_9, dp);
    }

    // Step 10: Podium Soffits — 8× Slope Inverted
    const s4_10 = startStep(pg4);
    for (let i = 0; i < 8; i++) {
      const soffit = createInvertedSlope(2, 1, {
        name: "Slope 2×3 Inverted", partNumber: "3747b", description: "Podium soffit",
      });
      soffit.position.set(-7 + i * 2, PODIUM_DECK_Y - PLATE_HEIGHT, 4.5);
      addToStep(s4_10, soffit);
    }

    // Step 11: Parapets — 10× Panel 1×4×1 Rounded
    const s4_11 = startStep(pg4);
    const parapetInfo: PieceInfo = { name: "Panel 1×4×1 Rounded", partNumber: "30413", description: "Parapet railing" };
    for (let i = 0; i < 5; i++) {
      const para = createPanel(4, 1, parapetInfo);
      para.position.set(-8 + i * 4, PODIUM_DECK_Y + PLATE_HEIGHT, 4);
      addToStep(s4_11, para);
    }
    for (let i = 0; i < 5; i++) {
      const para = createPanel(4, 1, parapetInfo);
      para.position.set(-8 + i * 4, PODIUM_DECK_Y + PLATE_HEIGHT, -2);
      addToStep(s4_11, para);
    }

    // Step 12: Corner Panels — 10× Panel 1×1×1 Corner
    const s4_12 = startStep(pg4);
    const cornerPInfo: PieceInfo = { name: "Panel 1×1×1 Corner", partNumber: "6231", description: "Parapet corner" };
    for (const x of [-10, 10]) {
      for (const z of [4, -2]) {
        const cp = createPanel(1, 1, cornerPInfo);
        cp.position.set(x, PODIUM_DECK_Y + PLATE_HEIGHT, z);
        addToStep(s4_12, cp);
      }
    }
    // remaining 6 at intermediate positions
    for (const x of [-6, -2, 2, 6, 8, -8]) {
      const cp = createPanel(1, 1, cornerPInfo);
      cp.position.set(x, PODIUM_DECK_Y + PLATE_HEIGHT, 4);
      addToStep(s4_12, cp);
    }

    // Steps 13-16: Tower Base — Y-plan courses 0-4
    const towerFrontZ = TOWER_Z + TOWER_D / 2;
    const towerBackZ = TOWER_Z - TOWER_D / 2;

    // Step 13: Tower Base — Y-plan courses 0-1
    const s4_13 = startStep(pg4);
    for (let c = 0; c < 2; c++) {
      buildYTowerCourse(s4_13, c);
    }

    // Step 14: Tower Base — Y-plan course 2
    const s4_14 = startStep(pg4);
    buildYTowerCourse(s4_14, 2);

    // Step 15: Tower Base — Y-plan course 3
    const s4_15 = startStep(pg4);
    buildYTowerCourse(s4_15, 3);

    // Step 16: Tower Base — Y-plan course 4
    const s4_16 = startStep(pg4);
    buildYTowerCourse(s4_16, 4);

    // Steps 17-22: Terrace Wall — running bond courses above podium deck
    const terraceWallY = PODIUM_DECK_Y + PLATE_HEIGHT;
    const buildTerraceWallCourse = (sg: THREE.Group, course: number) => {
      const cy = terraceWallY + course * BRICK_HEIGHT;
      const sizes = course % 2 === 0 ? [6, 4, 6, 4] : [4, 6, 4, 6];
      let xPos = TERRACE_X - TERRACE_W / 2;
      for (const sz of sizes) {
        const name = sz === 6 ? "Brick 1×6" : "Brick 1×4";
        const pn = sz === 6 ? "3009" : "3010";
        const brick = createBrick(sz, TERRACE_D, 1, WHITE_MAT, {
          name, partNumber: pn, description: "Terrace wall",
        }, true);
        brick.position.set(xPos + sz / 2, cy, TERRACE_Z);
        addToStep(sg, brick);
        xPos += sz;
      }
    };

    // Step 17: Terrace Wall courses 0-1 (left half pieces)
    const s4_17 = startStep(pg4);
    for (let c = 0; c < 2; c++) {
      const cy = terraceWallY + c * BRICK_HEIGHT;
      const sizes = c % 2 === 0 ? [6, 4] : [4, 6];
      let xPos = TERRACE_X - TERRACE_W / 2;
      for (const sz of sizes) {
        const brick = createBrick(sz, TERRACE_D, 1, WHITE_MAT, {
          name: sz === 6 ? "Brick 1×8" : "Brick 1×4",
          partNumber: sz === 6 ? "3008" : "3010",
          description: "Terrace wall left",
        }, true);
        brick.position.set(xPos + sz / 2, cy, TERRACE_Z);
        addToStep(s4_17, brick);
        xPos += sz;
      }
    }

    // Step 18: Terrace Wall courses 0-1 (right half)
    const s4_18 = startStep(pg4);
    for (let c = 0; c < 2; c++) {
      const cy = terraceWallY + c * BRICK_HEIGHT;
      const sizes = c % 2 === 0 ? [6, 4] : [4, 6];
      let xPos = TERRACE_X;
      for (const sz of sizes) {
        const brick = createBrick(sz, TERRACE_D, 1, WHITE_MAT, {
          name: sz === 6 ? "Brick 1×8" : "Brick 1×4",
          partNumber: sz === 6 ? "3008" : "3010",
          description: "Terrace wall right",
        }, true);
        brick.position.set(xPos + sz / 2, cy, TERRACE_Z);
        addToStep(s4_18, brick);
        xPos += sz;
      }
    }

    // Steps 19-21: Terrace courses 2-4
    const s4_19 = startStep(pg4);
    buildTerraceWallCourse(s4_19, 2);

    const s4_20 = startStep(pg4);
    buildTerraceWallCourse(s4_20, 3);

    const s4_21 = startStep(pg4);
    buildTerraceWallCourse(s4_21, 4);

    // Step 22: Upper wall courses
    const s4_22 = startStep(pg4);
    for (let c = 5; c < Math.ceil(TERRACE_H / 2); c++) {
      buildTerraceWallCourse(s4_22, c);
    }

    // Step 23: Tower Shaft — Y-plan courses 5-7
    const s4_23 = startStep(pg4);
    for (let c = 5; c < 8; c++) {
      buildYTowerCourse(s4_23, c);
    }

    // Step 24: Tower Shaft — Y-plan courses 8-9
    const s4_24 = startStep(pg4);
    for (let c = 8; c < 10; c++) {
      buildYTowerCourse(s4_24, c);
    }

    // Step 25: Structural Floor Plates — Terrace
    const s4_25 = startStep(pg4);
    const midPlate = createPlate(TERRACE_W, TERRACE_D, WHITE_MAT, {
      name: "Plate 2×8", partNumber: "3034", description: "Terrace structural plate",
    }, true);
    midPlate.position.set(TERRACE_X, terraceWallY + Math.ceil(TERRACE_H / 2) * BRICK_HEIGHT, TERRACE_Z);
    addToStep(s4_25, midPlate);

    // Step 26: Shear Walls (offset from tower zone)
    const s4_26 = startStep(pg4);
    for (const side of [-1, 1]) {
      const sx = TERRACE_X + side * 5; // moved outward to clear tower Y-plan wings
      for (let c = 0; c < TERRACE_H; c++) {
        const cy = PLATE_HEIGHT + c * BRICK_HEIGHT;
        const wall = createBrick(1, 4, 1, WHITE_MAT, {
          name: "Brick 2×4", partNumber: "3001", description: "Shear wall",
        }, true);
        wall.position.set(sx, cy, TERRACE_Z - TERRACE_D / 2 - 1);
        addToStep(s4_26, wall);
      }
    }

    // Step 27: Upper Wall + Cap Plate
    const s4_27 = startStep(pg4);
    for (let c = Math.ceil(TERRACE_H / 2); c < TERRACE_H; c++) {
      buildTerraceWallCourse(s4_27, c);
    }
    const topCap = createPlate(TERRACE_W, TERRACE_D, WHITE_MAT, {
      name: "Plate 2×8", partNumber: "3034", description: "Terrace top cap",
    }, true);
    topCap.position.set(TERRACE_X, terraceWallY + TERRACE_H * BRICK_HEIGHT, TERRACE_Z);
    addToStep(s4_27, topCap);
  }

  // ════════════════════════════════════════════════════════════════════
  // PHASE 5: Terrace SNOT Facade (13 steps)
  // Side-stud bricks on terrace front face, grille tiles clipped on
  // ════════════════════════════════════════════════════════════════════
  if (show("bp-terrace-facade")) {
    const pg5 = beginPhase("bp-terrace-facade");
    const facadeZ = TERRACE_Z + TERRACE_D / 2;
    const terraceWallY = PODIUM_DECK_Y + PLATE_HEIGHT;
    const snotInfo: PieceInfo = { name: "Brick 1×4 Side Studs", partNumber: "30414", description: "SNOT brick" };
    const grilleInfo: PieceInfo = { name: "Tile 1×2 Grille", partNumber: "2412b", description: "Concrete texture" };
    const hlInfo: PieceInfo = { name: "Headlight Brick 1×1", partNumber: "4070", description: "Window reveal" };
    const winInfo: PieceInfo = { name: "Trans-Clear Brick 1×2", partNumber: "3065", description: "Window glazing" };

    // SNOT bricks at integer X positions, 4 studs wide each, 5 columns across 20-stud terrace
    const snotCols = [-8, -4, 0, 4, 8]; // 5 positions, 4-wide pieces

    // Step 0: SNOT Bricks — Lower Storeys (level 0, 2)
    const s5_0 = startStep(pg5);
    for (const level of [0, 2]) {
      const ly = terraceWallY + level * BRICK_HEIGHT;
      for (const cx of snotCols) {
        const mount = createSideStudBrick(4, snotInfo);
        mount.position.set(cx, ly, facadeZ);
        addToStep(s5_0, mount);
      }
    }

    // Step 1: SNOT Bricks — Upper Storeys (level 4, 6)
    const s5_1 = startStep(pg5);
    for (const level of [4, 6]) {
      const ly = terraceWallY + level * BRICK_HEIGHT;
      for (const cx of snotCols) {
        const mount = createSideStudBrick(4, snotInfo);
        mount.position.set(cx, ly, facadeZ);
        addToStep(s5_1, mount);
      }
    }

    // Steps 2-4: Grille Texture — 3 bands (rotated to face outward via SNOT)
    for (let band = 0; band < 3; band++) {
      const sg = startStep(pg5);
      const ly = terraceWallY + (band * 2) * BRICK_HEIGHT;
      for (const cx of snotCols) {
        const grille = createGrilleTile(2, 1, grilleInfo);
        grille.rotation.x = Math.PI / 2; // face outward — SNOT technique
        grille.position.set(cx, ly + BRICK_HEIGHT * 0.5, facadeZ + 0.6);
        addToStep(sg, grille);
      }
    }

    // Steps 5-7: Window Reveals — Headlight bricks at 3 levels
    for (let row = 0; row < 3; row++) {
      const sg = startStep(pg5);
      const ly = terraceWallY + (1 + row * 2) * BRICK_HEIGHT;
      for (const cx of snotCols) {
        const hl = createHeadlightBrick(hlInfo);
        hl.position.set(cx, ly, facadeZ);
        addToStep(sg, hl);
      }
    }

    // Steps 8-10: Glazing — Trans bricks in headlight recesses
    for (let row = 0; row < 3; row++) {
      const sg = startStep(pg5);
      const ly = terraceWallY + (1 + row * 2) * BRICK_HEIGHT;
      for (const cx of snotCols) {
        const win = createBrick(1, 1, 1, TRANS_MAT, winInfo);
        win.position.set(cx, ly, facadeZ + 0.5 + STUD_HEIGHT);
        addToStep(sg, win);
      }
    }

    // Step 11: Penthouse Windows — Tall Panels
    const s5_11 = startStep(pg5);
    {
      const ly = terraceWallY + 5 * BRICK_HEIGHT;
      for (const cx of snotCols.slice(3)) {
        const win = createBrick(1, 1, 1, TRANS_MAT, {
          name: "Trans-Clear Panel 1×2×2", partNumber: "87552", description: "Penthouse panel",
        });
        win.position.set(cx, ly, facadeZ + 0.5 + STUD_HEIGHT);
        addToStep(s5_11, win);
      }
    }

    // Step 12: Remaining Window Fill
    const s5_12 = startStep(pg5);
    {
      const ly = terraceWallY + 3 * BRICK_HEIGHT;
      for (const cx of snotCols.slice(0, 3)) {
        const win = createBrick(1, 1, 1, TRANS_MAT, winInfo);
        win.position.set(cx, ly, facadeZ + 0.5 + STUD_HEIGHT);
        addToStep(s5_12, win);
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // PHASE 6: Balconies & Soffits (11 steps)
  // Cantilevered plate balconies at each storey
  // ════════════════════════════════════════════════════════════════════
  if (show("bp-terrace-balconies")) {
    const pg6 = beginPhase("bp-terrace-balconies");
    const facadeZ = TERRACE_Z + TERRACE_D / 2 + 1;
    const terraceWallY = PODIUM_DECK_Y + PLATE_HEIGHT;
    const balcInfo: PieceInfo = { name: "Plate 1×6", partNumber: "3666", description: "Balcony slab" };
    const tileInfo: PieceInfo = { name: "Tile 1×6", partNumber: "6636", description: "Balcony tile" };

    // 6 balcony positions across the terrace, 3 studs wide each
    const balcXs = [-8, -5, -2, 1, 4, 7]; // integer positions for even-width

    // Steps 0-4: Balcony plates at 5 levels (serrated sawtooth edges)
    for (let level = 0; level < 5; level++) {
      const sg = startStep(pg6);
      const ly = terraceWallY + (level * 2 + 1) * BRICK_HEIGHT + BRICK_HEIGHT;
      const stagger = level % 2 === 0 ? 0 : 1;
      for (let col = 0; col < balcXs.length; col++) {
        const cx = balcXs[col];
        // Sawtooth: alternate balconies project 0.5 studs further out
        const zJitter = (col % 2 === 0) ? 0 : 0.5;
        const balc = createPlate(3, 1, WHITE_MAT, balcInfo, true);
        balc.position.set(cx + stagger, ly, facadeZ + zJitter);
        addToStep(sg, balc);
      }
    }

    // Step 5: Inverted Slope soffit detail
    const s6_5 = startStep(pg6);
    {
      const ly = terraceWallY + 9 * BRICK_HEIGHT;
      const soffit = createInvertedSlope(2, 1, {
        name: "Slope 1×2 Inverted", partNumber: "3665", description: "Balcony soffit",
      });
      soffit.position.set(TERRACE_X, ly - PLATE_HEIGHT, facadeZ);
      addToStep(s6_5, soffit);
    }

    // Steps 6-8: Surface tiles on upper balconies
    for (let tileStep = 0; tileStep < 3; tileStep++) {
      const sg = startStep(pg6);
      const levels = tileStep === 0 ? [3, 4] : tileStep === 1 ? [0, 1] : [2];
      for (const level of levels) {
        const ly = terraceWallY + (level * 2 + 1) * BRICK_HEIGHT + BRICK_HEIGHT + PLATE_HEIGHT;
        const stagger = level % 2 === 0 ? 0 : 1;
        for (let col = 0; col < 6; col += 2) {
          const cx = balcXs[col] + stagger;
          const tile = createTile(3, 1, WHITE_MAT, tileInfo);
          tile.position.set(cx, ly, facadeZ);
          addToStep(sg, tile);
        }
      }
    }

    // Step 9: Long tile strips
    const s6_9 = startStep(pg6);
    for (let level = 0; level < 3; level++) {
      const ly = terraceWallY + (level * 2 + 1) * BRICK_HEIGHT + BRICK_HEIGHT + PLATE_HEIGHT + 0.01;
      const tile = createTile(4, 1, DARK_MAT, {
        name: "Tile 1×4", partNumber: "2431", description: "Balcony long strip",
      });
      tile.position.set(TERRACE_X, ly, facadeZ + 1);
      addToStep(s6_9, tile);
    }

    // Step 10: Short tile strips
    const s6_10 = startStep(pg6);
    for (let level = 3; level < 5; level++) {
      const ly = terraceWallY + (level * 2 + 1) * BRICK_HEIGHT + BRICK_HEIGHT + PLATE_HEIGHT + 0.01;
      const tile = createTile(2, 1, DARK_MAT, {
        name: "Tile 1×2", partNumber: "3069b", description: "Balcony short strip",
      });
      tile.position.set(TERRACE_X, ly, facadeZ + 1);
      addToStep(s6_10, tile);
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // PHASE 7: Barrel Vault Roof (10 steps)
  // ════════════════════════════════════════════════════════════════════
  if (show("bp-barrel-vault")) {
    const pg7 = beginPhase("bp-barrel-vault");
    const terraceWallY = PODIUM_DECK_Y + PLATE_HEIGHT;
    const vaultBaseY = terraceWallY + TERRACE_H * BRICK_HEIGHT;
    const vaultLInfo: PieceInfo = { name: "Curved Slope 3×1", partNumber: "50950", description: "Vault curve left" };
    const vaultRInfo: PieceInfo = { name: "Curved Slope 3×1", partNumber: "50950", description: "Vault curve right" };

    // 10 segments across 20-stud terrace width
    const segW = TERRACE_W / 10;
    const halfSegs = 5;

    // Steps 0-1: Left half curves
    const s7_0 = startStep(pg7);
    for (let seg = 0; seg < halfSegs; seg++) {
      const sx = TERRACE_X - TERRACE_W / 2 + segW / 2 + seg * segW;
      const ls = createCurvedSlope("left", vaultLInfo);
      ls.position.set(sx, vaultBaseY, TERRACE_Z);
      addToStep(s7_0, ls);
    }

    const s7_1 = startStep(pg7);
    for (let seg = 0; seg < halfSegs; seg++) {
      const sx = TERRACE_X - TERRACE_W / 2 + segW / 2 + seg * segW;
      const rs = createCurvedSlope("right", vaultRInfo);
      rs.position.set(sx, vaultBaseY, TERRACE_Z);
      addToStep(s7_1, rs);
    }

    // Steps 2-3: Right half curves
    const s7_2 = startStep(pg7);
    for (let seg = halfSegs; seg < 10; seg++) {
      const sx = TERRACE_X - TERRACE_W / 2 + segW / 2 + seg * segW;
      const ls = createCurvedSlope("left", vaultLInfo);
      ls.position.set(sx, vaultBaseY, TERRACE_Z);
      addToStep(s7_2, ls);
    }

    const s7_3 = startStep(pg7);
    for (let seg = halfSegs; seg < 10; seg++) {
      const sx = TERRACE_X - TERRACE_W / 2 + segW / 2 + seg * segW;
      const rs = createCurvedSlope("right", vaultRInfo);
      rs.position.set(sx, vaultBaseY, TERRACE_Z);
      addToStep(s7_3, rs);
    }

    // Step 4: End cap slope (left)
    const s7_4 = startStep(pg7);
    {
      const endCap = createSlope(1, TERRACE_D, 45, {
        name: "Slope 1×2 (45°)", partNumber: "3040", description: "Vault end cap",
      });
      endCap.position.set(TERRACE_X - TERRACE_W / 2 + 0.5, vaultBaseY, TERRACE_Z);
      addToStep(s7_4, endCap);
    }

    // Step 5: End cap slope (right)
    const s7_5 = startStep(pg7);
    {
      const endCap = createSlope(1, TERRACE_D, 45, {
        name: "Slope 1×2 (45°)", partNumber: "3040", description: "Vault end cap",
      });
      endCap.position.set(TERRACE_X + TERRACE_W / 2 - 0.5, vaultBaseY, TERRACE_Z);
      addToStep(s7_5, endCap);
    }

    // Step 6: Eave slopes along long sides
    const s7_6 = startStep(pg7);
    for (const zOff of [-TERRACE_D / 2 + 0.5, TERRACE_D / 2 - 0.5]) {
      const eave = createSlope(4, 1, 25, {
        name: "Slope 2×3 (25°)", partNumber: "3298", description: "Vault eave",
      });
      eave.position.set(TERRACE_X, vaultBaseY + 0.3, TERRACE_Z + zOff);
      addToStep(s7_6, eave);
    }

    // Step 7: Ridge cap tile
    const s7_7 = startStep(pg7);
    const ridge = createTile(TERRACE_W, 1, DARK_MAT, {
      name: "Tile 1×4", partNumber: "2431", description: "Ridge cap",
    });
    ridge.position.set(TERRACE_X, vaultBaseY + 1.0, TERRACE_Z);
    addToStep(s7_7, ridge);

    // Step 8: Hip corner — front
    const s7_8 = startStep(pg7);
    {
      const hip = createSlope(2, 2, 45, {
        name: "Slope 2×2 Double Convex", partNumber: "3045", description: "Hip corner",
      });
      hip.position.set(TERRACE_X - TERRACE_W / 2 + 1, vaultBaseY + 0.8, TERRACE_Z);
      addToStep(s7_8, hip);
    }

    // Step 9: Hip corner — back
    const s7_9 = startStep(pg7);
    {
      const hip = createSlope(2, 2, 45, {
        name: "Slope 2×2 Double Convex", partNumber: "3045", description: "Hip corner",
      });
      hip.position.set(TERRACE_X + TERRACE_W / 2 - 1, vaultBaseY + 0.8, TERRACE_Z);
      addToStep(s7_9, hip);
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // PHASE 8: Tower Core — Above Roofline (12 steps)
  // ════════════════════════════════════════════════════════════════════
  if (show("bp-tower-core")) {
    const pg8 = beginPhase("bp-tower-core");
    const totalTowerCourses = TOWER_COURSES + Math.round(PODIUM_DECK_Y / BRICK_HEIGHT) + TERRACE_H;

    // Build Y-plan course range
    const buildYTowerRange = (sg: THREE.Group, startC: number, endC: number) => {
      for (let c = startC; c < endC; c++) {
        buildYTowerCourse(sg, c);
      }
    };

    // Step 0: Corner SNOT — wing tips (left wing)
    const s8_0 = startStep(pg8);
    for (let i = 0; i < 2; i++) {
      const snot = createTravisBrick({
        name: "Brick 1×1 Studs 4 Sides", partNumber: "4733", description: "Tower corner SNOT",
      });
      snot.position.set(TOWER_X - TOWER_CORE / 2 - TOWER_WING_D + 0.5, TOWER_BASE_Y + (10 + i * 10) * BRICK_HEIGHT, TOWER_Z);
      addToStep(s8_0, snot);
    }

    // Step 1: Corner SNOT — wing tips (right wing)
    const s8_1 = startStep(pg8);
    for (let i = 0; i < 2; i++) {
      const snot = createTravisBrick({
        name: "Brick 1×1 Studs 4 Sides", partNumber: "4733", description: "Tower corner SNOT",
      });
      snot.position.set(TOWER_X + TOWER_CORE / 2 + TOWER_WING_D - 0.5, TOWER_BASE_Y + (10 + i * 10) * BRICK_HEIGHT, TOWER_Z);
      addToStep(s8_1, snot);
    }

    // Steps 2-6: Tower Y-plan courses in ranges
    const midCourse = Math.floor((totalTowerCourses - 5) / 2) + 5;
    const rangeSize = Math.floor((midCourse - 10) / 2);

    const s8_2 = startStep(pg8);
    buildYTowerRange(s8_2, 10, 10 + rangeSize);

    const s8_3 = startStep(pg8);
    buildYTowerRange(s8_3, 10 + rangeSize, midCourse);

    // Step 4: Mid structural plate (covers core + wing stubs)
    const s8_4 = startStep(pg8);
    {
      const plateY = TOWER_BASE_Y + midCourse * BRICK_HEIGHT;
      // Core plate
      const plate = createPlate(TOWER_CORE + 2, TOWER_CORE + 2, WHITE_MAT, {
        name: "Plate 2×6", partNumber: "3795", description: "Tower floor plate",
      }, true);
      plate.position.set(TOWER_X, plateY, TOWER_Z);
      addToStep(s8_4, plate);
    }

    const upperRange = Math.floor((totalTowerCourses - midCourse) / 3);

    const s8_5 = startStep(pg8);
    buildYTowerRange(s8_5, midCourse, midCourse + upperRange);

    const s8_6 = startStep(pg8);
    buildYTowerRange(s8_6, midCourse + upperRange, midCourse + upperRange * 2);

    // Steps 7-9: Upper tower
    const s8_7 = startStep(pg8);
    buildYTowerRange(s8_7, midCourse + upperRange * 2, midCourse + upperRange * 3);

    const s8_8 = startStep(pg8);
    buildYTowerRange(s8_8, midCourse + upperRange * 3, Math.min(midCourse + upperRange * 4, totalTowerCourses - 1));

    const s8_9 = startStep(pg8);
    buildYTowerRange(s8_9, Math.min(midCourse + upperRange * 4, totalTowerCourses - 1), totalTowerCourses);

    // Step 10: Top structural plate
    const s8_10 = startStep(pg8);
    {
      const plateY = TOWER_BASE_Y + totalTowerCourses * BRICK_HEIGHT;
      const plate = createPlate(TOWER_CORE + 2, TOWER_CORE + 2, WHITE_MAT, {
        name: "Plate 2×6", partNumber: "3795", description: "Tower top plate",
      }, true);
      plate.position.set(TOWER_X, plateY, TOWER_Z);
      addToStep(s8_10, plate);
    }

    // Step 11: Final visible course
    const s8_11 = startStep(pg8);
    {
      const finalY = TOWER_BASE_Y + totalTowerCourses * BRICK_HEIGHT + PLATE_HEIGHT;
      buildYTowerCourse(s8_11, totalTowerCourses);
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // PHASE 9: Tower Facade & Window Bands (11 steps)
  // ════════════════════════════════════════════════════════════════════
  if (show("bp-tower-facade")) {
    const pg9 = beginPhase("bp-tower-facade");
    const terraceWallY = PODIUM_DECK_Y + PLATE_HEIGHT;
    const towerVisibleStart = terraceWallY + TERRACE_H * BRICK_HEIGHT + 2;
    const grilleInfo9: PieceInfo = { name: "Grille Brick 1×2", partNumber: "2877", description: "Tower window band" };
    const winInfo9: PieceInfo = { name: "Trans-Clear Brick 1×2", partNumber: "3065", description: "Tower window" };
    const slabInfo9: PieceInfo = { name: "Plate 2×6", partNumber: "3795", description: "Tower balcony slab" };

    // Wing facade positions for Y-plan: front of back wing, right side of right wing, left side of left wing
    const wingFacades: { x: number; z: number; w: number; d: number; rotated: boolean }[] = [
      { x: TOWER_X, z: TOWER_Z - TOWER_CORE / 2 - TOWER_WING_D, w: TOWER_WING_W, d: 1, rotated: false }, // back wing tip
      { x: TOWER_X + TOWER_CORE / 2 + TOWER_WING_D, z: TOWER_Z, w: 1, d: TOWER_WING_W, rotated: true },  // right wing tip
      { x: TOWER_X - TOWER_CORE / 2 - TOWER_WING_D, z: TOWER_Z, w: 1, d: TOWER_WING_W, rotated: true },  // left wing tip
    ];

    // Steps 0-6: Window bands on each wing face
    for (let band = 0; band < 7; band++) {
      const sg = startStep(pg9);
      const by = towerVisibleStart + (3 + band * 4) * BRICK_HEIGHT;
      for (const wf of wingFacades) {
        const grille = createGrilleTile(wf.w, wf.d, grilleInfo9);
        if (wf.rotated) grille.rotation.x = Math.PI / 2;
        grille.position.set(wf.x, by, wf.z);
        addToStep(sg, grille);
        const win = createBrick(wf.w, wf.d, 1, TRANS_MAT, winInfo9);
        win.position.set(wf.x, by + BRICK_HEIGHT, wf.z);
        addToStep(sg, win);
      }
    }

    // Step 7: Balcony slabs — lower 3 (Y-plan: cross-shaped slab covers core + wing stubs)
    const s9_7 = startStep(pg9);
    for (let band = 0; band < 3; band++) {
      const by = towerVisibleStart + (3 + band * 4) * BRICK_HEIGHT;
      const slab = createPlate(TOWER_CORE + 2, TOWER_CORE + 2, WHITE_MAT, slabInfo9, true);
      slab.position.set(TOWER_X, by + BRICK_HEIGHT + PLATE_HEIGHT, TOWER_Z);
      addToStep(s9_7, slab);
    }

    // Steps 8-10: Upper balcony slabs
    for (let s = 0; s < 3; s++) {
      const sg = startStep(pg9);
      const by = towerVisibleStart + (3 + (3 + s) * 4) * BRICK_HEIGHT;
      const slab = createPlate(TOWER_CORE + 2, TOWER_CORE + 2, WHITE_MAT, slabInfo9, true);
      slab.position.set(TOWER_X, by + BRICK_HEIGHT + PLATE_HEIGHT, TOWER_Z);
      addToStep(sg, slab);
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // PHASE 10: Tower Crown (10 steps)
  // ════════════════════════════════════════════════════════════════════
  if (show("bp-tower-crown")) {
    const pg10 = beginPhase("bp-tower-crown");
    const totalTowerCourses = TOWER_COURSES + Math.round(PODIUM_DECK_Y / BRICK_HEIGHT) + TERRACE_H;
    const crownBaseY = TOWER_BASE_Y + totalTowerCourses * BRICK_HEIGHT + PLATE_HEIGHT + BRICK_HEIGHT;
    const terraceWallY = PODIUM_DECK_Y + PLATE_HEIGHT;
    const towerVisibleStart2 = terraceWallY + TERRACE_H * BRICK_HEIGHT + 2;
    const cheeseInfo: PieceInfo = { name: "Cheese Slope 1×1×2/3", partNumber: "54200", description: "Serrated edge" };

    // Cheese slope wedge at wing tips of Y-plan tower
    const makeWedge = (wingDir: "left" | "right" | "back", by: number, sg: THREE.Group) => {
      const cheese = new THREE.Group();
      const wedgeShape = new THREE.Shape();
      wedgeShape.moveTo(0, 0);
      wedgeShape.lineTo(0.7, 0);
      wedgeShape.lineTo(0, 0.5);
      wedgeShape.closePath();
      const wedgeGeo = new THREE.ExtrudeGeometry(wedgeShape, { depth: 0.8, bevelEnabled: false });
      const wedgeMesh = new THREE.Mesh(wedgeGeo, WHITE_MAT);
      wedgeMesh.rotation.x = -Math.PI / 2;
      wedgeMesh.position.z = -0.4;
      (wedgeMesh as any).pieceInfo = cheeseInfo;
      wedgeMesh.castShadow = true;
      cheese.add(wedgeMesh);
      if (wingDir === "left") {
        cheese.position.set(TOWER_X - TOWER_CORE / 2 - TOWER_WING_D - 0.5, by, TOWER_Z);
      } else if (wingDir === "right") {
        cheese.position.set(TOWER_X + TOWER_CORE / 2 + TOWER_WING_D + 0.5, by, TOWER_Z);
      } else {
        cheese.position.set(TOWER_X, by, TOWER_Z - TOWER_CORE / 2 - TOWER_WING_D - 0.5);
      }
      addToStep(sg, cheese);
    };

    // Steps 0-3: Serrated edges (cheese slopes) on Y-plan wing tips
    const s10_0 = startStep(pg10);
    for (let band = 0; band < 2; band++) {
      const by = towerVisibleStart2 + (5 + band * 5) * BRICK_HEIGHT;
      makeWedge("left", by, s10_0);
    }

    const s10_1 = startStep(pg10);
    for (let band = 0; band < 2; band++) {
      const by = towerVisibleStart2 + (5 + band * 5) * BRICK_HEIGHT;
      makeWedge("right", by, s10_1);
    }

    const s10_2 = startStep(pg10);
    for (let band = 2; band < 4; band++) {
      const by = towerVisibleStart2 + (5 + band * 5) * BRICK_HEIGHT;
      makeWedge("back", by, s10_2);
    }

    const s10_3 = startStep(pg10);
    for (let band = 2; band < 4; band++) {
      const by = towerVisibleStart2 + (5 + band * 5) * BRICK_HEIGHT;
      makeWedge("left", by, s10_3);
    }

    // Step 4: Crown slopes — 3 wedges converging (one per wing direction)
    const s10_4 = startStep(pg10);
    {
      // Back wing slope
      const slopeBack = createSlope(TOWER_WING_W, TOWER_WING_D, 45, {
        name: "Slope 1×2 (45°)", partNumber: "3040", description: "Crown back wing",
      });
      slopeBack.position.set(TOWER_X, crownBaseY, TOWER_Z - TOWER_CORE / 2 - 1);
      addToStep(s10_4, slopeBack);
    }

    // Step 5: Crown slopes — right wing
    const s10_5 = startStep(pg10);
    {
      const slopeRight = createSlope(TOWER_WING_D, TOWER_WING_W, 45, {
        name: "Slope 3×4 (25°)", partNumber: "3297", description: "Crown right wing",
      });
      slopeRight.position.set(TOWER_X + TOWER_CORE / 2 + 1, crownBaseY, TOWER_Z);
      addToStep(s10_5, slopeRight);
    }

    // Step 6: Crown slopes — left wing
    const s10_6 = startStep(pg10);
    {
      const slopeLeft = createSlope(TOWER_WING_D, TOWER_WING_W, 45, {
        name: "Slope 3×4 (25°)", partNumber: "3297", description: "Crown left wing",
      });
      slopeLeft.position.set(TOWER_X - TOWER_CORE / 2 - 1, crownBaseY, TOWER_Z);
      addToStep(s10_6, slopeLeft);
    }

    // Step 7: Crown core convergence
    const s10_7 = startStep(pg10);
    {
      const coreCrown = createSlope(TOWER_CORE, TOWER_CORE, 65, {
        name: "Slope 1×2×2 (65°)", partNumber: "60481", description: "Crown steep core",
      });
      coreCrown.position.set(TOWER_X, crownBaseY + BRICK_HEIGHT, TOWER_Z);
      addToStep(s10_7, coreCrown);
    }

    // Step 8: Cap tile
    const s10_8 = startStep(pg10);
    const capY = crownBaseY + 2 * BRICK_HEIGHT;
    const cap = createTile(TOWER_CORE, TOWER_CORE, WHITE_MAT, {
      name: "Tile 2×2", partNumber: "3068b", description: "Tower cap",
    });
    cap.position.set(TOWER_X, capY + BRICK_HEIGHT, TOWER_Z);
    addToStep(s10_8, cap);

    // Step 9: Mechanical penthouse — single 1×1 on top
    const s10_9 = startStep(pg10);
    const mech = createBrick(1, 1, 1, DARK_MAT, {
      name: "Brick 1×1", partNumber: "3005", description: "Mechanical penthouse",
    }, true);
    mech.position.set(TOWER_X, capY + BRICK_HEIGHT + PLATE_HEIGHT, TOWER_Z);
    addToStep(s10_9, mech);
  }

  // ════════════════════════════════════════════════════════════════════
  // PHASE 11: The Conservatory (13 steps)
  // ════════════════════════════════════════════════════════════════════
  if (show("bp-conservatory")) {
    const pg11 = beginPhase("bp-conservatory");
    const terraceWallY = PODIUM_DECK_Y + PLATE_HEIGHT;
    const conX = TERRACE_X + TERRACE_W / 2 - 2;
    const conZ = TERRACE_Z;
    const conBaseY = terraceWallY + TERRACE_H * BRICK_HEIGHT + PLATE_HEIGHT;

    // Step 0: Base plate
    const s11_0 = startStep(pg11);
    const conBase = createPlate(6, 4, WHITE_MAT, {
      name: "Plate 4×6", partNumber: "3032", description: "Conservatory base",
    }, true);
    conBase.position.set(conX, conBaseY, conZ);
    addToStep(s11_0, conBase);

    // Step 1: Side walls
    const s11_1 = startStep(pg11);
    for (const sx of [-3, 3]) {
      const wall = createBrick(1, 1, 1, WHITE_MAT, {
        name: "Brick 1×1", partNumber: "3005", description: "Conservatory wall",
      }, true);
      wall.position.set(conX + sx, conBaseY + PLATE_HEIGHT, conZ);
      addToStep(s11_1, wall);
    }

    // Step 2: Back wall
    const s11_2 = startStep(pg11);
    {
      const wall = createBrick(4, 1, 1, WHITE_MAT, {
        name: "Brick 1×4", partNumber: "3010", description: "Conservatory back wall",
      }, true);
      wall.position.set(conX, conBaseY + PLATE_HEIGHT, conZ + 2);
      addToStep(s11_2, wall);
    }

    // Step 3: Corner infill — Left
    const s11_3 = startStep(pg11);
    {
      const corner = createBrick(1, 1, 1, WHITE_MAT, {
        name: "Brick 1×1", partNumber: "3005", description: "Conservatory corner",
      }, true);
      corner.position.set(conX - 2.5, conBaseY + PLATE_HEIGHT, conZ + 1.5);
      addToStep(s11_3, corner);
    }

    // Step 4: Corner infill — Right
    const s11_4 = startStep(pg11);
    {
      const corner = createBrick(1, 1, 1, WHITE_MAT, {
        name: "Brick 1×1", partNumber: "3005", description: "Conservatory corner",
      }, true);
      corner.position.set(conX + 2.5, conBaseY + PLATE_HEIGHT, conZ + 1.5);
      addToStep(s11_4, corner);
    }

    // Step 5: Front windows
    const s11_5 = startStep(pg11);
    for (let i = 0; i < 3; i++) {
      const panel = createPanel(2, 2, {
        name: "Trans-Clear Panel 1×2×2", partNumber: "87552", description: "Conservatory glass",
      });
      panel.position.set(conX - 2 + i * 2, conBaseY + PLATE_HEIGHT, conZ - 2);
      addToStep(s11_5, panel);
    }

    // Step 6: Side & back windows
    const s11_6 = startStep(pg11);
    for (const sx of [-3, 3]) {
      for (let i = 0; i < 2; i++) {
        const win = createBrick(1, 2, 1, TRANS_MAT, {
          name: "Trans-Clear Brick 1×2", partNumber: "3065", description: "Conservatory side glass",
        });
        win.position.set(conX + sx, conBaseY + PLATE_HEIGHT, conZ - 1 + i * 2);
        addToStep(s11_6, win);
      }
    }

    // Step 7: Interior planting — dense
    const s11_7 = startStep(pg11);
    for (const [px, pz] of [[0, 0], [-1, 1]] as [number, number][]) {
      const plant = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 12), GREEN_MAT);
      plant.position.set(conX + px, conBaseY + PLATE_HEIGHT + 0.2, conZ + pz);
      (plant as any).pieceInfo = { name: "Plate 1×1 Round", partNumber: "4073", description: "Plant" };
      plant.castShadow = true;
      addToStep(s11_7, plant);
    }

    // Step 8: Interior planting — scattered
    const s11_8 = startStep(pg11);
    {
      const plant = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 12), GREEN_MAT);
      plant.position.set(conX + 1, conBaseY + PLATE_HEIGHT + 0.2, conZ - 1);
      (plant as any).pieceInfo = { name: "Plate 1×1 Round", partNumber: "4073", description: "Plant" };
      plant.castShadow = true;
      addToStep(s11_8, plant);
    }

    // Step 9: Interior floor
    const s11_9 = startStep(pg11);
    {
      const floor = createTile(4, 3, DARK_MAT, {
        name: "Tile 2×2", partNumber: "3068b", description: "Conservatory floor",
      });
      floor.position.set(conX, conBaseY + 0.01, conZ);
      addToStep(s11_9, floor);
    }

    // Step 10: Glass roof
    const s11_10 = startStep(pg11);
    {
      const roofY = conBaseY + PLATE_HEIGHT + BRICK_HEIGHT;
      for (let i = 0; i < 3; i++) {
        const ls = createCurvedSlope("left", {
          name: "Curved Slope 3×1", partNumber: "50950", description: "Conservatory roof",
        });
        ls.position.set(conX - 2 + i * 2, roofY, conZ);
        addToStep(s11_10, ls);
        const rs = createCurvedSlope("right", {
          name: "Curved Slope 3×1", partNumber: "50950", description: "Conservatory roof",
        });
        rs.position.set(conX - 2 + i * 2, roofY, conZ);
        addToStep(s11_10, rs);
      }
      const roofGlass = createPlate(4, 3, TRANS_MAT, {
        name: "Trans-Clear Plate 1×2", partNumber: "3023", description: "Glass roof",
      }, true);
      roofGlass.position.set(conX, roofY + 0.6, conZ);
      addToStep(s11_10, roofGlass);
    }

    // Step 11: Rooftop platform
    const s11_11 = startStep(pg11);
    const platform = createPlate(6, 4, WHITE_MAT, {
      name: "Plate 4×4 Round Corner", partNumber: "30565", description: "Rooftop platform",
    }, true);
    platform.position.set(conX, conBaseY - PLATE_HEIGHT, conZ);
    addToStep(s11_11, platform);

    // Step 12: Platform connections
    const s11_12 = startStep(pg11);
    for (const xOff of [-2, 2]) {
      const pin = createPlate(1, 1, WHITE_MAT, {
        name: "Plate 1×1 Round", partNumber: "4073", description: "Platform pin",
      }, true);
      pin.position.set(conX + xOff, conBaseY - PLATE_HEIGHT + 0.01, conZ);
      addToStep(s11_12, pin);
    }
  }

  // ════════════════════════════════════════════════════════════════════
  // PHASE 12: Landscaping & Details (33 steps)
  // ════════════════════════════════════════════════════════════════════
  if (show("bp-landscaping")) {
    const pg12 = beginPhase("bp-landscaping");
    const tileInfo12: PieceInfo = { name: "Tile 1×4", partNumber: "2431", description: "Paving tile" };
    const bollardInfo: PieceInfo = { name: "Round Plate 1×1", partNumber: "4073", description: "Bollard" };
    const planterInfo: PieceInfo = { name: "Brick 1×1", partNumber: "3005", description: "Planter" };
    const canopyInfo: PieceInfo = { name: "Plate 1×1 Round", partNumber: "4073", description: "Tree canopy" };

    const treePosns: [number, number][] = [
      [-8, 4], [-4, 4], [0, 4], [4, 4], [8, 4],
      [-6, 10], [-2, 10], [2, 10], [6, 10],
    ];

    // Steps 0-1: Paving tiles
    const s12_0 = startStep(pg12);
    for (let i = 0; i < 5; i++) {
      const tile = createTile(4, 1, DARK_MAT, tileInfo12);
      tile.position.set(-8 + i * 4, PODIUM_DECK_Y + PLATE_HEIGHT, 5);
      addToStep(s12_0, tile);
    }

    const s12_1 = startStep(pg12);
    for (let i = 0; i < 5; i++) {
      const tile = createTile(4, 1, DARK_MAT, tileInfo12);
      tile.position.set(-6 + i * 4, PODIUM_DECK_Y + PLATE_HEIGHT, 5);
      addToStep(s12_1, tile);
    }

    // Steps 2-3: Lakeside promenade
    const s12_2 = startStep(pg12);
    {
      const path = createTile(8, 1, DARK_MAT, { name: "Tile 1×6", partNumber: "6636", description: "Promenade left" });
      path.position.set(-4, PLATE_HEIGHT, 2.5);
      addToStep(s12_2, path);
    }

    const s12_3 = startStep(pg12);
    {
      const path = createTile(8, 1, DARK_MAT, { name: "Tile 1×6", partNumber: "6636", description: "Promenade right" });
      path.position.set(4, PLATE_HEIGHT, 2.5);
      addToStep(s12_3, path);
    }

    // Steps 4-5: Bollards
    const s12_4 = startStep(pg12);
    for (let i = 0; i < 3; i++) {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8), DARK_MAT);
      bollard.position.set(-6 + i * 3, PLATE_HEIGHT + 0.2, 2.5);
      (bollard as any).pieceInfo = bollardInfo;
      bollard.castShadow = true;
      addToStep(s12_4, bollard);
    }

    const s12_5 = startStep(pg12);
    for (let i = 0; i < 3; i++) {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8), DARK_MAT);
      bollard.position.set(0 + i * 3, PLATE_HEIGHT + 0.2, 2.5);
      (bollard as any).pieceInfo = bollardInfo;
      bollard.castShadow = true;
      addToStep(s12_5, bollard);
    }

    // Steps 6-7: Long walkway strips
    const s12_6 = startStep(pg12);
    {
      const strip = createTile(6, 1, DARK_MAT, { name: "Tile 1×6", partNumber: "6636", description: "Walkway strip" });
      strip.position.set(-3, PODIUM_DECK_Y + PLATE_HEIGHT, 1);
      addToStep(s12_6, strip);
    }

    const s12_7 = startStep(pg12);
    {
      const plaza = createTile(6, 4, DARK_MAT, { name: "Tile 2×2", partNumber: "3068b", description: "Plaza" });
      plaza.position.set(0, PLATE_HEIGHT, 3);
      addToStep(s12_7, plaza);
    }

    // Steps 8-11: Ground plane infill
    for (let step = 0; step < 4; step++) {
      const sg = startStep(pg12);
      const tile = createTile(3, 2, DARK_MAT, {
        name: "Plate 1×1", partNumber: "3024w", description: "Ground infill",
      });
      tile.position.set(-6 + step * 4, PLATE_HEIGHT, 4);
      addToStep(sg, tile);
    }

    // Step 12: Highwalk extension
    const s12_12 = startStep(pg12);
    {
      const hw = createTile(4, 1, DARK_MAT, tileInfo12);
      hw.position.set(-4, PODIUM_DECK_Y + PLATE_HEIGHT, -1);
      addToStep(s12_12, hw);
    }

    // Step 13: Terrace extensions
    const s12_13 = startStep(pg12);
    {
      const ext = createTile(4, 1, DARK_MAT, tileInfo12);
      ext.position.set(4, PODIUM_DECK_Y + PLATE_HEIGHT, -1);
      addToStep(s12_13, ext);
    }

    // Steps 14-18: Edge detail bricks
    const edgeBricks: [string, string, number][] = [
      ["Brick 1×4", "3010", -8],
      ["Brick 1×4", "3010", -4],
      ["Brick 1×2", "3004", 0],
      ["Brick 1×3", "3622", 4],
      ["Brick 1×6", "3009", 8],
    ];
    for (const [name, pn, x] of edgeBricks) {
      const sg = startStep(pg12);
      const detail = createBrick(2, 1, 1, WHITE_MAT, {
        name: name as string, partNumber: pn as string, description: "Edge detail",
      }, true);
      detail.position.set(x as number, PLATE_HEIGHT, TERRACE_Z + TERRACE_D / 2 + 2);
      addToStep(sg, detail);
    }

    // Steps 19-20: Wall junction & corner
    const s12_19 = startStep(pg12);
    {
      const detail = createBrick(1, 1, 1, WHITE_MAT, {
        name: "Brick 2×2", partNumber: "3003", description: "Wall junction",
      }, true);
      detail.position.set(-4.5, PLATE_HEIGHT, TERRACE_Z - TERRACE_D / 2 - 0.5);
      addToStep(s12_19, detail);
    }

    const s12_20 = startStep(pg12);
    {
      const detail = createBrick(1, 1, 1, WHITE_MAT, {
        name: "Brick 1×1", partNumber: "3005", description: "Wall corner",
      }, true);
      detail.position.set(4.5, PLATE_HEIGHT, TERRACE_Z - TERRACE_D / 2 - 0.5);
      addToStep(s12_20, detail);
    }

    // Step 21: Final brick infill
    const s12_21 = startStep(pg12);
    {
      const infill = createBrick(1, 1, 1, WHITE_MAT, {
        name: "Brick 1×2", partNumber: "3004", description: "Final infill",
      }, true);
      infill.position.set(TOWER_X, PLATE_HEIGHT, TOWER_Z + TOWER_D / 2 + 1);
      addToStep(s12_21, infill);
    }

    // Step 22: Entrance threshold
    const s12_22 = startStep(pg12);
    {
      const threshold = createTile(3, 1, DARK_MAT, {
        name: "Tile 2×2", partNumber: "3068b", description: "Entrance threshold",
      });
      threshold.position.set(-3.5, PODIUM_DECK_Y + 0.02, 5);
      addToStep(s12_22, threshold);
    }

    // Step 23: Walkway cap
    const s12_23 = startStep(pg12);
    {
      const cap = createTile(3, 1, DARK_MAT, {
        name: "Tile 1×8", partNumber: "4162", description: "Walkway cap",
      });
      cap.position.set(3.5, PODIUM_DECK_Y + 0.02, 5);
      addToStep(s12_23, cap);
    }

    // Steps 24-25: Trees — front row
    const s12_24 = startStep(pg12);
    for (const [tx, tz] of treePosns.slice(0, 3)) {
      const planter = createBrick(1, 1, 1, WHITE_MAT, planterInfo, true);
      planter.position.set(tx, PLATE_HEIGHT, tz);
      addToStep(s12_24, planter);
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), GREEN_MAT);
      canopy.position.set(tx, PLATE_HEIGHT + BRICK_HEIGHT + 0.5, tz);
      (canopy as any).pieceInfo = canopyInfo;
      canopy.castShadow = true;
      addToStep(s12_24, canopy);
    }

    const s12_25 = startStep(pg12);
    for (const [tx, tz] of treePosns.slice(3, 5)) {
      const planter = createBrick(1, 1, 1, WHITE_MAT, planterInfo, true);
      planter.position.set(tx, PLATE_HEIGHT, tz);
      addToStep(s12_25, planter);
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), GREEN_MAT);
      canopy.position.set(tx, PLATE_HEIGHT + BRICK_HEIGHT + 0.5, tz);
      (canopy as any).pieceInfo = canopyInfo;
      canopy.castShadow = true;
      addToStep(s12_25, canopy);
    }

    // Steps 26-27: Landscape slopes
    const s12_26 = startStep(pg12);
    {
      const slope = createSlope(2, 1, 25, {
        name: "Slope 2×4 (45°)", partNumber: "3037", description: "Landscape slope",
      });
      slope.position.set(-4, PLATE_HEIGHT, 5);
      addToStep(s12_26, slope);
    }

    const s12_27 = startStep(pg12);
    {
      const slope = createSlope(3, 4, 25, {
        name: "Slope 3×4 (25°)", partNumber: "3297", description: "Landscape slope",
      });
      slope.position.set(4.5, PLATE_HEIGHT, 5);
      addToStep(s12_27, slope);
    }

    // Steps 28-29: Structural soffits
    const s12_28 = startStep(pg12);
    {
      const soffit = createInvertedSlope(2, 1, {
        name: "Slope 1×2 Inverted", partNumber: "3665", description: "Deck soffit",
      });
      soffit.position.set(-3, PODIUM_DECK_Y - PLATE_HEIGHT, 5);
      addToStep(s12_28, soffit);
    }

    const s12_29 = startStep(pg12);
    {
      const soffit = createInvertedSlope(2, 1, {
        name: "Slope 1×2×2 (65°)", partNumber: "60481", description: "Steep terrain",
      });
      soffit.position.set(3, PODIUM_DECK_Y - PLATE_HEIGHT, 5);
      addToStep(s12_29, soffit);
    }

    // Steps 30-31: Final edge strips
    const s12_30 = startStep(pg12);
    {
      const strip = createTile(4, 1, DARK_MAT, {
        name: "Plate 1×1", partNumber: "3024w", description: "Edge strip",
      });
      strip.position.set(-4, PLATE_HEIGHT, LAKE_Z + 4);
      addToStep(s12_30, strip);
    }

    const s12_31 = startStep(pg12);
    {
      const strip = createTile(4, 1, DARK_MAT, {
        name: "Plate 1×6", partNumber: "3666", description: "Walkway strip",
      });
      strip.position.set(4, PLATE_HEIGHT, LAKE_Z + 4);
      addToStep(s12_31, strip);
    }

    // Step 32: Back row trees
    const s12_32 = startStep(pg12);
    for (const [tx, tz] of treePosns.slice(5)) {
      const planter = createBrick(1, 1, 1, WHITE_MAT, planterInfo, true);
      planter.position.set(tx, PLATE_HEIGHT, tz);
      addToStep(s12_32, planter);
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), GREEN_MAT);
      canopy.position.set(tx, PLATE_HEIGHT + BRICK_HEIGHT + 0.5, tz);
      (canopy as any).pieceInfo = canopyInfo;
      canopy.castShadow = true;
      addToStep(s12_32, canopy);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // STEP VISIBILITY — Show/hide steps based on phase and progress
  // ═══════════════════════════════════════════════════════════════════
  const effectiveStepIndex = stepIndex ?? Infinity;
  model.children.forEach((obj) => {
    const pg = obj as THREE.Group;
    const pid = pg.userData.phaseId as string | undefined;
    if (!pid) return;

    const status = getPhaseStatus(pid);
    const fullyCompleted = isPhaseFullyCompleted(pid);

    pg.children.forEach((child) => {
      const sg = child as THREE.Group;
      if (sg.userData.stepIndex === undefined) return;
      const si = sg.userData.stepIndex as number;
      const stepId = `${pid}-${si}`;

      if (status === "current") {
        sg.visible = effectiveStepIndex >= 0 && si <= effectiveStepIndex;
      } else if (status === "past" || fullyCompleted) {
        sg.visible = true;
      } else {
        sg.visible = completedSteps.has(stepId);
      }
    });

    // Active step highlighting
    if (status === "current") {
      let maxVisibleStep = -1;
      pg.children.forEach((child) => {
        const sg = child as THREE.Group;
        if (sg.userData.stepIndex !== undefined && sg.visible) {
          if ((sg.userData.stepIndex as number) > maxVisibleStep) {
            maxVisibleStep = sg.userData.stepIndex as number;
          }
        }
      });
      if (maxVisibleStep >= 0) {
        pg.children.forEach((child) => {
          const sg = child as THREE.Group;
          if (sg.userData.stepIndex === maxVisibleStep && sg.visible) {
            activeStepGroupRef = sg;
            applyActiveStepStyle(sg);
          }
        });
      }
    }
  });

  (model as any)._activeStepGroup = activeStepGroupRef;

  return model;
}

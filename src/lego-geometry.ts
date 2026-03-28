import * as THREE from "three";

// LEGO dimensions in "stud units" — 1 stud = 8mm real, we use 1.0 unit
const PLATE_HEIGHT = 0.4; // 3.2mm / 8mm
const BRICK_HEIGHT = 1.2; // 9.6mm / 8mm (plate height * 3)
const STUD_RADIUS = 0.3;
const STUD_HEIGHT = 0.2;
const TOLERANCE = 0.05; // visible seam gap on each side

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

const WATER_MAT = new THREE.MeshStandardMaterial({
  color: 0x93c5fd,
  roughness: 0.05,
  metalness: 0.1,
  transparent: true,
  opacity: 0.5,
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

// Red outline material for LEGO-instruction-style active step highlighting
const RED_EDGE_MAT = new THREE.LineBasicMaterial({
  color: 0xff2222,
  transparent: true,
  opacity: 0.6,
  linewidth: 1,
});

// Red wireframe material for selection glow (scaled-up duplicate)
const RED_WIREFRAME_MAT = new THREE.MeshBasicMaterial({
  color: 0xff2222,
  wireframe: true,
  transparent: true,
  opacity: 0.08,
});

// Subtle edge line material for all bricks
const EDGE_LINE_MAT = new THREE.LineBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 0.08,
});

// Groove line material for grille bricks
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

// Shared stud cylinder (slightly tapered for chamfer effect)
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
// ═══════════════════════════════════════════════════════════════════════

/**
 * Standard Brick — w studs wide, d studs deep, h brick-heights tall.
 * Body includes tolerance gaps for visible seams between adjacent pieces.
 */
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

  // Body with tolerance gap
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

  // Studs on top (skip for transparent bricks)
  if (!noStuds && mat !== TRANS_MAT) {
    addStudsToGroup(group, w, d, height, info);
  }

  return group;
}

/**
 * Plate — plate-height brick. Studs on top unless smooth=true.
 */
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

/**
 * Tile — smooth-topped plate (no studs). Defining feature: flat top.
 */
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

/**
 * Grille Tile — Part 2412b. No studs, 3 thin raised ridges across top.
 * Ridges run along the Z axis (short axis of a 1x2 tile).
 */
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

  // 3 thin raised ridges on top surface, running along Z axis
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

/**
 * Headlight Brick — Part 4070. L-shaped side profile with stud on top
 * and stud on front face pointing forward (+Z).
 */
export function createHeadlightBrick(info?: PieceInfo): THREE.Group {
  const group = new THREE.Group();

  // Lower shelf: full depth (1.0), height = PLATE_HEIGHT
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

  // Upper section: reduced depth (0.6), height = 2 * PLATE_HEIGHT
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

  // Stud on top (pointing up)
  const topStud = new THREE.Mesh(_studGeo, STUD_MAT);
  topStud.position.set(0, BRICK_HEIGHT + STUD_HEIGHT / 2, -0.2);
  topStud.castShadow = true;
  if (info) (topStud as any).pieceInfo = info;
  group.add(topStud);

  // Stud on front face (+Z), centered on recessed face
  const frontStud = new THREE.Mesh(_studGeo, STUD_MAT);
  frontStud.rotation.x = Math.PI / 2;
  frontStud.position.set(0, PLATE_HEIGHT + upperHeight / 2, 0.5 - TOLERANCE + STUD_HEIGHT / 2);
  frontStud.castShadow = true;
  if (info) (frontStud as any).pieceInfo = info;
  group.add(frontStud);

  return group;
}

/**
 * Side-Stud Brick — Part 30414 (1×w with side studs on front face).
 * Standard brick body, studs on top, studs on front face (+Z side).
 */
export function createSideStudBrick(
  w: number,
  info?: PieceInfo
): THREE.Group {
  const material = WHITE_MAT;
  const height = BRICK_HEIGHT;
  const d = 1; // always 1 stud deep
  const group = new THREE.Group();

  // Brick body with tolerance
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

  // Top studs (normal)
  addStudsToGroup(group, w, d, height, info);

  // Front-face studs (+Z side), pointing outward
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

/**
 * Travis Brick — Part 4733 (1×1 with studs on all 4 sides + top).
 */
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

  // Top stud
  const topStud = new THREE.Mesh(_studGeo, STUD_MAT);
  topStud.position.set(0, height + STUD_HEIGHT / 2, 0);
  topStud.castShadow = true;
  if (info) (topStud as any).pieceInfo = info;
  group.add(topStud);

  // 4 side studs (one per face, centered vertically)
  const dirs: [number, number, number][] = [
    [0, 0, 1],   // +Z
    [0, 0, -1],  // -Z
    [1, 0, 0],   // +X
    [-1, 0, 0],  // -X
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

/**
 * Round Brick — 1×1 (3062b) or 2×2 (3941) depending on diameter.
 */
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

  // Edge lines for cylinder
  const edgesGeo = new THREE.EdgesGeometry(cylGeo);
  const edgeLines = new THREE.LineSegments(edgesGeo, EDGE_LINE_MAT);
  edgeLines.position.y = height / 2;
  group.add(edgeLines);

  // Single stud on top center
  const stud = new THREE.Mesh(_studGeo, STUD_MAT);
  stud.position.y = height + STUD_HEIGHT / 2;
  stud.castShadow = true;
  if (info) (stud as any).pieceInfo = info;
  group.add(stud);

  return group;
}

/**
 * Macaroni Brick — Part 85080. Quarter-cylinder arc, open interior.
 */
export function createMacaroniBrick(info?: PieceInfo): THREE.Group {
  const group = new THREE.Group();
  const outerR = 2.0;
  const innerR = 1.6;

  // Quarter-circle shape from 0 to PI/2
  const shape = new THREE.Shape();
  const segments = 12;

  // Outer arc
  shape.moveTo(outerR, 0);
  for (let i = 1; i <= segments; i++) {
    const angle = (Math.PI / 2) * (i / segments);
    shape.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
  }
  // Inner arc (reverse direction)
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

  const edgesGeo = new THREE.EdgesGeometry(geo);
  const edgeLines = new THREE.LineSegments(edgesGeo, EDGE_LINE_MAT);
  edgeLines.rotation.x = -Math.PI / 2;
  group.add(edgeLines);

  return group;
}

/**
 * Curved Slope — Part 50950. 3 studs long, 1 wide.
 * Smooth convex curve from full BRICK_HEIGHT down to PLATE_HEIGHT.
 */
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

  const edgesGeo = new THREE.EdgesGeometry(geo);
  const edgeLines = new THREE.LineSegments(edgesGeo, EDGE_LINE_MAT);
  edgeLines.rotation.x = -Math.PI / 2;
  edgeLines.position.z = -(1 - TOLERANCE * 2) / 2;
  group.add(edgeLines);

  return group;
}

/**
 * Arch — Part 3659 (1×4 arch). Rectangular with semi-circular cutout on bottom.
 * 4 studs wide, BRICK_HEIGHT tall, studs on top.
 */
export function createArch(info?: PieceInfo): THREE.Group {
  const group = new THREE.Group();
  const w = 4;
  const d = 1;
  const bw = w - TOLERANCE * 2;
  const bd = d - TOLERANCE * 2;

  // Rectangular profile with arch cutout
  const shape = new THREE.Shape();
  shape.moveTo(-bw / 2, 0);
  shape.lineTo(-bw / 2, BRICK_HEIGHT);
  shape.lineTo(bw / 2, BRICK_HEIGHT);
  shape.lineTo(bw / 2, 0);

  // Semi-circular cutout spanning the middle 2 studs
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

  const edgesGeo = new THREE.EdgesGeometry(geo);
  const edgeLines = new THREE.LineSegments(edgesGeo, EDGE_LINE_MAT);
  edgeLines.position.z = -bd / 2;
  group.add(edgeLines);

  // Studs on top at all 4 positions
  addStudsToGroup(group, w, d, BRICK_HEIGHT, info);

  return group;
}

/**
 * Panel — Part 87552. Thin upright wall with small feet at bottom edges.
 */
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

  // Two small feet at bottom edges (extending backward)
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

/**
 * Inverted Slope — Angled cut on the BOTTOM face.
 * w wide, BRICK_HEIGHT tall, d deep.
 */
export function createInvertedSlope(
  w: number,
  d: number,
  info?: PieceInfo
): THREE.Group {
  const group = new THREE.Group();
  const h = BRICK_HEIGHT;

  // Trapezoidal cross-section: flat top, angled bottom
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, h);        // top-left (flat top)
  shape.lineTo(w / 2, h);         // top-right
  shape.lineTo(w / 2, 0);         // bottom-right (full depth)
  shape.lineTo(-w / 2, h * 0.4);  // bottom-left (raised = angled bottom)
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

  const edgesGeo = new THREE.EdgesGeometry(geo);
  const edgeLines = new THREE.LineSegments(edgesGeo, EDGE_LINE_MAT);
  edgeLines.position.z = -bd / 2;
  group.add(edgeLines);

  // Studs on top
  addStudsToGroup(group, w, d, h, info);

  return group;
}

/**
 * Slope — Regular slope. One end full BRICK_HEIGHT, other tapers to ~PLATE_HEIGHT.
 * Smooth angled top face (no studs on slope).
 */
export function createSlope(
  w: number,
  d: number,
  _angle: number = 45,
  info?: PieceInfo
): THREE.Group {
  const group = new THREE.Group();

  // Cross-section: tall on one side, short on other
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

  const edgesGeo = new THREE.EdgesGeometry(geo);
  const edgeLines = new THREE.LineSegments(edgesGeo, EDGE_LINE_MAT);
  edgeLines.position.z = -bd / 2;
  group.add(edgeLines);

  return group;
}

// ═══════════════════════════════════════════════════════════════════════
// BARBICAN PANORAMA — FULL DIORAMA MODEL
// ═══════════════════════════════════════════════════════════════════════

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

// ─── Step Group Helper ────────────────────────────────────────────────

/** Apply LEGO-instruction-style coral highlight to active step pieces.
 *  Replaces materials with coral tints and adds subtle red edge outlines.
 *  Stores original materials for restoration. */
export function applyActiveStepStyle(group: THREE.Group): void {
  const meshesToProcess: THREE.Mesh[] = [];
  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh && (obj as THREE.Mesh).geometry) {
      meshesToProcess.push(obj as THREE.Mesh);
    }
  });

  for (const mesh of meshesToProcess) {
    // Store original material for potential restoration
    (mesh as any)._originalMaterial = mesh.material;

    // Replace materials with coral-tinted versions
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

    // Add subtle red edge outlines
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

  const getPhaseStatus = (pid: string): "current" | "completed" | "past" | "future" => {
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
    if (status === "future") return isPhaseFullyCompleted(pid);
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

  // Layout constants
  const BASE_W = 32;
  const BASE_D = 24;
  const LAKE_Z = 8;
  const PODIUM_Y = PLATE_HEIGHT;
  const PODIUM_DECK_Y = PODIUM_Y + 3 * BRICK_HEIGHT;
  const TERRACE_X = -2;
  const TERRACE_W = 20;
  const TERRACE_D = 3;
  const TERRACE_Z = -3;
  const TERRACE_H = 10;
  const TOWER_X = -2;
  const TOWER_Z = TERRACE_Z - TERRACE_D / 2 - 2;
  const TOWER_W = 6;
  const TOWER_D = 4;
  const TOWER_COURSES = 25;
  const TOWER_BASE_Y = PLATE_HEIGHT;

  // ── PHASE 1: Foundation Platform (10 steps) ────────────────────────────
  if (show("bp-foundation")) {
    const pg1 = beginPhase("bp-foundation");
    const plateInfo: PieceInfo = {
      name: "Plate 8×8",
      partNumber: "41539",
      description: "Foundation plate — 8×8",
    };

    // Step 0: Back Row — First Two Large Plates
    const s1_0 = startStep(pg1);
    for (let col = 0; col < 2; col++) {
      const plate = createPlate(8, 8, WHITE_MAT, plateInfo);
      plate.position.set(-8 + col * 8, 0, -4);
      addToStep(s1_0, plate);
    }

    // Step 1: Back Row — Third Large Plate
    const s1_1 = startStep(pg1);
    {
      const plate = createPlate(8, 8, WHITE_MAT, plateInfo);
      plate.position.set(-8 + 2 * 8, 0, -4);
      addToStep(s1_1, plate);
    }

    // Step 2: Front Row — Two Large Plates
    const s1_2 = startStep(pg1);
    for (let col = 0; col < 2; col++) {
      const plate = createPlate(8, 8, WHITE_MAT, plateInfo);
      plate.position.set(-8 + col * 8, 0, -4 + 8);
      addToStep(s1_2, plate);
    }

    // Step 3: Front Row — Sixth Large Plate
    const s1_3 = startStep(pg1);
    {
      const plate = createPlate(8, 8, WHITE_MAT, plateInfo);
      plate.position.set(-8 + 2 * 8, 0, -4 + 8);
      addToStep(s1_3, plate);
    }

    // Step 4: Front Extension — Lake Zone Plates
    const s1_4 = startStep(pg1);
    const extInfo: PieceInfo = { name: "Plate 6×10", partNumber: "3033", description: "Front extension — lake zone" };
    for (let i = 0; i < 4; i++) {
      const ext = createPlate(BASE_W / 4 - 0.3, 6, WHITE_MAT, extInfo);
      ext.position.set(-BASE_W * 3 / 8 + i * (BASE_W / 4), 0, BASE_D / 2 + 3);
      addToStep(s1_4, ext);
    }

    // Step 5: Side Extensions — Widening the Site
    const s1_5 = startStep(pg1);
    const sideInfo: PieceInfo = { name: "Plate 6×8", partNumber: "3036", description: "Side extension plate" };
    for (const side of [-1, 1]) {
      const sideExt = createPlate(3, BASE_D - 2, WHITE_MAT, sideInfo);
      sideExt.position.set(side * (BASE_W / 2 + 1.5), 0, 0);
      addToStep(s1_5, sideExt);
    }

    // Step 6: Infill — Middle Zone
    const s1_6 = startStep(pg1);
    const fillInfo: PieceInfo = { name: "Plate 4×8", partNumber: "3035", description: "Gap fill plate" };
    const plateW = BASE_W / 3;
    for (let col = 0; col < 2; col++) {
      const fill = createPlate(0.4, BASE_D - 1, DARK_MAT, fillInfo, true);
      fill.position.set(-plateW / 2 + col * plateW, 0.01, 0);
      addToStep(s1_6, fill);
    }
    const frontFill = createPlate(BASE_W - 1, 0.4, DARK_MAT, fillInfo, true);
    frontFill.position.set(0, 0.01, BASE_D / 2);
    addToStep(s1_6, frontFill);

    // Step 7: Infill — Corner Zones
    const s1_7 = startStep(pg1);
    const cornerInfo: PieceInfo = { name: "Plate 6×6", partNumber: "3958", description: "Corner fill plate" };
    for (const sx of [-1, 1]) {
      const corner = createPlate(3, 6, WHITE_MAT, cornerInfo);
      corner.position.set(sx * (BASE_W / 2 + 1.5), 0, BASE_D / 2 + 3);
      addToStep(s1_7, corner);
    }

    // Step 8: Edge Beams — 8 individual Plate 1×10 pieces around the perimeter
    // Each is 10 studs long × 1 stud wide, placed ON TOP of the base plates (y = PLATE_HEIGHT)
    const s1_8 = startStep(pg1);
    const edgeInfo: PieceInfo = { name: "Plate 1×10", partNumber: "4477", description: "Edge reinforcement beam — locks base plate joints" };
    // Front edge: 2 plates end-to-end (covers 20 studs of the ~32-wide front)
    for (let i = 0; i < 2; i++) {
      const edge = createPlate(10, 1, DARK_MAT, edgeInfo);
      edge.position.set(-5 + i * 10, PLATE_HEIGHT, BASE_D / 2);
      addToStep(s1_8, edge);
    }
    // Back edge: 2 plates end-to-end
    for (let i = 0; i < 2; i++) {
      const edge = createPlate(10, 1, DARK_MAT, edgeInfo);
      edge.position.set(-5 + i * 10, PLATE_HEIGHT, -BASE_D / 2);
      addToStep(s1_8, edge);
    }
    // Left edge: 2 plates end-to-end (running front-to-back)
    for (let i = 0; i < 2; i++) {
      const edge = createPlate(1, 10, DARK_MAT, edgeInfo);
      edge.position.set(-BASE_W / 2 + 0.5, PLATE_HEIGHT, -5 + i * 10);
      addToStep(s1_8, edge);
    }
    // Right edge: 2 plates end-to-end
    for (let i = 0; i < 2; i++) {
      const edge = createPlate(1, 10, DARK_MAT, edgeInfo);
      edge.position.set(BASE_W / 2 - 0.5, PLATE_HEIGHT, -5 + i * 10);
      addToStep(s1_8, edge);
    }

    // Step 9: Tower Reinforcement Zone — 6 individual Plate 4×6 stacked in overlapping layers
    // These sit ON TOP of the base plates at the rear, creating a thicker foundation
    const s1_9 = startStep(pg1);
    const towerZoneInfo: PieceInfo = { name: "Plate 4×6", partNumber: "3032", description: "Tower zone reinforcement — extra layer for tower weight" };
    // Layer 1: 3 plates side-by-side across the rear (on base plate studs)
    for (let i = 0; i < 3; i++) {
      const tz = createPlate(4, 6, DARK_MAT, towerZoneInfo);
      tz.position.set(-4 + i * 4, PLATE_HEIGHT, -(BASE_D / 2 - 3));
      addToStep(s1_9, tz);
    }
    // Layer 2: 3 plates offset by 2 studs (on top of layer 1, overlapping joints)
    for (let i = 0; i < 3; i++) {
      const tz = createPlate(4, 6, WHITE_MAT, towerZoneInfo);
      tz.position.set(-2 + i * 4, 2 * PLATE_HEIGHT, -(BASE_D / 2 - 3));
      addToStep(s1_9, tz);
    }
  }

  // ── PHASE 2: The Lake (8 steps) ────────────────────────────────────────
  if (show("bp-lake")) {
    const pg2 = beginPhase("bp-lake");
    const borderInfo: PieceInfo = { name: "Plate 1×2", partNumber: "3023", description: "Lake border plate" };
    const lakeY = PLATE_HEIGHT;
    const lakePlateInfo1x2: PieceInfo = { name: "Trans-Clear Plate 1×2", partNumber: "3023", description: "Ornamental lake — transparent plate" };

    // Step 0: Lake Corners — Border Start
    const s2_0 = startStep(pg2);
    for (let x = -7; x < 7; x += 2) {
      const fb = createPlate(2, 1, DARK_MAT, borderInfo);
      fb.position.set(x + 1, PLATE_HEIGHT, LAKE_Z - 4.5);
      addToStep(s2_0, fb);
    }

    // Step 1: Lake Edge — Straight Border
    const s2_1 = startStep(pg2);
    for (let x = -7; x < 7; x += 2) {
      const bb = createPlate(2, 1, DARK_MAT, borderInfo);
      bb.position.set(x + 1, PLATE_HEIGHT, LAKE_Z + 4.5);
      addToStep(s2_1, bb);
    }
    for (let z = -3; z < 4; z += 2) {
      const lb = createPlate(1, 2, DARK_MAT, borderInfo);
      lb.position.set(-7.5, PLATE_HEIGHT, LAKE_Z + z);
      addToStep(s2_1, lb);
      const rb = createPlate(1, 2, DARK_MAT, borderInfo);
      rb.position.set(7.5, PLATE_HEIGHT, LAKE_Z + z);
      addToStep(s2_1, rb);
    }

    // Step 2: Water Surface — Back Rows
    const s2_2 = startStep(pg2);
    for (let x = -6; x < 7; x += 2) {
      for (let z = -3; z < -1; z += 1) {
        if ((x + z) % 5 === 0) continue;
        const p = createPlate(2, 1, TRANS_MAT, lakePlateInfo1x2);
        p.position.set(x, lakeY, LAKE_Z + z);
        addToStep(s2_2, p);
      }
    }

    // Step 3: Water Surface — Middle Rows
    const s2_3 = startStep(pg2);
    for (let x = -6; x < 7; x += 2) {
      for (let z = -1; z < 1; z += 1) {
        if ((x + z) % 5 === 0) continue;
        const p = createPlate(2, 1, TRANS_MAT, lakePlateInfo1x2);
        p.position.set(x, lakeY, LAKE_Z + z);
        addToStep(s2_3, p);
      }
    }

    // Step 4: Water Surface — Front Rows
    const s2_4 = startStep(pg2);
    for (let x = -6; x < 7; x += 2) {
      for (let z = 1; z < 3; z += 1) {
        if ((x + z) % 5 === 0) continue;
        const p = createPlate(2, 1, TRANS_MAT, lakePlateInfo1x2);
        p.position.set(x, lakeY, LAKE_Z + z);
        addToStep(s2_4, p);
      }
    }

    // Step 5: Water Surface — Final Fill
    const s2_5 = startStep(pg2);
    for (let x = -6; x < 7; x += 2) {
      for (let z = 3; z < 4; z += 1) {
        if ((x + z) % 5 === 0) continue;
        const p = createPlate(2, 1, TRANS_MAT, lakePlateInfo1x2);
        p.position.set(x, lakeY, LAKE_Z + z);
        addToStep(s2_5, p);
      }
    }

    // Step 6: Depth Variation — Near Edges
    const s2_6 = startStep(pg2);
    const scatteredInfo: PieceInfo = { name: "Trans-Clear Plate 1×1", partNumber: "3024", description: "Scattered depth — on top of lake surface" };
    const scatterY = 2 * PLATE_HEIGHT;
    const edgePositions: [number, number][] = [
      [-6, -3], [-5, -3], [-4, 3], [-3, -2], [-2, 3], [-1, -3], [-6, 2],
    ];
    for (const [x, z] of edgePositions) {
      const sp = createPlate(1, 1, TRANS_MAT, scatteredInfo);
      sp.position.set(x, scatterY, LAKE_Z + z);
      addToStep(s2_6, sp);
    }

    // Step 7: Depth Variation — Centre & Deep Spots
    const s2_7 = startStep(pg2);
    const centrePositions: [number, number][] = [
      [0, 2], [1, -2], [2, 3], [3, -3], [4, 2], [5, -2], [6, 3], [4, -1],
    ];
    for (const [x, z] of centrePositions) {
      const sp = createPlate(1, 1, TRANS_MAT, scatteredInfo);
      sp.position.set(x, scatterY, LAKE_Z + z);
      addToStep(s2_7, sp);
    }
  }

  // ── PHASE 3: Podium Colonnade (8 steps) ────────────────────────────────
  if (show("bp-podium")) {
    const pg3 = beginPhase("bp-podium");
    const colInfo: PieceInfo = { name: "Brick 2×2 Round", partNumber: "3941", description: "Podium colonnade piloti" };
    const capInfo: PieceInfo = { name: "Plate 2×2 Round", partNumber: "4032", description: "Column capital bearing pad" };
    const secInfo: PieceInfo = { name: "Round Brick 1×1", partNumber: "3062b", description: "Secondary podium column" };
    const braceInfo: PieceInfo = { name: "Plate 1×2", partNumber: "3023w", description: "Lateral column bracing" };

    // Step 0: Main Columns — First Four
    const s3_0 = startStep(pg3);
    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 2; row++) {
        const column = createRoundBrick(3, colInfo);
        column.position.set(-10.5 + col * 3, PODIUM_Y, 1 + row * 3);
        addToStep(s3_0, column);
      }
    }

    // Step 1: Main Columns — Middle Four
    const s3_1 = startStep(pg3);
    for (let col = 4; col < 6; col++) {
      for (let row = 0; row < 2; row++) {
        const column = createRoundBrick(3, colInfo);
        column.position.set(-10.5 + col * 3, PODIUM_Y, 1 + row * 3);
        addToStep(s3_1, column);
      }
    }

    // Step 2: Main Columns — Last Four
    const s3_2 = startStep(pg3);
    for (let col = 6; col < 8; col++) {
      for (let row = 0; row < 2; row++) {
        const column = createRoundBrick(3, colInfo);
        column.position.set(-10.5 + col * 3, PODIUM_Y, 1 + row * 3);
        addToStep(s3_2, column);
      }
    }

    // Step 3: Column Capitals — Left Half
    const s3_3 = startStep(pg3);
    for (let col = 0; col < 4; col++) {
      const cap = createPlate(2, 2, WHITE_MAT, capInfo, true);
      cap.position.set(-10.5 + col * 3, PODIUM_Y + 3 * BRICK_HEIGHT, 1);
      addToStep(s3_3, cap);
    }

    // Step 4: Column Capitals — Right Half
    const s3_4 = startStep(pg3);
    for (let col = 4; col < 8; col++) {
      const cap = createPlate(2, 2, WHITE_MAT, capInfo, true);
      cap.position.set(-10.5 + col * 3, PODIUM_Y + 3 * BRICK_HEIGHT, 1);
      addToStep(s3_4, cap);
    }

    // Step 5: Secondary Columns — Left Half
    const s3_5 = startStep(pg3);
    for (let col = 0; col < 4; col++) {
      const secCol = createRoundBrick(2, secInfo);
      secCol.position.set(-9 + col * 3, PODIUM_Y, 2.5);
      addToStep(s3_5, secCol);
    }

    // Step 6: Secondary Columns — Right Half
    const s3_6 = startStep(pg3);
    for (let col = 4; col < 7; col++) {
      const secCol = createRoundBrick(2, secInfo);
      secCol.position.set(-9 + col * 3, PODIUM_Y, 2.5);
      addToStep(s3_6, secCol);
    }

    // Step 7: Lateral Bracing
    const s3_7 = startStep(pg3);
    for (let col = 0; col < 4; col++) {
      const brace = createPlate(1, 2, WHITE_MAT, braceInfo, true);
      brace.position.set(-10.5 + col * 6, PODIUM_Y + 1.5 * BRICK_HEIGHT, 1);
      addToStep(s3_7, brace);
    }
  }

  // ── PHASE 4: Ground Level & Structural Cores (28 steps) ───────────────
  if (show("bp-terrace-core")) {
    const pg4 = beginPhase("bp-terrace-core");
    const bearingWallCount = 4;
    const bearingCoursesBelow = Math.round((PODIUM_DECK_Y - PLATE_HEIGHT) / BRICK_HEIGHT);
    const facadeZ_p4 = TERRACE_Z + TERRACE_D / 2 + 0.6;

    // Step 0: Terrace Ground — Left Section
    const s4_0 = startStep(pg4);
    for (let w = 0; w < 2; w++) {
      const wx = TERRACE_X - TERRACE_W / 2 + 2 + w * (TERRACE_W / (bearingWallCount - 1)) - 2;
      for (let course = 0; course < bearingCoursesBelow; course++) {
        const cy = PLATE_HEIGHT + course * BRICK_HEIGHT;
        const bearWall = createBrick(1.5, TERRACE_D + 2, 1, DARK_MAT, {
          name: "Brick 2×6", partNumber: "2456", description: "Bearing wall — terrace to foundation",
        }, true);
        bearWall.position.set(wx, cy, TERRACE_Z);
        addToStep(s4_0, bearWall);
      }
    }

    // Step 1: Terrace Ground — Right Section
    const s4_1 = startStep(pg4);
    for (let w = 2; w < bearingWallCount; w++) {
      const wx = TERRACE_X - TERRACE_W / 2 + 2 + w * (TERRACE_W / (bearingWallCount - 1)) - 2;
      for (let course = 0; course < bearingCoursesBelow; course++) {
        const cy = PLATE_HEIGHT + course * BRICK_HEIGHT;
        const bearWall = createBrick(1.5, TERRACE_D + 2, 1, DARK_MAT, {
          name: "Brick 2×6", partNumber: "2456", description: "Bearing wall — terrace to foundation",
        }, true);
        bearWall.position.set(wx, cy, TERRACE_Z);
        addToStep(s4_1, bearWall);
      }
    }

    // Step 2: Terrace Ground — Bond Course
    const s4_2 = startStep(pg4);
    for (let i = 0; i < 3; i++) {
      const bond = createBrick(2, TERRACE_D, 1, WHITE_MAT, {
        name: "Brick 2×4", partNumber: "3001", description: "Bond course — offset joints",
      }, true);
      bond.position.set(TERRACE_X - 4 + i * 4, PLATE_HEIGHT + bearingCoursesBelow * BRICK_HEIGHT, TERRACE_Z);
      addToStep(s4_2, bond);
    }

    // Step 3: Arts Centre Arches
    const s4_3 = startStep(pg4);
    for (let i = 0; i < 3; i++) {
      const arch = createArch({
        name: "Arch 1×4", partNumber: "3659", description: "Ground-level entrance arch",
      });
      arch.position.set(TERRACE_X - 5 + i * 5, PODIUM_Y, facadeZ_p4 + 2);
      arch.scale.set(0.5, 0.5, 0.5);
      addToStep(s4_3, arch);
    }

    // Step 4: Ground-Floor Windows — Left Half
    const s4_4 = startStep(pg4);
    for (let i = 0; i < 3; i++) {
      const panel = createBrick(1.5, 0.4, 1.5, TRANS_MAT, {
        name: "Trans-Clear Panel 1×2×2", partNumber: "87552", description: "Arts Centre foyer window",
      });
      panel.position.set(TERRACE_X - 4 + i * 2, PLATE_HEIGHT, facadeZ_p4 + 1);
      addToStep(s4_4, panel);
    }

    // Step 5: Ground-Floor Windows — Right Half
    const s4_5 = startStep(pg4);
    for (let i = 3; i < 5; i++) {
      const panel = createBrick(1.5, 0.4, 1.5, TRANS_MAT, {
        name: "Trans-Clear Panel 1×2×2", partNumber: "87552", description: "Arts Centre foyer window",
      });
      panel.position.set(TERRACE_X - 4 + i * 2, PLATE_HEIGHT, facadeZ_p4 + 1);
      addToStep(s4_5, panel);
    }

    // Step 6: Ground-Level Landscaping
    const s4_6 = startStep(pg4);
    for (let i = 0; i < 4; i++) {
      const slopeP = createSlope(2, 1, 25, {
        name: "Slope 2×3 (25°)", partNumber: "3298", description: "Terrain grade slope",
      });
      slopeP.position.set(TERRACE_X - 3 + i * 2, PLATE_HEIGHT, facadeZ_p4 - 1);
      addToStep(s4_6, slopeP);
    }

    // Step 7: Podium Deck — Back Plates
    const s4_7 = startStep(pg4);
    const deckInfo: PieceInfo = { name: "Plate 2×6", partNumber: "3795", description: "Podium deck plate" };
    for (let x = -12; x < 13; x += 6) {
      for (let z = -2; z < 2; z += 2) {
        const dp = createPlate(6, 2, WHITE_MAT, deckInfo);
        dp.position.set(x, PODIUM_DECK_Y, z + 2);
        addToStep(s4_7, dp);
      }
    }

    // Step 8: Podium Deck — Front Plates
    const s4_8 = startStep(pg4);
    for (let x = -12; x < 13; x += 6) {
      for (let z = 2; z < 6; z += 2) {
        const dp = createPlate(6, 2, WHITE_MAT, deckInfo);
        dp.position.set(x, PODIUM_DECK_Y, z + 2);
        addToStep(s4_8, dp);
      }
    }

    // Step 9: Podium Deck — Wide Sections
    const s4_9 = startStep(pg4);
    for (let x = -6; x < 7; x += 6) {
      const wideDeck = createPlate(6, 3, WHITE_MAT, { name: "Plate 2×6", partNumber: "3795", description: "Podium wide deck section" });
      wideDeck.position.set(x, PODIUM_DECK_Y + 0.01, 3);
      addToStep(s4_9, wideDeck);
    }

    // Step 10: Podium Soffits — Sub-Assembly
    const s4_10 = startStep(pg4);
    for (let i = 0; i < 8; i++) {
      const soffit = createInvertedSlope(3, 1, {
        name: "Slope Inverted 45 2×1", partNumber: "3665", description: "Cantilevered soffit at deck edge",
      });
      soffit.position.set(-10.5 + i * 3, PODIUM_DECK_Y - PLATE_HEIGHT * 1.5, 5.5);
      addToStep(s4_10, soffit);
    }

    // Step 11: Podium Parapets — Railings
    const s4_11 = startStep(pg4);
    const parapetInfo: PieceInfo = { name: "Panel 1×4×1 Rounded", partNumber: "30413", description: "Podium walkway parapet" };
    for (const zOff of [5.8, -1.5]) {
      const parapet = createPanel(26, 0.8, parapetInfo);
      parapet.position.set(0, PODIUM_DECK_Y + PLATE_HEIGHT, zOff);
      addToStep(s4_11, parapet);
    }

    // Step 12: Podium Parapets — Corner Pieces
    const s4_12 = startStep(pg4);
    for (const xOff of [-13, 13]) {
      for (const zOff of [5.8, -1.5]) {
        const cornerPanel = createPanel(1, 0.8, { name: "Panel 1×1×1 Corner", partNumber: "6231", description: "Podium parapet corner" });
        cornerPanel.position.set(xOff, PODIUM_DECK_Y + PLATE_HEIGHT, zOff);
        addToStep(s4_12, cornerPanel);
      }
    }

    // Step 13: Tower Base — First Course Left
    const s4_13 = startStep(pg4);
    {
      const tw = TOWER_W + 2;
      for (let course = 0; course < 2; course++) {
        const cy = TOWER_BASE_Y + course * BRICK_HEIGHT;
        const sizes = course % 2 === 0 ? [4, 4] : [3, 2, 3];
        let xPos = TOWER_X - tw / 2;
        for (const sz of sizes) {
          const b = createBrick(sz, 1, 1, WHITE_MAT, {
            name: sz === 4 ? "Brick 1×4" : sz === 3 ? "Brick 1×3" : "Brick 1×2",
            partNumber: sz === 4 ? "3010" : sz === 3 ? "3622" : "3004",
            description: "Tower base — running bond",
          }, true);
          b.position.set(xPos + sz / 2, cy, TOWER_Z + (TOWER_D + 2) / 2 - 0.5);
          addToStep(s4_13, b);
          xPos += sz;
        }
      }
    }

    // Step 14: Tower Base — First Course Right
    const s4_14 = startStep(pg4);
    {
      const tw = TOWER_W + 2;
      const course = 2;
      const cy = TOWER_BASE_Y + course * BRICK_HEIGHT;
      const sizes = [4, 4];
      let xPos = TOWER_X - tw / 2;
      for (const sz of sizes) {
        const b = createBrick(sz, 1, 1, WHITE_MAT, {
          name: "Brick 1×4", partNumber: "3010", description: "Tower base — running bond",
        }, true);
        b.position.set(xPos + sz / 2, cy, TOWER_Z + (TOWER_D + 2) / 2 - 0.5);
        addToStep(s4_14, b);
        xPos += sz;
      }
    }

    // Step 15: Tower Base — Second Course
    const s4_15 = startStep(pg4);
    {
      const tw = TOWER_W + 2;
      const course = 3;
      const cy = TOWER_BASE_Y + course * BRICK_HEIGHT;
      const sizes = [3, 2, 3];
      let xPos = TOWER_X - tw / 2;
      for (const sz of sizes) {
        const b = createBrick(sz, 1, 1, WHITE_MAT, {
          name: sz === 3 ? "Brick 1×3" : "Brick 1×2",
          partNumber: sz === 3 ? "3622" : "3004",
          description: "Tower base — running bond",
        }, true);
        b.position.set(xPos + sz / 2, cy, TOWER_Z + (TOWER_D + 2) / 2 - 0.5);
        addToStep(s4_15, b);
        xPos += sz;
      }
    }

    // Step 16: Tower Base — Third Course
    const s4_16 = startStep(pg4);
    {
      const tw = TOWER_W + 2;
      const course = 4;
      const cy = TOWER_BASE_Y + course * BRICK_HEIGHT;
      const sizes = [4, 4];
      let xPos = TOWER_X - tw / 2;
      for (const sz of sizes) {
        const b = createBrick(sz, 1, 1, WHITE_MAT, {
          name: "Brick 1×4", partNumber: "3010", description: "Tower base — running bond",
        }, true);
        b.position.set(xPos + sz / 2, cy, TOWER_Z + (TOWER_D + 2) / 2 - 0.5);
        addToStep(s4_16, b);
        xPos += sz;
      }
    }

    // Step 17: Terrace Wall — Course 3 (Left Half)
    const s4_17 = startStep(pg4);
    for (let course = 0; course < 2; course++) {
      const cy = PODIUM_DECK_Y + PLATE_HEIGHT + course * BRICK_HEIGHT;
      const brickSizes = course % 2 === 0 ? [6, 4] : [4, 6];
      let xPos = TERRACE_X - TERRACE_W / 2;
      for (const size of brickSizes) {
        const brick = createBrick(size, TERRACE_D, 1, WHITE_MAT, {
          name: size === 6 ? "Brick 1×8" : "Brick 1×4",
          partNumber: size === 6 ? "3008" : "3010",
          description: "Terrace core wall — running bond",
        }, true);
        brick.position.set(xPos + size / 2, cy, TERRACE_Z);
        addToStep(s4_17, brick);
        xPos += size;
      }
    }

    // Step 18: Terrace Wall — Course 3 (Right Half)
    const s4_18 = startStep(pg4);
    for (let course = 0; course < 2; course++) {
      const cy = PODIUM_DECK_Y + PLATE_HEIGHT + course * BRICK_HEIGHT;
      const brickSizes = course % 2 === 0 ? [6, 4] : [4, 6];
      let xPos = TERRACE_X + TERRACE_W / 2 - 10;
      for (const size of brickSizes) {
        const brick = createBrick(size, TERRACE_D, 1, WHITE_MAT, {
          name: size === 6 ? "Brick 1×8" : "Brick 1×4",
          partNumber: size === 6 ? "3008" : "3010",
          description: "Terrace core wall — running bond",
        }, true);
        brick.position.set(xPos + size / 2, cy, TERRACE_Z);
        addToStep(s4_18, brick);
        xPos += size;
      }
    }

    // Step 19: Terrace Wall — Courses 4-5 (Left)
    const s4_19 = startStep(pg4);
    for (let course = 2; course < 3; course++) {
      const cy = PODIUM_DECK_Y + PLATE_HEIGHT + course * BRICK_HEIGHT;
      const brickSizes = [6, 4];
      let xPos = TERRACE_X - TERRACE_W / 2;
      for (const size of brickSizes) {
        const brick = createBrick(size, TERRACE_D, 1, WHITE_MAT, {
          name: "Brick 2×3", partNumber: "3002", description: "Terrace core wall — running bond",
        }, true);
        brick.position.set(xPos + size / 2, cy, TERRACE_Z);
        addToStep(s4_19, brick);
        xPos += size;
      }
    }

    // Step 20: Terrace Wall — Courses 4-5 (Centre)
    const s4_20 = startStep(pg4);
    {
      const course = 3;
      const cy = PODIUM_DECK_Y + PLATE_HEIGHT + course * BRICK_HEIGHT;
      const brickSizes = [4, 6, 4, 6];
      let xPos = TERRACE_X - TERRACE_W / 2;
      for (const size of brickSizes) {
        const brick = createBrick(size, TERRACE_D, 1, WHITE_MAT, {
          name: "Brick 2×3", partNumber: "3002", description: "Terrace core wall — running bond",
        }, true);
        brick.position.set(xPos + size / 2, cy, TERRACE_Z);
        addToStep(s4_20, brick);
        xPos += size;
      }
    }

    // Step 21: Terrace Wall — Courses 4-5 (Right)
    const s4_21 = startStep(pg4);
    {
      const course = 4;
      const cy = PODIUM_DECK_Y + PLATE_HEIGHT + course * BRICK_HEIGHT;
      const brickSizes = [6, 4, 6, 4];
      let xPos = TERRACE_X - TERRACE_W / 2;
      for (const size of brickSizes) {
        const brick = createBrick(size, TERRACE_D, 1, WHITE_MAT, {
          name: "Brick 2×3", partNumber: "3002", description: "Terrace core wall — running bond",
        }, true);
        brick.position.set(xPos + size / 2, cy, TERRACE_Z);
        addToStep(s4_21, brick);
        xPos += size;
      }
    }

    // Step 22: Terrace Wall — Upper Courses with 1×6
    const s4_22 = startStep(pg4);
    for (let course = Math.floor(TERRACE_H / 2) - 1; course < Math.floor(TERRACE_H / 2); course++) {
      const cy = PODIUM_DECK_Y + PLATE_HEIGHT + course * BRICK_HEIGHT;
      const brickSizes = course % 2 === 0 ? [6, 4, 6, 4] : [4, 6, 4, 6];
      let xPos = TERRACE_X - TERRACE_W / 2;
      for (const size of brickSizes) {
        const brick = createBrick(size, TERRACE_D, 1, WHITE_MAT, {
          name: "Brick 1×6", partNumber: "3009", description: "Terrace upper wall — long bricks",
        }, true);
        brick.position.set(xPos + size / 2, cy, TERRACE_Z);
        addToStep(s4_22, brick);
        xPos += size;
      }
    }

    // Step 23: Tower Shaft — Courses 4-6
    const s4_23 = startStep(pg4);
    {
      const tw = TOWER_W + 2;
      for (let course = 5; course < 8; course++) {
        const cy = TOWER_BASE_Y + course * BRICK_HEIGHT;
        const sizes = course % 2 === 0 ? [4, 4] : [3, 2, 3];
        let xPos = TOWER_X - tw / 2;
        for (const sz of sizes) {
          const b = createBrick(sz, 1, 1, WHITE_MAT, {
            name: sz === 4 ? "Brick 1×4" : sz === 3 ? "Brick 1×3" : "Brick 1×2",
            partNumber: sz === 4 ? "3010" : sz === 3 ? "3622" : "3004",
            description: "Tower shaft — running bond",
          }, true);
          b.position.set(xPos + sz / 2, cy, TOWER_Z + (TOWER_D + 2) / 2 - 0.5);
          addToStep(s4_23, b);
          xPos += sz;
        }
      }
    }

    // Step 24: Tower Shaft — Infill Bricks
    const s4_24 = startStep(pg4);
    {
      const tw = TOWER_W + 2;
      for (let course = 8; course < 10; course++) {
        const cy = TOWER_BASE_Y + course * BRICK_HEIGHT;
        const sizes = course % 2 === 0 ? [4, 4] : [3, 2, 3];
        let xPos = TOWER_X - tw / 2;
        for (const sz of sizes) {
          const b = createBrick(sz, 1, 1, WHITE_MAT, {
            name: sz === 4 ? "Brick 1×4" : sz === 2 ? "Brick 1×2" : "Brick 1×3",
            partNumber: sz === 4 ? "3010" : sz === 2 ? "3004" : "3622",
            description: "Tower shaft infill — bond pattern",
          }, true);
          b.position.set(xPos + sz / 2, cy, TOWER_Z + (TOWER_D + 2) / 2 - 0.5);
          addToStep(s4_24, b);
          xPos += sz;
        }
      }
    }

    // Step 25: Structural Floor Plates — Terrace
    const s4_25 = startStep(pg4);
    const capPlate = createPlate(TERRACE_W, TERRACE_D, WHITE_MAT, {
      name: "Plate 2×8", partNumber: "3034", description: "Terrace structural plate",
    }, true);
    capPlate.position.set(TERRACE_X, PODIUM_DECK_Y + PLATE_HEIGHT + Math.floor(TERRACE_H / 2) * BRICK_HEIGHT, TERRACE_Z);
    addToStep(s4_25, capPlate);

    // Step 26: Shear Walls
    const s4_26 = startStep(pg4);
    const shearWallD = 4;
    const totalShearCourses = bearingCoursesBelow + TERRACE_H;
    for (const side of [-1, 1]) {
      const sx = TERRACE_X + side * 2.5;
      for (let course = 0; course < totalShearCourses; course++) {
        const cy = PLATE_HEIGHT + course * BRICK_HEIGHT;
        const wall = createBrick(1, shearWallD, 1, WHITE_MAT, {
          name: "Brick 2×4", partNumber: "3001", description: "Rear shear wall — foundation to tower",
        }, true);
        wall.position.set(sx, cy, TERRACE_Z - TERRACE_D / 2 - shearWallD / 2);
        addToStep(s4_26, wall);
      }
    }

    // Step 27: Upper Wall Infill & Tower Completion to Terrace Height
    const s4_27 = startStep(pg4);
    for (let course = Math.floor(TERRACE_H / 2); course < TERRACE_H; course++) {
      const cy = PODIUM_DECK_Y + PLATE_HEIGHT + course * BRICK_HEIGHT;
      const brickSizes = course % 2 === 0 ? [6, 4, 6, 4] : [4, 6, 4, 6];
      let xPos = TERRACE_X - TERRACE_W / 2;
      for (const size of brickSizes) {
        const brick = createBrick(size, TERRACE_D, 1, WHITE_MAT, {
          name: size === 6 ? "Brick 2×6" : "Brick 2×4",
          partNumber: size === 6 ? "2456" : "3001",
          description: "Terrace core wall — running bond",
        }, true);
        brick.position.set(xPos + size / 2, cy, TERRACE_Z);
        addToStep(s4_27, brick);
        xPos += size;
      }
    }
    const topCapPlate = createPlate(TERRACE_W, TERRACE_D, WHITE_MAT, {
      name: "Plate 2×8", partNumber: "3034", description: "Terrace top cap plate",
    }, true);
    topCapPlate.position.set(TERRACE_X, PODIUM_DECK_Y + PLATE_HEIGHT + TERRACE_H * BRICK_HEIGHT, TERRACE_Z);
    addToStep(s4_27, topCapPlate);
  }

  // ── PHASE 5: Terrace SNOT Facade (13 steps) ────────────────────────────
  if (show("bp-terrace-facade")) {
    const pg5 = beginPhase("bp-terrace-facade");
    const facadeZ = TERRACE_Z + TERRACE_D / 2;
    const snotInfo: PieceInfo = { name: "Brick 1×4 Side Studs", partNumber: "30414", description: "SNOT brick — studs face outward" };
    const grilleInfo: PieceInfo = { name: "Tile 1×2 Grille", partNumber: "2412b", description: "Bush-hammered concrete texture" };
    const hlInfo: PieceInfo = { name: "Headlight Brick 1×1", partNumber: "4070", description: "Window reveal — recessed pocket" };

    // Step 0: SNOT Bricks — Lower Storeys
    const s5_0 = startStep(pg5);
    for (let level = 0; level < 2; level += 2) {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + level * 2 * BRICK_HEIGHT;
      for (let col = 0; col < 7; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 1.5 + col * 2.8;
        const mount = createSideStudBrick(4, snotInfo);
        mount.position.set(cx, ly, facadeZ);
        addToStep(s5_0, mount);
      }
    }

    // Step 1: SNOT Bricks — Upper Storeys
    const s5_1 = startStep(pg5);
    for (let level = 2; level < 5; level += 2) {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + level * 2 * BRICK_HEIGHT;
      for (let col = 0; col < 7; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 1.5 + col * 2.8;
        const mount = createSideStudBrick(4, snotInfo);
        mount.position.set(cx, ly, facadeZ);
        addToStep(s5_1, mount);
      }
    }

    // Step 2: Grille Texture — Bottom Band
    const s5_2 = startStep(pg5);
    {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT;
      for (let col = 0; col < 7; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 1.5 + col * 2.8;
        const grille = createGrilleTile(2, 1, grilleInfo);
        grille.position.set(cx, ly + BRICK_HEIGHT * 0.5, facadeZ + 0.5 + STUD_HEIGHT);
        addToStep(s5_2, grille);
      }
    }

    // Step 3: Grille Texture — Middle Band
    const s5_3 = startStep(pg5);
    {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + 2 * BRICK_HEIGHT;
      for (let col = 0; col < 7; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 1.5 + col * 2.8;
        const grille = createGrilleTile(2, 1, grilleInfo);
        grille.position.set(cx, ly + BRICK_HEIGHT * 0.5, facadeZ + 0.5 + STUD_HEIGHT);
        addToStep(s5_3, grille);
      }
    }

    // Step 4: Grille Texture — Top Band
    const s5_4 = startStep(pg5);
    {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + 4 * BRICK_HEIGHT;
      for (let col = 0; col < 7; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 1.5 + col * 2.8;
        const grille = createGrilleTile(2, 1, grilleInfo);
        grille.position.set(cx, ly + BRICK_HEIGHT * 0.5, facadeZ + 0.5 + STUD_HEIGHT);
        addToStep(s5_4, grille);
      }
    }

    // Step 5: Window Reveals — Bottom Row
    const s5_5 = startStep(pg5);
    {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + BRICK_HEIGHT;
      for (let col = 0; col < 7; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 1.5 + col * 2.8;
        const hl = createHeadlightBrick(hlInfo);
        hl.position.set(cx, ly, facadeZ);
        addToStep(s5_5, hl);
      }
    }

    // Step 6: Window Reveals — Middle Row
    const s5_6 = startStep(pg5);
    {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + 2 * 2 * BRICK_HEIGHT + BRICK_HEIGHT;
      for (let col = 0; col < 7; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 1.5 + col * 2.8;
        const hl = createHeadlightBrick(hlInfo);
        hl.position.set(cx, ly, facadeZ);
        addToStep(s5_6, hl);
      }
    }

    // Step 7: Window Reveals — Top Row
    const s5_7 = startStep(pg5);
    {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + 3 * 2 * BRICK_HEIGHT + BRICK_HEIGHT;
      for (let col = 0; col < 7; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 1.5 + col * 2.8;
        const hl = createHeadlightBrick(hlInfo);
        hl.position.set(cx, ly, facadeZ);
        addToStep(s5_7, hl);
      }
    }

    // Step 8: Glazing — Lower Windows
    const s5_8 = startStep(pg5);
    {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + BRICK_HEIGHT;
      for (let col = 0; col < 7; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 1.5 + col * 2.8;
        const win = createBrick(1, 1, 0.5, TRANS_MAT, {
          name: "Trans-Clear Brick 1×2", partNumber: "3065", description: "Glass — seated in headlight recess",
        });
        win.position.set(cx, ly + BRICK_HEIGHT * 0.1, facadeZ + 0.5 + STUD_HEIGHT);
        addToStep(s5_8, win);
      }
    }

    // Step 9: Glazing — Middle Windows
    const s5_9 = startStep(pg5);
    {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + 2 * 2 * BRICK_HEIGHT + BRICK_HEIGHT;
      for (let col = 0; col < 7; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 1.5 + col * 2.8;
        const win = createBrick(1, 1, 0.5, TRANS_MAT, {
          name: "Trans-Clear Brick 1×2", partNumber: "3065", description: "Glass — seated in headlight recess",
        });
        win.position.set(cx, ly + BRICK_HEIGHT * 0.1, facadeZ + 0.5 + STUD_HEIGHT);
        addToStep(s5_9, win);
      }
    }

    // Step 10: Glazing — Upper Windows
    const s5_10 = startStep(pg5);
    {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + 3 * 2 * BRICK_HEIGHT + BRICK_HEIGHT;
      for (let col = 0; col < 4; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 1.5 + col * 2.8;
        const win = createBrick(1, 1, 0.5, TRANS_MAT, {
          name: "Trans-Clear Brick 1×2", partNumber: "3065", description: "Glass — seated in headlight recess",
        });
        win.position.set(cx, ly + BRICK_HEIGHT * 0.1, facadeZ + 0.5 + STUD_HEIGHT);
        addToStep(s5_10, win);
      }
    }

    // Step 11: Penthouse Windows — Tall Panels
    const s5_11 = startStep(pg5);
    {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + 3 * 2 * BRICK_HEIGHT + BRICK_HEIGHT;
      for (let col = 4; col < 7; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 1.5 + col * 2.8;
        const win = createBrick(1, 1, 0.5, TRANS_MAT, {
          name: "Trans-Clear Panel 1×2×2", partNumber: "87552", description: "Penthouse tall glass panel",
        });
        win.position.set(cx, ly + BRICK_HEIGHT * 0.1, facadeZ + 0.5 + STUD_HEIGHT);
        addToStep(s5_11, win);
      }
    }

    // Step 12: Glazing — Remaining Window Fill
    const s5_12 = startStep(pg5);
    {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + 1 * 2 * BRICK_HEIGHT + BRICK_HEIGHT;
      for (let col = 0; col < 3; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 1.5 + col * 2.8;
        const win = createBrick(1, 1, 0.5, TRANS_MAT, {
          name: "Trans-Clear Brick 1×2", partNumber: "3065", description: "Glass — remaining fill",
        });
        win.position.set(cx, ly + BRICK_HEIGHT * 0.1, facadeZ + 0.5 + STUD_HEIGHT);
        addToStep(s5_12, win);
      }
    }
  }

  // ── PHASE 6: Balconies & Soffits (11 steps) ───────────────────────────
  if (show("bp-terrace-balconies")) {
    const pg6 = beginPhase("bp-terrace-balconies");
    const facadeZ = TERRACE_Z + TERRACE_D / 2 + 0.6;
    const balcInfo: PieceInfo = { name: "Plate 1×6", partNumber: "3666", description: "Cantilevered balcony slab" };
    const tileInfo: PieceInfo = { name: "Tile 1×6", partNumber: "6636", description: "Smooth balcony surface tile" };

    // Step 0: Balcony Sub-Assembly 1 — Plates (level 0)
    const s6_0 = startStep(pg6);
    {
      const level = 0;
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + (level * 2 + 1) * BRICK_HEIGHT + BRICK_HEIGHT;
      const stagger = 0;
      for (let col = 0; col < 6; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 2 + col * 3.2 + stagger;
        const balcony = createPlate(2.5, 1.2, WHITE_MAT, balcInfo, true);
        balcony.position.set(cx, ly, facadeZ + 1);
        addToStep(s6_0, balcony);
      }
    }

    // Step 1: Balcony Sub-Assembly 1 — Soffits (level 1)
    const s6_1 = startStep(pg6);
    {
      const level = 1;
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + (level * 2 + 1) * BRICK_HEIGHT + BRICK_HEIGHT;
      const stagger = 1.4;
      for (let col = 0; col < 6; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 2 + col * 3.2 + stagger;
        const balcony = createPlate(2.5, 1.2, WHITE_MAT, balcInfo, true);
        balcony.position.set(cx, ly, facadeZ + 1);
        addToStep(s6_1, balcony);
      }
    }

    // Step 2: Balcony Sub-Assembly 2 — Plates & Soffits (level 2)
    const s6_2 = startStep(pg6);
    {
      const level = 2;
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + (level * 2 + 1) * BRICK_HEIGHT + BRICK_HEIGHT;
      const stagger = 0;
      for (let col = 0; col < 6; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 2 + col * 3.2 + stagger;
        const balcony = createPlate(2.5, 1.2, WHITE_MAT, balcInfo, true);
        balcony.position.set(cx, ly, facadeZ + 1);
        addToStep(s6_2, balcony);
      }
    }

    // Step 3: Balcony Sub-Assembly 3 — Wide Balcony (level 3)
    const s6_3 = startStep(pg6);
    {
      const level = 3;
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + (level * 2 + 1) * BRICK_HEIGHT + BRICK_HEIGHT;
      const stagger = 1.4;
      for (let col = 0; col < 6; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 2 + col * 3.2 + stagger;
        const balcony = createPlate(2.5, 1.2, WHITE_MAT, balcInfo, true);
        balcony.position.set(cx, ly, facadeZ + 1);
        addToStep(s6_3, balcony);
      }
    }

    // Step 4: Balcony Sub-Assembly 4 — Inverted Slopes (level 4)
    const s6_4 = startStep(pg6);
    {
      const level = 4;
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + (level * 2 + 1) * BRICK_HEIGHT + BRICK_HEIGHT;
      const stagger = 0;
      for (let col = 0; col < 6; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 2 + col * 3.2 + stagger;
        const balcony = createPlate(2.5, 1.2, WHITE_MAT, balcInfo, true);
        balcony.position.set(cx, ly, facadeZ + 1);
        addToStep(s6_4, balcony);
      }
    }

    // Step 5: Balcony Sub-Assemblies 5-6 (extra soffits placeholder)
    const s6_5 = startStep(pg6);
    {
      const level = 4;
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + (level * 2 + 1) * BRICK_HEIGHT + BRICK_HEIGHT;
      const soffit = createInvertedSlope(2, 1, {
        name: "Slope 1×2 Inverted", partNumber: "3665", description: "Balcony soffit detail",
      });
      soffit.position.set(TERRACE_X, ly - PLATE_HEIGHT, facadeZ + 1);
      addToStep(s6_5, soffit);
    }

    // Step 6: Upper Balcony Surface Tiles
    const s6_6 = startStep(pg6);
    for (let level = 3; level < 5; level++) {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + (level * 2 + 1) * BRICK_HEIGHT + BRICK_HEIGHT + PLATE_HEIGHT;
      const stagger = level % 2 === 0 ? 0 : 1.4;
      for (let col = 0; col < 6; col += 2) {
        const cx = TERRACE_X - TERRACE_W / 2 + 2 + col * 3.2 + stagger;
        const tile = createTile(2.5, 1.0, WHITE_MAT, tileInfo);
        tile.position.set(cx, ly, facadeZ + 1);
        addToStep(s6_6, tile);
      }
    }

    // Step 7: Attach Balconies — Lower Rows (tiles for levels 0-1)
    const s6_7 = startStep(pg6);
    for (let level = 0; level < 2; level++) {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + (level * 2 + 1) * BRICK_HEIGHT + BRICK_HEIGHT + PLATE_HEIGHT;
      const stagger = level % 2 === 0 ? 0 : 1.4;
      for (let col = 0; col < 6; col += 2) {
        const cx = TERRACE_X - TERRACE_W / 2 + 2 + col * 3.2 + stagger;
        const tile = createTile(2.5, 1.0, WHITE_MAT, tileInfo);
        tile.position.set(cx, ly, facadeZ + 1);
        addToStep(s6_7, tile);
      }
    }

    // Step 8: Attach Balconies — Upper Rows (tiles for level 2)
    const s6_8 = startStep(pg6);
    {
      const level = 2;
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + (level * 2 + 1) * BRICK_HEIGHT + BRICK_HEIGHT + PLATE_HEIGHT;
      const stagger = level % 2 === 0 ? 0 : 1.4;
      for (let col = 0; col < 6; col += 2) {
        const cx = TERRACE_X - TERRACE_W / 2 + 2 + col * 3.2 + stagger;
        const tile = createTile(2.5, 1.0, WHITE_MAT, tileInfo);
        tile.position.set(cx, ly, facadeZ + 1);
        addToStep(s6_8, tile);
      }
    }

    // Step 9: Balcony Surface — Long Tiles
    const s6_9 = startStep(pg6);
    for (let level = 0; level < 3; level++) {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + (level * 2 + 1) * BRICK_HEIGHT + BRICK_HEIGHT + PLATE_HEIGHT + 0.01;
      const tile = createTile(TERRACE_W * 0.8, 0.3, DARK_MAT, {
        name: "Tile 1×4", partNumber: "2431", description: "Balcony long tile strip",
      });
      tile.position.set(TERRACE_X, ly, facadeZ + 1.5);
      addToStep(s6_9, tile);
    }

    // Step 10: Balcony Surface — Short Tiles
    const s6_10 = startStep(pg6);
    for (let level = 3; level < 5; level++) {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + (level * 2 + 1) * BRICK_HEIGHT + BRICK_HEIGHT + PLATE_HEIGHT + 0.01;
      const tile = createTile(TERRACE_W * 0.6, 0.3, DARK_MAT, {
        name: "Tile 1×2", partNumber: "3069b", description: "Balcony short tile strip",
      });
      tile.position.set(TERRACE_X, ly, facadeZ + 1.5);
      addToStep(s6_10, tile);
    }
  }

  // ── PHASE 7: Barrel Vault Roof (10 steps) ──────────────────────────────
  if (show("bp-barrel-vault")) {
    const pg7 = beginPhase("bp-barrel-vault");
    const vaultBaseY = PODIUM_DECK_Y + PLATE_HEIGHT + TERRACE_H * BRICK_HEIGHT;
    const vaultSegments = 10;
    const segW = TERRACE_W / vaultSegments;
    const vaultLInfo: PieceInfo = { name: "Curved Slope 3×1", partNumber: "50950", description: "Barrel vault — left curve" };
    const vaultRInfo: PieceInfo = { name: "Curved Slope 3×1", partNumber: "50950", description: "Barrel vault — right curve" };

    // Step 0: Vault Curve — Left Half (left curves)
    const s7_0 = startStep(pg7);
    for (let seg = 0; seg < Math.floor(vaultSegments / 2); seg++) {
      const sx = TERRACE_X - TERRACE_W / 2 + segW / 2 + seg * segW;
      const ls = createCurvedSlope("left", vaultLInfo);
      ls.position.set(sx, vaultBaseY, TERRACE_Z);
      addToStep(s7_0, ls);
    }

    // Step 1: Vault Curve — Right Half (right curves for left half)
    const s7_1 = startStep(pg7);
    for (let seg = 0; seg < Math.floor(vaultSegments / 2); seg++) {
      const sx = TERRACE_X - TERRACE_W / 2 + segW / 2 + seg * segW;
      const rs = createCurvedSlope("right", vaultRInfo);
      rs.position.set(sx, vaultBaseY, TERRACE_Z);
      addToStep(s7_1, rs);
    }

    // Step 2: Vault Enrichment — Left
    const s7_2 = startStep(pg7);
    for (let seg = Math.floor(vaultSegments / 2); seg < vaultSegments; seg++) {
      const sx = TERRACE_X - TERRACE_W / 2 + segW / 2 + seg * segW;
      const ls = createCurvedSlope("left", vaultLInfo);
      ls.position.set(sx, vaultBaseY, TERRACE_Z);
      addToStep(s7_2, ls);
    }

    // Step 3: Vault Enrichment — Right
    const s7_3 = startStep(pg7);
    for (let seg = Math.floor(vaultSegments / 2); seg < vaultSegments; seg++) {
      const sx = TERRACE_X - TERRACE_W / 2 + segW / 2 + seg * segW;
      const rs = createCurvedSlope("right", vaultRInfo);
      rs.position.set(sx, vaultBaseY, TERRACE_Z);
      addToStep(s7_3, rs);
    }

    // Step 4: Eave Slopes — Narrow Ends
    const s7_4 = startStep(pg7);
    {
      const endX = TERRACE_X - TERRACE_W / 2 + 0.5;
      const endCap = createSlope(1, TERRACE_D, 45, {
        name: "Slope 1×2 (45°)", partNumber: "3040", description: "Vault end cap",
      });
      endCap.position.set(endX, vaultBaseY, TERRACE_Z);
      addToStep(s7_4, endCap);
    }

    // Step 5: Eave Slopes — Long Sides
    const s7_5 = startStep(pg7);
    {
      const endX = TERRACE_X + TERRACE_W / 2 - 0.5;
      const endCap = createSlope(1, TERRACE_D, 45, {
        name: "Slope 1×2 (45°)", partNumber: "3040", description: "Vault end cap",
      });
      endCap.position.set(endX, vaultBaseY, TERRACE_Z);
      addToStep(s7_5, endCap);
    }

    // Step 6: Eave Slopes — Remaining
    const s7_6 = startStep(pg7);
    for (const zOff of [-TERRACE_D / 2 + 0.5, TERRACE_D / 2 - 0.5]) {
      const eave = createSlope(TERRACE_W * 0.8, 0.5, 25, {
        name: "Slope 2×3 (25°)", partNumber: "3298", description: "Vault eave slope",
      });
      eave.position.set(TERRACE_X, vaultBaseY + 0.3, TERRACE_Z + zOff);
      addToStep(s7_6, eave);
    }

    // Step 7: Ridge Cap — Smooth Tiles
    const s7_7 = startStep(pg7);
    const ridge = createTile(TERRACE_W, 0.6, DARK_MAT, {
      name: "Tile 1×4", partNumber: "2431", description: "Barrel vault ridge cap",
    });
    ridge.position.set(TERRACE_X, vaultBaseY + 1.0, TERRACE_Z);
    addToStep(s7_7, ridge);

    // Step 8: Hip Corners — Front
    const s7_8 = startStep(pg7);
    {
      const hip = createSlope(1, 1, 45, {
        name: "Slope 2×2 Double Convex", partNumber: "3045", description: "Hip corner element",
      });
      hip.position.set(TERRACE_X - TERRACE_W / 2 + 0.5, vaultBaseY + 0.8, TERRACE_Z);
      addToStep(s7_8, hip);
    }

    // Step 9: Hip Corners — Back
    const s7_9 = startStep(pg7);
    {
      const hip = createSlope(1, 1, 45, {
        name: "Slope 2×2 Double Convex", partNumber: "3045", description: "Hip corner element",
      });
      hip.position.set(TERRACE_X + TERRACE_W / 2 - 0.5, vaultBaseY + 0.8, TERRACE_Z);
      addToStep(s7_9, hip);
    }
  }

  // ── PHASE 8: Lauderdale Tower — Above the Roofline (12 steps) ────────
  if (show("bp-tower-core")) {
    const pg8 = beginPhase("bp-tower-core");
    const totalTowerCourses = TOWER_COURSES + Math.round(PODIUM_DECK_Y / BRICK_HEIGHT) + TERRACE_H;
    const midCourse = Math.floor((totalTowerCourses - 5) / 2) + 5;
    const towerBrickInfo = (sz: number): PieceInfo => ({
      name: sz === 4 ? "Brick 1×4" : sz === 3 ? "Brick 1×3" : "Brick 1×2",
      partNumber: sz === 4 ? "3010" : sz === 3 ? "3622" : "3004",
      description: "Lauderdale Tower core — running bond",
    });

    // Helper to build a range of tower courses
    const buildTowerCourses = (sg: THREE.Group, startC: number, endC: number, desc: string) => {
      for (let course = startC; course < endC; course++) {
        const cy = TOWER_BASE_Y + course * BRICK_HEIGHT;
        const sizes = course % 2 === 0 ? [4, 2] : [3, 3];
        // Front wall
        let xPos = TOWER_X - TOWER_W / 2;
        for (const sz of sizes) {
          const b = createBrick(sz, 1, 1, WHITE_MAT, { ...towerBrickInfo(sz), description: desc }, true);
          b.position.set(xPos + sz / 2, cy, TOWER_Z + TOWER_D / 2 - 0.5);
          addToStep(sg, b);
          xPos += sz;
        }
        // Back wall
        xPos = TOWER_X - TOWER_W / 2;
        for (const sz of sizes) {
          const b = createBrick(sz, 1, 1, WHITE_MAT, { ...towerBrickInfo(sz), description: desc }, true);
          b.position.set(xPos + sz / 2, cy, TOWER_Z - TOWER_D / 2 + 0.5);
          addToStep(sg, b);
          xPos += sz;
        }
        // Side walls
        for (const side of [-1, 1]) {
          const sideLen = TOWER_D - 2;
          const b = createBrick(1, Math.max(sideLen, 1), 1, WHITE_MAT, {
            name: "Brick 1×2", partNumber: "3004", description: desc + " — side wall",
          }, true);
          b.position.set(TOWER_X + side * (TOWER_W / 2 - 0.5), cy, TOWER_Z);
          addToStep(sg, b);
        }
      }
    };

    // Step 0: Front Corner SNOT — Left
    const s8_0 = startStep(pg8);
    for (let i = 0; i < 2; i++) {
      const snot = createTravisBrick({
        name: "Brick 1×1 Studs 4 Sides", partNumber: "4733", description: "Tower front corner SNOT brick",
      });
      snot.position.set(TOWER_X + -1 * (TOWER_W / 2 - 0.5), TOWER_BASE_Y + (10 + i * 10) * BRICK_HEIGHT, TOWER_Z + TOWER_D / 2 - 0.5);
      addToStep(s8_0, snot);
    }

    // Step 1: Front Corner SNOT — Right
    const s8_1 = startStep(pg8);
    for (let i = 0; i < 2; i++) {
      const snot = createTravisBrick({
        name: "Brick 1×1 Studs 4 Sides", partNumber: "4733", description: "Tower front corner SNOT brick",
      });
      snot.position.set(TOWER_X + 1 * (TOWER_W / 2 - 0.5), TOWER_BASE_Y + (10 + i * 10) * BRICK_HEIGHT, TOWER_Z + TOWER_D / 2 - 0.5);
      addToStep(s8_1, snot);
    }

    // Steps 2-5: Tower emerging courses 10-19 (split into 4 steps of ~3 courses each)
    const courseRange1 = Math.floor((midCourse - 5) / 4);
    const s8_2 = startStep(pg8);
    buildTowerCourses(s8_2, 5, 5 + courseRange1, "Tower courses 10-14");

    const s8_3 = startStep(pg8);
    buildTowerCourses(s8_3, 5 + courseRange1, 5 + courseRange1 * 2, "Tower courses — corner fill");

    // Step 4: Structural Plates — Mid Tower
    const s8_4 = startStep(pg8);
    {
      const plateY = TOWER_BASE_Y + (5 + courseRange1 * 2) * BRICK_HEIGHT;
      const plate = createPlate(TOWER_W, TOWER_D, WHITE_MAT, {
        name: "Plate 2×6", partNumber: "3795", description: "Tower structural floor plate",
      }, true);
      plate.position.set(TOWER_X, plateY, TOWER_Z);
      addToStep(s8_4, plate);
    }

    const s8_5 = startStep(pg8);
    buildTowerCourses(s8_5, 5 + courseRange1 * 2, 5 + courseRange1 * 3, "Tower courses 15-19");

    const s8_6 = startStep(pg8);
    buildTowerCourses(s8_6, 5 + courseRange1 * 3, midCourse, "Tower courses 15-19 — corner fill");

    // Steps 7-9: Upper tower hollow core courses
    const upperRange = Math.floor((totalTowerCourses - midCourse) / 3);
    const s8_7 = startStep(pg8);
    buildTowerCourses(s8_7, midCourse, midCourse + upperRange, "Upper tower hollow core");

    const s8_8 = startStep(pg8);
    buildTowerCourses(s8_8, midCourse + upperRange, midCourse + upperRange * 2, "Upper tower perimeter");

    const s8_9 = startStep(pg8);
    buildTowerCourses(s8_9, midCourse + upperRange * 2, totalTowerCourses, "Upper tower perimeter");

    // Step 10: Upper Tower — Structural Plates
    const s8_10 = startStep(pg8);
    {
      const plateY = TOWER_BASE_Y + totalTowerCourses * BRICK_HEIGHT;
      const plate = createPlate(TOWER_W, TOWER_D, WHITE_MAT, {
        name: "Plate 2×6", partNumber: "3795", description: "Tower top structural plate",
      }, true);
      plate.position.set(TOWER_X, plateY, TOWER_Z);
      addToStep(s8_10, plate);
    }

    // Step 11: Upper Tower — Final Visible Courses
    const s8_11 = startStep(pg8);
    {
      const finalY = TOWER_BASE_Y + totalTowerCourses * BRICK_HEIGHT + PLATE_HEIGHT;
      const capBrick = createBrick(TOWER_W, TOWER_D, 0.5, WHITE_MAT, {
        name: "Brick 1×4", partNumber: "3010", description: "Tower final visible course",
      }, true);
      capBrick.position.set(TOWER_X, finalY, TOWER_Z);
      addToStep(s8_11, capBrick);
    }
  }

  // ── PHASE 9: Tower Facade & Window Bands (11 steps) ────────────────────
  if (show("bp-tower-facade")) {
    const pg9 = beginPhase("bp-tower-facade");
    const facadeZ_t = TOWER_Z + TOWER_D / 2 + 0.3;
    const towerVisibleStart = PODIUM_DECK_Y + PLATE_HEIGHT + TERRACE_H * BRICK_HEIGHT + 2;
    const grilleInfo9: PieceInfo = { name: "Grille Brick 1×2", partNumber: "2877", description: "Tower window band — concrete texture" };
    const winInfo9: PieceInfo = { name: "Trans-Clear Brick 1×2", partNumber: "3065", description: "Tower window glazing" };
    const slabInfo9: PieceInfo = { name: "Plate 2×6", partNumber: "3795", description: "Tower balcony slab" };

    // Steps 0-1: Rear Corner SNOT
    const s9_0 = startStep(pg9);
    {
      const by = towerVisibleStart + 3 * BRICK_HEIGHT;
      const grille = createGrilleTile(TOWER_W, 1, grilleInfo9);
      grille.position.set(TOWER_X, by, facadeZ_t);
      addToStep(s9_0, grille);
    }
    const s9_1 = startStep(pg9);
    {
      const by = towerVisibleStart + 3 * BRICK_HEIGHT;
      const win = createBrick(TOWER_W, 1, 0.5, TRANS_MAT, winInfo9);
      win.position.set(TOWER_X, by + BRICK_HEIGHT * 0.6, facadeZ_t + 0.15);
      addToStep(s9_1, win);
    }

    // Steps 2-3: Edge SNOT
    const s9_2 = startStep(pg9);
    {
      const by = towerVisibleStart + (3 + 1 * 4) * BRICK_HEIGHT;
      const grille = createGrilleTile(TOWER_W, 1, grilleInfo9);
      grille.position.set(TOWER_X, by, facadeZ_t);
      addToStep(s9_2, grille);
      const win = createBrick(TOWER_W, 1, 0.5, TRANS_MAT, winInfo9);
      win.position.set(TOWER_X, by + BRICK_HEIGHT * 0.6, facadeZ_t + 0.15);
      addToStep(s9_2, win);
    }
    const s9_3 = startStep(pg9);
    {
      const by = towerVisibleStart + (3 + 2 * 4) * BRICK_HEIGHT;
      const grille = createGrilleTile(TOWER_W, 1, grilleInfo9);
      grille.position.set(TOWER_X, by, facadeZ_t);
      addToStep(s9_3, grille);
      const win = createBrick(TOWER_W, 1, 0.5, TRANS_MAT, winInfo9);
      win.position.set(TOWER_X, by + BRICK_HEIGHT * 0.6, facadeZ_t + 0.15);
      addToStep(s9_3, win);
    }

    // Steps 4-5: Horizontal Banding — Grilles
    const s9_4 = startStep(pg9);
    {
      const by = towerVisibleStart + (3 + 3 * 4) * BRICK_HEIGHT;
      const grille = createGrilleTile(TOWER_W, 1, grilleInfo9);
      grille.position.set(TOWER_X, by, facadeZ_t);
      addToStep(s9_4, grille);
      const win = createBrick(TOWER_W, 1, 0.5, TRANS_MAT, winInfo9);
      win.position.set(TOWER_X, by + BRICK_HEIGHT * 0.6, facadeZ_t + 0.15);
      addToStep(s9_4, win);
    }
    const s9_5 = startStep(pg9);
    {
      const by = towerVisibleStart + (3 + 4 * 4) * BRICK_HEIGHT;
      const grille = createGrilleTile(TOWER_W, 1, grilleInfo9);
      grille.position.set(TOWER_X, by, facadeZ_t);
      addToStep(s9_5, grille);
      const win = createBrick(TOWER_W, 1, 0.5, TRANS_MAT, winInfo9);
      win.position.set(TOWER_X, by + BRICK_HEIGHT * 0.6, facadeZ_t + 0.15);
      addToStep(s9_5, win);
    }

    // Steps 6-7: Staggered Windows — Jumper Plates
    const s9_6 = startStep(pg9);
    {
      const by = towerVisibleStart + (3 + 5 * 4) * BRICK_HEIGHT;
      const grille = createGrilleTile(TOWER_W, 1, grilleInfo9);
      grille.position.set(TOWER_X, by, facadeZ_t);
      addToStep(s9_6, grille);
      const win = createBrick(TOWER_W, 1, 0.5, TRANS_MAT, winInfo9);
      win.position.set(TOWER_X, by + BRICK_HEIGHT * 0.6, facadeZ_t + 0.15);
      addToStep(s9_6, win);
    }
    const s9_7 = startStep(pg9);
    for (let band = 0; band < 3; band++) {
      const by = towerVisibleStart + (3 + band * 4) * BRICK_HEIGHT;
      const slab = createPlate(TOWER_W + 1, TOWER_D + 1, WHITE_MAT, slabInfo9, true);
      slab.position.set(TOWER_X, by + BRICK_HEIGHT, facadeZ_t - 0.3);
      addToStep(s9_7, slab);
    }

    // Step 8: Smooth Floor Bands — Lower 1×2 Tiles
    const s9_8 = startStep(pg9);
    {
      const by = towerVisibleStart + (3 + 3 * 4) * BRICK_HEIGHT;
      const slab = createPlate(TOWER_W + 1, TOWER_D + 1, WHITE_MAT, slabInfo9, true);
      slab.position.set(TOWER_X, by + BRICK_HEIGHT, facadeZ_t - 0.3);
      addToStep(s9_8, slab);
    }

    // Step 9: Smooth Floor Bands — Lower 2×2 Tiles
    const s9_9 = startStep(pg9);
    {
      const by = towerVisibleStart + (3 + 4 * 4) * BRICK_HEIGHT;
      const slab = createPlate(TOWER_W + 1, TOWER_D + 1, WHITE_MAT, slabInfo9, true);
      slab.position.set(TOWER_X, by + BRICK_HEIGHT, facadeZ_t - 0.3);
      addToStep(s9_9, slab);
    }

    // Step 10: Smooth Floor Bands — Upper Tiles
    const s9_10 = startStep(pg9);
    {
      const by = towerVisibleStart + (3 + 5 * 4) * BRICK_HEIGHT;
      const slab = createPlate(TOWER_W + 1, TOWER_D + 1, WHITE_MAT, slabInfo9, true);
      slab.position.set(TOWER_X, by + BRICK_HEIGHT, facadeZ_t - 0.3);
      addToStep(s9_10, slab);
    }
  }

  // ── PHASE 10: Tower Serrated Edges & Crown (10 steps) ──────────────────
  if (show("bp-tower-crown")) {
    const pg10 = beginPhase("bp-tower-crown");
    const totalTowerCourses = TOWER_COURSES + Math.round(PODIUM_DECK_Y / BRICK_HEIGHT) + TERRACE_H;
    const crownBaseY = TOWER_BASE_Y + totalTowerCourses * BRICK_HEIGHT;
    const towerVisibleStart2 = PODIUM_DECK_Y + PLATE_HEIGHT + TERRACE_H * BRICK_HEIGHT + 2;
    const cheeseInfo: PieceInfo = { name: "Cheese Slope 1×1×2/3", partNumber: "54200", description: "Serrated balcony edge" };

    const makeWedge = (side: number, by: number, sg: THREE.Group) => {
      const cheese = new THREE.Group();
      const wedgeShape = new THREE.Shape();
      wedgeShape.moveTo(0, 0);
      wedgeShape.lineTo(0.7 * side, 0);
      wedgeShape.lineTo(0, 0.5);
      wedgeShape.closePath();
      const wedgeGeo = new THREE.ExtrudeGeometry(wedgeShape, { depth: 0.8, bevelEnabled: false });
      const wedgeMesh = new THREE.Mesh(wedgeGeo, WHITE_MAT);
      wedgeMesh.rotation.x = -Math.PI / 2;
      wedgeMesh.position.z = -0.4;
      (wedgeMesh as any).pieceInfo = cheeseInfo;
      wedgeMesh.castShadow = true;
      cheese.add(wedgeMesh);
      cheese.position.set(TOWER_X + (TOWER_W / 2 + 0.4) * side, by, TOWER_Z + TOWER_D / 2);
      addToStep(sg, cheese);
    };

    // Step 0: Serrated Left Edge — Wedge Plates
    const s10_0 = startStep(pg10);
    for (let band = 0; band < 2; band++) {
      const by = towerVisibleStart2 + (5 + band * 5) * BRICK_HEIGHT;
      makeWedge(-1, by, s10_0);
    }

    // Step 1: Serrated Right Edge — Wedge Plates
    const s10_1 = startStep(pg10);
    for (let band = 0; band < 2; band++) {
      const by = towerVisibleStart2 + (5 + band * 5) * BRICK_HEIGHT;
      makeWedge(1, by, s10_1);
    }

    // Step 2: Fine Serration — Left Edge
    const s10_2 = startStep(pg10);
    for (let band = 2; band < 4; band++) {
      const by = towerVisibleStart2 + (5 + band * 5) * BRICK_HEIGHT;
      makeWedge(-1, by, s10_2);
    }

    // Step 3: Fine Serration — Right Edge
    const s10_3 = startStep(pg10);
    for (let band = 2; band < 4; band++) {
      const by = towerVisibleStart2 + (5 + band * 5) * BRICK_HEIGHT;
      makeWedge(1, by, s10_3);
    }

    // Step 4: Crown — Main 45-Degree Slopes
    const s10_4 = startStep(pg10);
    {
      const stepBrick = createBrick(TOWER_W, TOWER_D, 0.6, WHITE_MAT, {
        name: "Slope 1×2 (45°)", partNumber: "3040", description: "Crown main slope",
      }, true);
      stepBrick.position.set(TOWER_X, crownBaseY, TOWER_Z);
      addToStep(s10_4, stepBrick);
    }

    // Step 5: Crown Transition — Large Gentle Slopes
    const s10_5 = startStep(pg10);
    {
      const stepBrick = createBrick(TOWER_W - 1, TOWER_D - 0.5, 0.6, WHITE_MAT, {
        name: "Slope 3×4 (25°)", partNumber: "3297", description: "Crown large gentle slope",
      }, true);
      stepBrick.position.set(TOWER_X, crownBaseY + BRICK_HEIGHT * 0.6, TOWER_Z);
      addToStep(s10_5, stepBrick);
    }

    // Step 6: Crown Transition — Medium Slopes
    const s10_6 = startStep(pg10);
    {
      const topStep = createBrick(TOWER_W - 2, TOWER_D - 1, 0.6, WHITE_MAT, {
        name: "Slope 3×4 (25°)", partNumber: "3297", description: "Crown medium slope",
      }, true);
      topStep.position.set(TOWER_X, crownBaseY + 2 * BRICK_HEIGHT * 0.6, TOWER_Z);
      addToStep(s10_6, topStep);
    }

    // Step 7: Crown Peak — 65-Degree Slopes
    const s10_7 = startStep(pg10);
    {
      const peakSlope = createBrick(TOWER_W - 3, TOWER_D - 1.5, 0.4, WHITE_MAT, {
        name: "Slope 1×2 (65°)", partNumber: "60481", description: "Crown steep slope",
      }, true);
      peakSlope.position.set(TOWER_X, crownBaseY + 3 * BRICK_HEIGHT * 0.6 - 0.1, TOWER_Z);
      addToStep(s10_7, peakSlope);
    }

    // Step 8: Crown Peak — 75-Degree Slopes
    const s10_8 = startStep(pg10);
    const capY = crownBaseY + 3 * BRICK_HEIGHT * 0.6;
    const cap = createTile(TOWER_W - 2, TOWER_D - 1, WHITE_MAT, {
      name: "Tile 2×2", partNumber: "3068b", description: "Tower cap tiles",
    });
    cap.position.set(TOWER_X, capY, TOWER_Z);
    addToStep(s10_8, cap);

    // Step 9: Crown Peak — Final Point
    const s10_9 = startStep(pg10);
    const mech = createBrick(2, 1.5, 0.5, DARK_MAT, {
      name: "Brick 1×1", partNumber: "3005", description: "Mechanical penthouse",
    }, true);
    mech.position.set(TOWER_X, capY + PLATE_HEIGHT, TOWER_Z);
    addToStep(s10_9, mech);
  }

  // ── PHASE 11: The Conservatory (13 steps) ──────────────────────────────
  if (show("bp-conservatory")) {
    const pg11 = beginPhase("bp-conservatory");
    const conX = TERRACE_X + TERRACE_W / 2 - 2;
    const conZ = TERRACE_Z;
    const conBaseY = PODIUM_DECK_Y + PLATE_HEIGHT + TERRACE_H * BRICK_HEIGHT + 1.0;

    // Step 0: Curved Walls — Front Arc
    const s11_0 = startStep(pg11);
    const conBase = createPlate(5, 4, WHITE_MAT, {
      name: "Plate 4×6", partNumber: "3032", description: "Conservatory base plate",
    }, true);
    conBase.position.set(conX, conBaseY, conZ);
    addToStep(s11_0, conBase);

    // Step 1: Curved Walls — Side Arcs
    const s11_1 = startStep(pg11);
    for (const sx of [-2.5, 2.5]) {
      const wallBrick = createBrick(0.4, 1, 1, WHITE_MAT, {
        name: "Brick 1×3 Curved", partNumber: "50950", description: "Conservatory curved wall",
      }, true);
      wallBrick.position.set(conX + sx, conBaseY + PLATE_HEIGHT, conZ);
      addToStep(s11_1, wallBrick);
    }

    // Step 2: Curved Walls — Back Arc
    const s11_2 = startStep(pg11);
    {
      const wallBrick = createBrick(4, 0.4, 1, WHITE_MAT, {
        name: "Brick 1×4 Curved", partNumber: "50950", description: "Conservatory back wall",
      }, true);
      wallBrick.position.set(conX, conBaseY + PLATE_HEIGHT, conZ + 1.8);
      addToStep(s11_2, wallBrick);
    }

    // Step 3: Corner Infill — Left Side
    const s11_3 = startStep(pg11);
    {
      const corner = createBrick(0.5, 0.5, 1, WHITE_MAT, {
        name: "Brick 1×1", partNumber: "3005", description: "Conservatory corner infill",
      }, true);
      corner.position.set(conX - 2.5, conBaseY + PLATE_HEIGHT, conZ + 1.8);
      addToStep(s11_3, corner);
    }

    // Step 4: Corner Infill — Right Side
    const s11_4 = startStep(pg11);
    {
      const corner = createBrick(0.5, 0.5, 1, WHITE_MAT, {
        name: "Brick 1×1", partNumber: "3005", description: "Conservatory corner infill",
      }, true);
      corner.position.set(conX + 2.5, conBaseY + PLATE_HEIGHT, conZ + 1.8);
      addToStep(s11_4, corner);
    }

    // Step 5: Glazing — Front Windows
    const s11_5 = startStep(pg11);
    for (let i = 0; i < 3; i++) {
      const panel = createBrick(1.5, 0.4, 1.2, TRANS_MAT, {
        name: "Trans-Clear Panel 1×2×2", partNumber: "87552", description: "Conservatory glass wall",
      });
      panel.position.set(conX - 1.5 + i * 1.5, conBaseY + PLATE_HEIGHT, conZ - 1.8);
      addToStep(s11_5, panel);
    }

    // Step 6: Glazing — Side & Back Windows
    const s11_6 = startStep(pg11);
    for (const sx of [-2.5, 2.5]) {
      for (let i = 0; i < 2; i++) {
        const panel = createBrick(0.4, 1.5, 1.2, TRANS_MAT, {
          name: "Trans-Clear Brick 1×2", partNumber: "3065", description: "Conservatory side glass",
        });
        panel.position.set(conX + sx, conBaseY + PLATE_HEIGHT, conZ - 0.5 + i * 1.5);
        addToStep(s11_6, panel);
      }
    }

    // Step 7: Interior Planting — Dense Clusters
    const s11_7 = startStep(pg11);
    for (const [px, pz] of [[0, 0], [-1, 0.5]] as [number, number][]) {
      const plant = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 12), GREEN_MAT);
      plant.position.set(conX + px, conBaseY + PLATE_HEIGHT + 0.2, conZ + pz);
      (plant as any).pieceInfo = { name: "Plate 1×1 Round", partNumber: "4073", description: "Tropical plant" };
      plant.castShadow = true;
      addToStep(s11_7, plant);
    }

    // Step 8: Interior Planting — Scattered
    const s11_8 = startStep(pg11);
    {
      const plant = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 12), GREEN_MAT);
      plant.position.set(conX + 1, conBaseY + PLATE_HEIGHT + 0.2, conZ - 0.5);
      (plant as any).pieceInfo = { name: "Plate 1×1 Round", partNumber: "4073", description: "Tropical plant" };
      plant.castShadow = true;
      addToStep(s11_8, plant);
    }

    // Step 9: Interior Floor Sections
    const s11_9 = startStep(pg11);
    {
      const floor = createTile(4, 3, DARK_MAT, {
        name: "Tile 2×2", partNumber: "3068b", description: "Conservatory interior floor",
      });
      floor.position.set(conX, conBaseY + 0.01, conZ);
      addToStep(s11_9, floor);
    }

    // Step 10: Glass Roof
    const s11_10 = startStep(pg11);
    for (let i = 0; i < 3; i++) {
      const roofY = conBaseY + PLATE_HEIGHT + 1.2 * BRICK_HEIGHT;
      const ls = createCurvedSlope("left", {
        name: "Curved Slope 3×1", partNumber: "50950", description: "Conservatory vaulted roof",
      });
      ls.position.set(conX - 1.5 + i * 1.5, roofY, conZ);
      addToStep(s11_10, ls);
      const rs = createCurvedSlope("right", {
        name: "Curved Slope 3×1", partNumber: "50950", description: "Conservatory vaulted roof",
      });
      rs.position.set(conX - 1.5 + i * 1.5, roofY, conZ);
      addToStep(s11_10, rs);
    }
    const roofGlass = createPlate(4, 3, TRANS_MAT, {
      name: "Trans-Clear Plate 2×3", partNumber: "3021", description: "Conservatory glass roof",
    }, true);
    roofGlass.position.set(conX, conBaseY + PLATE_HEIGHT + 1.2 * BRICK_HEIGHT + 0.6, conZ);
    addToStep(s11_10, roofGlass);

    // Step 11: Rooftop Platform — Round Corners
    const s11_11 = startStep(pg11);
    const platform = createPlate(6, 5, WHITE_MAT, {
      name: "Plate 4×4 Round Corner", partNumber: "30565", description: "Conservatory rooftop platform",
    }, true);
    platform.position.set(conX, conBaseY - PLATE_HEIGHT, conZ);
    addToStep(s11_11, platform);

    // Step 12: Platform Connections — Pin Plates
    const s11_12 = startStep(pg11);
    for (const xOff of [-2, 2]) {
      const pin = createPlate(1, 1, WHITE_MAT, {
        name: "Plate 1×2 Pin", partNumber: "11458", description: "Platform connection pin plate",
      }, true);
      pin.position.set(conX + xOff, conBaseY - PLATE_HEIGHT + 0.01, conZ);
      addToStep(s11_12, pin);
    }
  }

  // ── PHASE 12: Landscaping & Details (33 steps) ─────────────────────────
  if (show("bp-landscaping")) {
    const pg12 = beginPhase("bp-landscaping");
    const tileInfo12: PieceInfo = { name: "Tile 1×4", partNumber: "2431", description: "Highwalk paving tile" };
    const bollardInfo: PieceInfo = { name: "Round Plate 1×1", partNumber: "4073", description: "Promenade bollard" };
    const planterInfo: PieceInfo = { name: "Brick 1×1", partNumber: "3005", description: "Planter box" };
    const canopyInfo: PieceInfo = { name: "Plate 1×1 Round", partNumber: "4073", description: "Tree canopy" };
    const treePosns: [number, number][] = [
      [-8, 4], [-4, 3.5], [0, 3.5], [4, 3.5], [8, 4],
      [-6, 12], [-2, 12], [2, 12], [6, 12],
    ];

    // Step 0: Garden Grade Changes — Terrace Base
    const s12_0 = startStep(pg12);
    for (let i = 0; i < 5; i++) {
      const tile = createTile(2.5, 1, DARK_MAT, tileInfo12);
      tile.position.set(-11 + i * 2.5, PODIUM_DECK_Y + PLATE_HEIGHT * 0.5, 5.5);
      addToStep(s12_0, tile);
    }

    // Step 1: Garden Grade Changes — Tower Base
    const s12_1 = startStep(pg12);
    for (let i = 5; i < 10; i++) {
      const tile = createTile(2.5, 1, DARK_MAT, tileInfo12);
      tile.position.set(-11 + i * 2.5, PODIUM_DECK_Y + PLATE_HEIGHT * 0.5, 5.5);
      addToStep(s12_1, tile);
    }

    // Step 2: Walkway Tiles — Podium Surface
    const s12_2 = startStep(pg12);
    {
      const lakePath = createTile(8, 0.6, DARK_MAT, { name: "Tile 1×6", partNumber: "6636", description: "Lakeside promenade left" });
      lakePath.position.set(-4, PLATE_HEIGHT * 0.3, LAKE_Z - 4.5);
      addToStep(s12_2, lakePath);
    }

    // Step 3: Walkway Tiles — Ground Level
    const s12_3 = startStep(pg12);
    {
      const lakePath = createTile(8, 0.6, DARK_MAT, { name: "Tile 1×6", partNumber: "6636", description: "Lakeside promenade right" });
      lakePath.position.set(4, PLATE_HEIGHT * 0.3, LAKE_Z - 4.5);
      addToStep(s12_3, lakePath);
    }

    // Step 4: Walkway Tiles — Lake Edge
    const s12_4 = startStep(pg12);
    for (let i = 0; i < 3; i++) {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8), DARK_MAT);
      bollard.position.set(-6 + i * 2.5, PLATE_HEIGHT + 0.2, LAKE_Z - 4.5);
      (bollard as any).pieceInfo = bollardInfo;
      bollard.castShadow = true;
      addToStep(s12_4, bollard);
    }

    // Step 5: Walkway Tiles — Conservatory Entrance
    const s12_5 = startStep(pg12);
    for (let i = 3; i < 6; i++) {
      const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8), DARK_MAT);
      bollard.position.set(-6 + i * 2.5, PLATE_HEIGHT + 0.2, LAKE_Z - 4.5);
      (bollard as any).pieceInfo = bollardInfo;
      bollard.castShadow = true;
      addToStep(s12_5, bollard);
    }

    // Step 6: Long Walkway Strips
    const s12_6 = startStep(pg12);
    {
      const strip = createTile(20, 0.4, DARK_MAT, { name: "Tile 1×6", partNumber: "6636", description: "Long walkway strip" });
      strip.position.set(0, PODIUM_DECK_Y + PLATE_HEIGHT * 0.3, 2);
      addToStep(s12_6, strip);
    }

    // Step 7: Plaza Sections
    const s12_7 = startStep(pg12);
    {
      const plaza = createTile(6, 4, DARK_MAT, { name: "Tile 2×2", partNumber: "3068b", description: "Plaza section" });
      plaza.position.set(0, PLATE_HEIGHT * 0.2, 3.5);
      addToStep(s12_7, plaza);
    }

    // Step 8: Ground Plane — 1×1 Infill (Centre)
    const s12_8 = startStep(pg12);
    {
      const infill = createTile(3, 2, DARK_MAT, {
        name: "Plate 1×1", partNumber: "3024", description: "Ground plane infill",
      });
      infill.position.set(-6, PLATE_HEIGHT * 0.15, 4);
      addToStep(s12_8, infill);
    }

    // Step 9: Ground Plane — 1×1 Infill (Edges)
    const s12_9 = startStep(pg12);
    {
      const infill = createTile(3, 2, DARK_MAT, {
        name: "Plate 1×1", partNumber: "3024", description: "Ground plane infill",
      });
      infill.position.set(-2, PLATE_HEIGHT * 0.15, 4.5);
      addToStep(s12_9, infill);
    }

    // Step 10: Ground Plane — 1×2 Infill (Podium)
    const s12_10 = startStep(pg12);
    {
      const infill = createTile(3, 2, DARK_MAT, {
        name: "Plate 1×2", partNumber: "3023", description: "Ground plane infill",
      });
      infill.position.set(2, PLATE_HEIGHT * 0.15, 5);
      addToStep(s12_10, infill);
    }

    // Step 11: Ground Plane — 1×2 Infill (Perimeter)
    const s12_11 = startStep(pg12);
    {
      const infill = createTile(3, 2, DARK_MAT, {
        name: "Plate 1×2", partNumber: "3023", description: "Ground plane infill",
      });
      infill.position.set(6, PLATE_HEIGHT * 0.15, 5.5);
      addToStep(s12_11, infill);
    }

    // Step 12: Highwalk Extensions
    const s12_12 = startStep(pg12);
    {
      const hw = createTile(10, 0.5, DARK_MAT, { name: "Tile 1×4", partNumber: "2431", description: "Highwalk extension" });
      hw.position.set(-5, PODIUM_DECK_Y + PLATE_HEIGHT * 0.5, -1);
      addToStep(s12_12, hw);
    }

    // Step 13: Terrace Extensions & Details
    const s12_13 = startStep(pg12);
    {
      const ext = createTile(8, 0.5, DARK_MAT, { name: "Tile 1×4", partNumber: "2431", description: "Terrace detail strip" });
      ext.position.set(5, PODIUM_DECK_Y + PLATE_HEIGHT * 0.5, -1);
      addToStep(s12_13, ext);
    }

    // Step 14: Edge Reinforcement — Long Bricks (left)
    const s12_14 = startStep(pg12);
    {
      const detail = createBrick(2, 0.5, 0.5, WHITE_MAT, {
        name: "Brick 1×4", partNumber: "3010", description: "Edge detail brick",
      }, true);
      detail.position.set(-8, PLATE_HEIGHT + 0.5, TERRACE_Z + TERRACE_D / 2 + 2);
      addToStep(s12_14, detail);
    }

    // Step 15: Edge Reinforcement — Long Bricks (right)
    const s12_15 = startStep(pg12);
    {
      const detail = createBrick(2, 0.5, 0.5, WHITE_MAT, {
        name: "Brick 1×4", partNumber: "3010", description: "Edge detail brick",
      }, true);
      detail.position.set(-4, PLATE_HEIGHT + 0.5, TERRACE_Z + TERRACE_D / 2 + 2);
      addToStep(s12_15, detail);
    }

    // Step 16: Edge Reinforcement — Short Bricks
    const s12_16 = startStep(pg12);
    {
      const detail = createBrick(2, 0.5, 0.5, WHITE_MAT, {
        name: "Brick 1×2", partNumber: "3004", description: "Edge detail brick",
      }, true);
      detail.position.set(0, PLATE_HEIGHT + 0.5, TERRACE_Z + TERRACE_D / 2 + 2);
      addToStep(s12_16, detail);
    }

    // Step 17: Wall Details — 1×3 Bricks
    const s12_17 = startStep(pg12);
    {
      const detail = createBrick(2, 0.5, 0.5, WHITE_MAT, {
        name: "Brick 1×3", partNumber: "3622", description: "Edge detail brick",
      }, true);
      detail.position.set(4, PLATE_HEIGHT + 0.5, TERRACE_Z + TERRACE_D / 2 + 2);
      addToStep(s12_17, detail);
    }

    // Step 18: Wall Details — 1×6 Bricks
    const s12_18 = startStep(pg12);
    {
      const detail = createBrick(2, 0.5, 0.5, WHITE_MAT, {
        name: "Brick 1×6", partNumber: "3009", description: "Edge detail brick",
      }, true);
      detail.position.set(8, PLATE_HEIGHT + 0.5, TERRACE_Z + TERRACE_D / 2 + 2);
      addToStep(s12_18, detail);
    }

    // Step 19: Wall Details — Junction Bricks
    const s12_19 = startStep(pg12);
    {
      const detail = createBrick(1, 0.5, 0.5, WHITE_MAT, {
        name: "Brick 2×2", partNumber: "3003", description: "Wall junction fill",
      }, true);
      detail.position.set(-4, PLATE_HEIGHT + 0.5, TERRACE_Z - TERRACE_D / 2 - 1);
      addToStep(s12_19, detail);
    }

    // Step 20: Wall Details — Corner Fill
    const s12_20 = startStep(pg12);
    {
      const detail = createBrick(1, 0.5, 0.5, WHITE_MAT, {
        name: "Brick 1×1", partNumber: "3005", description: "Wall corner fill",
      }, true);
      detail.position.set(4, PLATE_HEIGHT + 0.5, TERRACE_Z - TERRACE_D / 2 - 1);
      addToStep(s12_20, detail);
    }

    // Step 21: Final Brick Infill
    const s12_21 = startStep(pg12);
    {
      const infill = createBrick(1, 1, 0.5, WHITE_MAT, {
        name: "Brick 1×2", partNumber: "3004", description: "Final brick infill",
      }, true);
      infill.position.set(TOWER_X, PLATE_HEIGHT + 0.5, TOWER_Z + TOWER_D / 2 + 1);
      addToStep(s12_21, infill);
    }

    // Step 22: Entrance Thresholds & Walkway Caps
    const s12_22 = startStep(pg12);
    {
      const threshold = createTile(3, 1, DARK_MAT, {
        name: "Tile 2×2", partNumber: "3068b", description: "Entrance threshold",
      });
      threshold.position.set(-3, PODIUM_DECK_Y + 0.02, 5.5);
      addToStep(s12_22, threshold);
    }

    // Step 23: Walkway Caps & Bollards
    const s12_23 = startStep(pg12);
    {
      const threshold = createTile(3, 1, DARK_MAT, {
        name: "Tile 1×8", partNumber: "4162", description: "Walkway cap",
      });
      threshold.position.set(3, PODIUM_DECK_Y + 0.02, 6.5);
      addToStep(s12_23, threshold);
    }

    // Step 24: Tree & Planting Positions (front trees)
    const s12_24 = startStep(pg12);
    for (const [tx, tz] of treePosns.slice(0, 3)) {
      const planter = createBrick(1, 1, 0.5, WHITE_MAT, planterInfo, true);
      planter.position.set(tx, PLATE_HEIGHT, tz);
      addToStep(s12_24, planter);
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), GREEN_MAT);
      canopy.position.set(tx, PLATE_HEIGHT + BRICK_HEIGHT * 0.5 + 0.5, tz);
      (canopy as any).pieceInfo = canopyInfo;
      canopy.castShadow = true;
      addToStep(s12_24, canopy);
    }

    // Step 25: Curved Edges & Plaza Extension (more front trees)
    const s12_25 = startStep(pg12);
    for (const [tx, tz] of treePosns.slice(3, 5)) {
      const planter = createBrick(1, 1, 0.5, WHITE_MAT, planterInfo, true);
      planter.position.set(tx, PLATE_HEIGHT, tz);
      addToStep(s12_25, planter);
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), GREEN_MAT);
      canopy.position.set(tx, PLATE_HEIGHT + BRICK_HEIGHT * 0.5 + 0.5, tz);
      (canopy as any).pieceInfo = canopyInfo;
      canopy.castShadow = true;
      addToStep(s12_25, canopy);
    }

    // Step 26: Landscape Slopes — Terrain Grading (left)
    const s12_26 = startStep(pg12);
    {
      const slope = createSlope(2, 1, 25, {
        name: "Slope 2×4 (45°)", partNumber: "3037", description: "Landscape terrain slope",
      });
      slope.position.set(-4, PLATE_HEIGHT, 5);
      addToStep(s12_26, slope);
    }

    // Step 27: Landscape Slopes — Terrain Grading (right)
    const s12_27 = startStep(pg12);
    {
      const slope = createSlope(2, 1, 25, {
        name: "Slope 3×4 (25°)", partNumber: "3297", description: "Landscape terrain slope",
      });
      slope.position.set(4, PLATE_HEIGHT, 5);
      addToStep(s12_27, slope);
    }

    // Step 28: Structural Soffits — Exposed Deck Edges
    const s12_28 = startStep(pg12);
    {
      const soffit = createInvertedSlope(2, 1, {
        name: "Slope 1×2 Inverted", partNumber: "3665", description: "Exposed deck soffit",
      });
      soffit.position.set(-3, PODIUM_DECK_Y - PLATE_HEIGHT, 5.5);
      addToStep(s12_28, soffit);
    }

    // Step 29: Steep Terrain Features
    const s12_29 = startStep(pg12);
    {
      const soffit = createInvertedSlope(2, 1, {
        name: "Slope 1×2×2 (65°)", partNumber: "60481", description: "Steep terrain feature",
      });
      soffit.position.set(3, PODIUM_DECK_Y - PLATE_HEIGHT, 5.5);
      addToStep(s12_29, soffit);
    }

    // Step 30: Final Edge Infill
    const s12_30 = startStep(pg12);
    {
      const strip = createTile(4, 0.4, DARK_MAT, {
        name: "Plate 1×1", partNumber: "3024w", description: "Final edge strip",
      });
      strip.position.set(-5, PLATE_HEIGHT * 0.3, LAKE_Z + 5);
      addToStep(s12_30, strip);
    }

    // Step 31: Final Walkway Strips
    const s12_31 = startStep(pg12);
    {
      const strip = createTile(4, 0.4, DARK_MAT, {
        name: "Plate 1×6", partNumber: "3666", description: "Final walkway strip",
      });
      strip.position.set(5, PLATE_HEIGHT * 0.3, LAKE_Z + 5);
      addToStep(s12_31, strip);
    }

    // Step 32: Final Planting Beds & Structural Completion (back row trees)
    const s12_32 = startStep(pg12);
    for (const [tx, tz] of treePosns.slice(5)) {
      const planter = createBrick(1, 1, 0.5, WHITE_MAT, planterInfo, true);
      planter.position.set(tx, PLATE_HEIGHT, tz);
      addToStep(s12_32, planter);
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), GREEN_MAT);
      canopy.position.set(tx, PLATE_HEIGHT + BRICK_HEIGHT * 0.5 + 0.5, tz);
      (canopy as any).pieceInfo = canopyInfo;
      canopy.castShadow = true;
      addToStep(s12_32, canopy);
    }
  }

  // ── Apply step-level visibility across ALL phases ────────────────────
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
        if (effectiveStepIndex >= 0 && si <= effectiveStepIndex) {
          sg.visible = true;
        } else {
          sg.visible = false;
        }
      } else if (status === "past" || fullyCompleted) {
        sg.visible = true;
      } else {
        sg.visible = completedSteps.has(stepId);
      }
    });

    // Apply active step highlighting for current phase
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

import * as THREE from "three";

// LEGO dimensions in "stud units" — 1 stud = 8mm real, we use 1.0 unit
const PLATE_HEIGHT = 0.4; // 3.2mm / 8mm
const BRICK_HEIGHT = 1.2; // 9.6mm / 8mm (plate height * 3)
const STUD_RADIUS = 0.3;
const STUD_HEIGHT = 0.2;

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
  opacity: 0.9,
  linewidth: 2,
});

// Red wireframe material for selection glow (scaled-up duplicate)
const RED_WIREFRAME_MAT = new THREE.MeshBasicMaterial({
  color: 0xff2222,
  wireframe: true,
  transparent: true,
  opacity: 0.12,
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

// ─── Types ─────────────────────────────────────────────────────────────

export type PieceInfo = {
  name: string;
  partNumber: string;
  description: string;
};

// ─── Primitive Helpers ─────────────────────────────────────────────────

// Shinier material for studs (lower roughness for subtle sheen)
const STUD_MAT = new THREE.MeshStandardMaterial({
  color: 0xf5f5f0,
  roughness: 0.2,
  metalness: 0.0,
});

// Dark ring geometry for stud base definition
const STUD_RING_GEO = new THREE.TorusGeometry(STUD_RADIUS, 0.03, 6, 12);
const STUD_RING_MAT = new THREE.MeshStandardMaterial({
  color: 0xc0c0b8,
  roughness: 0.6,
  metalness: 0.0,
});

function createStuds(
  width: number,
  depth: number,
  yOffset: number
): THREE.Group {
  const group = new THREE.Group();
  // Slightly tapered stud — top radius slightly smaller for chamfer effect
  const studGeo = new THREE.CylinderGeometry(
    STUD_RADIUS * 0.92,
    STUD_RADIUS,
    STUD_HEIGHT,
    12
  );

  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      const stud = new THREE.Mesh(studGeo, STUD_MAT);
      stud.position.set(
        x - (width - 1) / 2,
        yOffset + STUD_HEIGHT / 2,
        z - (depth - 1) / 2
      );
      stud.castShadow = true;
      group.add(stud);

      // Dark ring at stud base for definition
      const ring = new THREE.Mesh(STUD_RING_GEO, STUD_RING_MAT);
      ring.position.set(
        x - (width - 1) / 2,
        yOffset + 0.01,
        z - (depth - 1) / 2
      );
      ring.rotation.x = -Math.PI / 2;
      group.add(ring);
    }
  }
  return group;
}

// Basic brick (w studs wide, d studs deep, h = brick height multiplier)
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

  const bodyGeo = new THREE.BoxGeometry(w, height, d);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  if (info) (body as any).pieceInfo = info;
  group.add(body);

  // Subtle edge lines for brick definition
  const edgesGeo = new THREE.EdgesGeometry(bodyGeo);
  const edgeLines = new THREE.LineSegments(edgesGeo, EDGE_LINE_MAT);
  edgeLines.position.y = height / 2;
  group.add(edgeLines);

  if (!noStuds && mat !== TRANS_MAT) {
    const studs = createStuds(w, d, height);
    studs.children.forEach((s) => {
      if (info) (s as any).pieceInfo = info;
    });
    group.add(studs);
  }

  return group;
}

// Plate (thinner brick)
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

  const bodyGeo = new THREE.BoxGeometry(w, height, d);
  const body = new THREE.Mesh(bodyGeo, mat);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  if (info) (body as any).pieceInfo = info;
  group.add(body);

  // Subtle edge lines for plate definition
  const edgesGeo = new THREE.EdgesGeometry(bodyGeo);
  const edgeLines = new THREE.LineSegments(edgesGeo, EDGE_LINE_MAT);
  edgeLines.position.y = height / 2;
  group.add(edgeLines);

  if (!smooth) {
    const studs = createStuds(w, d, height);
    studs.children.forEach((s) => {
      if (info) (s as any).pieceInfo = info;
    });
    group.add(studs);
  }

  return group;
}

// Round brick (column)
export function createRoundBrick(
  h: number = 1,
  info?: PieceInfo
): THREE.Group {
  const group = new THREE.Group();
  const height = h * BRICK_HEIGHT;

  const cylGeo = new THREE.CylinderGeometry(0.45, 0.45, height, 16);
  const cyl = new THREE.Mesh(cylGeo, WHITE_MAT);
  cyl.position.y = height / 2;
  cyl.castShadow = true;
  if (info) (cyl as any).pieceInfo = info;
  group.add(cyl);

  const studGeo = new THREE.CylinderGeometry(
    STUD_RADIUS,
    STUD_RADIUS,
    STUD_HEIGHT,
    12
  );
  const stud = new THREE.Mesh(studGeo, WHITE_MAT);
  stud.position.y = height + STUD_HEIGHT / 2;
  if (info) (stud as any).pieceInfo = info;
  group.add(stud);

  return group;
}

// Curved slope for barrel vault
export function createCurvedSlope(
  direction: "left" | "right",
  info?: PieceInfo
): THREE.Group {
  const group = new THREE.Group();

  const shape = new THREE.Shape();
  if (direction === "left") {
    shape.moveTo(0, 0);
    shape.lineTo(1.5, 0);
    shape.quadraticCurveTo(1.5, 1.0, 0, 1.0);
    shape.lineTo(0, 0);
  } else {
    shape.moveTo(0, 0);
    shape.lineTo(-1.5, 0);
    shape.quadraticCurveTo(-1.5, 1.0, 0, 1.0);
    shape.lineTo(0, 0);
  }

  const extrudeSettings = { depth: 1, bevelEnabled: false };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const mesh = new THREE.Mesh(geo, WHITE_MAT);
  mesh.rotation.x = -Math.PI / 2;
  mesh.castShadow = true;
  if (info) (mesh as any).pieceInfo = info;
  group.add(mesh);

  return group;
}

// Grille brick (textured surface with pronounced horizontal grooves)
export function createGrilleBrick(
  w: number,
  d: number,
  info?: PieceInfo
): THREE.Group {
  const group = new THREE.Group();
  const height = BRICK_HEIGHT;

  const bodyGeo = new THREE.BoxGeometry(w, height, d);
  const body = new THREE.Mesh(bodyGeo, GRILLE_MAT);
  body.position.y = height / 2;
  body.castShadow = true;
  if (info) (body as any).pieceInfo = info;
  group.add(body);

  // Edge lines for definition
  const edgesGeo = new THREE.EdgesGeometry(bodyGeo);
  const edgeLines = new THREE.LineSegments(edgesGeo, EDGE_LINE_MAT);
  edgeLines.position.y = height / 2;
  group.add(edgeLines);

  // 5 pronounced horizontal groove lines (recessed slightly into surface)
  const grooveGeo = new THREE.BoxGeometry(w * 0.96, 0.06, d * 0.15);
  for (let i = 0; i < 5; i++) {
    const groove = new THREE.Mesh(grooveGeo, GROOVE_LINE_MAT);
    groove.position.set(0, 0.18 + i * 0.2, d / 2 - d * 0.06);
    if (info) (groove as any).pieceInfo = info;
    group.add(groove);
    // Back side groove too
    const grooveBack = new THREE.Mesh(grooveGeo, GROOVE_LINE_MAT);
    grooveBack.position.set(0, 0.18 + i * 0.2, -(d / 2 - d * 0.06));
    if (info) (grooveBack as any).pieceInfo = info;
    group.add(grooveBack);
  }

  return group;
}

// Arch brick
export function createArch(info?: PieceInfo): THREE.Group {
  const group = new THREE.Group();

  const archGeo = new THREE.TorusGeometry(1.5, 0.25, 8, 16, Math.PI);
  const arch = new THREE.Mesh(archGeo, WHITE_MAT);
  arch.position.y = 0.5;
  arch.rotation.z = Math.PI;
  arch.castShadow = true;
  if (info) (arch as any).pieceInfo = info;
  group.add(arch);

  const pillarGeo = new THREE.BoxGeometry(0.5, 1.5, 0.5);
  const leftPillar = new THREE.Mesh(pillarGeo, WHITE_MAT);
  leftPillar.position.set(-1.5, 0.75, 0);
  if (info) (leftPillar as any).pieceInfo = info;
  group.add(leftPillar);

  const rightPillar = new THREE.Mesh(pillarGeo, WHITE_MAT);
  rightPillar.position.set(1.5, 0.75, 0);
  if (info) (rightPillar as any).pieceInfo = info;
  group.add(rightPillar);

  return group;
}

// Inverted slope — wedge shape: flat on top, angled on bottom
export function createInvertedSlope(
  w: number,
  d: number,
  info?: PieceInfo
): THREE.Group {
  const group = new THREE.Group();
  const h = BRICK_HEIGHT * 0.4;

  // Wedge shape — flat on top, angled on bottom
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2, 0);       // top-left (flat top)
  shape.lineTo(w / 2, 0);        // top-right
  shape.lineTo(w / 2, -h);       // bottom-right (full depth)
  shape.lineTo(-w / 2, 0);       // back to top-left (angled bottom)
  shape.closePath();

  const extrudeSettings = { depth: d, bevelEnabled: false };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const mesh = new THREE.Mesh(geo, WHITE_MAT);
  mesh.rotation.y = Math.PI / 2;
  mesh.position.set(0, 0, -d / 2);
  mesh.castShadow = true;
  if (info) (mesh as any).pieceInfo = info;
  group.add(mesh);

  // Edge lines
  const edgesGeo = new THREE.EdgesGeometry(geo);
  const edgeLines = new THREE.LineSegments(edgesGeo, EDGE_LINE_MAT);
  edgeLines.rotation.y = Math.PI / 2;
  edgeLines.position.set(0, 0, -d / 2);
  group.add(edgeLines);

  return group;
}

// Panel — thin vertical wall piece (for parapets, railings)
export function createPanel(
  w: number,
  h: number,
  info?: PieceInfo
): THREE.Group {
  const group = new THREE.Group();
  const panelHeight = h * BRICK_HEIGHT;
  const panelDepth = 0.2; // very thin

  const bodyGeo = new THREE.BoxGeometry(w, panelHeight, panelDepth);
  const body = new THREE.Mesh(bodyGeo, WHITE_MAT);
  body.position.y = panelHeight / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  if (info) (body as any).pieceInfo = info;
  group.add(body);

  // Edge lines
  const edgesGeo = new THREE.EdgesGeometry(bodyGeo);
  const edgeLines = new THREE.LineSegments(edgesGeo, EDGE_LINE_MAT);
  edgeLines.position.y = panelHeight / 2;
  group.add(edgeLines);

  // Single row of studs on top
  const studs = createStuds(w, 1, panelHeight);
  studs.children.forEach((s) => {
    if (info) (s as any).pieceInfo = info;
  });
  group.add(studs);

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
  completedPhases: string[],
  _buildId: string = "barbican-panorama",
  stepIndex?: number
): THREE.Group {
  return buildBarbicanPanorama(phaseId, completedPhases, stepIndex);
}

// ─── Step Group Helper ────────────────────────────────────────────────

/** Apply LEGO-instruction-style red outline to active step pieces.
 *  Keeps original materials — only ADDS red edge LineSegments and a
 *  slightly scaled-up red wireframe duplicate for a selection glow. */
export function applyActiveStepStyle(group: THREE.Group): void {
  // Collect meshes first to avoid mutating during traversal
  const meshesToOutline: THREE.Mesh[] = [];
  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh && (obj as THREE.Mesh).geometry) {
      meshesToOutline.push(obj as THREE.Mesh);
    }
  });
  for (const mesh of meshesToOutline) {
    // Bold red edge lines
    const edgesGeo = new THREE.EdgesGeometry(mesh.geometry);
    const lines = new THREE.LineSegments(edgesGeo, RED_EDGE_MAT);
    lines.position.copy(mesh.position);
    lines.rotation.copy(mesh.rotation);
    lines.scale.copy(mesh.scale);
    (lines as any)._isActiveEdge = true;
    group.add(lines);

    // Slightly scaled-up red wireframe duplicate for glow effect
    const glowMesh = new THREE.Mesh(mesh.geometry, RED_WIREFRAME_MAT);
    glowMesh.position.copy(mesh.position);
    glowMesh.rotation.copy(mesh.rotation);
    glowMesh.scale.copy(mesh.scale).multiplyScalar(1.02);
    (glowMesh as any)._isActiveEdge = true;
    group.add(glowMesh);
  }
}

// ─── Progressive Model Builder ─────────────────────────────────────────

function buildBarbicanPanorama(
  phaseId: string,
  completedPhases: string[],
  stepIndex?: number
): THREE.Group {
  const model = new THREE.Group();
  const currentIdx = BP_PHASES.indexOf(phaseId);

  const show = (pid: string): boolean => {
    const idx = BP_PHASES.indexOf(pid);
    return idx <= currentIdx || completedPhases.includes(pid);
  };

  // Step grouping helpers — used within each phase block
  const isCurrentPhase = (pid: string) => pid === phaseId;
  let currentPhaseGroup: THREE.Group | null = null;
  let stepCounter = 0;
  let activeStepGroupRef: THREE.Group | null = null;

  const beginPhase = (pid: string): THREE.Group => {
    const pg = new THREE.Group();
    pg.userData.phaseId = pid;
    model.add(pg);
    if (isCurrentPhase(pid)) {
      currentPhaseGroup = pg;
      stepCounter = 0;
    } else {
      currentPhaseGroup = null;
    }
    return pg;
  };

  const startStep = (phaseGroup: THREE.Group): THREE.Group => {
    const sg = new THREE.Group();
    const idx = stepCounter++;
    sg.userData.stepIndex = idx;
    phaseGroup.add(sg);
    return sg;
  };

  const addToStep = (stepGroup: THREE.Group, obj: THREE.Object3D) => {
    stepGroup.add(obj);
  };

  // Layout constants — the scene is centred at (0,0,0).
  // Z-axis: positive = towards the viewer (lake side)
  // X-axis: positive = right
  // Y-axis: positive = up
  const BASE_W = 32;
  const BASE_D = 24;
  const LAKE_Z = 8; // lake front-centre
  const PODIUM_Y = PLATE_HEIGHT;
  const PODIUM_DECK_Y = PODIUM_Y + 3 * BRICK_HEIGHT + PLATE_HEIGHT;
  const TERRACE_X = -2; // terrace centred slightly left
  const TERRACE_W = 20;
  const TERRACE_D = 3;
  const TERRACE_Z = -3;
  const TERRACE_H = 10; // brick courses
  const TOWER_X = -2;
  const TOWER_Z = TERRACE_Z - TERRACE_D / 2 - 2; // behind terrace
  const TOWER_W = 6;
  const TOWER_D = 4;
  const TOWER_COURSES = 25;
  // STRUCTURAL FIX: Tower starts at FOUNDATION level (Y=0), not on top of terrace.
  // It rises through/behind the terrace block as an independent load-bearing structure.
  const TOWER_BASE_Y = PLATE_HEIGHT; // directly on foundation

  // ── PHASE 1: Foundation Platform ─────────────────────────────────────
  if (show("bp-foundation")) {
    const pg1 = beginPhase("bp-foundation");

    // Step 0: Base 8x8 plates (the grid)
    const s1_0 = startStep(pg1);
    const left = createPlate(BASE_W / 2, BASE_D, WHITE_MAT, {
      name: "Plate 8×8",
      partNumber: "41539",
      description: "Foundation plate — left half",
    });
    left.position.set(-BASE_W / 4, 0, 0);
    addToStep(s1_0, left);
    const right = createPlate(BASE_W / 2, BASE_D, WHITE_MAT, {
      name: "Plate 8×8",
      partNumber: "41539",
      description: "Foundation plate — right half",
    });
    right.position.set(BASE_W / 4, 0, 0);
    addToStep(s1_0, right);

    // Step 1: Lake/side extensions (placeholder — same visual as core)
    const s1_1 = startStep(pg1);
    // Represented by slightly extended area (visual marker)
    const extFront = createPlate(BASE_W, 2, WHITE_MAT, {
      name: "Plate 6×10",
      partNumber: "3033",
      description: "Front extension — lake zone",
    });
    extFront.position.set(0, 0, BASE_D / 2 + 1);
    addToStep(s1_1, extFront);

    // Step 2: Gap fill plates
    const s1_2 = startStep(pg1);
    const fill = createPlate(BASE_W, 1, WHITE_MAT, {
      name: "Plate 4×8",
      partNumber: "3035",
      description: "Gap fill plate",
    }, true);
    fill.position.set(0, 0, -BASE_D / 2 - 0.5);
    addToStep(s1_2, fill);

    // Step 3: Edge reinforcement
    const s1_3 = startStep(pg1);
    for (const zOff of [-BASE_D / 2, BASE_D / 2]) {
      const edge = createPlate(BASE_W, 0.5, DARK_MAT, {
        name: "Plate 1×8",
        partNumber: "3460",
        description: "Base perimeter edge",
      }, true);
      edge.position.set(0, 0, zOff);
      addToStep(s1_3, edge);
    }
  }

  // ── PHASE 2: The Lake ────────────────────────────────────────────────
  if (show("bp-lake")) {
    const pg2 = beginPhase("bp-lake");

    // Step 0: Lake border — individual plates around the edge
    const s2_0 = startStep(pg2);
    const borderInfo = { name: "Plate 1×2", partNumber: "3023", description: "Lake border plate" };
    // Front and back edges
    for (let x = -7; x < 7; x += 2) {
      const fb = createPlate(2, 1, DARK_MAT, borderInfo);
      fb.position.set(x + 1, 0.02, LAKE_Z - 4.5);
      addToStep(s2_0, fb);
      const bb = createPlate(2, 1, DARK_MAT, borderInfo);
      bb.position.set(x + 1, 0.02, LAKE_Z + 4.5);
      addToStep(s2_0, bb);
    }
    // Left and right edges
    for (let z = -3; z < 4; z += 2) {
      const lb = createPlate(1, 2, DARK_MAT, borderInfo);
      lb.position.set(-7.5, 0.02, LAKE_Z + z);
      addToStep(s2_0, lb);
      const rb = createPlate(1, 2, DARK_MAT, borderInfo);
      rb.position.set(7.5, 0.02, LAKE_Z + z);
      addToStep(s2_0, rb);
    }

    // Step 1: Lake surface — grid of individual trans-clear plates WITH studs
    const s2_1 = startStep(pg2);
    const lakePlateInfo1x2 = { name: "Trans-Clear Plate 1×2", partNumber: "3023", description: "Ornamental lake — transparent plate" };
    const lakePlateInfo1x1 = { name: "Trans-Clear Plate 1×1", partNumber: "3024", description: "Ornamental lake — transparent plate" };
    for (let x = -6; x < 7; x += 2) {
      for (let z = -3; z < 4; z += 1) {
        // Skip occasional spots for water shimmer effect
        if ((x + z) % 5 === 0) continue;
        if (z % 2 === 0) {
          const p = createPlate(2, 1, TRANS_MAT, lakePlateInfo1x2);
          p.position.set(x, 0.05, LAKE_Z + z);
          addToStep(s2_1, p);
        } else {
          const p = createPlate(1, 1, TRANS_MAT, lakePlateInfo1x1);
          p.position.set(x, 0.05, LAKE_Z + z);
          addToStep(s2_1, p);
          const p2 = createPlate(1, 1, TRANS_MAT, lakePlateInfo1x1);
          p2.position.set(x + 1, 0.05, LAKE_Z + z);
          addToStep(s2_1, p2);
        }
      }
    }

    // Step 2: Deeper centre — second layer of trans plates in centre 8×4 zone
    const s2_2 = startStep(pg2);
    const deepInfo = { name: "Trans-Clear Plate 1×2", partNumber: "3023", description: "Deeper lake centre" };
    for (let x = -4; x < 4; x += 2) {
      for (let z = -2; z < 2; z += 1) {
        const dp = createPlate(2, 1, TRANS_MAT, deepInfo);
        dp.position.set(x + 1, 0.12, LAKE_Z + z);
        addToStep(s2_2, dp);
      }
    }
  }

  // ── PHASE 3: Podium Colonnade ────────────────────────────────────────
  if (show("bp-podium")) {
    const pg3 = beginPhase("bp-podium");

    // Step 0: Main columns
    const s3_0 = startStep(pg3);
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 8; col++) {
        const column = createRoundBrick(3, {
          name: "Round Brick 1×1",
          partNumber: "3062b",
          description: "Podium colonnade piloti",
        });
        column.position.set(
          -10.5 + col * 3,
          PODIUM_Y,
          1 + row * 3
        );
        addToStep(s3_0, column);
      }
    }

    // Step 1: Secondary columns + bracing
    const s3_1 = startStep(pg3);
    for (let col = 0; col < 7; col++) {
      const secCol = createRoundBrick(2, {
        name: "Round Brick 1×1",
        partNumber: "3062b",
        description: "Secondary podium column",
      });
      secCol.position.set(-9 + col * 3, PODIUM_Y, 2.5);
      addToStep(s3_1, secCol);
    }

    // Step 2: Podium deck — individual 2×6 plates WITH studs
    const s3_2 = startStep(pg3);
    const deckInfo = { name: "Plate 2×6", partNumber: "3795", description: "Podium deck plate" };
    // Lay individual 2×6 plates in a grid across the deck area
    for (let x = -12; x < 13; x += 6) {
      for (let z = -2; z < 6; z += 2) {
        const dp = createPlate(6, 2, WHITE_MAT, deckInfo);
        dp.position.set(x, PODIUM_DECK_Y, z + 2);
        addToStep(s3_2, dp);
      }
    }

    // Step 3: Soffits — inverted slope wedges
    const s3_3 = startStep(pg3);
    for (let i = 0; i < 8; i++) {
      const soffit = createInvertedSlope(3, 1, {
        name: "Slope Inverted 45 2×1",
        partNumber: "3665",
        description: "Cantilevered soffit at deck edge",
      });
      soffit.position.set(-10.5 + i * 3, PODIUM_DECK_Y - PLATE_HEIGHT * 1.5, 5.5);
      addToStep(s3_3, soffit);
    }

    // Step 4: Parapets — thin panel wall pieces
    const s3_4 = startStep(pg3);
    const parapetInfo = { name: "Panel 1×4×1 Rounded", partNumber: "30413", description: "Podium walkway parapet" };
    for (const zOff of [5.8, -1.5]) {
      const parapet = createPanel(26, 0.8, parapetInfo);
      parapet.position.set(0, PODIUM_DECK_Y + PLATE_HEIGHT, zOff);
      addToStep(s3_4, parapet);
    }
  }

  // ── PHASE 4: Terrace Block Structural Core ───────────────────────────
  if (show("bp-terrace-core")) {
    const pg4 = beginPhase("bp-terrace-core");
    const bearingWallCount = 4;
    const bearingCoursesBelow = Math.round((PODIUM_DECK_Y - PLATE_HEIGHT) / BRICK_HEIGHT);

    // Step 0: Ground course — wide bricks (bearing walls)
    const s4_0 = startStep(pg4);
    for (let w = 0; w < bearingWallCount; w++) {
      const wx = TERRACE_X - TERRACE_W / 2 + 2 + w * (TERRACE_W / (bearingWallCount - 1)) - 2;
      for (let course = 0; course < bearingCoursesBelow; course++) {
        const cy = PLATE_HEIGHT + course * BRICK_HEIGHT;
        const bearWall = createBrick(1.5, TERRACE_D + 2, 1, DARK_MAT, {
          name: "Brick 2×4",
          partNumber: "3001",
          description: "Bearing wall — terrace to foundation",
        }, true);
        bearWall.position.set(wx, cy, TERRACE_Z);
        addToStep(s4_0, bearWall);
      }
    }

    // Step 1: Rising courses — lower half
    const s4_1 = startStep(pg4);
    for (let course = 0; course < Math.floor(TERRACE_H / 2); course++) {
      const cy = PODIUM_DECK_Y + PLATE_HEIGHT + course * BRICK_HEIGHT;
      const offset = course % 2 === 0 ? 0 : 0.5;
      const brick = createBrick(TERRACE_W, TERRACE_D, 1, WHITE_MAT, {
        name: course % 2 === 0 ? "Brick 2×4" : "Brick 2×3",
        partNumber: course % 2 === 0 ? "3001" : "3002",
        description: "Terrace core wall — running bond",
      }, true);
      brick.position.set(TERRACE_X + offset, cy, TERRACE_Z);
      addToStep(s4_1, brick);
    }

    // Step 2: Floor plates + upper courses
    const s4_2 = startStep(pg4);
    for (let course = Math.floor(TERRACE_H / 2); course < TERRACE_H; course++) {
      const cy = PODIUM_DECK_Y + PLATE_HEIGHT + course * BRICK_HEIGHT;
      const offset = course % 2 === 0 ? 0 : 0.5;
      const brick = createBrick(TERRACE_W, TERRACE_D, 1, WHITE_MAT, {
        name: course % 2 === 0 ? "Brick 2×4" : "Brick 2×3",
        partNumber: course % 2 === 0 ? "3001" : "3002",
        description: "Terrace core wall — running bond",
      }, true);
      brick.position.set(TERRACE_X + offset, cy, TERRACE_Z);
      addToStep(s4_2, brick);
    }

    // Step 3: Wall infill (visual completion)
    const s4_3 = startStep(pg4);
    // Cap plate across top
    const capPlate = createPlate(TERRACE_W, TERRACE_D, WHITE_MAT, {
      name: "Plate 2×8",
      partNumber: "3034",
      description: "Terrace top cap plate",
    }, true);
    capPlate.position.set(TERRACE_X, PODIUM_DECK_Y + PLATE_HEIGHT + TERRACE_H * BRICK_HEIGHT, TERRACE_Z);
    addToStep(s4_3, capPlate);

    // Step 4: Rear shear walls
    const s4_4 = startStep(pg4);
    const shearWallD = 4;
    const totalShearCourses = bearingCoursesBelow + TERRACE_H;
    for (const side of [-1, 1]) {
      const sx = TERRACE_X + side * 2.5;
      for (let course = 0; course < totalShearCourses; course++) {
        const cy = PLATE_HEIGHT + course * BRICK_HEIGHT;
        const wall = createBrick(1, shearWallD, 1, WHITE_MAT, {
          name: "Brick 2×4",
          partNumber: "3001",
          description: "Rear shear wall — foundation to tower",
        }, true);
        wall.position.set(sx, cy, TERRACE_Z - TERRACE_D / 2 - shearWallD / 2);
        addToStep(s4_4, wall);
      }
    }
  }

  // ── PHASE 5: Terrace SNOT Facade ─────────────────────────────────────
  if (show("bp-terrace-facade")) {
    const pg5 = beginPhase("bp-terrace-facade");
    const facadeZ = TERRACE_Z + TERRACE_D / 2 + 0.4;

    // Step 0: SNOT mounting points
    const s5_0 = startStep(pg5);
    // Step 1: Textured concrete — grille tiles (lower levels)
    const s5_1 = startStep(pg5);
    // Step 2: Window reveals — headlight bricks
    const s5_2 = startStep(pg5);
    // Step 3: Glazing — transparent bricks (upper levels)
    const s5_3 = startStep(pg5);
    // Step 4: Large window panels
    const s5_4 = startStep(pg5);

    for (let level = 0; level < 5; level++) {
      const ly = PODIUM_DECK_Y + PLATE_HEIGHT + level * 2 * BRICK_HEIGHT;
      const targetStep = level < 2 ? s5_1 : level < 4 ? s5_3 : s5_4;
      for (let col = 0; col < 7; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 1.5 + col * 2.8;
        const grille = createGrilleBrick(2, 0.5, {
          name: "Tile 1×2 Grille",
          partNumber: "2412b",
          description: "Bush-hammered concrete texture panel",
        });
        grille.position.set(cx, ly, facadeZ);
        addToStep(level === 0 ? s5_0 : targetStep, grille);
        const win = createBrick(2, 0.3, 0.8, TRANS_MAT, {
          name: "Trans-Clear Panel 1×2×2",
          partNumber: "87552",
          description: "Window glazing — SNOT facade",
        });
        win.position.set(cx, ly + BRICK_HEIGHT, facadeZ + 0.1);
        addToStep(level < 3 ? s5_2 : targetStep, win);
      }
    }
  }

  // ── PHASE 6: Balconies & Soffits ─────────────────────────────────────
  if (show("bp-terrace-balconies")) {
    const pg6 = beginPhase("bp-terrace-balconies");
    const facadeZ = TERRACE_Z + TERRACE_D / 2 + 0.6;

    // Step 0: Balcony slabs — projecting plates
    const s6_0 = startStep(pg6);
    // Step 1: Balcony soffits — narrow inverted slopes
    const s6_1 = startStep(pg6);
    // Step 2: Wide inverted slopes
    const s6_2 = startStep(pg6);
    // Step 3: Balcony surface — smooth tiles
    const s6_3 = startStep(pg6);

    for (let level = 0; level < 5; level++) {
      const ly =
        PODIUM_DECK_Y + PLATE_HEIGHT + (level * 2 + 1) * BRICK_HEIGHT + BRICK_HEIGHT;
      const stagger = level % 2 === 0 ? 0 : 1.4;
      const targetStep = level < 2 ? s6_0 : level < 3 ? s6_1 : level < 4 ? s6_2 : s6_3;
      for (let col = 0; col < 6; col++) {
        const cx = TERRACE_X - TERRACE_W / 2 + 2 + col * 3.2 + stagger;
        const balcony = createPlate(2.5, 1.2, WHITE_MAT, {
          name: "Plate 1×4",
          partNumber: "3710",
          description: "Cantilevered balcony projection",
        }, true);
        balcony.position.set(cx, ly, facadeZ + 1);
        addToStep(targetStep, balcony);
      }
    }

    // Step 4: Arts Centre arches
    const s6_4 = startStep(pg6);
    for (let i = 0; i < 3; i++) {
      const arch = createArch({
        name: "Arch 1×4",
        partNumber: "3659",
        description: "Ground-level entrance arch",
      });
      arch.position.set(TERRACE_X - 5 + i * 5, PODIUM_Y, facadeZ + 2);
      arch.scale.set(0.5, 0.5, 0.5);
      addToStep(s6_4, arch);
    }
  }

  // ── PHASE 7: Barrel Vault Roof ───────────────────────────────────────
  if (show("bp-barrel-vault")) {
    const pg7 = beginPhase("bp-barrel-vault");
    const vaultBaseY =
      PODIUM_DECK_Y + PLATE_HEIGHT + TERRACE_H * BRICK_HEIGHT;
    const vaultSegments = 10;
    const segW = TERRACE_W / vaultSegments;

    // Step 0: Vault curve — curved slopes (left half)
    const s7_0 = startStep(pg7);
    for (let seg = 0; seg < Math.floor(vaultSegments / 2); seg++) {
      const sx = TERRACE_X - TERRACE_W / 2 + segW / 2 + seg * segW;
      const ls = createCurvedSlope("left", {
        name: "Curved Slope 3×1",
        partNumber: "50950",
        description: "Barrel vault — left curve",
      });
      ls.position.set(sx, vaultBaseY, TERRACE_Z);
      addToStep(s7_0, ls);
      const rs = createCurvedSlope("right", {
        name: "Curved Slope 3×1",
        partNumber: "50950",
        description: "Barrel vault — right curve",
      });
      rs.position.set(sx, vaultBaseY, TERRACE_Z);
      addToStep(s7_0, rs);
    }

    // Step 1: Vault enrichment — right half
    const s7_1 = startStep(pg7);
    for (let seg = Math.floor(vaultSegments / 2); seg < vaultSegments; seg++) {
      const sx = TERRACE_X - TERRACE_W / 2 + segW / 2 + seg * segW;
      const ls = createCurvedSlope("left", {
        name: "Curved Slope 3×1",
        partNumber: "50950",
        description: "Barrel vault — left curve",
      });
      ls.position.set(sx, vaultBaseY, TERRACE_Z);
      addToStep(s7_1, ls);
      const rs = createCurvedSlope("right", {
        name: "Curved Slope 3×1",
        partNumber: "50950",
        description: "Barrel vault — right curve",
      });
      rs.position.set(sx, vaultBaseY, TERRACE_Z);
      addToStep(s7_1, rs);
    }

    // Step 2: Vault edges — angled slopes (placeholder)
    const s7_2 = startStep(pg7);
    // Visual: end cap bricks
    for (const endX of [TERRACE_X - TERRACE_W / 2 + 0.5, TERRACE_X + TERRACE_W / 2 - 0.5]) {
      const endCap = createBrick(1, TERRACE_D, 0.6, WHITE_MAT, {
        name: "Slope 1×2 (45°)",
        partNumber: "3040",
        description: "Vault end cap",
      }, true);
      endCap.position.set(endX, vaultBaseY, TERRACE_Z);
      addToStep(s7_2, endCap);
    }

    // Step 3: Ridge line — smooth cap
    const s7_3 = startStep(pg7);
    const ridge = createPlate(TERRACE_W, 0.6, DARK_MAT, {
      name: "Tile 1×4",
      partNumber: "2431",
      description: "Barrel vault ridge cap",
    }, true);
    ridge.position.set(TERRACE_X, vaultBaseY + 1.0, TERRACE_Z);
    addToStep(s7_3, ridge);

    // Step 4: Hip corners — double convex slopes (placeholder visual)
    const s7_4 = startStep(pg7);
    for (const endX of [TERRACE_X - TERRACE_W / 2 + 0.5, TERRACE_X + TERRACE_W / 2 - 0.5]) {
      const hip = createBrick(1, 1, 0.5, DARK_MAT, {
        name: "Slope 2×2 Double Convex",
        partNumber: "3045",
        description: "Hip corner element",
      }, true);
      hip.position.set(endX, vaultBaseY + 0.8, TERRACE_Z);
      addToStep(s7_4, hip);
    }
  }

  // ── PHASE 8: Lauderdale Tower Core ───────────────────────────────────
  if (show("bp-tower-core")) {
    const pg8 = beginPhase("bp-tower-core");
    const totalTowerCourses = TOWER_COURSES + Math.round(PODIUM_DECK_Y / BRICK_HEIGHT) + TERRACE_H;

    // Step 0: Tower base — directly on foundation (widened)
    const s8_0 = startStep(pg8);
    for (let course = 0; course < 5; course++) {
      const cy = TOWER_BASE_Y + course * BRICK_HEIGHT;
      const baseBrick = createBrick(TOWER_W + 2, TOWER_D + 2, 1, WHITE_MAT, {
        name: "Brick 2×4",
        partNumber: "3001",
        description: "Tower widened base — directly on foundation",
      }, true);
      baseBrick.position.set(TOWER_X, cy, TOWER_Z);
      addToStep(s8_0, baseBrick);
    }

    // Step 1: Tower lower shaft — through terrace zone
    const s8_1 = startStep(pg8);
    const midCourse = Math.floor((totalTowerCourses - 5) / 3) + 5;
    for (let course = 5; course < midCourse; course++) {
      const cy = TOWER_BASE_Y + course * BRICK_HEIGHT;
      const brick = createBrick(TOWER_W, TOWER_D, 1, WHITE_MAT, {
        name: "Brick 2×4",
        partNumber: "3001",
        description: "Lauderdale Tower core wall",
      }, true);
      brick.position.set(TOWER_X, cy, TOWER_Z);
      addToStep(s8_1, brick);
    }

    // Step 2: Tower emerging — above terrace roofline
    const s8_2 = startStep(pg8);
    const upperStart = midCourse + Math.floor((totalTowerCourses - midCourse) / 2);
    for (let course = midCourse; course < upperStart; course++) {
      const cy = TOWER_BASE_Y + course * BRICK_HEIGHT;
      const brick = createBrick(TOWER_W, TOWER_D, 1, WHITE_MAT, {
        name: "Brick 1×3",
        partNumber: "3622",
        description: "Lauderdale Tower core wall",
      }, true);
      brick.position.set(TOWER_X, cy, TOWER_Z);
      addToStep(s8_2, brick);
    }

    // Step 3: Tower upper — hollow core
    const s8_3 = startStep(pg8);
    for (let course = upperStart; course < totalTowerCourses; course++) {
      const cy = TOWER_BASE_Y + course * BRICK_HEIGHT;
      const brick = createBrick(TOWER_W, TOWER_D, 1, WHITE_MAT, {
        name: "Brick 2×4",
        partNumber: "3001",
        description: "Lauderdale Tower core wall",
      }, true);
      brick.position.set(TOWER_X, cy, TOWER_Z);
      addToStep(s8_3, brick);
    }
  }

  // ── PHASE 9: Tower Facade & Window Bands ─────────────────────────────
  if (show("bp-tower-facade")) {
    const pg9 = beginPhase("bp-tower-facade");
    const facadeZ_t = TOWER_Z + TOWER_D / 2 + 0.3;
    const towerVisibleStart = PODIUM_DECK_Y + PLATE_HEIGHT + TERRACE_H * BRICK_HEIGHT + 2;

    // 5 steps spread across 6 bands: s0 = band 0, s1 = band 1, s2 = bands 2-3, s3 = band 4, s4 = band 5
    const stepGroups9 = [
      startStep(pg9), startStep(pg9), startStep(pg9), startStep(pg9), startStep(pg9),
    ];
    const bandToStep = [0, 1, 2, 2, 3, 4];

    for (let band = 0; band < 6; band++) {
      const by = towerVisibleStart + (3 + band * 4) * BRICK_HEIGHT;
      const sg = stepGroups9[bandToStep[band]];
      const grille = createGrilleBrick(TOWER_W, 0.5, {
        name: "Grille Brick 1×2",
        partNumber: "2877",
        description: "Tower window band — concrete texture",
      });
      grille.position.set(TOWER_X, by, facadeZ_t);
      addToStep(sg, grille);
      const win = createBrick(TOWER_W, 0.3, 0.5, TRANS_MAT, {
        name: "Trans-Clear Brick 1×2",
        partNumber: "3065",
        description: "Tower window glazing",
      });
      win.position.set(TOWER_X, by + BRICK_HEIGHT * 0.6, facadeZ_t + 0.15);
      addToStep(sg, win);
      const slab = createPlate(TOWER_W + 1, TOWER_D + 1, WHITE_MAT, {
        name: "Plate 2×6",
        partNumber: "3795",
        description: "Tower balcony slab",
      }, true);
      slab.position.set(TOWER_X, by + BRICK_HEIGHT, facadeZ_t - 0.3);
      addToStep(sg, slab);
    }
  }

  // ── PHASE 10: Tower Serrated Edges & Crown ───────────────────────────
  if (show("bp-tower-crown")) {
    const pg10 = beginPhase("bp-tower-crown");
    const totalTowerCourses = TOWER_COURSES + Math.round(PODIUM_DECK_Y / BRICK_HEIGHT) + TERRACE_H;
    const crownBaseY = TOWER_BASE_Y + totalTowerCourses * BRICK_HEIGHT;
    const towerVisibleStart2 = PODIUM_DECK_Y + PLATE_HEIGHT + TERRACE_H * BRICK_HEIGHT + 2;

    // Step 0: Serrated edges — wedge plates
    const s10_0 = startStep(pg10);
    for (let band = 0; band < 2; band++) {
      const by = towerVisibleStart2 + (5 + band * 5) * BRICK_HEIGHT;
      for (const side of [-1, 1]) {
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
        (wedgeMesh as any).pieceInfo = { name: "Cheese Slope 1×1×2/3", partNumber: "54200", description: "Serrated balcony edge" };
        cheese.add(wedgeMesh);
        cheese.position.set(TOWER_X + (TOWER_W / 2 + 0.4) * side, by, TOWER_Z + TOWER_D / 2);
        addToStep(s10_0, cheese);
      }
    }

    // Step 1: Fine serration — cheese slopes
    const s10_1 = startStep(pg10);
    for (let band = 2; band < 4; band++) {
      const by = towerVisibleStart2 + (5 + band * 5) * BRICK_HEIGHT;
      for (const side of [-1, 1]) {
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
        (wedgeMesh as any).pieceInfo = { name: "Cheese Slope 1×1×2/3", partNumber: "54200", description: "Serrated balcony edge" };
        cheese.add(wedgeMesh);
        cheese.position.set(TOWER_X + (TOWER_W / 2 + 0.4) * side, by, TOWER_Z + TOWER_D / 2);
        addToStep(s10_1, cheese);
      }
    }

    // Step 2: Crown angles — main slopes
    const s10_2 = startStep(pg10);
    for (let step = 0; step < 2; step++) {
      const sw = TOWER_W - step * 1;
      const sd = TOWER_D - step * 0.5;
      const stepBrick = createBrick(sw, sd, 0.6, WHITE_MAT, {
        name: "Brick 1×2",
        partNumber: "3004",
        description: "Crown stepped recess",
      }, true);
      stepBrick.position.set(TOWER_X, crownBaseY + step * BRICK_HEIGHT * 0.6, TOWER_Z);
      addToStep(s10_2, stepBrick);
    }

    // Step 3: Crown transition — gentle slopes
    const s10_3 = startStep(pg10);
    const topStep = createBrick(TOWER_W - 2, TOWER_D - 1, 0.6, WHITE_MAT, {
      name: "Slope 3×4 (25°)",
      partNumber: "3297",
      description: "Crown stepped recess",
    }, true);
    topStep.position.set(TOWER_X, crownBaseY + 2 * BRICK_HEIGHT * 0.6, TOWER_Z);
    addToStep(s10_3, topStep);

    // Step 4: Crown peak — cap + mechanical penthouse
    const s10_4 = startStep(pg10);
    const capY = crownBaseY + 3 * BRICK_HEIGHT * 0.6;
    const cap = createPlate(TOWER_W - 2, TOWER_D - 1, WHITE_MAT, {
      name: "Tile 2×2",
      partNumber: "3068b",
      description: "Tower cap tiles",
    }, true);
    cap.position.set(TOWER_X, capY, TOWER_Z);
    addToStep(s10_4, cap);
    const mech = createBrick(2, 1.5, 0.5, DARK_MAT, {
      name: "Brick 1×1",
      partNumber: "3005",
      description: "Mechanical penthouse",
    }, true);
    mech.position.set(TOWER_X, capY + PLATE_HEIGHT, TOWER_Z);
    addToStep(s10_4, mech);
  }

  // ── PHASE 11: The Conservatory ───────────────────────────────────────
  if (show("bp-conservatory")) {
    const pg11 = beginPhase("bp-conservatory");
    const conX = TERRACE_X + TERRACE_W / 2 - 2;
    const conZ = TERRACE_Z;
    const conBaseY = PODIUM_DECK_Y + PLATE_HEIGHT + TERRACE_H * BRICK_HEIGHT + 1.0;

    // Step 0: Conservatory base — curved walls
    const s11_0 = startStep(pg11);
    const conBase = createPlate(5, 4, WHITE_MAT, {
      name: "Plate 4×6",
      partNumber: "3032",
      description: "Conservatory base plate",
    }, true);
    conBase.position.set(conX, conBaseY, conZ);
    addToStep(s11_0, conBase);

    // Step 1: Glazing — transparent bricks (back wall)
    const s11_1 = startStep(pg11);
    for (let i = 0; i < 3; i++) {
      const panel = createBrick(1.5, 0.4, 1.2, TRANS_MAT, {
        name: "Trans-Clear Panel 1×2×2",
        partNumber: "87552",
        description: "Conservatory glass wall",
      });
      panel.position.set(conX - 1.5 + i * 1.5, conBaseY + PLATE_HEIGHT, conZ - 1.8);
      addToStep(s11_1, panel);
    }
    for (const sx of [-2.5, 2.5]) {
      for (let i = 0; i < 2; i++) {
        const panel = createBrick(0.4, 1.5, 1.2, TRANS_MAT, {
          name: "Trans-Clear Brick 1×2",
          partNumber: "3065",
          description: "Conservatory side glass",
        });
        panel.position.set(conX + sx, conBaseY + PLATE_HEIGHT, conZ - 0.5 + i * 1.5);
        addToStep(s11_1, panel);
      }
    }

    // Step 2: Roof — gentle glass slopes
    const s11_2 = startStep(pg11);
    for (let i = 0; i < 3; i++) {
      const roofY = conBaseY + PLATE_HEIGHT + 1.2 * BRICK_HEIGHT;
      const ls = createCurvedSlope("left", {
        name: "Curved Slope 3×1",
        partNumber: "50950",
        description: "Conservatory vaulted roof",
      });
      ls.position.set(conX - 1.5 + i * 1.5, roofY, conZ);
      addToStep(s11_2, ls);
      const rs = createCurvedSlope("right", {
        name: "Curved Slope 3×1",
        partNumber: "50950",
        description: "Conservatory vaulted roof",
      });
      rs.position.set(conX - 1.5 + i * 1.5, roofY, conZ);
      addToStep(s11_2, rs);
    }
    const roofGlass = createPlate(4, 3, TRANS_MAT, {
      name: "Trans-Clear Plate 2×3",
      partNumber: "3021",
      description: "Conservatory glass roof",
    }, true);
    roofGlass.position.set(conX, conBaseY + PLATE_HEIGHT + 1.2 * BRICK_HEIGHT + 0.6, conZ);
    addToStep(s11_2, roofGlass);

    // Step 3: Rooftop platform (placeholder)
    const s11_3 = startStep(pg11);
    const platform = createPlate(6, 5, WHITE_MAT, {
      name: "Plate 4×4 Round Corner",
      partNumber: "30565",
      description: "Conservatory rooftop platform",
    }, true);
    platform.position.set(conX, conBaseY - PLATE_HEIGHT, conZ);
    addToStep(s11_3, platform);

    // Step 4: Planting — green dots
    const s11_4 = startStep(pg11);
    for (const [px, pz] of [[0, 0], [-1, 0.5], [1, -0.5]] as [number, number][]) {
      const plant = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.4, 12),
        GREEN_MAT
      );
      plant.position.set(conX + px, conBaseY + PLATE_HEIGHT + 0.2, conZ + pz);
      (plant as any).pieceInfo = {
        name: "Plate 1×1 Round",
        partNumber: "4073",
        description: "Tropical plant in conservatory",
      };
      plant.castShadow = true;
      addToStep(s11_4, plant);
    }
  }

  // ── PHASE 12: Landscaping & Details ──────────────────────────────────
  if (show("bp-landscaping")) {
    const pg12 = beginPhase("bp-landscaping");

    // Step 0: Garden grade changes
    const s12_0 = startStep(pg12);
    // Walkway tiles along the podium front
    for (let i = 0; i < 10; i++) {
      const tile = createPlate(2.5, 1, DARK_MAT, {
        name: "Tile 1×4",
        partNumber: "2431",
        description: "Highwalk paving tile",
      }, true);
      tile.position.set(-11 + i * 2.5, PODIUM_DECK_Y + PLATE_HEIGHT * 0.5, 5.5);
      addToStep(s12_0, tile);
    }

    // Step 1: Walkway surfaces — small tiles (lake edge path)
    const s12_1 = startStep(pg12);
    const lakePath = createPlate(16, 0.6, DARK_MAT, {
      name: "Tile 1×6",
      partNumber: "6636",
      description: "Lakeside promenade",
    }, true);
    lakePath.position.set(0, PLATE_HEIGHT * 0.3, LAKE_Z - 4.5);
    addToStep(s12_1, lakePath);

    // Step 2: Walkway strips — long tiles + bollards
    const s12_2 = startStep(pg12);
    for (let i = 0; i < 6; i++) {
      const bollard = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8),
        DARK_MAT
      );
      bollard.position.set(-6 + i * 2.5, PLATE_HEIGHT + 0.2, LAKE_Z - 4.5);
      (bollard as any).pieceInfo = {
        name: "Round Plate 1×1",
        partNumber: "4073",
        description: "Promenade bollard",
      };
      addToStep(s12_2, bollard);
    }

    // Step 3: Plaza sections & highwalk extensions (planters front half)
    const s12_3 = startStep(pg12);
    const treePosns: [number, number][] = [
      [-8, 4], [-4, 3.5], [0, 3.5], [4, 3.5], [8, 4],
      [-6, 12], [-2, 12], [2, 12], [6, 12],
    ];
    for (const [tx, tz] of treePosns.slice(0, 5)) {
      const planter = createBrick(1, 1, 0.5, WHITE_MAT, {
        name: "Brick 1×1",
        partNumber: "3005",
        description: "Planter box",
      }, true);
      planter.position.set(tx, PLATE_HEIGHT, tz);
      addToStep(s12_3, planter);
      const canopy = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 12, 8),
        GREEN_MAT
      );
      canopy.position.set(tx, PLATE_HEIGHT + BRICK_HEIGHT * 0.5 + 0.5, tz);
      (canopy as any).pieceInfo = {
        name: "Plate 1×1 Round",
        partNumber: "4073",
        description: "Tree canopy",
      };
      canopy.castShadow = true;
      addToStep(s12_3, canopy);
    }

    // Step 4: Final details & remaining pieces (back row trees)
    const s12_4 = startStep(pg12);
    for (const [tx, tz] of treePosns.slice(5)) {
      const planter = createBrick(1, 1, 0.5, WHITE_MAT, {
        name: "Brick 1×1",
        partNumber: "3005",
        description: "Planter box",
      }, true);
      planter.position.set(tx, PLATE_HEIGHT, tz);
      addToStep(s12_4, planter);
      const canopy = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 12, 8),
        GREEN_MAT
      );
      canopy.position.set(tx, PLATE_HEIGHT + BRICK_HEIGHT * 0.5 + 0.5, tz);
      (canopy as any).pieceInfo = {
        name: "Plate 1×1 Round",
        partNumber: "4073",
        description: "Tree canopy",
      };
      canopy.castShadow = true;
      addToStep(s12_4, canopy);
    }
  }

  // ── Apply step visibility for current phase ─────────────────────────
  const effectiveStepIndex = stepIndex ?? Infinity;
  model.traverse((obj) => {
    const pg = obj as THREE.Group;
    if (pg.userData.phaseId === phaseId) {
      // This is the current phase group — apply step visibility
      let maxVisibleStep = -1;
      pg.children.forEach((child) => {
        const sg = child as THREE.Group;
        if (sg.userData.stepIndex !== undefined) {
          if (sg.userData.stepIndex > effectiveStepIndex) {
            sg.visible = false;
          } else {
            sg.visible = true;
            if (sg.userData.stepIndex > maxVisibleStep) {
              maxVisibleStep = sg.userData.stepIndex;
            }
          }
        }
      });
      // Apply active step highlighting to the last visible step
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

  // Store the active step group ref on the model for the viewer to access
  (model as any)._activeStepGroup = activeStepGroupRef;

  return model;
}

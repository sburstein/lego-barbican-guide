# LEGO Barbican Guide — 3D Model Audit Report

**Date:** 2026-03-27
**Auditor:** First-principles LEGO geometry review
**Files reviewed:**
- `src/lego-geometry.ts` (1552 lines — geometry primitives + full diorama builder)
- `src/builds.ts` (893 lines — build instructions data)
- `src/LegoViewer.tsx` (263 lines — Three.js viewer component)

---

## 1. CRITICAL ISSUES

### C1. Standalone "stud" cylinders in SNOT facade (Phase 5, lines 911-921)

**The problem:** The Phase 5 SNOT mounting code creates **standalone cylinder meshes** positioned in front of the wall face to represent "outward-facing studs." These are free-floating geometry — they are not part of any brick mesh. They are raw `CylinderGeometry` primitives manually rotated 90 degrees and placed at calculated coordinates.

```
// Lines 912-921 — standalone stud cylinders
for (let s = 0; s < 2; s++) {
  const studGeo = new THREE.CylinderGeometry(STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 8);
  const stud = new THREE.Mesh(studGeo, WHITE_MAT);
  stud.rotation.x = Math.PI / 2; // point outward (along Z)
  ...
}
```

**Why this is wrong:** A Brick 1x4 with Side Studs (30414) is a single moulded piece. The studs on its side are integral to the brick body. The 3D model should show a single brick mesh with bumps on one face — not a box + separate cylinders. This makes the model look like studs are glued to a smooth wall, which is physically impossible.

**Fix:** Create a dedicated `createSideStudBrick()` function that generates a single group with the brick body AND side studs as one cohesive piece, similar to how `createBrick()` includes studs on top.

---

### C2. No "empty state" — base plate studs render before any steps (Viewer, lines 196-253)

**The problem:** The `buildPhaseModel()` function always renders geometry for all "shown" phases. When a user navigates to Phase 1 Step 1, the code runs `buildBarbicanPanorama(phaseId, completedSteps, stepIndex)` which immediately constructs the foundation plate geometry at step 0. There is no concept of an empty build surface.

The viewer shows `si <= effectiveStepIndex` (line 1510), meaning when `stepIndex === 0`, step 0 is already visible. The user sees the first step's pieces already placed — they never see the empty table before beginning.

**Why this is wrong:** In real LEGO instructions, Step 1 shows the pieces being added to an empty surface. The viewer should show:
- stepIndex = -1 or null: empty build surface (ground plane only)
- stepIndex = 0: first step's pieces appear

**Fix:** In the visibility logic (line 1510), change `si <= effectiveStepIndex` to `si < effectiveStepIndex` for a "show what you've built so far" model, or add a dedicated "step 0 = empty" concept.

---

### C3. Terrace core wall is rendered as single monolithic slabs per course (Phase 4, lines 826-851)

**The problem:** Each terrace wall course is a single `createBrick(TERRACE_W, TERRACE_D, 1, ...)` call — creating one 20-stud-wide brick. Real LEGO bricks max out at 2x6 (part 2456). The 3D model shows a single seamless wall slab per course, which:
1. Does not look like LEGO — no visible brick joints
2. Does not match the build instructions which call for multiple 2x4, 2x3, 2x6 bricks in running bond
3. Misrepresents the physical build — a builder cannot obtain a 20x3 brick

**Why this is wrong:** The instructions say to use Brick 2x6 and Brick 2x4 in offset bond pattern. The 3D should show individual bricks with visible joints and staggered seams.

**Fix:** Replace the single-slab-per-course approach with a loop that places multiple smaller bricks (2x4, 2x6) with offset (running bond) pattern, matching the build instructions.

---

### C4. Tower shaft is rendered as single monolithic slabs per course (Phase 8, lines 1112-1164)

**Same issue as C3.** Each tower course is `createBrick(TOWER_W, TOWER_D, 1, ...)` or `createBrick(TOWER_W+2, TOWER_D+2, 1, ...)` — single slabs 6 or 8 studs wide. The build instructions call for Brick 1x4, Brick 1x2, Brick 1x3 in alternating bond. The "hollow core" described in Phase 8 Step 3 instructions (perimeter ring with empty 4x2 interior) is not represented — the 3D shows solid slabs all the way up.

**Fix:** Model individual bricks in the tower courses. For the "hollow core" upper section, render only the perimeter ring of bricks with the center empty.

---

### C5. Grille tiles have studs on top — they should be smooth (lines 288-325)

**The problem:** `createGrilleBrick()` does NOT add studs on top (correct), but it also does not explicitly mark itself as a tile. More importantly, the piece is called "Grille Brick" in the code but the build instructions call for "Tile 1x2 Grille" (part 2412b) — a TILE, not a brick. Tiles are smooth on top (no studs) and are thinner than bricks.

The code creates the grille at `BRICK_HEIGHT` (line 295) — 1.2 stud-units — but a 1x2 grille tile is only 0.4 stud-units tall (plate height, since tiles are plate-thickness). This makes the grille pieces 3x too tall.

**Fix:** Change grille height from `BRICK_HEIGHT` to `PLATE_HEIGHT` (line 295). Rename function to `createGrilleTile()` for clarity.

---

### C6. Builds data and geometry code have different step counts per phase

**The problem:** The builds.ts data defines step counts per phase (e.g., Phase 3 has 2 steps in the instructions), but lego-geometry.ts creates a different number of steps. For example:

| Phase | Steps in builds.ts | Steps in geometry |
|-------|-------------------|-------------------|
| Phase 3 (Podium) | 2 steps | 5 steps (s3_0 through s3_4) |
| Phase 4 (Terrace Core) | 9 steps | 5 steps (s4_0 through s4_4) |
| Phase 6 (Balconies) | 3 steps | 5 steps (s6_0 through s6_4) |
| Phase 7 (Barrel Vault) | 5 steps | 5 steps (matches) |
| Phase 11 (Conservatory) | 5 steps | 5 steps (matches) |
| Phase 12 (Landscaping) | 5 steps | 5 steps (matches) |

This means the step indices in the viewer UI do not map correctly to what renders in 3D. The user clicks "Step 2" in Phase 3 (which does not exist in builds.ts — Phase 3 only has steps 0 and 1 in instructions), and the geometry code has 5 internal steps that the user cannot individually navigate.

**Fix:** Ensure a 1:1 mapping between build instruction steps and geometry steps.

---

### C7. Arts Centre arches are placed in Phase 6 (Balconies), not Phase 4 (where instructions say to place them)

**The problem:** The build instructions for Phase 4, Step 1 say to place Arch 1x4 at ground level before the podium deck covers the zone. But in lego-geometry.ts, the arches are created in Phase 6 (Balconies) at line 1010-1020 as `s6_4`. This contradicts the build sequence and means:
1. The arches appear AFTER the podium deck is placed (Phases 3-4), making them physically unreachable
2. A builder following the 3D would try to place arches after the deck is already spanning the columns

**Fix:** Move arch geometry creation from Phase 6 into Phase 4, matching the instruction sequence.

---

## 2. ACCURACY ISSUES

### A1. `createPlate()` studs on transparent pieces

**The problem:** `createPlate()` adds studs unless the `smooth` parameter is true (line 217). Transparent plates (TRANS_MAT) get studs. However, `createBrick()` explicitly skips studs for transparent material (line 180: `if (!noStuds && mat !== TRANS_MAT)`). This inconsistency means transparent plates have studs but transparent bricks do not.

In reality, transparent LEGO pieces DO have studs. Both functions should either consistently show or hide studs on transparent pieces.

---

### A2. `createRoundBrick()` has wrong radius (line 236)

**The problem:** The cylinder radius is 0.45 stud-units. A real Round Brick 2x2 (part 3941, used for columns) has an outer diameter of approximately 2 studs (16mm). At the code's scale (1 stud-unit = 8mm), the diameter should be 2.0, so radius = 1.0. The current 0.45 radius renders columns that are less than 1 stud wide — impossibly thin for a 2x2 Round Brick.

The code also labels these columns as "Round Brick 1x1" (part 3062b) in Phase 3, but the build instructions specify "Brick 2x2 Round" (part 3941). Part 3062b is a 1x1 round brick (8mm diameter), part 3941 is 2x2 (16mm diameter).

**Fix:** Use radius = 1.0 for 2x2 Round Bricks (as used for main columns) and radius = 0.5 for 1x1 Round Bricks. Match part numbers to the builds.ts data.

---

### A3. `createCurvedSlope()` does not look like a LEGO Curved Slope (lines 258-286)

**The problem:** The function creates a 2D quadratic curve extruded 1 unit deep. A real Curved Slope 3x1 (part 50950) is a wedge that curves from 1-brick height down to zero over 3 studs of length. The current implementation creates a half-pipe cross-section, not a sloping curve. The piece also has no studs on the bottom (connection surface) and no stud on the high end.

**Fix:** Redesign to produce a wedge shape that starts at brick height on one end and tapers to zero on the other, with a convex curved top surface.

---

### A4. `createArch()` does not look like Arch 1x4 (lines 328-351)

**The problem:** The arch is modeled as a torus (half-ring) with two pillars. A real Arch 1x4 (part 3659) is a single-piece brick that is 4 studs long and has an arch-shaped opening underneath. It sits on a flat surface and connects via studs on top. The 3D model's torus + pillar approach looks like a freestanding archway, not a brick with an arched undercut.

---

### A5. `createInvertedSlope()` geometry is incorrect (lines 354-387)

**The problem:** The wedge shape is defined as flat on top, angled on bottom — which is conceptually correct for an inverted slope. However, the height is `BRICK_HEIGHT * 0.4` (line 360), which makes it only 40% of a brick tall. A real Inverted Slope 2x1 45 (part 3665) is a full plate or brick height. The shape dimensions don't correspond to any real LEGO inverted slope piece.

---

### A6. `createPanel()` has studs on top (lines 413-418)

**The problem:** Panels (like Panel 1x4x1 Rounded, part 30413) are thin wall pieces used for parapets. The function adds a single row of studs along the top (line 414). In reality, Panel 1x4x1 has a clip at the bottom to attach to a plate edge, not studs on top. The studs make the panel look like a very thin brick rather than a railing element.

---

### A7. Tree canopies rendered as spheres, not LEGO pieces (lines 1452-1463)

**The problem:** Trees in Phase 12 are rendered as `SphereGeometry` meshes — smooth spheres that do not look like any LEGO piece. The build instructions reference "Plate 1x1 Round" for tree positions, implying simple round plates stacked or clustered. The sphere has no LEGO-like appearance.

---

### A8. Transparent material handling is inconsistent

**The problem:** `TRANS_MAT` has opacity 0.45 and color 0xc8ddf0 (light blue tint). Real Trans-Clear LEGO pieces are colorless. The `WATER_MAT` (opacity 0.5, color 0x93c5fd) is used nowhere in the geometry code — the lake surface uses `TRANS_MAT`. This means the lake water looks the same as window glass.

---

## 3. RECOMMENDED FIXES (with line numbers)

### High Priority

| # | File | Lines | Fix |
|---|------|-------|-----|
| 1 | lego-geometry.ts | 911-921 | Remove standalone stud cylinders. Create `createSideStudBrick(w, h, numSideStuS)` that integrates side studs into brick body |
| 2 | lego-geometry.ts | 1507-1514 | Change step visibility: `si < effectiveStepIndex` to show previous steps only, or add explicit empty-state handling |
| 3 | lego-geometry.ts | 826-851 | Replace monolithic wall slabs with individual brick placements matching builds.ts piece list |
| 4 | lego-geometry.ts | 1112-1164 | Same as above for tower courses |
| 5 | lego-geometry.ts | 295 | Change grille height from `BRICK_HEIGHT` to `PLATE_HEIGHT` |
| 6 | lego-geometry.ts | 236 | Change round brick radius from 0.45 to ~1.0 for 2x2 pieces |
| 7 | lego-geometry.ts | 1010-1020 | Move arch creation from Phase 6 to Phase 4 |

### Medium Priority

| # | File | Lines | Fix |
|---|------|-------|-----|
| 8 | lego-geometry.ts | 180, 217 | Make transparent-material stud logic consistent between createBrick and createPlate |
| 9 | lego-geometry.ts | 258-286 | Redesign curved slope to be a tapering wedge, not a half-pipe extrusion |
| 10 | lego-geometry.ts | 328-351 | Redesign arch to be a brick-with-opening, not a torus-and-pillars |
| 11 | lego-geometry.ts | 360 | Fix inverted slope height to match real piece dimensions |
| 12 | lego-geometry.ts | 413-418 | Remove studs from panel pieces; add clip geometry instead (or just omit both) |

### Low Priority

| # | File | Lines | Fix |
|---|------|-------|-----|
| 13 | lego-geometry.ts | 1452-1463 | Replace sphere tree canopies with stacked round plate/brick geometry |
| 14 | lego-geometry.ts | 17-23, 39-45 | Differentiate TRANS_MAT (clear) from WATER_MAT (blue); use WATER_MAT for lake pieces |
| 15 | lego-geometry.ts | All | Ensure step counts in geometry match step counts in builds.ts for every phase |

---

## 4. PHASE-BY-PHASE CONNECTION AUDIT

### Phase 1 — Foundation Platform
- **Step 0 (lines 586-605):** 6 plates placed at Y=0 on the ground plane. Connection: plates sit on the build surface (table). Valid — plates connect to nothing below on the first layer. **OK**
- **Step 1 (lines 608-622):** Extension plates at Y=0, positioned forward and to the sides. Connection: these plates overlap the step 0 plates by position but the code does not verify stud overlap. The positions are continuous but there is a 0.3-unit gap between plates (line 597: `plateW - 0.3`) meaning there may be visible gaps. The side extensions at `BASE_W/2 + 1.5` extend beyond the core plates — they sit on the build surface with no stud connection to the core. **ISSUE: Side extensions float adjacent to the core with no overlap.**
- **Step 2 (lines 625-643):** Fill plates at Y=0.01 (slightly elevated). These are 0.4-unit-wide strips placed in the gaps between step 0 plates. Connection: they sit on the build surface. The 0.01 Y offset means they visually float 0.01 units above the ground. **MINOR: Visually floating by 0.01 units.**
- **Step 3 (lines 646-665):** Edge beams and tower zone reinforcement. Edge beams are at Y=0.02. Tower zone plates are stacked at `PLATE_HEIGHT * 1` and `PLATE_HEIGHT * 2`. Connection: the tower zone plates stack on the step 0 base plates — this is a valid stud connection (plates on plates). Edge beams are thin strips (0.6 wide) that do not align with any stud grid. **ISSUE: Edge beams are 0.6 units wide, not matching any real plate width.**

### Phase 2 — The Lake
- **Step 0 (lines 673-692):** Border plates at Y=0.02. Connection: sit on top of Phase 1 base plates in the lake zone. The Y offset of 0.02 means they do not actually connect via studs — they hover. **ISSUE: 0.02 Y offset means no stud connection.**
- **Step 1 (lines 695-715):** Trans-clear plates at Y=0.05. Connection: sit on Phase 1 base plates. Same issue — Y=0.05 means floating above the stud tops (studs are 0.2 tall above plate surface at Y=0.4). **ISSUE: Lake surface pieces float above the base plate by arbitrary amounts rather than connecting to studs.**
- **Step 2 (lines 718-732):** Scattered 1x1 trans-clear bricks at Y=PLATE_HEIGHT+0.05. These sit on top of the lake border/surface. Connection: they are placed at `PLATE_HEIGHT + 0.05` which would require connecting to studs at the top of the plate surface pieces. Since the lake plates are at Y=0.05 (not at true PLATE_HEIGHT), these scattered pieces float. **ISSUE: No valid stud connection chain.**

### Phase 3 — Podium Colonnade
- **Step 0 (lines 740-755):** Round columns at Y=PODIUM_Y (0.4). Connection: columns should connect to studs on the foundation plate (which is at Y=0, studs at Y=0.4+0.2=0.62 approximately). But PODIUM_Y = PLATE_HEIGHT = 0.4, and the column base starts at Y=0.4. The base plate studs are at Y = PLATE_HEIGHT + STUD_HEIGHT = 0.4 + 0.2 = 0.6. The column starts at 0.4, below the stud tops. **ISSUE: Column Y position does not account for stud height — columns start below stud level and interpenetrate the base plate studs.**
- **Step 1 (lines 758-767):** Secondary columns. Same Y issue as Step 0.
- **Step 2 (lines 770-779):** Podium deck plates at Y=PODIUM_DECK_Y (0.4 + 3*1.2 = 4.0). The columns are 3 brick-heights tall (3*1.2 = 3.6), starting at Y=0.4, so column top = 0.4 + 3.6 = 4.0. The stud on top of the column is at Y = 4.0 + 0.2 = 4.2. The deck plate at Y=4.0 sits below the column stud top. **ISSUE: Deck sits at column-top level, not above the stud. Should be at PODIUM_Y + column_height + STUD_HEIGHT or should account for how plates sit on studs.**
- **Steps 3-4:** Soffits and parapets are attached to the deck. If the deck position is off, everything above it inherits the error.

### Phase 4 — Terrace Core
- **Step 0 (lines 810-823):** Bearing walls at Y=PLATE_HEIGHT. These are full-height wall columns from foundation to podium deck level. Connection: they connect to foundation plate studs. The Y position (0.4) matches the stud-connection zone approximately. **MOSTLY OK** but the continuous slab issue (C3) means the geometry doesn't represent individual bricks.
- **Steps 1-2 (lines 826-851):** Rising courses from `PODIUM_DECK_Y + PLATE_HEIGHT` upward. These sit on top of the podium deck level. Connection assumes the podium deck is beneath them. The terrace wall courses connect to the deck surface. **CONNECTION CHAIN DEPENDS ON DECK POSITION BEING CORRECT (see Phase 3 issue).**
- **Step 3 (lines 853-862):** Cap plate at terrace top. Valid — sits on the topmost wall course.
- **Step 4 (lines 865-880):** Shear walls extending behind the terrace. These run from Y=PLATE_HEIGHT (foundation) up through the full terrace height. They connect at the base to foundation studs. **OK structurally but rendered as single slabs.**

### Phase 5 — SNOT Facade
- **Step 0 (lines 897-922):** SNOT bricks placed at facade face Z. The SNOT bricks are positioned at `facadeZ = TERRACE_Z + TERRACE_D/2`. They should be replacements for wall bricks (integrated into the wall), but they are placed as additional pieces ON TOP of the already-complete terrace wall. This means they overlap/intersect the wall face. **ISSUE: SNOT bricks overlap the existing terrace wall geometry rather than replacing bricks within it.**
- **Steps 1-3 (lines 924-975):** Grille tiles, headlight bricks, and windows attach to the SNOT stud positions. The grille tiles at line 936 are positioned at `facadeZ + TERRACE_D * 0.2 + STUD_HEIGHT` — directly in front of where the SNOT studs protrude. **CONNECTION CHAIN: Depends on SNOT stud positions being correct, but the standalone cylinder issue (C1) means there are no real studs to connect to.**

### Phase 6 — Balconies
- **Steps 0-3 (lines 984-1007):** Balcony slabs (plates) are placed projecting forward from the facade at `facadeZ + 1`. Connection: they should clip onto studs at the facade face. Since the facade is smooth wall + SNOT cylinders, the balconies would need to connect to the outward-facing studs. The Y positions are calculated per-storey. **ISSUE: No explicit stud connection chain — balconies are positioned by absolute coordinates, not by referencing available studs on the wall below them.**
- **Step 4 (lines 1010-1020):** Arches placed at PODIUM_Y level. See C7 — these should be in Phase 4.

### Phase 7 — Barrel Vault
- **Steps 0-1 (lines 1032-1069):** Curved slopes placed at `vaultBaseY` = terrace top. Connection: these should sit on top of the terrace wall cap plate. The Y position matches. **OK in principle, but the curved slope geometry (A3) does not represent the real piece shape.**
- **Steps 2-4 (lines 1072-1104):** End caps, ridge, and hip corners. All positioned at vault base Y with various offsets. These pieces float at their calculated positions. **No explicit stud connection — positioned by coordinate.**

### Phase 8 — Tower Core
- **Step 0 (lines 1113-1123):** Tower base at Y=TOWER_BASE_Y (PLATE_HEIGHT = 0.4). Widened base (TOWER_W+2 x TOWER_D+2). Connection: sits on the triple-layered tower zone from Phase 1 Step 3. The tower zone reinforcement is at Y = PLATE_HEIGHT*2 = 0.8. Tower base starts at 0.4. **ISSUE: Tower base at Y=0.4 sits BELOW the tower zone reinforcement at Y=0.8. The tower base should sit on TOP of the reinforcement, at approximately Y=0.8+PLATE_HEIGHT.**
- **Steps 1-3:** Tower courses stacking upward. If the base Y is wrong, all courses are shifted down.

### Phase 9 — Tower Facade
- **Steps 0-4 (lines 1168-1203):** Grille bricks and windows placed at `facadeZ_t = TOWER_Z + TOWER_D/2 + 0.3`. These are positioned by absolute coordinate against the tower front face. **No stud connection logic — pieces float at calculated positions.**

### Phase 10 — Tower Crown
- **Steps 0-4 (lines 1207-1298):** Serrated edges, crown steps, and cap. The crown starts at `crownBaseY = TOWER_BASE_Y + totalTowerCourses * BRICK_HEIGHT`. This sits directly on the last tower course. **Connection is valid if the total tower courses are correct.** The crown stepping bricks reduce in size — each sits on the one below.

### Phase 11 — Conservatory
- **Step 0 (lines 1308-1315):** Base plate at `conBaseY = PODIUM_DECK_Y + PLATE_HEIGHT + TERRACE_H * BRICK_HEIGHT + 1.0`. The +1.0 offset places it above the terrace top. Connection: should sit on the terrace cap plate. The barrel vault is on the terrace top, and the conservatory occupies the reserved gap. **The +1.0 offset is arbitrary and may not align with any stud position on the terrace cap.**
- **Steps 1-4:** Glass walls, roof, platform, and plants all reference `conBaseY`. If the base position is wrong, everything is offset.

### Phase 12 — Landscaping
- **Steps 0-4 (lines 1399-1488):** Walkway tiles, bollards, planters, and trees scattered across the model at various Y positions. Most are at `PODIUM_DECK_Y + PLATE_HEIGHT * 0.5` or `PLATE_HEIGHT`. **No stud connection verification — pieces are placed by absolute world coordinates.**

---

## Summary

The 3D model has **7 critical issues** and **8 accuracy issues**. The most fundamental problems are:

1. **Pieces are positioned by world coordinates, not by stud-connection logic.** Every piece should reference the studs of the piece below it. Instead, Y positions are calculated from constants (PODIUM_DECK_Y, TOWER_BASE_Y, etc.) with small arbitrary offsets, leading to floating/interpenetrating geometry.

2. **Monolithic slab rendering.** The terrace wall and tower shaft are each rendered as one giant box per course rather than individual bricks. This makes the 3D look nothing like a LEGO build.

3. **SNOT implementation uses standalone cylinders** instead of integrated side-stud brick geometry.

4. **Step counts don't match** between the build instructions and the geometry, breaking the UI navigation.

5. **Several piece primitives** (curved slope, arch, grille, panel, round brick) have incorrect dimensions or shapes that don't match their real-world counterparts.

The model functions as a rough architectural massing diagram but does not accurately represent the LEGO building experience. A builder following the 3D preview would find that many pieces don't match what they're asked to place, and the connection logic between pieces is not demonstrated.

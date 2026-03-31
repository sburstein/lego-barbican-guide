# LEGO Geometry Audit: lego-geometry.ts

Exhaustive review of every piece placement for physical buildability.
File: `/Users/scottburstein/lego-barbican-guide/src/lego-geometry.ts` (2973 lines)

Constants used throughout:
- `PLATE_HEIGHT = 0.4`
- `BRICK_HEIGHT = 1.2`
- `STUD_HEIGHT = 0.2`
- `TOLERANCE = 0.05`

---

## PHASE 1: bp-foundation (Steps 0-9)

### Step 6 — Infill Middle Zone
- **ISSUE: Invalid plate width 0.4 studs.** `createPlate(0.4, BASE_D - 1, ...)` creates a plate 0.4 studs wide. No real LEGO plate is 0.4 studs wide. The smallest plate width is 1 stud. This is physically impossible to manufacture or build.
- **LINE:** 995
- **FIX:** Use `createPlate(1, BASE_D - 1, ...)` for a 1-stud-wide plate, or use `createTile(1, ...)` as a cosmetic seam line.

- **ISSUE: Invalid plate depth 0.4 studs.** `createPlate(BASE_W - 1, 0.4, ...)` creates a plate that is 0.4 studs deep. Same problem -- no real plate is 0.4 studs in any dimension.
- **LINE:** 999
- **FIX:** Use `createPlate(BASE_W - 1, 1, ...)` or `createTile(BASE_W - 1, 1, ...)`.

### Step 4 — Lake Zone Plates
- **ISSUE: Fractional plate width.** `createPlate(BASE_W / 4 - 0.3, 6, ...)` evaluates to `createPlate(7.7, 6, ...)`. No LEGO plate is 7.7 studs wide. Valid plate widths are integers (1, 2, 4, 6, 8, etc.).
- **LINE:** 976
- **FIX:** Use `createPlate(8, 6, ...)` to match real 8x6 plates.

### Step 4 — Lake Zone Plates (positions)
- **ISSUE: Off-grid X positions.** `-BASE_W * 3 / 8 + i * (BASE_W / 4)` with BASE_W=32 gives X positions of -12, -4, 4, 12. These are on-grid. No issue here.

### Step 5 — Side Extensions
- **ISSUE: Plate positioned at half-stud boundary.** `side * (BASE_W / 2 + 1.5)` gives X = +/-17.5. A 3-wide plate centered at X=17.5 spans studs 16 to 19, which is on half-stud offset. This is technically grid-aligned (centered between studs 17 and 18) for a 3-wide plate, so acceptable.

### Step 8 — Edge Beams
- **ISSUE: Potential air gap.** Two Plate 1x10 pieces at X=-5 and X=5 (step 8, front edge) cover X from -10 to 0 and 0 to 10. The base is 32 studs wide (-16 to +16), so studs at X=-16 to -10 and X=+10 to +16 (12 studs total) have no edge beam. This is a coverage gap, not a physics error. Acceptable for design intent.

### Step 9 — Tower Reinforcement
- **ISSUE: None.** Layer 1 at Y=PLATE_HEIGHT on base studs. Layer 2 at Y=2*PLATE_HEIGHT on layer 1 studs. Positions are grid-aligned integers after evaluation. Correct stacking.

---

## PHASE 2: bp-lake (Steps 0-7)

### Steps 2-5 — Water Surface
- **ISSUE: Off-grid X positions.** Loop `for (let x = -6; x < 7; x += 2)` produces X values of -6, -4, -2, 0, 2, 4, 6. The plates are 2 studs wide, so a plate at X=-6 is centered there, spanning -7 to -5. These are integer positions, so on-grid. No issue.

### Steps 2-5 — Water Surface (Y position)
- **ISSUE: Potential floating pieces.** The water plates are placed at `lakeY = PLATE_HEIGHT` (0.4). This means they sit at Y=0.4, which requires studs beneath them at Y=0. The foundation plates at Y=0 provide studs at Y=PLATE_HEIGHT (0.4). However, the water plates are at positions like X=-6, Z=LAKE_Z-3 to LAKE_Z+4 (Z=5 to Z=12). The foundation front extension plates (step 4) are at Z=BASE_D/2+3 = 15, and the main base plates are at Z=-4 and Z=4. Water plates at Z=5..12 may be beyond the foundation coverage at Z=4+4=8. Plates at Z=9-12 would be floating with no support beneath.
- **LINE:** 1095-1131
- **FIX:** Ensure foundation plates extend to cover the full lake zone, or accept that some water plates are decorative overlays on the front extension plates (step 4 positions Z=15 center, spanning Z=12 to 18). The gap between base plates at Z=8 and front extensions at Z=12 means water plates at Z=9-11 float.

### Steps 6-7 — Depth Variation
- **ISSUE: 1x1 plates on water surface.** Scatter plates at `scatterY = 2 * PLATE_HEIGHT` (0.8) sit on top of the water plates at Y=PLATE_HEIGHT (0.4). A plate at Y=0.4 is PLATE_HEIGHT tall (0.4), so its top is at Y=0.8. Studs at Y=0.8. Scatter plates at Y=0.8 connects correctly. No issue IF the water plates below exist at those X,Z positions. With the skip condition `(x + z) % 5 === 0`, some scatter plates may be placed over skipped water plate positions -- meaning they float.
- **LINE:** 1141-1155
- **FIX:** Verify each scatter plate's X,Z has a water plate beneath it, or remove the skip condition for positions that will have scatter plates on top.

---

## PHASE 3: bp-podium (Steps 0-7)

### Steps 0-2 — Main Columns
- **ISSUE: Off-grid X positions.** `-10.5 + col * 3` produces X = -10.5, -7.5, -4.5, -1.5, 1.5, 4.5, 7.5, 10.5. These are all at .5 offsets. For a 2x2 round brick (diameter 2), centering at X=-10.5 means the brick spans -11.5 to -9.5 -- this is on half-stud boundaries. LEGO round bricks connect via a single centered stud, so X=-10.5 means the stud center is between integer positions. This is off-grid and won't connect to the base plate studs which are at integer positions.
- **LINE:** 1172
- **FIX:** Use integer or half-integer positions that align with the base plate stud grid. E.g., `-10 + col * 3` or `-9 + col * 3`.

### Steps 3-4 — Column Capitals
- **ISSUE: Same off-grid X as columns.** Capitals at `-10.5 + col * 3` inherit the same off-grid problem.
- **LINE:** 1201, 1209
- **FIX:** Match whatever fix is applied to column positions.

### Steps 3-4 — Column Capitals (Z position)
- **ISSUE: Capital only placed at Z=1, but columns exist at Z=1 and Z=4 (1 + row*3).** Capitals are missing for the Z=4 row of columns. Those columns have no bearing plate on top.
- **LINE:** 1201, 1209
- **FIX:** Add capitals for Z=4 row, or loop over both Z positions.

### Steps 5-6 — Secondary Columns
- **ISSUE: Off-grid X positions.** `-9 + col * 3` produces X = -9, -6, -3, 0, 3, 6, 9, 12 (for cols 0-6). These are integer positions. No issue.
- **ISSUE: Secondary columns at Z=2.5.** A 1x1 round brick at Z=2.5 is at a half-stud position. The base plate studs are at integer Z positions. This is off-grid.
- **LINE:** 1217, 1225
- **FIX:** Use Z=2 or Z=3 (integer position).

### Step 7 — Lateral Bracing
- **ISSUE: Off-grid X.** `-10.5 + col * 6` gives X = -10.5, -4.5, 1.5, 7.5. Same .5 offset issue as columns.
- **LINE:** 1233
- **FIX:** Align to stud grid.

- **ISSUE: Bracing floats.** Placed at `PODIUM_Y + 1.5 * BRICK_HEIGHT` = 0.4 + 1.8 = 2.2. The columns are 3 brick-heights tall (3.6), so the brace is at Y=2.2 which is partway up the column. There is no stud or connection point at Y=2.2 on a round brick column. Round bricks have studs only on top.
- **LINE:** 1233
- **FIX:** Place bracing at the top of the columns (Y = PODIUM_Y + 3 * BRICK_HEIGHT = 4.0) or restructure as a plate spanning between column capitals.

---

## PHASE 4: bp-terrace-core (Steps 0-27)

### Steps 0-1 — Bearing Walls
- **ISSUE: Fractional brick width.** `createBrick(1.5, TERRACE_D + 2, 1, ...)` -- width 1.5 studs. No standard LEGO brick is 1.5 studs wide. Valid widths are 1, 2, 3, 4, 6, 8, etc.
- **LINE:** 1251, 1265
- **FIX:** Use `createBrick(2, TERRACE_D + 2, 1, ...)` for a 2-stud-wide brick.

### Step 3 — Arts Centre Arches
- **ISSUE: Arches scaled to 0.5.** `arch.scale.set(0.5, 0.5, 0.5)` makes a 4-wide arch become 2 studs wide and half brick-height tall. Scaling a LEGO piece to 50% is not a real building technique. The stud spacing on the scaled piece would be 0.5 stud units apart instead of 1.0, so it cannot connect to any standard grid.
- **LINE:** 1291
- **FIX:** Remove the scale, use the arch at 1:1 scale, or use a different smaller piece.

### Steps 4-5 — Ground-Floor Windows
- **ISSUE: Fractional brick dimensions.** `createBrick(1.5, 0.4, 1.5, ...)` -- width 1.5, depth 0.4, height 1.5 bricks. None of these are valid LEGO dimensions. No brick is 0.4 studs deep. No brick has a non-integer height multiplier of 1.5.
- **LINE:** 1297, 1307
- **FIX:** Use `createBrick(2, 1, 2, TRANS_MAT, ...)` for a 2x1 brick 2 courses tall, or use `createPanel(2, 2, ...)` for a window panel element.

### Step 6 — Ground-Level Landscaping
- **ISSUE: None critical.** Slopes at Y=PLATE_HEIGHT sit on foundation. Positions are on-grid.

### Steps 7-9 — Podium Deck
- **ISSUE: Deck at PODIUM_DECK_Y.** `PODIUM_DECK_Y = PODIUM_Y + 3 * BRICK_HEIGHT = 0.4 + 3.6 = 4.0`. The deck plates sit at Y=4.0. The columns below are 3 brick-heights tall starting at Y=PODIUM_Y=0.4, reaching Y=0.4+3.6=4.0. Column tops have studs at Y=4.0+STUD_HEIGHT. But the capitals (2x2 plates at Y=4.0) add PLATE_HEIGHT, so their studs are at Y=4.0+0.4=4.4. The deck plates at Y=4.0 would need support at Y=4.0, which the column body provides, but the capitals at Y=4.0 would overlap with the deck at Y=4.0. This is a collision.
- **LINE:** 1329-1351
- **FIX:** Place deck at `PODIUM_DECK_Y + PLATE_HEIGHT` (Y=4.4) to sit on capital plate studs, OR remove capitals and place deck directly on column studs.

### Step 9 — Wide Deck Sections
- **ISSUE: Overlap with step 7/8 deck plates.** Wide deck sections at Y=PODIUM_DECK_Y+0.01 overlap with step 7/8 deck plates at Y=PODIUM_DECK_Y. The 0.01 offset suggests awareness of collision, but two plates at virtually the same Y occupy the same space. In the X,Z range (-6 to 6, Z=3), these overlap with step 7/8 plates that cover X=-12 to 12, Z=0 to 8.
- **LINE:** 1349
- **FIX:** Place wide deck on top of step 7/8 plates at Y=PODIUM_DECK_Y+PLATE_HEIGHT, or remove the overlapping plates from steps 7/8 in the overlapping region.

### Step 10 — Podium Soffits
- **ISSUE: Soffits at non-standard Y.** `PODIUM_DECK_Y - PLATE_HEIGHT * 1.5` = 4.0 - 0.6 = 3.4. This Y is not aligned to any stud grid position. The inverted slopes float at a fractional height.
- **LINE:** 1359
- **FIX:** Place at `PODIUM_DECK_Y - PLATE_HEIGHT` (3.6) to sit on the underside of the deck structure.

### Steps 13-16 — Tower Base
- **ISSUE: Tower front wall only.** Bricks are placed at `TOWER_Z + (TOWER_D + 2) / 2 - 0.5`. With TOWER_D=4, this is `TOWER_Z + 3 - 0.5 = TOWER_Z + 2.5`. Only the front face of the tower is built. There are no back or side walls in these steps. The tower is a single row of bricks, not a hollow rectangle. Later phases (Phase 8) add all four walls, but courses 0-4 only have a front wall.
- **LINE:** 1396-1456
- **FIX:** Add back wall and side walls for courses 0-4 to match the pattern used in Phase 8's `buildTowerCourses` helper, or accept that Phase 8 will complete the tower starting from course 5.

### Steps 17-22 — Terrace Wall
- **ISSUE: None critical.** Brick sizes are integer. Positions are computed from constants. Running bond pattern alternates correctly.

### Step 25 — Structural Floor Plates
- **ISSUE: None.** Plate at mid-height, spanning full terrace width. On-grid.

### Step 26 — Shear Walls
- **ISSUE: Shear walls at X = TERRACE_X +/- 2.5 = -2 +/- 2.5 = -4.5 and 0.5.** X=-4.5 is off-grid (half-stud). X=0.5 is also a half-stud position. A 1-wide brick centered at X=-4.5 spans -5 to -4, which is on-grid for its edges but the center is between studs. The `position.set()` sets the center, and a 1-wide brick centered at X=-4.5 would have its stud at X=-4.5, which does not align with base plate studs at integer positions.
- **LINE:** 1618
- **FIX:** Use X = TERRACE_X +/- 2 or TERRACE_X +/- 3 for integer grid alignment.

---

## PHASE 5: bp-terrace-facade (Steps 0-12)

### Steps 0-1 — SNOT Bricks
- **ISSUE: Off-grid X spacing.** `TERRACE_X - TERRACE_W / 2 + 1.5 + col * 2.8` = `-2 - 10 + 1.5 + col * 2.8` = `-10.5 + col * 2.8`. For col=0: X=-10.5. For col=1: X=-7.7. For col=2: X=-4.9. These are all off-grid -- 2.8-stud spacing does not align to the LEGO stud grid.
- **LINE:** 1664, 1676
- **FIX:** Use integer spacing, e.g., `col * 3` for 3-stud spacing.

### Steps 2-4 — Grille Texture
- **ISSUE: Same off-grid X as SNOT bricks.** Inherits the 2.8-stud spacing problem.
- **LINE:** 1688-1715
- **FIX:** Match corrected SNOT brick spacing.

- **ISSUE: Grille tiles placed on side studs.** Grilles at `facadeZ + 0.5 + STUD_HEIGHT` are mounted on the side studs of the SNOT bricks. The side studs point in +Z direction. A tile at `facadeZ + 0.5 + STUD_HEIGHT` = facadeZ + 0.7. The SNOT brick side studs extend STUD_HEIGHT (0.2) from the brick face at facadeZ + 0.45 (half of the 0.9-tolerance brick). The grille tile is placed slightly beyond stud reach. Minor floating gap.
- **LINE:** 1690
- **FIX:** Position grille at `facadeZ + 0.5` to sit directly on side studs.

### Steps 5-7 — Window Reveals (Headlight Bricks)
- **ISSUE: Same off-grid X.** Inherits the 2.8-stud spacing.
- **LINE:** 1726, 1738, 1749
- **FIX:** Use integer grid spacing.

### Steps 8-12 — Glazing
- **ISSUE: createBrick(1, 1, 0.5, TRANS_MAT, ...) -- height 0.5 bricks.** A brick with h=0.5 has height = 0.5 * BRICK_HEIGHT = 0.6. This is not a standard LEGO piece height. Standard heights are 1 plate (0.4), 1 brick (1.2), or integer multiples. Height 0.6 is 1.5 plates, which is not a real piece.
- **LINE:** 1761, 1775, 1789, 1803, 1817
- **FIX:** Use `createPlate(1, 1, ...)` for plate-height (0.4) glass pieces, or `createBrick(1, 1, 1, ...)` for full brick-height glass. A "Trans-Clear Plate 1x1" should use `createPlate`, not `createBrick` with h=0.5.

- **ISSUE: Off-grid Y offset.** Glazing at `ly + BRICK_HEIGHT * 0.1` adds 0.12 to the Y position. This puts the glass at a non-standard height that does not align with any stud row.
- **LINE:** 1764, 1778, 1792, 1806, 1820
- **FIX:** Place at `ly` exactly to sit on the headlight brick's front-facing stud.

---

## PHASE 6: bp-terrace-balconies (Steps 0-10)

### Steps 0-4 — Balcony Plates
- **ISSUE: Fractional plate dimensions.** `createPlate(2.5, 1.2, ...)` -- width 2.5 studs, depth 1.2 studs. No LEGO plate is 2.5 or 1.2 studs in any dimension. Valid plate sizes use integer dimensions.
- **LINE:** 1841, 1855, 1869, 1883, 1897
- **FIX:** Use `createPlate(2, 1, ...)` or `createPlate(3, 1, ...)` for real plate sizes.

### Steps 0-4 — Balcony Plates (X spacing)
- **ISSUE: Off-grid X.** `TERRACE_X - TERRACE_W / 2 + 2 + col * 3.2 + stagger` with stagger = 0 or 1.4. For col=0, stagger=0: X = -2 - 10 + 2 + 0 = -10. For col=1: X = -10 + 3.2 = -6.8. The 3.2-stud spacing puts every piece after col=0 off-grid. With stagger=1.4, all positions are off-grid.
- **LINE:** 1840-1901
- **FIX:** Use integer spacing (e.g., `col * 3`) and integer stagger (e.g., 1 instead of 1.4).

### Steps 6-8 — Surface Tiles
- **ISSUE: Fractional tile dimensions.** `createTile(2.5, 1.0, ...)` -- width 2.5. Same issue.
- **LINE:** 1922, 1935, 1949
- **FIX:** Use `createTile(2, 1, ...)` or `createTile(3, 1, ...)`.

### Steps 9-10 — Long Tile Strips
- **ISSUE: Fractional tile width.** `createTile(TERRACE_W * 0.8, 0.3, ...)` = `createTile(16, 0.3, ...)`. Depth of 0.3 studs is not a valid LEGO dimension. Similarly, `TERRACE_W * 0.6` = 12 is fine, but depth 0.3 is invalid.
- **LINE:** 1959, 1970
- **FIX:** Use depth 1 for the minimum valid tile depth.

---

## PHASE 7: bp-barrel-vault (Steps 0-9)

### Steps 0-3 — Vault Curves
- **ISSUE: Fractional X spacing.** `segW = TERRACE_W / vaultSegments = 20 / 10 = 2.0`. So `TERRACE_X - TERRACE_W/2 + segW/2 + seg*segW` = `-2 - 10 + 1 + seg*2` = `-11 + seg*2`. For seg=0: X=-11. For seg=1: X=-9. These are integer positions. No issue with X.
- **ISSUE: Curved slopes placed directly on terrace top.** At `vaultBaseY = PODIUM_DECK_Y + PLATE_HEIGHT + TERRACE_H * BRICK_HEIGHT`. The terrace top cap plate (step 27, phase 4) is at the same Y. These curved slopes sit on the cap plate studs. Correct.

### Steps 4-5 — Eave Slopes
- **ISSUE: None critical.** End cap slopes at edges of vault. On-grid.

### Step 6 — Eave Slopes (Remaining)
- **ISSUE: Fractional slope width.** `createSlope(TERRACE_W * 0.8, 0.5, ...)` = `createSlope(16, 0.5, ...)`. Depth 0.5 studs is not a real LEGO dimension.
- **LINE:** 2048
- **FIX:** Use depth 1 for minimum valid slope depth.

### Step 7 — Ridge Cap
- **ISSUE: Fractional tile depth.** `createTile(TERRACE_W, 0.6, ...)` = `createTile(20, 0.6, ...)`. Depth 0.6 is not valid.
- **LINE:** 2057
- **FIX:** Use `createTile(20, 1, ...)`.

---

## PHASE 8: bp-tower-core (Steps 0-11)

### Steps 0-1 — Corner SNOT Bricks
- **ISSUE: None critical.** Travis bricks at tower corners, integer-derived positions.

### Steps 2-9 — Tower Courses
- **ISSUE: Tower front/back wall brick widths.** `sizes = course % 2 === 0 ? [4, 2] : [3, 3]`. Total width: 4+2=6 or 3+3=6, matching TOWER_W=6. The xPos starts at `TOWER_X - TOWER_W/2 = -2 - 3 = -5`, and pieces fill to -5+6=1. Correct.

- **ISSUE: Side wall depth.** `createBrick(1, Math.max(sideLen, 1), 1, ...)` where `sideLen = TOWER_D - 2 = 2`. So `createBrick(1, 2, 1, ...)` -- a 1x2 brick. Positioned at `TOWER_X +/- (TOWER_W/2 - 0.5)` = -2 +/- 2.5 = -4.5 and 0.5. Off-grid (half-stud).
- **LINE:** 2122
- **FIX:** Use `TOWER_X +/- (TOWER_W/2 - 1)` for integer positions (-4 and 1), or adjust TOWER_W to be even so that half-width is integer.

### Step 11 — Final Visible Course
- **ISSUE: createBrick(TOWER_W, TOWER_D, 0.5, ...) -- height 0.5 bricks.** Height = 0.5 * 1.2 = 0.6 units. Not a standard LEGO height. Should be a plate (h=1 plate = 0.4) or full brick (h=1.2).
- **LINE:** 2199
- **FIX:** Use `createPlate(TOWER_W, TOWER_D, ...)` for a plate-height cap, or `createBrick(TOWER_W, TOWER_D, 1, ...)` for a full course.

---

## PHASE 9: bp-tower-facade (Steps 0-10)

### Steps 0-6 — Grille + Window Bands
- **ISSUE: createBrick(TOWER_W, 1, 0.5, TRANS_MAT, ...) -- height 0.5.** Same fractional height issue as Phase 5 glazing and Phase 8 cap. Not a real piece height.
- **LINE:** 2227, 2239, 2249, 2261, 2271, 2283
- **FIX:** Use `createPlate(TOWER_W, 1, ...)` for plate-height windows.

### Steps 7-10 — Balcony Slabs
- **ISSUE: Slab dimensions TOWER_W+1 x TOWER_D+1.** `createPlate(7, 5, ...)`. A 7x5 plate is not a standard LEGO part. Closest are 6x6 or 8x8. However, the code already defines plates by arbitrary dimensions (the createPlate function generates any size), so this is a modeling choice rather than a strict error. Flag as minor.
- **LINE:** 2290, 2299, 2308, 2317
- **FIX:** Consider using standard plate sizes (6x4, 8x6) if strict LEGO accuracy is desired.

- **ISSUE: Slab Z position.** `facadeZ_t - 0.3` where `facadeZ_t = TOWER_Z + TOWER_D/2 + 0.3`. So slab Z = TOWER_Z + TOWER_D/2. This is the tower face, correct for a cantilevered balcony. But the slab is wider and deeper than the tower, potentially colliding with the tower wall bricks.

---

## PHASE 10: bp-tower-crown (Steps 0-9)

### Steps 4-7 — Crown Slopes
- **ISSUE: createBrick with h=0.6.** `createBrick(TOWER_W, TOWER_D, 0.6, ...)` -- height = 0.6 * 1.2 = 0.72. Not a real LEGO height. Repeated for steps 4, 5, 6.
- **LINE:** 2380, 2390, 2400
- **FIX:** Use h=1 for standard brick or remove fractional height.

- **ISSUE: createBrick with h=0.4.** Step 7: `createBrick(TOWER_W - 3, TOWER_D - 1.5, 0.4, ...)`. Height = 0.4 * 1.2 = 0.48. Not a standard height. Additionally, depth = TOWER_D - 1.5 = 2.5. Fractional depth.
- **LINE:** 2410
- **FIX:** Use `createPlate(...)` for plate-height, and integer depth.

### Step 5 — Crown Transition
- **ISSUE: Fractional depth.** `TOWER_D - 0.5 = 3.5`. Not a valid LEGO dimension.
- **LINE:** 2390
- **FIX:** Use `TOWER_D - 1 = 3` or `TOWER_D = 4`.

### Step 9 — Mechanical Penthouse
- **ISSUE: createBrick(2, 1.5, 0.5, ...) -- depth 1.5, height 0.5.** Both dimensions are fractional. No real LEGO brick is 1.5 studs deep or 0.5 brick-heights tall.
- **LINE:** 2428
- **FIX:** Use `createBrick(2, 2, 1, ...)` or `createPlate(2, 2, ...)`.

---

## PHASE 11: bp-conservatory (Steps 0-12)

### Step 1 — Side Walls
- **ISSUE: createBrick(0.4, 1, 1, ...) -- width 0.4 studs.** No LEGO brick is 0.4 studs wide. Minimum is 1.
- **LINE:** 2453
- **FIX:** Use `createBrick(1, 1, 1, ...)`.

### Step 2 — Back Wall
- **ISSUE: createBrick(4, 0.4, 1, ...) -- depth 0.4 studs.** Same problem.
- **LINE:** 2463
- **FIX:** Use `createBrick(4, 1, 1, ...)`.

### Steps 3-4 — Corner Infill
- **ISSUE: createBrick(0.5, 0.5, 1, ...) -- width 0.5, depth 0.5.** Both fractional. No LEGO brick is 0.5 studs.
- **LINE:** 2473, 2483
- **FIX:** Use `createBrick(1, 1, 1, ...)`.

### Step 5 — Front Windows
- **ISSUE: createBrick(1.5, 0.4, 1.2, ...) -- all three dimensions fractional.** Width 1.5, depth 0.4, height 1.2 bricks (= 1.44 units). None are valid.
- **LINE:** 2493
- **FIX:** Use `createBrick(2, 1, 1, TRANS_MAT, ...)` or `createPanel(2, 1, ...)`.

### Step 6 — Side Windows
- **ISSUE: createBrick(0.4, 1.5, 1.2, ...) -- same fractional issue.
- **LINE:** 2504
- **FIX:** Use `createBrick(1, 2, 1, TRANS_MAT, ...)`.

### Step 9 — Interior Floor
- **ISSUE: Floor tile at Y = conBaseY + 0.01.** This is 0.01 below the base plate's top surface. A tile sitting at this Y would clip into the base plate.
- **LINE:** 2538
- **FIX:** Place at `conBaseY + PLATE_HEIGHT` to sit on top of the base plate studs.

### Step 11 — Rooftop Platform
- **ISSUE: Platform at Y = conBaseY - PLATE_HEIGHT.** This is below the conservatory base plate. The platform would clip into whatever is beneath it. If it's meant to be the structural connection, it should be at or above the terrace roof.
- **LINE:** 2568
- **FIX:** Place at `conBaseY` or adjust to proper structural height.

### Step 12 — Pin Plates
- **ISSUE: Plates at Y = conBaseY - PLATE_HEIGHT + 0.01.** Same issue as step 11 -- below the base.
- **LINE:** 2577
- **FIX:** Match platform Y position.

---

## PHASE 12: bp-landscaping (Steps 0-32)

### Steps 0-1 — Garden Grade Tiles
- **ISSUE: Y position.** `PODIUM_DECK_Y + PLATE_HEIGHT * 0.5` = 4.0 + 0.2 = 4.2. This is not on any stud grid. The podium deck at Y=4.0 has studs at Y=4.0+0.4=4.4. Tiles at Y=4.2 float between the deck surface and its studs.
- **LINE:** 2598, 2605
- **FIX:** Place at `PODIUM_DECK_Y + PLATE_HEIGHT` (Y=4.4) to sit on deck studs.

### Steps 2-3 — Walkway Tiles
- **ISSUE: Y position.** `PLATE_HEIGHT * 0.3 = 0.12`. Tiles at Y=0.12 are below the PLATE_HEIGHT (0.4) of the base. They clip into the foundation plates.
- **LINE:** 2613, 2621
- **FIX:** Place at Y=PLATE_HEIGHT (0.4) to sit on base plate studs.

### Steps 4-5 — Bollards
- **ISSUE: Y position.** `PLATE_HEIGHT + 0.2 = 0.6`. Bollards (cylinder meshes) centered at Y=0.6, height 0.4, so bottom at Y=0.4, top at Y=0.8. Bottom at Y=0.4 = PLATE_HEIGHT. This is on the base surface. Acceptable as decorative.

### Step 6 — Long Walkway Strip
- **ISSUE: Y = PODIUM_DECK_Y + PLATE_HEIGHT * 0.3 = 4.12.** Same off-grid Y as steps 0-1.
- **LINE:** 2650
- **FIX:** Use Y = PODIUM_DECK_Y + PLATE_HEIGHT.

### Step 7 — Plaza Section
- **ISSUE: Y = PLATE_HEIGHT * 0.2 = 0.08.** Below the foundation surface. Clips into base plates.
- **LINE:** 2658
- **FIX:** Use Y = PLATE_HEIGHT.

### Steps 8-11 — Ground Plane Infill
- **ISSUE: Y = PLATE_HEIGHT * 0.15 = 0.06.** All four infill tiles clip into the base.
- **LINE:** 2668, 2678, 2688, 2698
- **FIX:** Use Y = PLATE_HEIGHT.

### Steps 14-21 — Detail Bricks
- **ISSUE: createBrick(2, 0.5, 0.5, ...) and createBrick(1, 0.5, 0.5, ...) -- depth 0.5, height 0.5.** No real LEGO brick has depth 0.5 studs or height 0.5 bricks (= 0.6 units).
- **LINE:** 2722, 2732, 2742, 2752, 2762, 2772, 2782, 2792
- **FIX:** Use `createPlate(2, 1, ...)` for plate-height detail, or `createBrick(2, 1, 1, ...)` for full bricks.

- **ISSUE: Y position.** `PLATE_HEIGHT + 0.5 = 0.9`. Not aligned to any stud grid. Base studs are at Y=0.4+0.2=0.6 (stud top), or plate top is at Y=0.4. A brick at Y=0.9 floats.
- **LINE:** 2724, 2734, 2744, 2754, 2764, 2774, 2784, 2794
- **FIX:** Place at Y=PLATE_HEIGHT to sit on base studs, or Y=2*PLATE_HEIGHT if on a second layer.

### Steps 24-25, 32 — Trees
- **ISSUE: createBrick(1, 1, 0.5, ...) for planter box -- height 0.5.** Not a standard LEGO height.
- **LINE:** 2821, 2834, 2907
- **FIX:** Use `createPlate(1, 1, ...)` for a plate-height planter or `createBrick(1, 1, 1, ...)` for a full brick.

---

## SUMMARY OF RECURRING ISSUES

### 1. Fractional Piece Dimensions (CRITICAL -- 40+ instances)
The most pervasive issue. Many `createBrick` and `createPlate` calls use fractional widths, depths, or heights that do not correspond to any real LEGO piece:
- **Width/depth 0.4 studs:** Lines 995, 999, 2453, 2463, 2493, 2504
- **Width/depth 0.5 studs:** Lines 2048, 2057, 2390, 2410, 2428, 2473, 2483, 2722-2792
- **Width 1.5 studs:** Lines 1251, 1265, 1297, 1307, 2493
- **Width 2.5 studs:** Lines 1841-1897, 1922-1949
- **Depth 1.2 studs:** Lines 1841-1897
- **Height 0.5 bricks (=0.6 units):** Lines 1761-1820, 2199, 2227-2283, 2380-2428, 2722-2792, 2821-2907
- **Height 0.6 bricks (=0.72 units):** Lines 2380, 2390, 2400
- **Height 1.2 bricks (=1.44 units):** Lines 2493, 2504
- **Height 1.5 bricks (=1.8 units):** Lines 1297, 1307

### 2. Off-Grid Positions (MODERATE -- 20+ instances)
Many pieces are positioned at non-integer stud coordinates where they cannot connect to the standard stud grid:
- **X = n.5 positions:** Podium columns (line 1172), shear walls (line 1618), tower side walls (line 2122)
- **2.8-stud spacing:** Entire terrace facade (lines 1664-1820)
- **3.2-stud spacing + 1.4 stagger:** Balconies (lines 1840-1970)
- **Fractional Y offsets:** 0.01, 0.1, 0.15, 0.2, 0.3 additions to Y (lines 1349, 1764, 2598-2698)

### 3. Pieces Floating Without Stud Support (MODERATE -- 10+ instances)
- Lake water plates beyond foundation coverage (lines 1095-1131)
- Scatter plates over skipped water positions (lines 1141-1155)
- Lateral bracing mid-column (line 1233)
- Landscaping tiles at sub-plate-height Y (lines 2598-2698)

### 4. Scaled Pieces (MINOR -- 1 instance)
- Arches scaled to 50% break stud alignment (line 1291)

### 5. Piece Collisions/Overlaps (MINOR -- 2 instances)
- Wide deck plates overlap regular deck (line 1349)
- Podium deck at same Y as column capitals (lines 1329-1351)

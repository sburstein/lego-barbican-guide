# LEGO Barbican Guide: audit and repair (2026-09-30)

Scope: the engine, the 3D viewer, the print manual and the three hand-built
models, against the plan in PLAN.md (phase 1, "Engine"). The AI designer
(phases 2 and 3) is not part of this pass; see "Open items".

This file keeps two records apart:

1. **Historical state**: the project as committed on 2026-08-15 (commit
   `8c290e0`), the state the booklet in `print/` (file dated 2026-08-16) was
   generated from. Nothing in `print/` or the git history was changed.
2. **Repairs**: what changed today, and how it was verified.

## 1. Historical state (as built and printed in August)

### The validator missed whole classes of error

The July validator checked parts, grid, collisions, studs below and
build order. It did not check that the model holds together as one object,
that a directional part is laid in a real orientation, where a part's studs
and legs really are, or that the part table matched real LEGO geometry. Its
"zero violations" result in GEOMETRY-AUDIT.md was true for those checks
only.

### Model defects found by the new validator

| Build | Violations | What was wrong |
|---|---|---|
| Lakeside Panorama | 63 | The 12 curved-top bricks (6091) on the plant room were turned a quarter off a real orientation and overlapped. The two crown slopes were laid in an impossible orientation and overlapped. The 5 highwalk plates sat on studless rounded panels, so they had nothing to grip: 5 loose pairs. |
| Frobisher Section | 16 | On floors 2 and 3, the balcony grille tiles sat exactly where the clip-on facade panels hang, so the panels could not fit. The 4 macaroni "site corners" overlapped the seam-tie plates. |
| London Wall | 57 | The wedge parts (41767/41768) were treated as flat lawn plates; they are full-height wedge bricks. That put the cold frames, the fig tree and a stepping stone inside them. Three wall shards and a wall-head slope were laid in impossible orientations. The garden's base pads were never tied together, so the model came apart in 12 pieces. |

### Renderer defects

- **3D viewer:** east- and west-facing parts were mirrored (wrong yaw sign),
  so slopes on those faces fell the wrong way on screen.
- **Print manual:** it had its own rotation table, which also mirrored east
  and west. It drew 6091 as a half-cylinder along its longer side, and placed
  panels and corner plates from hand-written tables. Its face normals mixed
  up the y and z components: boxes survived by accident, but a curved
  outline could lose its top face, and lighting brightened front faces
  instead of tops. Its painter's sort, by front corner only, let a long base
  plate paint over a raised part in front of it.
- **Part shapes:** the wedge brick's taper ran the wrong way, the 6091 hump
  fell far too low at its end, and 1×1 round parts were drawn undersized.

## 2. Repairs (today)

### One shape table, checked against real parts

- `src/engine/shapes.ts` now defines every part body once, as convex solids
  in the part's own frame. The 3D viewer (`src/lego-geometry.ts`) and the
  print manual (`scripts/lib/iso.mjs`) both draw from it, through the same
  rotation the validator uses (`canonicalToLocal`). The manual's separate
  rotation and shape tables are gone.
- `scripts/check-parts.mjs` now also compares each shape's top surface with
  the real LDraw part, bin by bin, with thresholds scaled to part height.
  It found and fixed the wedge taper, the 6091 hump (real heights 4.0, 3.9,
  3.6, 3.1 plates across the hump) and the round-part radius. Negative
  controls confirm it fails reversed slopes, a reversed wedge and a wrong
  corner on both the corner brick and the one-plate corner plate.
- The validator now ties clip-on parts to the side stud's real height
  (10 LDU below the host's top, from LDraw 4070, 47905 and 4733) and
  reports `SIDE STUD HEIGHT` otherwise. LDraw also settled a design rule: a
  clip-on tile clears bare studs below it, but not a tile or plate at its
  host's base.
- The manual's face normals and lighting are fixed, and pieces are ordered
  by a separating-axis test between overlapping parts.

### Model repairs

| Build | Pieces | Steps | Changes |
|---|---|---|---|
| Lakeside Panorama | 668 (same) | 108 (same) | Vault rows face outward (rear north, front south), forming one roof with rounded eaves. The crown takes its two 1×2 slopes side by side, both falling toward the lake. The deck parapet is now 5 × Brick 1×4 instead of 5 rounded panels, so the highwalk has studs to grip. |
| Frobisher Section | 167 to 163 | 40 to 39 | Balcony decking is 8 × Tile 1×1 in front of the window slots, instead of 8 grille tiles across the panels' path. The 4 macaroni corners are removed: every 2×2 spot on that level is taken by the seam ties, and moving them up runs into the party walls. |
| London Wall | 73 to 77 | 18 to 22 | The garden is redesigned around spare parts. Two 4×4 quarter-round plates form one lawn with rounded front corners and bridge the base joints. A 2×2 tile path runs south from the gate, and a 1×8 front walk ties the garden plates together. The fig tree, three stepping stones and one cold frame stand on lawn studs. The shards alternate faces and the wall-head slope faces south. Four 2×2 plates complete the base. The wedge bricks are no longer used. |

All three builds still stand together from one set: 908 of 1,210 pieces,
no part over its quantity.

### If you built the Panorama from the August booklet

Three spots differ from what you built. Step numbers are from the
regenerated manual.

- **Step 29, deck upstand:** use five 1×4 bricks where the rounded 1×4
  panels went. The highwalk plates in steps 53 and 54 then clip on.
- **Steps 62 and 63, vault caps:** point the curved humps outward, north on
  the rear row and south on the front row. The flat ends with the recessed
  stud meet in the middle.
- **Step 84, crown:** two 1×2 slopes side by side, studs to the north, both
  falling toward the lake.

### Other fixes

- The app's parts lists merge entries that differ only in role, which also
  removed React duplicate-key errors.
- Trans-only parts are named "Trans-Clear" again; the app colours swatches
  by name.
- Deep links: `?build=<id>&step=<phase>-<n>` opens a step with everything
  before it built, without touching saved progress.
- `audit.mjs` now exits non-zero when a build needs more than one set.
- `npm run build` passes: an unused UI component written against an old
  react-resizable-panels API was removed.

## 3. Verification

`node scripts/harness.mjs all` runs everything below in about 30 seconds.

| Check | Result |
|---|---|
| Parts vs LDraw (footprint, height, studs, slope direction, shape) | 73 of 73 |
| Physical and build-order validation | 0 violations in all three builds |
| Combined inventory | 908 of 1,210 pieces, none over |
| Unit tests | 24 pass: 12 renderer agreement, 12 validator regressions |
| App build | typecheck and bundle pass |

The agreement tests load the real 3D renderer in Node and raycast every
cell of every part in every build, against the shape table under the
validator's rotation. A negative control, swapping the east and west yaw,
fails them. The regression tests rebuild each historical defect above and
assert the validator still reports it.

Visual review: four-side renders of all three builds (`npm run harness --
render`), close-ups of every repaired area, the regenerated manual pages for
those steps, and the live app through deep links (headless Chrome for London
Wall and Frobisher; the in-app browser for the Panorama, whose 668 parts are
too heavy for software WebGL in a screenshot).

## Open items

- **AI designer (PLAN.md phases 2 and 3) is not started.** Running it sends
  prompts to the Anthropic API, and the key the plan names lives in
  `~/lego-remix/apps/server/.env`, a file the Brick Remix worker owns. That
  is a shared-file dependency, so it was not read or copied. The designer
  needs a key placed in this repo's own gitignored `.env`, and a go-ahead
  for the API spend.
- **`print/` blocks the daily GitHub sync.** `~/tools/gh-sync.sh` skips this
  repo because the 27 MB August booklet fails its large-file check.
  Ignoring `print/` in `.gitignore` would lift the block, and the next run
  would commit and push everything here. That is your call, so it is
  unchanged.
- **Not deployed.** The live site still shows the August models.
- The inventory and the part table name two parts differently (6091 and
  60474). This is cosmetic; part numbers match.

---

# October 2026: AI designer and release (2026-10-01)

This section adds to the September record above; it changes nothing in it.
The August booklet in `print/` and the tag `august-2026-booklet` remain the
historical record of what was built.

## Added

- **Compiler:** an architecture compiler (`src/design/`) turns a spec into
  validated placements. It provides stock-aware recipes, bands and decks
  tiled across the joints below, exact supported tiling for small slabs,
  2-wide cores, hidden support piers, seam ties, tiled finishing, and errors
  that name the part and the count.
- **Designer:** `scripts/lib/designer.mjs` runs `claude-opus-5-5` at
  `xhigh` effort with the server-side refusal fallback. Its tools are
  compile and render (images go back to the model), submit and web search.
  A blind review gate checks the result. The loop has budget, time, compile
  and review limits, and it handles refusals, truncation, API errors and
  cancellation.
- **Server route:** `/api/design` runs in the Vite dev server and in
  `scripts/designer-server.mjs`. Writes need a same-origin header, one job
  runs at a time, and the key never reaches the browser.
- **App:** the build switcher lists any number of builds. AI builds show
  their review record. A designer panel appears, which disables itself on
  static hosts. Every build has booklet downloads, and the footer carries a
  version stamp.
- **Build:** `npm run build` writes HTML and PDF booklets for every build,
  plus `version.json`.
- **Tests:** 51 tests: renderer agreement, validator regressions, the
  compiler (including shortages), every designer loop exit with a scripted
  client, and the HTTP route.

## Offline geometry from the first live review (2026-10-02)

The first real design run reached the review gate. The blind reviewer named
the Barbican but scored 5/10 and listed fixes. Before any further paid runs,
the compiler gained the vocabulary those fixes need. All of it is checked
offline; DESIGNER-STATUS.md has the details and the live checks still owed.

- **`tower` element:** a triangular (rasterised equilateral) or square plan,
  with walls laid course by course. Each course is the best of a hollow ring
  or a solid course, scanned by rows or columns, so a stepped edge no longer
  burns 1×1 bricks. Balcony slabs serrate N/S then E/W, and an optional
  crown of fins leans outward.
- **Roof `scallops`:** a fine rhythm of small vaults.
- **Podium `parapet`:** railing panels along the free deck edges.
- **Stranded plates:** slabs are re-tiled locally, then by an exact cover
  search that settles the most constrained cell first, so cantilevered
  balcony corners always grip something. Compiles stay fast; the review-led
  fixture compiles in about 0.25 s.
- **Ground ties:** surfaces on the ground weigh spanning the base plates'
  joints above part size, so paved strips no longer leave base plates loose.
- **Booklets for unapproved designs:** `generate-manual --spec` prints any
  design for review, and it is tested.
- **Tests:** 71, including renderer agreement on compiled fixtures and the
  live run's reviewed spec as a regression fixture.

## One design (2026-10-02)

At Scott's direction the site now carries one Barbican design: the repaired
Lakeside Panorama, the model built from the August booklet. The Frobisher
Section and London Wall builds, their guide text and their booklets are
retired; they remain recoverable from tag `v2.0.1`. The AI designer panel is
built into the local dev server only. The September findings above about
those two builds stay as historical record.


# A truly blind review and a new tower (2026-10-04)

## The review gate was not blind

The four-view render handed to the "blind" reviewer carried the model's
title in its header. The reviewer read it ("The title says so"), so every
earlier blind verdict, including the designer's first live run, could have
come from the text rather than the model. Review renders now carry a
neutral heading (`renderViews(pieces, null, file)`), the designer's
submitted render is blind, and a test pins both.

`scripts/review-build.mjs` runs the same two-pass review on the hand-built
Panorama or on any spec (`--spec`), at about $0.12 a run, and keeps each
record in `reviews/`.

## What the blind reviewer saw

| Render | Blind guess | Quality | Fidelity | Named |
|---|---|---|---|---|
| Panorama, title showing (`reviews/leaked/`) | the Barbican, "the title says so" | 5 | 5 | yes |
| Panorama v2.1.1, blind | "a tall tapering office tower… something like The Shard" | 4 | 3 | no |
| Compiler critique fixture, blind | the Barbican Estate | 6 | 6 | yes |
| New tower, 4 studs wide | "a minaret… Hassan II Mosque" | 4 | 4 | no |
| New tower, 6 studs wide, north-west | "possibly the Barbican Estate" | 5 | 6 | yes |
| New tower, 6 studs wide, north-east (released) | "The Barbican Estate, London" | 6 | 6 | yes |

The August tower was the problem: it tapered to a point, so the model read
as a generic skyscraper. The real towers are straight triangular prisms
with saw-tooth balconies and a jagged crown.

## The new Lauderdale Tower

- **Plan:** a triangle pointing at the lake, its rows 6, 4 and 2 studs wide, two deep each.
  Each of 11 levels is two brick courses laid crosswise, so each bridges
  the other's joints, then a balcony slab one stud proud of the walls.
- **Saw-tooth:** slabs alternate, north and south on one level, east and
  west on the next, so their ends step in and out up every corner.
- **Crown:** 16 steep slopes (65° and 75°) lean out from the top slab, tall
  and short in turn, round a 2×2 plant room.
- **Site:** the tower stands on its own two-plate raft in the north-east
  corner, clear of the terrace. In the north-west it hid behind the terrace
  from the booklet's fixed camera, so a builder could not see the lower
  levels going on.
- **Stock:** 625 pieces in all, 43 fewer than before. Plate and brick mixes
  vary on a few levels where the set runs short, always with the same
  outline. The validator, the agreement tests and the audit pass.

The booklet is Edition 3, 70 pages (even, for print-on-demand), with a
changes page for August builders and a back page carrying the fan-project
notice.

## Still open: what the reviewer wants next

The released model is recognised but scores 6/10 against the gate's 7.
The reviewer's remaining points are mostly outside the tower:

- the terrace is short and deep, with a blank rear face; the real terraces
  are long, thin slabs with a long run of vaults;
- the lake sits beside the terrace instead of running under it on pilotis;
- the pilotis are buried and the dark lakeside edging reads as clutter;
- the conservatory belongs on the arts centre, and St Giles' Cripplegate
  is missing;
- one tower, where the estate has three.

On the tower itself the verdicts conflict: at 4 studs wide it was "a
minaret, ten times taller than wide"; at 6 studs it is "too squat". The
set's 2×2 and 2×6 bricks cap a 6-stud tower at about 11 levels.

The compiler's own `tower` recipe has a weakness found here: on a stepped
triangle its slabs never cross the joint between the apex rows and the
rest, so the apex column joins the tower only through the top slab. The
validator passes it, because it checks connection, not stiffness.
DESIGNER-STATUS.md records it, and its fix on 2026-10-04.

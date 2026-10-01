# Handoff to Brick Remix: transferable fixes from the Barbican guide

Written 2026-10-01 for the worker rebuilding `~/lego-remix`. Nothing in
`~/lego-remix` or any shared engine file was changed from this project; each
item below says what was found here, why it matters, and where the working
version lives in `~/lego-barbican-guide` so it can be ported deliberately.

## 1. Check renderer shapes against LDraw, not just part footprints

**Found:** footprint and stud checks passed while the drawn shapes were
wrong: a wedge brick's taper ran backwards, the 6091 curved-top hump fell
2.5 plates too low, and 1×1 round parts were undersized.

**Fix:** `scripts/check-parts.mjs` rotates each LDraw part's top-surface
height field into the part's canonical frame and compares it, bin by bin
(4 per stud), with the renderer's shape table. Two lessons matter:

- Sample the renderer inclusive of bin edges, as the LDraw rasterizer does.
  Without that, correct L-shaped and ring-shaped parts fail.
- Scale thresholds by part height. A fixed one-plate threshold lets a wrong
  corner on a one-plate part pass.

Run negative controls, such as a reversed slope or wedge, to prove the check
can fail.

## 2. One canonical shape table for every renderer

**Found:** the 3D viewer and the print renderer each had their own rotation
and shape code; one mirrored east and west.

**Fix:** `src/engine/shapes.ts` defines each part body once as convex solids
in the part's canonical frame. Both renderers place it through the
validator's own `canonicalToLocal`. `tests/agreement.test.mjs` raycasts the
real three.js meshes at every cell of every part and compares them with the
shape table. Swapping the E and W yaw makes it fail.

## 3. Isometric SVG renderer bugs

**Found in `scripts/lib/iso.mjs`, inherited from older code:**

- **Normal components mixed:** face normals came from a cross product in
  `[x, z, y]` index order but were read as `(x, y, z)`. Boxes survived by
  accident. A curved outline flipped its top face down, so it was culled,
  and lighting brightened front faces instead of tops.
- **Painter's sort:** sorting by front corner alone let a long base plate
  paint over a raised part in front of it. The fix orders overlapping parts
  by a separating axis (lower x, lower z or lower y is behind), with a
  topological sort and the corner key only as a tie-break.

## 4. SNOT (studs-not-on-top) geometry

LDraw puts side studs 10 LDU below the host's top (4070, 47905, 4733). A
clip-on 1×1 tile therefore spans 4 to 24 LDU above the host's base. It
clears bare studs below it but collides with a tile or plate at the host's
base level. The validator here enforces the side-stud height and the clear
cell in front; `tests/validator.test.mjs` has the regression cases.

## 5. Validator gaps worth closing

The July validator here missed whole classes that real builders hit:

- **Connectivity:** the model must lift as one piece; the graph is built
  from stud contacts.
- **Directional orientation:** a 1×2 slope laid 2×1 is not a real part.
- **Arch legs:** an arch stands only on its end legs.
- **Studless parts:** nothing can grip the top of a panel or curved top.
- **Build order:** each piece must have its support placed earlier, with a
  clear column above.

Each has a regression test built from a real defect.

## 6. Deterministic compiler between the model and the bricks

`src/design/compile.ts` turns an architectural spec into bricks with
recipes that are sound by construction:

- running bond with alternating corners;
- floor bands and decks tiled to span the joints below them;
- hidden 1×1 support piers under unsupported plates;
- seam ties for loose base plates;
- stock-aware allocation that falls back through equivalent 1×1 parts
  before reporting a shortage by part and count.

The LLM writes the spec, never bricks. A blind reviewer that sees only
renders gates acceptance (`scripts/lib/designer.mjs`). The same split should
transfer to Remix's set-to-build flow.

## 7. Claude API details that tripped or helped

- **Model settings:** `claude-opus-5-5` with `output_config.effort: "xhigh"`
  and adaptive thinking; omitting `thinking` is equivalent, while disabled
  thinking or a budget returns a 400.
- **Refusal fallback:** `fallbacks: "default"` with beta
  `server-side-fallback-2026-07-01`. The scalar form needs that header; the
  array form needs `-2026-06-01`.
- **Tool choice:** forced tool choice returns a 400 on Opus 5.5. Steer with
  the prompt and handle a turn with no tool call by nudging.
- **Streaming:** stream with `eager_input_streaming` and validate tool
  inputs yourself. Stop on `max_tokens` before running a truncated tool call.
- **Images:** render images go inside `tool_result` content as base64 PNG
  blocks.
- **Testing:** a scripted fake client (`tests/designer.test.mjs`) covers
  every loop exit without spend. Snapshot `messages` when recording calls;
  the array keeps growing after the call returns.

## 8. Non-rectangular walls without 1×1 bricks (added 2026-10-02)

**Found:** stepped edges, such as triangular plans or any diagonal, isolate
the step-corner cell inside a one-stud wall ring. Tiled as a ring, every
course needs 1×1 bricks there, which are the scarcest bricks in most sets.

**Fix:** for each course, plan several covers and keep the one with the
fewest 1×1s, then the fewest parts. The candidates are the ring and the
solid course, each scanned row-major and column-major. A solid course spans
the steps with 2×N bricks. In `courseCells` in `src/design/compile.ts`, this
cut a three-tower model from 378 1×1s to 2.

## 9. Supported tiling for cantilevers (added 2026-10-02)

**Found:** greedy largest-first plate tiling of an overhanging slab can
leave a plate entirely on the overhang, holding nothing.

**Fix,** in `planTiles` and `exactSupported`, in two stages:

1. **Local repair:** re-tile just the stranded plate and its edge
   neighbours, requiring every plate to touch a stud below.
2. **Exact cover:** if that fails, search for a cover of the whole slab,
   choosing the most constrained cell next. Precompute every legal placement
   once and index it by cell; that took the stock-exhausted worst case from
   68 s to about 1 s.

## 10. Ground surfaces must tie the base

On the ground layer, weight "spans a joint between base plates" above part
size when choosing tiles. Otherwise long tiles laid parallel to a base joint
leave a whole strip of baseplate loose.


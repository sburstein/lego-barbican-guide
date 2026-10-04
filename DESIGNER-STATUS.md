# AI designer: status and checkpoint (2026-10-02)

> **Decision, 2026-10-02:** one Barbican design is needed, and it is the
> repaired Lakeside Panorama. Frobisher Section and London Wall are retired
> from the site, and the AI designer stays a local tool. Nothing below is
> needed for the site; it records where the local designer stands.

The guide, booklets and release (v2.0.1, live) are unaffected by this work.
The AI designer is built and tested offline, but it is **not production
ready**. No real design has passed its review gate. It is disabled on the
public site, and the Anthropic account is out of API credit.

## Evidence so far

| What | Result |
|---|---|
| Live run, 2026-10-01 | Opus 5.5 at `xhigh` effort, 9 compiles, about $9.26 by token count. The first compile needed 311 1×1 bricks against 40 in the set; the run reached a valid design by compile 5. The blind reviewer named it "Barbican Estate, London" but scored quality 5/10 and fidelity 5/10. The revision was cut off by "credit balance is too low". The spec, review, render and result are kept in `tests/fixtures/live-run-2026-10-01/`. |
| Failure path through the app | A job started from the panel stopped at once with "out of API credit", saved nothing and cost $0. |
| Offline tests | 71 pass (`npm test`): compiler, geometry, designer loop with a scripted client, HTTP route, renderer agreement, validator. |

## Correction, 2026-10-04: the review was not blind

Every render sent to the reviewer, including the live run's, showed the
design's title in its header. The live run's "named the Barbican" verdict
may have come from that text. The gate now renders without a title and a
test pins it. Truly blind, `tests/fixtures/barbican-critique.json` is named
as the Barbican and scores quality 6, fidelity 6 (`reviews/`).

**Known compiler weakness:** on a stepped triangular plan, `tower` slabs
never bridge the joint between the apex rows and the rest, so the apex
column is held only by the top slab. The validator checks connection, not
stiffness, so it passes. Fix before the designer is trusted with towers:
make each slab, or alternate courses, span that joint.

**Fixed, 2026-10-04.** The reproduction was worse than the note above. On
a size 6 tower pointing S (rows 6, 6, 4, 2, 2 wide; 14 levels, 2 courses)
every course and every slab, the top one included, split into the same
three blocks. No part crossed the row 2/3 joint on any level, so the apex
stack met the tower only through the site plate under it. Every triangular
size from 4 to 8, in all four orientations, left row joints open, and odd
sizes left a column joint open on alternate levels.

Each tower level must now lay at least one part across every joint between
consecutive rows and columns of its plan (`src/design/compile.ts`):

- The last brick course of a level is laid across the joints the level still
  has open. `crossCover` is a bounded search: it settles the open joints
  first, the most constrained first, then covers the pockets left with the
  fewest 1×1s and parts, from what the set has left. On a two-course level
  this gives the hand-built Panorama tower's pattern: course 1 in rows,
  course 2 across them, often on a 2×6 spine.
- The slab takes any joint the walls leave open, using the same search over
  plates.
- A level that is still untied raises a warning naming its levels.

Proof: the test "every level of a triangular tower lays a part across each
joint between plan rows" in `tests/geometry.test.mjs` covers sizes 4 to 8,
all four points, one and two courses, a glazed lobby, and the 14-level case.
It fails on the old compiler. `npm test` (65 pass) and `node
scripts/harness.mjs all` pass, and the Panorama model is untouched.

Costs and limits:

- `tests/fixtures/barbican-critique.json` now takes 493 pieces (was 466),
  all within the set. Its three towers had 23 open joints over 15 levels;
  they now have none.
- A size 4 tower needs one 1×1 brick per level. The end cells of its base row
  cannot be reached any other way once a part crosses into the apex.
- A one-course tower with a glazed lobby can leave the lobby level untied.
  The glass ring is hollow, so the slab above it has nothing to hold a plate
  across the joints. The warning says to use `courses: 2`, which ties it.
- Compiling is slower: about 0.3 s for the 14-level size 6 tower (was
  0.06 s), and 0.5 to 3.5 s for size 10 and 12 towers (the slowest of those
  already took 2.7 s).
- Towers too tall for the set still run out of plates as before. Their late
  levels are left untied, and the warning names them.

## What the review asked for, and what the compiler can now express

The reviewer's actionable points, and the offline response:

| Reviewer point | Now in the compiler | Proof |
|---|---|---|
| Towers are square stacks; they should be triangular with saw-tooth balconies | `tower` element: rasterised equilateral triangle (or square), slabs serrating N/S then E/W | `tests/geometry.test.mjs` |
| Tower heights unequal | Equal `levels` and `courses` give equal heights | the fixture test checks the three tops |
| Crowns underplayed | `crown: "fins"`: steep-slope fins leaning outward | fin-orientation test |
| Vault rhythm too coarse | roof `scallops`: one hump every 2 studs | scallop test |
| Podium a "table on legs", studs everywhere | podium `parapet` (railing panels) and `finish: "tiles"` | parapet test, tiled finishing |
| Terrace should cross the lake on columns | blocks with `pilotis` over water (worked before; shown in the fixture) | `tests/fixtures/barbican-critique.json` |
| Hand-placed towers (281 raw parts in the reviewed spec) | the designer prompt now documents `tower`, `scallops`, `parapet`, `courses` | prompt check |

Not addressed: St Giles church and the Barbican Centre, which are content
choices for the designer; and a nameplate, which needs printed tiles the set
does not have.

`tests/fixtures/barbican-critique.json` applies these points in one model:
493 pieces since the tower fix (466 before), valid, within the set. Its
56-page booklet (54 before) prints every new
recipe. It has **not** been reviewed, because that needs the API.

## Live validation still owed

Run these in order once the account has credit. Each one spends money.

```bash
node scripts/harness.mjs api
npm run design -- "the Barbican Estate, City of London: three equal triangular towers with serrated balconies and finned crowns, terrace blocks with vaulted roofs over the lake, the podium" --budget 20
npm run dev
```

1. The first command is the key and credit check, about a cent. Expect
   `reply "OK"`.
2. The second command is the real gate test. Approval saves
   `src/designs/<id>.ts` and a render. Then run `node scripts/harness.mjs all`
   and look at the design in the app.
3. Under `npm run dev`, start one design from the app's panel and watch it
   to completion. That is the route and UI end to end with a real approval.

Only after a real approval should an AI design be released, through the
RELEASE.md steps (draft deploy, checks, publish). The release adds the
approved design and its booklet to the public site; the designer itself
stays off there.

## Decisions

1. **Settled 2026-10-02:** one Barbican design (the Panorama). No public
   designer and no AI gallery.
2. **Open, only if the local designer is wanted again:** API credit for the
   key in `.env`.
3. **Open:** merging `repair/engine-2026-09-30` into `main` (still the August
   record) when GitHub's default branch should show the current guide.

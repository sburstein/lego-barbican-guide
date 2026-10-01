# LEGO Geometry Audit

> **2026-09-30 re-audit.** The July record below is kept as written. A
> stricter engine (LDraw-verified parts, real orientations, one-piece
> connectivity, side-stud heights) found 136 violations the July validator
> could not see, all now repaired. The renderers now share one shape table.
> Details and the change list are in REVIEW.md; current checks are under
> "Checks (September 2026)" at the end of this file.

**Status: resolved (July 2026 rebuild).** The issues catalogued in earlier
versions of this document (fractional brick sizes, half-stud misalignments,
floating pieces, scaled arches, colliding plates) were fixed by replacing the
free-form geometry code with a validated placement model.

## How it works now

- `src/lego-model.ts` holds the part catalog, the validator, and the Lakeside
  Panorama model; `src/model-frobisher.ts` holds the Frobisher Crescent
  section and `src/model-londonwall.ts` the London Wall & Bastion build.
  `src/build-models.ts` registers all three and is what the viewer and
  the scripts consume. Every piece in either build is a
  `Placement`: a real LEGO part from a catalog of Architecture Studio 21050
  parts, positioned by integer stud coordinates (corner-based) and an integer
  plate-layer. Bricks are 3 layers, plates/tiles 1, cheese slopes 2,
  trans panels 6.
- `validateBuild()` checks every placement machine-verifiably:
  - the part exists in the catalog (and in the requested color);
  - the position and size are on the stud grid (integers only);
  - no two pieces overlap any 1×1×1-plate cell (full 3D occupancy);
  - every piece above layer 0 has at least one stud directly beneath a
    footprint cell (tiles, cheese slopes, and curved tops provide no studs;
    25° slopes provide studs only on their back row);
  - SNOT pieces (`attach: true`, used for the Frobisher facade panels) claim
    no grid cell of their own, so instead the validator requires a side-stud
    host brick in the same cell whose studded face points the right way, and
    clear air in the cell the piece hangs into;
  - sequential accessibility: walking the steps in order, every piece must
    drop straight down onto its studs; nothing placed in an earlier step may
    occupy the column above it. This is what makes the on-screen order
    followable with real bricks (undercroft paving before decks, facades
    before the floor bands above them, tower window bands inline with their
    courses).
- `src/lego-geometry.ts` only renders the validated model (correct stud
  proportions, 0.03-stud seams, real slope/arch profiles).

## Checks

```
node scripts/validate-geometry.mjs    # physics + build order + guide sync, all builds
node audit.mjs                        # piece usage per build and combined
node scripts/gen-builds.mjs           # regenerate every build's step text in builds.ts
```

Step titles and tips are authored in the model files (`b.step(title, tip)`);
instructions and piece lists derive from the placements, and each phase's
full parts list is shown in the app before its steps.

Current state:

| Build | Pieces | Steps | Phases |
|---|---|---|---|
| Lakeside Panorama | 668 | 108 | 12 |
| Frobisher Crescent Section | 167 | 40 | 7 |
| London Wall & Bastion | 73 | 18 | 5 |

Zero violations in any build, and the three together use 908 of the set's
1,210 pieces with no part over its quantity, so all three models stand at
once from a single copy of 21050. Each later build deliberately draws on the
parts the earlier ones strand: Frobisher takes the curved 3×1 slopes and
side-stud bricks; the London Wall takes the macaroni bricks, wedges,
jumpers and ruin-shaped slopes.

The validator also runs in dev mode (console warning on regression), so any
future edit to the model that breaks buildability is caught immediately.

## Checks (September 2026)

The engine now lives in `src/engine/`: `parts.ts` (the part table, every
entry checked against LDraw), `shapes.ts` (part bodies for both renderers),
`model.ts` (placement and rotation) and `validate.ts`.

```
node scripts/harness.mjs all     # every check below, then manuals, renders and the app build
node scripts/check-parts.mjs     # part table and shapes vs LDraw
node scripts/validate-geometry.mjs
node audit.mjs                   # exits 1 if the builds need more than one set
npm test                         # renderer agreement + validator regressions
```

| Build | Pieces | Steps | Phases |
|---|---|---|---|
| Lakeside Panorama | 668 | 108 | 12 |
| Frobisher Crescent Section | 163 | 39 | 7 |
| London Wall & Bastion | 77 | 22 | 5 |

Zero violations in each build; 908 of 1,210 pieces together.

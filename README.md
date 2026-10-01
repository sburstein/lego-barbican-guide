# LEGO Barbican Guide

An interactive build guide for recreating the Barbican Estate from a single
LEGO Architecture Studio set (21050), with a live 3D model for every step.

**Live site:** https://lego-barbican-guide.netlify.app

## The three builds

| Build | Pieces | Steps | What it is |
|---|---|---|---|
| The Barbican Estate: Lakeside Panorama | 668 | 108 | The wide shot: lake, podium colonnade, terrace block with barrel vaults, Lauderdale Tower, conservatory, landscaping |
| Frobisher Crescent: Facade Bay Section | 163 | 39 | The close-up: a cutaway bay with party walls, three floors, SNOT facade panels and a vaulted roof |
| London Wall & Bastion | 77 | 22 | The dessert: the ancient wall fragment and bastion inside the estate, with a walled garden, built from the leftover slopes and macaroni bricks |

All three are designed to stand at the same time: together they use 908 of the
set's 1,210 pieces with no part over its real quantity.

The live site still shows the August versions; see REVIEW.md for the
September repairs and what changed for anyone who built from the booklet.

## How correctness is enforced

Every build lives as data in `src/lego-model.ts`, `src/model-frobisher.ts`
and `src/model-londonwall.ts`: each piece is a real 21050 part placed on an
integer stud grid at an integer plate-layer. `validateBuild()` proves, for
every piece:

- it is a real part (in the requested color) from the set's catalog
- it sits on the grid, collides with nothing (full 3D cell occupancy)
- it has studs beneath it (tiles, cheese slopes and curved tops provide none)
- it can be lowered straight down at the moment its step comes; nothing
  placed earlier blocks the column above it
- it is laid in an orientation the real part has, and the whole model holds
  together as one piece
- clip-on (SNOT) parts sit on a real side stud with clear air in front

The part table in `src/engine/parts.ts` and the shapes in
`src/engine/shapes.ts` are checked against the LDraw library of real LEGO
geometry, and the 3D viewer and print manual both draw from those shapes
through the validator's own rotation, with tests proving they agree.

The guide text in `src/builds.ts` is generated from the models, so the app
can never drift from the geometry.

## Scripts

```bash
npx vite                                       # dev server
node scripts/harness.mjs all                   # every check, manuals, renders, app build
node scripts/check-parts.mjs                   # part table and shapes vs LDraw
node scripts/validate-geometry.mjs             # physics + build-order + guide sync
node audit.mjs                                 # piece usage vs. the set inventory
npm test                                       # renderer agreement + validator regressions
node scripts/gen-builds.mjs                    # regenerate builds.ts step text
node scripts/generate-manual.mjs <build-id>    # print-ready HTML booklet
node scripts/render-views.mjs <build-id>       # four-side review render (PNG)
```

Deep link to any step: `/?build=<build-id>&step=<phase-id>-<n>`.

Build ids: `barbican-panorama`, `frobisher-section`, `london-wall`. Manuals
land in `manual/` and are gitignored; regenerate rather than commit them.

Step titles and tips are authored in the model files via
`b.step(title, tip)`; instructions and piece lists derive from the
placements. `src/inventory.ts` is verified against the published Brickset
inventory of 21050-1.

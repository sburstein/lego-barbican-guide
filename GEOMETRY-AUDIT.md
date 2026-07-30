# LEGO Geometry Audit

**Status: resolved (July 2026 rebuild).** The issues catalogued in earlier
versions of this document (fractional brick sizes, half-stud misalignments,
floating pieces, scaled arches, colliding plates) were fixed by replacing the
free-form geometry code with a validated placement model.

## How it works now

- `src/lego-model.ts` holds the part catalog, the validator, and the Lakeside
  Panorama model; `src/model-frobisher.ts` holds the Frobisher Crescent
  section. `src/build-models.ts` registers both and is what the viewer and
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
    clear air in the cell the piece hangs into.
- `src/lego-geometry.ts` only renders the validated model (correct stud
  proportions, 0.03-stud seams, real slope/arch profiles).

## Checks

```
node scripts/validate-geometry.mjs    # physical validation + step counts, both builds
node audit.mjs                        # piece usage per build and combined
node scripts/sync-builds.mjs          # regenerate the panorama's piece lists
node scripts/gen-frobisher-build.mjs  # regenerate the Frobisher build entry
```

Current state:

| Build | Pieces | Steps | Phases |
|---|---|---|---|
| Lakeside Panorama | 671 | 167 | 12 |
| Frobisher Crescent Section | 167 | 58 | 7 |

Zero physical violations in either, and the two together use 838 of the set's
1,210 pieces with no part over its quantity — so both models can be built at
once from a single copy of 21050. The Frobisher section deliberately draws on
the parts the panorama strands: all twelve curved 3×1 slopes, the side-stud
bricks, the macaroni bricks, the 6×6 plates and the 1×8 tiles.

The validator also runs in dev mode (console warning on regression), so any
future edit to the model that breaks buildability is caught immediately.

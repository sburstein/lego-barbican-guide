# LEGO Geometry Audit

**Status: resolved (July 2026 rebuild).** The issues catalogued in earlier
versions of this document (fractional brick sizes, half-stud misalignments,
floating pieces, scaled arches, colliding plates) were fixed by replacing the
free-form geometry code with a validated placement model.

## How it works now

- `src/lego-model.ts` is the single source of truth. Every piece is a
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
    25° slopes provide studs only on their back row).
- `src/lego-geometry.ts` only renders the validated model (correct stud
  proportions, 0.03-stud seams, real slope/arch profiles).

## Checks

```
node scripts/validate-geometry.mjs   # physical validation + step counts
node audit.mjs                       # piece usage vs. set 21050 inventory
node scripts/sync-builds.mjs         # regenerate builds.ts piece lists
```

Current state: 671 pieces, 167 steps, 12 phases — zero physical violations,
and no part exceeds its quantity in the 21050 set.

The validator also runs in dev mode (console warning on regression), so any
future edit to the model that breaks buildability is caught immediately.

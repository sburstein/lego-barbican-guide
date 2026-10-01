// Part shapes: the one table both renderers draw from.
//
// Every part body is a list of convex solids in the part's canonical frame
// (the frame parts.ts defines cells in):
//   u  across the part, 0..W (stud units)
//   v  back to front, 0..D (stud units); slopes fall toward +v
//   y  up, in plates (a brick is 3)
// A renderer turns a canonical point into the model with canonicalToLocal()
// from model.ts, the same rotation the validator applies to cells, so the
// 3D view, the print manual and the validator cannot disagree about which
// way a part faces. scripts/check-parts.mjs compares these shapes against
// the real LDraw geometry, so they cannot quietly drift from the real parts.
//
// Solids are convex, which lets a renderer shade and cull each face without
// a depth buffer (the manual's SVG renderer relies on this).

import type { PartDef, PartKind } from "./parts.ts";

export type Pt3 = [number, number, number]; // (u, v, y)
export type Face = Pt3[]; // convex polygon
export type Solid =
  | { type: "faces"; faces: Face[] }
  | { type: "cylinder"; u: number; v: number; r: number; y0: number; y1: number };

/** Height of the thin front edge left on slopes, in plates (4 LDU). */
export const SLOPE_LIP = 0.5;

// ─── Builders ──────────────────────────────────────────────────────────

/** Extrude a closed outline in the (u, v) plane from y0 up to y1. */
export function extrudePlan(outline: [number, number][], y0: number, y1: number): Solid {
  const n = outline.length;
  const faces: Face[] = [
    outline.map(([u, v]) => [u, v, y1] as Pt3),
    outline.map(([u, v]) => [u, v, y0] as Pt3).reverse(),
  ];
  for (let i = 0; i < n; i++) {
    const [a, b] = [outline[i], outline[(i + 1) % n]];
    faces.push([[a[0], a[1], y0], [b[0], b[1], y0], [b[0], b[1], y1], [a[0], a[1], y1]]);
  }
  return { type: "faces", faces };
}

/** Extrude a side profile in the (v, y) plane across u0..u1. */
export function extrudeSide(profile: [number, number][], u0: number, u1: number): Solid {
  const n = profile.length;
  const faces: Face[] = [
    profile.map(([v, y]) => [u0, v, y] as Pt3),
    profile.map(([v, y]) => [u1, v, y] as Pt3).reverse(),
  ];
  for (let i = 0; i < n; i++) {
    const [a, b] = [profile[i], profile[(i + 1) % n]];
    faces.push([[u0, a[0], a[1]], [u0, b[0], b[1]], [u1, b[0], b[1]], [u1, a[0], a[1]]]);
  }
  return { type: "faces", faces };
}

/** Extrude a front profile in the (u, y) plane across v0..v1. */
export function extrudeFront(profile: [number, number][], v0: number, v1: number): Solid {
  const n = profile.length;
  const faces: Face[] = [
    profile.map(([u, y]) => [u, v0, y] as Pt3),
    profile.map(([u, y]) => [u, v1, y] as Pt3).reverse(),
  ];
  for (let i = 0; i < n; i++) {
    const [a, b] = [profile[i], profile[(i + 1) % n]];
    faces.push([[a[0], v0, a[1]], [b[0], v0, b[1]], [b[0], v1, b[1]], [a[0], v1, a[1]]]);
  }
  return { type: "faces", faces };
}

export const box = (u0: number, u1: number, v0: number, v1: number, y0: number, y1: number): Solid =>
  extrudePlan([[u0, v0], [u1, v0], [u1, v1], [u0, v1]], y0, y1);

function arc(cu: number, cv: number, r: number, a0: number, a1: number, steps: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push([cu + r * Math.cos(a), cv + r * Math.sin(a)]);
  }
  return out;
}

// ─── The table ─────────────────────────────────────────────────────────

/**
 * Canonical solids for a part. `kind` is passed separately because a few
 * kinds share a PartDef shape class (plates and tiles, for instance).
 */
export function partSolids(kind: PartKind, d: PartDef): Solid[] {
  const { W, D, h: H } = d;
  switch (kind) {
    case "slope45":
    case "slope33":
    case "steepSlope2":
    case "steepSlope3":
      // one-stud ledge at the back carries the studs, then the slope falls
      // to a thin lip at the front
      return [extrudeSide([[0, 0], [0, H], [1, H], [D, SLOPE_LIP], [D, 0]], 0, W)];

    case "cheese":
      return [extrudeSide([[0, 0], [0, H], [0.12, H], [D, 0.3], [D, 0]], 0, W)];

    case "curvedSlope": {
      // studless: full height at the back, curving down to a thin front edge
      const prof: [number, number][] = [[0, 0], [0, H]];
      for (let i = 1; i <= 12; i++) {
        const t = i / 12;
        prof.push([D * t, Math.max(0.3, H * Math.cos((t * Math.PI) / 2))]);
      }
      prof.push([D, 0]);
      return [extrudeSide(prof, 0, W)];
    }

    case "curvedTop": {
      // 6091: the back cell is a plain block at brick height holding a
      // recessed stud; the front cell carries a low hump that peaks one plate
      // above brick height at mid-length and falls to about 2.4 plates at the
      // end (LDraw: 4.0, 3.9, 3.6, 3.1 plates across the cell; a parabola).
      const hump: [number, number][] = [[1, 0], [1, H]];
      for (let i = 1; i <= 8; i++) {
        const t = i / 8;
        hump.push([1 + t, H - 1.6 * t * t]);
      }
      hump.push([2, 0]);
      return [box(0, W, 0, 1, 0, 3), extrudeSide(hump, 0, W)];
    }

    case "invSlope":
      // full studded top; the underside rises from the back row to a thin
      // edge at the front
      return [extrudeSide([[0, 0], [0, H], [D, H], [D, H - SLOPE_LIP], [1, 0]], 0, W)];

    case "slopeCorner": {
      // double convex: one-stud ledge at the back-left corner, falling to the
      // front and to the right. Two slope planes meet along the hip.
      const L = SLOPE_LIP;
      const faces: Face[] = [
        [[0, 0, 0], [W, 0, 0], [W, D, 0], [0, D, 0]], // bottom
        [[0, 0, 0], [0, 0, H], [1, 0, H], [W, 0, L], [W, 0, 0]], // back
        [[0, 0, 0], [0, D, 0], [0, D, L], [0, 1, H], [0, 0, H]], // left
        [[0, D, 0], [W, D, 0], [W, D, L], [0, D, L]], // front
        [[W, 0, 0], [W, 0, L], [W, D, L], [W, D, 0]], // right
        [[0, 0, H], [0, 1, H], [1, 1, H], [1, 0, H]], // ledge
        [[0, 1, H], [0, D, L], [W, D, L], [1, 1, H]], // front slope
        [[1, 0, H], [1, 1, H], [W, D, L], [W, 0, L]], // right slope
      ];
      return [{ type: "faces", faces }];
    }

    case "wedgeL":
      // studded long side at u 0..1 runs straight; the other side tapers
      // from one stud wide at the back to full width at the front
      return [extrudePlan([[0, 0], [1, 0], [W, D], [0, D]], 0, H)];
    case "wedgeR":
      return [extrudePlan([[W - 1, 0], [W, 0], [W, D], [0, D]], 0, H)];

    case "roundCornerPlate":
      // quarter disc of radius 4 about the back-left corner
      return [extrudePlan([[0, 0], ...arc(0, 0, 4, 0, Math.PI / 2, 16)], 0, H)];

    case "macaroni": {
      // quarter ring, radii 1..2 about the front-right corner, in segments
      const out: Solid[] = [];
      const steps = 8;
      for (let i = 0; i < steps; i++) {
        const a0 = Math.PI + (i / steps) * (Math.PI / 2);
        const a1 = Math.PI + ((i + 1) / steps) * (Math.PI / 2);
        const o = arc(W, D, 2, a0, a1, 1);
        const n = arc(W, D, 1, a0, a1, 1);
        out.push(extrudePlan([o[0], o[1], n[1], n[0]], 0, H));
      }
      return out;
    }

    case "cornerPlate":
    case "cornerBrick":
      // L of three cells; the canonical (1, 1) cell is empty
      return [box(0, 2, 0, 1, 0, H), box(0, 1, 1, 2, 0, H)];

    case "roundBrick":
    case "roundPlate":
      return [{ type: "cylinder", u: W / 2, v: D / 2, r: W / 2 - 0.02, y0: 0, y1: H }];

    case "arch": {
      // legs at both ends; the span between them is a beam over an elliptical
      // opening (half-width 1 stud, rise 2 plates), sliced into convex strips
      const out: Solid[] = [box(0, 1, 0, D, 0, H), box(W - 1, W, 0, D, 0, H)];
      const steps = 8;
      const rise = (u: number) => 2.0 * Math.sqrt(Math.max(0, 1 - (u - W / 2) ** 2));
      for (let i = 0; i < steps; i++) {
        const ua = 1 + (2 * i) / steps;
        const ub = 1 + (2 * (i + 1)) / steps;
        out.push(extrudeFront([[ua, rise(ua)], [ub, rise(ub)], [ub, H], [ua, H]], 0, D));
      }
      return out;
    }

    case "panel": {
      // thin wall along the front edge on a thin base; the 1×1 corner panel
      // adds a second wall on the right
      const t = 0.2;
      const out = [box(0, W, 0, D, 0, 0.5), box(0, W, D - t, D, 0.5, H)];
      if (W === 1) out.push(box(W - t, W, 0, D - t, 0.5, H));
      return out;
    }

    case "glassPanel":
      // 87552: thin front wall between a base and a top rim with two studs
      return [box(0, W, 0, D, 0, 0.5), box(0, W, D - 0.2, D, 0.5, H - 1), box(0, W, 0, D, H - 1, H)];

    default:
      return [box(0, W, 0, D, 0, H)];
  }
}

// ─── Queries ───────────────────────────────────────────────────────────

/** Convert a cylinder solid to faces (n-gon prism), for flat renderers. */
export function cylinderFaces(s: Extract<Solid, { type: "cylinder" }>, seg = 16): Face[] {
  const ring: [number, number][] = [];
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    ring.push([s.u + s.r * Math.cos(a), s.v + s.r * Math.sin(a)]);
  }
  return (extrudePlan(ring, s.y0, s.y1) as Extract<Solid, { type: "faces" }>).faces;
}

export function solidFaces(s: Solid): Face[] {
  return s.type === "faces" ? s.faces : cylinderFaces(s);
}

/**
 * Top surface height (plates) of a set of solids above canonical point
 * (u, v), or -1 if nothing is there. Used to compare shapes with LDraw.
 */
export function topHeightAt(solids: Solid[], u: number, v: number): number {
  let best = -1;
  for (const s of solids) {
    if (s.type === "cylinder") {
      if ((u - s.u) ** 2 + (v - s.v) ** 2 <= s.r * s.r) best = Math.max(best, s.y1);
      continue;
    }
    for (const f of s.faces) {
      // non-vertical faces only: project to the plan and test containment
      const [a, b, c] = f;
      const n = [
        (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]),
        (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]),
        (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]),
      ];
      if (Math.abs(n[2]) < 1e-9) continue;
      if (!insidePlan(f, u, v)) continue;
      const y = a[2] - (n[0] * (u - a[0]) + n[1] * (v - a[1])) / n[2];
      best = Math.max(best, y);
    }
  }
  return best;
}

function insidePlan(f: Face, u: number, v: number): boolean {
  let sign = 0;
  for (let i = 0; i < f.length; i++) {
    const [a, b] = [f[i], f[(i + 1) % f.length]];
    const cross = (b[0] - a[0]) * (v - a[1]) - (b[1] - a[1]) * (u - a[0]);
    if (Math.abs(cross) < 1e-9) continue;
    const s = Math.sign(cross);
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

// Architecture compiler: DesignSpec (spec.ts) -> validated LEGO placements.
//
// The AI designer describes buildings; this file decides every brick, with
// recipes that are sound by construction:
// - walls run in running bond, with corners alternating course by course;
// - floor bands, decks and surfaces are tiled preferring plates that span the
//   joints of whatever is beneath, so they tie the structure together;
// - window piers line up vertically, glass comes only in real trans parts;
// - every part is drawn from one Architecture Studio 21050 box, and anything
//   the box cannot supply is reported by part and count.
// The engine validator (physics, connectivity, build order) has the final
// word; its findings come back as errors the designer can act on.

import { allParts, partDef, partNumberFor, type ColorKey, type Facing, type PartKind } from "../engine/parts.ts";
import {
  footprintCells,
  makePlacement,
  orientationOk,
  studCells,
  type BuildMeta,
  type BuildPlacements,
  type Placement,
} from "../engine/model.ts";
import { components, connectionGraph, validateBuild } from "../engine/validate.ts";
import { FULL_INVENTORY } from "../inventory.ts";
import { checkSpec, type DesignSpec, type Element, type Facade, type Rect, type Roof, type Side, type Tint } from "./spec.ts";

export type CompiledPhase = {
  id: string;
  elementId: string;
  type: string;
  name: string;
  concept?: string;
  about?: string;
};

export type PartUsage = { part: string; name: string; used: number; stock: number };

export type Compiled = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  build: BuildPlacements;
  meta: BuildMeta;
  phases: CompiledPhase[];
  phaseOrder: string[];
  stats: {
    pieces: number;
    steps: number;
    heightBricks: number;
    footprint: [number, number];
    shortages: PartUsage[];
    usage: PartUsage[];
  };
};

type StepRec = { phase: string; title: string; tip?: string; pieces: Placement[] };
type Cand = { kind: PartKind; w: number; d: number; x: number; z: number; pn: string; supported: boolean };

const k2 = (x: number, z: number) => `${x},${z}`;
const k3 = (x: number, z: number, l: number) => `${x},${z},${l}`;
const SIDES: Side[] = ["N", "S", "E", "W"];
const BRICK_LENGTHS = [8, 6, 4, 3, 2, 1];

/** Mutable compile state: occupancy, the stud surface, stock and steps. */
class Ctx {
  spec: DesignSpec;
  pieces: Placement[] = [];
  occ = new Map<string, Placement>();
  top = new Map<string, { layer: number; stud: boolean; p: Placement }>();
  stock = new Map<string, number>();
  names = new Map<string, string>();
  used = new Map<string, number>();
  steps: StepRec[] = [];
  cur: StepRec | null = null;
  phase = "";
  errors: string[] = [];
  warnings: string[] = [];
  facts: string[] = [];
  factIdx = 0;

  constructor(spec: DesignSpec) {
    this.spec = spec;
    for (const e of FULL_INVENTORY) {
      this.stock.set(e.partNumber, e.totalInSet);
      this.names.set(e.partNumber, e.name);
    }
  }

  // ─── surface queries ───
  heightAt(x: number, z: number): number {
    return this.top.get(k2(x, z))?.layer ?? 0;
  }
  studAt(x: number, z: number, layer: number): boolean {
    if (layer === 0) return true;
    const t = this.top.get(k2(x, z));
    return !!t && t.layer === layer && t.stud;
  }
  inSite(x: number, z: number): boolean {
    return x >= 0 && z >= 0 && x < this.spec.site.w && z < this.spec.site.d;
  }
  freeAt(x: number, z: number, layer: number, h = 1): boolean {
    if (!this.inSite(x, z)) return false;
    for (let l = layer; l < layer + h; l++) if (this.occ.has(k3(x, z, l))) return false;
    return true;
  }
  left(pn: string): number {
    return (this.stock.get(pn) ?? 0) - (this.used.get(pn) ?? 0);
  }

  // ─── steps ───
  beginPhase(id: string, facts: string[] = []) {
    this.phase = id;
    this.facts = facts;
    this.factIdx = 0;
    this.cur = null;
  }
  step(title: string, tip?: string) {
    const t = tip ?? (this.facts.length ? this.facts[this.factIdx++ % this.facts.length] : undefined);
    this.cur = { phase: this.phase, title, tip: t, pieces: [] };
    this.steps.push(this.cur);
  }

  /** Place one part. Returns null (with an error) if it cannot go there. */
  put(kind: PartKind, w: number, d: number, x: number, z: number, layer: number, color: ColorKey, desc: string, facing: Facing = "S"): Placement | null {
    const def = partDef(kind, w, d);
    if (!def) {
      this.errors.push(`${desc}: there is no ${kind} ${w}×${d} in the set`);
      return null;
    }
    if (color === "trans" && typeof def.pn === "string" && def.pn !== "87552") {
      this.errors.push(`${desc}: ${def.name} does not come in trans-clear in this set (only Brick 1×2, Plate 1×1, Plate 1×2 and Panel 1×2×2 do)`);
      return null;
    }
    const p = makePlacement(kind, w, d, x, z, layer, color, desc, facing);
    if (!orientationOk(p)) {
      this.errors.push(`${desc}: ${def.name} cannot be laid ${w}×${d} facing ${facing}`);
      return null;
    }
    const cells = footprintCells(p);
    for (const [cx, cz] of cells) {
      if (!this.inSite(cx, cz)) {
        this.errors.push(`${desc}: ${def.name} at ${x},${z} runs off the site`);
        return null;
      }
      for (let l = layer; l < layer + p.h; l++) {
        const other = this.occ.get(k3(cx, cz, l));
        if (other) {
          this.errors.push(`${desc}: ${def.name} at ${x},${z} layer ${layer} hits ${other.info.description} (${other.info.name})`);
          return null;
        }
      }
    }
    if (!this.cur) this.step("Build");
    const pn = p.info.partNumber;
    this.used.set(pn, (this.used.get(pn) ?? 0) + 1);
    const studs = new Set(studCells(p).map(([a, b]) => k2(a, b)));
    for (const [cx, cz] of cells) {
      for (let l = layer; l < layer + p.h; l++) this.occ.set(k3(cx, cz, l), p);
      const t = this.top.get(k2(cx, cz));
      if (!t || layer + p.h >= t.layer) this.top.set(k2(cx, cz), { layer: layer + p.h, stud: studs.has(k2(cx, cz)), p });
    }
    this.pieces.push(p);
    this.cur!.pieces.push(p);
    return p;
  }

  /**
   * One brick-tall 1×1 part: a plain brick while they last, then the set's
   * other 1×1 bricks (headlight, side-stud, round), which read as the same
   * pier from outside. Returns null when every kind is used up.
   */
  oneByOne(x: number, z: number, layer: number, color: ColorKey, desc: string, facing: Facing = "S"): Placement | null {
    const options: [PartKind, string][] = [["brick", "3005"], ["headlight", "4070"], ["sideStud4", "4733"], ["sideStud2", "47905"], ["roundBrick", "3062b"]];
    for (const [kind, pn] of options) if (this.left(pn) > 0) return this.put(kind, 1, 1, x, z, layer, color, desc, facing);
    return this.put("brick", 1, 1, x, z, layer, color, desc, facing); // reported as a shortage
  }
  oneByOneLeft(): number {
    return ["3005", "4070", "4733", "47905", "3062b"].reduce((s, pn) => s + Math.max(0, this.left(pn)), 0);
  }

  /** Stack 1×1 bricks from `from` up to `to` (layers); a hidden support or a column. */
  column(x: number, z: number, from: number, to: number, color: ColorKey, desc: string, round = false): boolean {
    if ((to - from) % 3 !== 0 || to <= from) return false;
    if (!this.studAt(x, z, from) || !this.freeAt(x, z, from, to - from)) return false;
    for (let l = from; l < to; l += 3) {
      if (round && this.left("3062b") > 0) this.put("roundBrick", 1, 1, x, z, l, color, desc);
      else this.oneByOne(x, z, l, color, desc);
    }
    return true;
  }

  // ─── tiling ───

  /**
   * Plan a cover of `cells` at `layer` with plates or tiles from stock.
   * Larger parts first; among equals, parts that span joints in the layer
   * below (ties) and parts that have studs to grip win.
   */
  planTiles(cells: [number, number][], layer: number, family: "plate" | "tile", color: ColorKey): { plan: Cand[]; missing: [number, number][]; blocked: [number, number][] } {
    // cells something else already fills are reported, not tiled
    const blocked = cells.filter(([x, z]) => !this.freeAt(x, z, layer));
    const region = new Set(cells.filter(([x, z]) => this.freeAt(x, z, layer)).map(([x, z]) => k2(x, z)));
    const covered = new Set<string>();
    const reserved = new Map<string, number>();
    const sizes: { kind: PartKind; w: number; d: number; pn: string }[] = [];
    for (const def of allParts()) {
      if (def.kind !== family) continue;
      if (color === "trans" && typeof def.pn === "string") continue;
      const pn = partNumberFor(def, color)!;
      sizes.push({ kind: def.kind, w: def.W, d: def.D, pn });
      if (def.W !== def.D) sizes.push({ kind: def.kind, w: def.D, d: def.W, pn });
    }
    sizes.sort((a, b) => b.w * b.d - a.w * a.d || Math.min(b.w, b.d) - Math.min(a.w, a.d));
    const order = cells.filter(([x, z]) => region.has(k2(x, z))).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const plan: Cand[] = [];
    const missing: [number, number][] = [];
    for (const [x, z] of order) {
      if (covered.has(k2(x, z))) continue;
      let best: Cand | null = null;
      let bestScore = -Infinity;
      for (const s of sizes) {
        if (this.left(s.pn) - (reserved.get(s.pn) ?? 0) <= 0) continue;
        let ok = true;
        let support = 0;
        const below = new Set<Placement>();
        for (let i = 0; i < s.w && ok; i++)
          for (let j = 0; j < s.d && ok; j++) {
            const cx = x + i, cz = z + j;
            if (!region.has(k2(cx, cz)) || covered.has(k2(cx, cz)) || !this.freeAt(cx, cz, layer)) { ok = false; break; }
            if (this.studAt(cx, cz, layer)) support++;
            const t = this.top.get(k2(cx, cz));
            if (t && t.layer === layer) below.add(t.p);
          }
        if (!ok) continue;
        const score = s.w * s.d * 4 + (below.size - 1) * 3 + (support > 0 || layer === 0 ? 0 : -400);
        if (score > bestScore) {
          bestScore = score;
          best = { kind: s.kind, w: s.w, d: s.d, x, z, pn: s.pn, supported: support > 0 || layer === 0 };
        }
      }
      if (!best) {
        missing.push([x, z]);
        covered.add(k2(x, z));
        continue;
      }
      plan.push(best);
      reserved.set(best.pn, (reserved.get(best.pn) ?? 0) + 1);
      for (let i = 0; i < best.w; i++) for (let j = 0; j < best.d; j++) covered.add(k2(x + i, z + j));
    }
    // Greedy can strand a plate where nothing holds it (a balcony row tiled
    // on its own). For small areas, search for a cover where every plate
    // grips something, fewest plates first.
    if (layer > 0 && region.size <= 48 && plan.some((c) => !c.supported)) {
      const exact = this.exactSupported([...region].map((k) => k.split(",").map(Number) as [number, number]), layer, sizes);
      if (exact) return { plan: exact, missing: [], blocked };
    }
    return { plan, missing, blocked };
  }

  /** Bounded exact search for a cover in which every plate is supported. */
  exactSupported(cells: [number, number][], layer: number, sizes: { kind: PartKind; w: number; d: number; pn: string }[]): Cand[] | null {
    const region = new Set(cells.map(([x, z]) => k2(x, z)));
    const order = [...cells].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    const covered = new Set<string>();
    const used = new Map<string, number>();
    const cur: Cand[] = [];
    let best: Cand[] | null = null;
    let nodes = 0;
    const go = () => {
      if (++nodes > 40000 || (best && cur.length >= best.length)) return;
      const next = order.find(([x, z]) => !covered.has(k2(x, z)));
      if (!next) { best = [...cur]; return; }
      const [x, z] = next;
      for (const s of sizes) {
        if (this.left(s.pn) - (used.get(s.pn) ?? 0) <= 0) continue;
        let ok = true, support = 0;
        for (let i = 0; i < s.w && ok; i++)
          for (let j = 0; j < s.d && ok; j++) {
            const key = k2(x + i, z + j);
            if (!region.has(key) || covered.has(key)) ok = false;
            else if (this.studAt(x + i, z + j, layer)) support++;
          }
        if (!ok || support === 0) continue;
        const cand: Cand = { kind: s.kind, w: s.w, d: s.d, x, z, pn: s.pn, supported: true };
        for (let i = 0; i < s.w; i++) for (let j = 0; j < s.d; j++) covered.add(k2(x + i, z + j));
        used.set(s.pn, (used.get(s.pn) ?? 0) + 1);
        cur.push(cand);
        go();
        cur.pop();
        used.set(s.pn, used.get(s.pn)! - 1);
        for (let i = 0; i < s.w; i++) for (let j = 0; j < s.d; j++) covered.delete(k2(x + i, z + j));
      }
    };
    go();
    return best;
  }

  commit(plan: Cand[], layer: number, color: ColorKey, desc: string) {
    for (const c of plan) this.put(c.kind, c.w, c.d, c.x, c.z, layer, color, desc);
  }

  /** Lay a straight run of 1-wide bricks, avoiding the joints below. */
  fillRun(cells: [number, number][], axis: "x" | "z", layer: number, color: ColorKey, desc: string, forbidden: Set<number>, facing: Facing = "S"): number[] {
    const n = cells.length;
    if (!n) return [];
    const c0 = axis === "x" ? cells[0][0] : cells[0][1];
    const banned = new Set<number>();
    const pnOf = (L: number) => partNumberFor(partDef("brick", 1, L)!, "white")!;
    let segs: number[] = [];
    for (let attempt = 0; attempt < 7; attempt++) {
      const lens = BRICK_LENGTHS.filter((L) => !banned.has(L) && (L === 1 ? this.oneByOneLeft() > 0 : this.left(pnOf(L)) > 0));
      const dp = new Array(n + 1).fill(Infinity);
      const from = new Array(n + 1).fill(-1);
      dp[0] = 0;
      for (let i = 0; i < n; i++) {
        if (dp[i] === Infinity) continue;
        for (const L of lens) {
          const j = i + L;
          if (j > n) continue;
          const cost = dp[i] + 1 + (j < n && forbidden.has(c0 + j) ? 4 : 0) + (L === 1 ? 0.7 : 0);
          if (cost < dp[j]) { dp[j] = cost; from[j] = L; }
        }
      }
      if (dp[n] === Infinity) { segs = new Array(n).fill(1); break; }
      segs = [];
      for (let j = n; j > 0; j -= from[j]) segs.unshift(from[j]);
      const need = new Map<number, number>();
      for (const L of segs) need.set(L, (need.get(L) ?? 0) + 1);
      const short = [...need].find(([L, q]) => q > (L === 1 ? this.oneByOneLeft() : this.left(pnOf(L))));
      if (!short) break;
      banned.add(short[0]);
    }
    const joints: number[] = [];
    let i = 0;
    for (const L of segs) {
      const [x, z] = cells[i];
      if (L === 1) this.oneByOne(x, z, layer, color, desc, facing);
      else if (axis === "x") this.put("brick", L, 1, x, z, layer, color, desc);
      else this.put("brick", 1, L, x, z, layer, color, desc);
      i += L;
      if (i < n) joints.push(c0 + i);
    }
    return joints;
  }
}

// ─── helpers ───

const tintColor = (t: Tint | undefined, dflt: ColorKey = "white"): ColorKey => (t ?? dflt) as ColorKey;

function rectCells(r: Rect): [number, number][] {
  const out: [number, number][] = [];
  for (let z = r.z; z < r.z + r.d; z++) for (let x = r.x; x < r.x + r.w; x++) out.push([x, z]);
  return out;
}

/** The common height under a rect, or an error naming the spread. */
function flatBase(ctx: Ctx, r: Rect, who: string): number | null {
  let lo = Infinity, hi = -Infinity;
  for (const [x, z] of rectCells(r)) {
    const h = ctx.heightAt(x, z);
    lo = Math.min(lo, h);
    hi = Math.max(hi, h);
  }
  if (lo !== hi) {
    ctx.errors.push(`${who}: the ground under ${r.x},${r.z} ${r.w}×${r.d} is uneven (layers ${lo} to ${hi}); give it a footprint that sits on one surface`);
    return null;
  }
  return lo;
}

function facadeOf(f: Facade | Partial<Record<Side, Facade>> | undefined, side: Side): Facade {
  if (!f) return "solid";
  if (typeof f === "string") return f;
  return f[side] ?? "solid";
}

type Role = "white" | "glass" | "void" | "grille" | "arch";

/** Role of the cell at offset k along a full wall extent of length n. */
function roleAt(f: Facade, k: number, n: number): Role {
  if (k === 0 || k === n - 1) return "white";
  switch (f) {
    case "glass": return (k - 1) % 3 === 2 ? "white" : "glass";
    case "ribbon": return "glass";
    case "open": return k % 2 === 0 ? "white" : "void";
    case "grille": return "grille";
    case "arches": return "arch";
    default: return "white";
  }
}

// ─── wall course ───

type WallState = Record<Side, Set<number>>;
const OUT: Record<Side, Facing> = { N: "N", S: "S", E: "E", W: "W" };

function wallCourse(ctx: Ctx, wr: Rect, layer: number, parity: number, facade: (s: Side) => Facade, color: ColorKey, desc: string, state: WallState) {
  if (wr.w <= 2 || wr.d <= 2) {
    // too narrow for a hollow ring: fill solid, with 2-wide bricks where the
    // strip is 2 wide (a 2×2 core is one brick, not four 1×1s)
    const along: "x" | "z" = wr.w >= wr.d ? "x" : "z";
    if (Math.min(wr.w, wr.d) === 2 && fillWide(ctx, wr, along, layer, color, desc, parity)) return;
    const rows = along === "x" ? wr.d : wr.w;
    for (let r = 0; r < rows; r++) {
      const cells: [number, number][] = [];
      const len = along === "x" ? wr.w : wr.d;
      for (let i = 0; i < len; i++) cells.push(along === "x" ? [wr.x + i, wr.z + r] : [wr.x + r, wr.z + i]);
      const key: Side = r === 0 ? (along === "x" ? "N" : "W") : along === "x" ? "S" : "E";
      state[key] = new Set(ctx.fillRun(cells, along, layer, color, desc, state[key] ?? new Set()));
    }
    return;
  }
  const x0 = wr.x, x1 = wr.x + wr.w - 1, z0 = wr.z, z1 = wr.z + wr.d - 1;
  const lines: { side: Side; axis: "x" | "z"; fixed: number; from: number; to: number; full0: number; fullN: number }[] = [
    { side: "N", axis: "x", fixed: z0, from: parity ? x0 + 1 : x0, to: parity ? x1 - 1 : x1, full0: x0, fullN: wr.w },
    { side: "S", axis: "x", fixed: z1, from: parity ? x0 + 1 : x0, to: parity ? x1 - 1 : x1, full0: x0, fullN: wr.w },
    { side: "W", axis: "z", fixed: x0, from: parity ? z0 : z0 + 1, to: parity ? z1 : z1 - 1, full0: z0, fullN: wr.d },
    { side: "E", axis: "z", fixed: x1, from: parity ? z0 : z0 + 1, to: parity ? z1 : z1 - 1, full0: z0, fullN: wr.d },
  ];
  for (const ln of lines) {
    const f = facade(ln.side);
    const cell = (c: number): [number, number] => (ln.axis === "x" ? [c, ln.fixed] : [ln.fixed, c]);
    // group the line into runs of one role
    const runs: { role: Role; cells: [number, number][] }[] = [];
    for (let c = ln.from; c <= ln.to; c++) {
      let role = roleAt(f, c - ln.full0, ln.fullN);
      if (role === "arch") {
        // arches come in fours; the remainder of the span is solid
        const k = c - ln.full0 - 1;
        const span = ln.fullN - 2;
        if (k >= Math.floor(span / 4) * 4) role = "white";
      }
      const last = runs[runs.length - 1];
      if (last && last.role === role) last.cells.push(cell(c));
      else runs.push({ role, cells: [cell(c)] });
    }
    const joints = new Set<number>();
    let pos = ln.from;
    for (const run of runs) {
      const n = run.cells.length;
      if (run.role === "white") {
        for (const j of ctx.fillRun(run.cells, ln.axis, layer, color, desc, state[ln.side] ?? new Set(), OUT[ln.side])) joints.add(j);
      } else if (run.role === "glass") {
        const pairs = Math.floor(n / 2);
        for (let i = 0; i < pairs; i++) {
          const [x, z] = run.cells[i * 2];
          if (ln.axis === "x") ctx.put("brick", 2, 1, x, z, layer, "trans", `${desc} glazing`);
          else ctx.put("brick", 1, 2, x, z, layer, "trans", `${desc} glazing`);
        }
        if (n % 2) {
          const [x, z] = run.cells[n - 1];
          ctx.oneByOne(x, z, layer, color, desc, OUT[ln.side]);
        }
      } else if (run.role === "grille") {
        const pairs = Math.floor(n / 2);
        for (let i = 0; i < pairs; i++) {
          const [x, z] = run.cells[i * 2];
          if (ln.axis === "x") ctx.put("profile", 2, 1, x, z, layer, color, `${desc} grille`, OUT[ln.side]);
          else ctx.put("profile", 1, 2, x, z, layer, color, `${desc} grille`, OUT[ln.side]);
        }
        if (n % 2) {
          const [x, z] = run.cells[n - 1];
          ctx.oneByOne(x, z, layer, color, desc, OUT[ln.side]);
        }
      } else if (run.role === "arch") {
        for (let i = 0; i + 4 <= n; i += 4) {
          const [x, z] = run.cells[i];
          if (ln.axis === "x") ctx.put("arch", 4, 1, x, z, layer, color, `${desc} arch`);
          else ctx.put("arch", 1, 4, x, z, layer, color, `${desc} arch`);
        }
      }
      pos += n;
      if (pos <= ln.to) joints.add(pos);
    }
    state[ln.side] = joints;
  }
}

/**
 * Fill a 2-wide strip with 2×L bricks (L = 6, 4, 3, 2), offsetting joints
 * course by course. Returns false if the stock cannot do it.
 */
function fillWide(ctx: Ctx, r: Rect, along: "x" | "z", layer: number, color: ColorKey, desc: string, parity: number): boolean {
  const len = along === "x" ? r.w : r.d;
  const lens = [6, 4, 3, 2].filter((L) => ctx.left(partNumberFor(partDef("brick", 2, L)!, "white")!) > 0);
  // offset the first joint on odd courses so joints do not stack
  const plan: number[] = [];
  let at = 0;
  if (parity % 2 && len >= 5 && lens.includes(3)) { plan.push(3); at = 3; }
  while (at < len) {
    const L = lens.find((l) => at + l <= len && (len - at - l === 0 || len - at - l >= 2));
    if (!L) return false;
    plan.push(L);
    at += L;
  }
  const need = new Map<number, number>();
  for (const L of plan) need.set(L, (need.get(L) ?? 0) + 1);
  for (const [L, q] of need) if (q > ctx.left(partNumberFor(partDef("brick", 2, L)!, "white")!)) return false;
  at = 0;
  for (const L of plan) {
    if (along === "x") ctx.put("brick", L, 2, r.x + at, r.z, layer, color, desc);
    else ctx.put("brick", 2, L, r.x, r.z + at, layer, color, desc);
    at += L;
  }
  return true;
}

/** Ring of columns around a rect at a spacing, plus all four corners. */
function columnRing(r: Rect, spacing: number): [number, number][] {
  const out = new Set<string>();
  const add = (x: number, z: number) => out.add(k2(x, z));
  const x1 = r.x + r.w - 1, z1 = r.z + r.d - 1;
  for (let x = r.x; x <= x1; x += spacing) { add(x, r.z); add(x, z1); }
  for (let z = r.z; z <= z1; z += spacing) { add(r.x, z); add(x1, z); }
  add(x1, r.z); add(x1, z1); add(r.x, z1);
  return [...out].map((k) => k.split(",").map(Number) as [number, number]);
}

/**
 * Tile a band (floor slab, deck, roof) and make sure every plate stands on
 * something: plates over hollow interiors get a hidden 1×1 support column
 * placed before them (in the current step).
 */
function band(ctx: Ctx, area: Rect, layer: number, color: ColorKey, desc: string, supportFrom: number | null, stepTitle: string) {
  const { plan, missing, blocked } = ctx.planTiles(rectCells(area), layer, "plate", color);
  if (blocked.length) {
    const other = ctx.occ.get(k3(blocked[0][0], blocked[0][1], layer));
    ctx.errors.push(`${desc}: ${blocked.length} cells at layer ${layer} are already taken${other ? ` by ${other.info.description}` : ""} (first at ${blocked[0][0]},${blocked[0][1]})`);
  }
  if (missing.length) ctx.errors.push(`${desc}: ran out of plates for ${missing.length} cells (the set's plates are used up)`);
  for (const c of plan.filter((c) => !c.supported)) {
    let fixed = false;
    if (supportFrom !== null) {
      const cells: [number, number][] = [];
      for (let i = 0; i < c.w; i++) for (let j = 0; j < c.d; j++) cells.push([c.x + i, c.z + j]);
      cells.sort((a, b) => Math.abs(a[0] - (c.x + c.w / 2)) + Math.abs(a[1] - (c.z + c.d / 2)) - (Math.abs(b[0] - (c.x + c.w / 2)) + Math.abs(b[1] - (c.z + c.d / 2))));
      for (const [x, z] of cells) {
        if (ctx.column(x, z, supportFrom, layer, color, `${desc} support`)) { fixed = true; break; }
      }
    }
    if (!fixed) {
      const small = ["3023w", "3022", "3020", "3021", "3710", "3623"].filter((pn) => ctx.left(pn) <= 0).length;
      ctx.errors.push(`${desc}: a ${c.w}×${c.d} plate at ${c.x},${c.z} (layer ${layer}) has nothing under it to grip` +
        (small >= 3 ? "; the set's small plates are used up, so use fewer levels, smaller balconies or fewer bands elsewhere" : "; reach it from a wall or column below"));
    }
  }
  ctx.step(stepTitle);
  ctx.commit(plan, layer, color, desc);
}

// ─── roofs ───

function roof(ctx: Ctx, el: Extract<Element, { type: "block" }>, wr: Rect, top: Rect, layer: number) {
  const r: Roof = el.roof ?? { type: "flat" };
  const color = tintColor(el.bandTint ?? el.tint);
  const name = el.name;
  if (r.type === "flat") {
    if (r.finish === "tiles") {
      ctx.step(`${name}: tiled roof`);
      const { plan, missing } = ctx.planTiles(rectCells(top), layer, "tile", color);
      ctx.commit(plan, layer, color, `${name} roof tiles`);
      if (missing.length) ctx.errors.push(`${name}: not enough tiles for the tiled roof (${missing.length} cells short); use finish "studs" or a smaller roof`);
    }
    return;
  }
  if (r.type === "glass") {
    ctx.step(`${name}: glass roof`);
    const { plan, missing } = ctx.planTiles(rectCells(top), layer, "plate", "trans");
    ctx.commit(plan, layer, "trans", `${name} glass roof`);
    if (missing.length) ctx.errors.push(`${name}: not enough trans-clear plates for the glass roof (${missing.length} cells short)`);
    return;
  }
  if (r.type === "vaults") {
    const axis = r.axis ?? "ns";
    ctx.step(`${name}: barrel vaults`);
    if (axis === "ns") {
      // arches seen from the front: pairs of curved slopes facing W and E
      const count = r.count ?? Math.floor(wr.w / 6);
      const x0 = r.at ?? wr.x + Math.floor((wr.w - 6 * count) / 2);
      const rows = r.rows ?? wr.d;
      if (count < 1) return void ctx.errors.push(`${name}: a vault is 6 studs wide; this roof is ${wr.w}`);
      if (x0 < wr.x || x0 + 6 * count > wr.x + wr.w) return void ctx.errors.push(`${name}: ${count} vaults from x=${x0} overrun the walls (${wr.x}..${wr.x + wr.w - 1})`);
      for (let v = 0; v < count; v++)
        for (let z = wr.z; z < wr.z + Math.min(rows, wr.d); z++) {
          ctx.put("curvedSlope", 3, 1, x0 + 6 * v, z, layer, color, `${name} vault`, "W");
          ctx.put("curvedSlope", 3, 1, x0 + 6 * v + 3, z, layer, color, `${name} vault`, "E");
        }
    } else {
      const count = r.count ?? Math.floor(wr.d / 6);
      const z0 = r.at ?? wr.z + Math.floor((wr.d - 6 * count) / 2);
      const rows = r.rows ?? wr.w;
      if (count < 1) return void ctx.errors.push(`${name}: a vault is 6 studs deep; this roof is ${wr.d}`);
      if (z0 < wr.z || z0 + 6 * count > wr.z + wr.d) return void ctx.errors.push(`${name}: ${count} vaults from z=${z0} overrun the walls`);
      for (let v = 0; v < count; v++)
        for (let x = wr.x; x < wr.x + Math.min(rows, wr.w); x++) {
          ctx.put("curvedSlope", 1, 3, x, z0 + 6 * v, layer, color, `${name} vault`, "N");
          ctx.put("curvedSlope", 1, 3, x, z0 + 6 * v + 3, layer, color, `${name} vault`, "S");
        }
    }
    return;
  }
  if (r.type === "rounded") {
    if (wr.d !== 4) return void ctx.errors.push(`${name}: a rounded roof needs walls 4 studs deep (these are ${wr.d})`);
    ctx.step(`${name}: rounded roof`);
    for (let x = wr.x; x < wr.x + wr.w; x++) {
      ctx.put("curvedTop", 1, 2, x, wr.z, layer, color, `${name} rounded eave`, "N");
      ctx.put("curvedTop", 1, 2, x, wr.z + 2, layer, color, `${name} rounded eave`, "S");
    }
    return;
  }
  if (r.type === "pitched") {
    const ridge = r.ridge ?? (wr.w >= wr.d ? "ew" : "ns");
    const depth = ridge === "ew" ? wr.d : wr.w;
    const length = ridge === "ew" ? wr.w : wr.d;
    const fam: { kind: PartKind; D: number; widths: number[] } | null =
      depth === 4 || depth === 2 ? { kind: "slope45", D: 2, widths: [4, 2, 1] } : depth === 6 ? { kind: "slope33", D: 3, widths: [4, 2, 1] } : null;
    if (!fam) return void ctx.errors.push(`${name}: a pitched roof needs walls 2, 4 or 6 studs deep across the ridge (these are ${depth})`);
    ctx.step(`${name}: pitched roof`);
    const rows: Facing[] = depth === 2 ? [ridge === "ew" ? "S" : "E"] : ridge === "ew" ? ["N", "S"] : ["W", "E"];
    rows.forEach((facing, ri) => {
      let at = 0;
      while (at < length) {
        const W = fam.widths.find((wd) => at + wd <= length && ctx.left(partNumberFor(partDef(fam.kind, wd, fam.D)!, "white")!) > 0);
        if (!W) { ctx.errors.push(`${name}: ran out of ${fam.kind === "slope45" ? "45°" : "25°"} slopes for the roof`); return; }
        if (ridge === "ew") ctx.put(fam.kind, W, fam.D, wr.x + at, wr.z + ri * fam.D, layer, color, `${name} roof slope`, facing);
        else ctx.put(fam.kind, fam.D, W, wr.x + ri * fam.D, wr.z + at, layer, color, `${name} roof slope`, facing);
        at += W;
      }
    });
  }
}

// ─── elements ───

function compileBlock(ctx: Ctx, el: Extract<Element, { type: "block" }>) {
  const rect = el.rect;
  const sides = new Set<Side>(el.balconies === "all" ? SIDES : el.balconies ?? []);
  const wr: Rect = {
    x: rect.x + (sides.has("W") ? 1 : 0),
    z: rect.z + (sides.has("N") ? 1 : 0),
    w: rect.w - (sides.has("W") ? 1 : 0) - (sides.has("E") ? 1 : 0),
    d: rect.d - (sides.has("N") ? 1 : 0) - (sides.has("S") ? 1 : 0),
  };
  if (wr.w < 1 || wr.d < 1) return void ctx.errors.push(`${el.name}: balconies leave no room for walls`);
  const base = flatBase(ctx, wr, el.name);
  if (base === null) return;
  const color = tintColor(el.tint);
  const bandColor = tintColor(el.bandTint ?? el.tint);
  const bands = el.bands !== false;
  const levelH = bands ? 4 : 3;
  const state: WallState = { N: new Set(), S: new Set(), E: new Set(), W: new Set() };
  let topLayer = base;
  let lastBand: Rect = wr;
  for (let k = 0; k < el.levels; k++) {
    const L = base + k * levelH;
    ctx.step(el.levels > 1 ? `${el.name}: level ${k + 1} walls` : `${el.name}: walls`);
    if (k === 0 && el.pilotis) {
      for (const [x, z] of columnRing(wr, 3)) {
        if (!ctx.column(x, z, L, L + 3, color, `${el.name} pilotis`, true)) ctx.errors.push(`${el.name}: no room for a column at ${x},${z}`);
      }
    } else {
      const f = k === 0 && el.groundFacade ? el.groundFacade : el.facade;
      wallCourse(ctx, wr, L, k % 2, (s) => {
        const ff = facadeOf(f, s);
        if (ff === "arches" && k !== 0) return "solid";
        return ff;
      }, color, `${el.name} wall`, state);
    }
    topLayer = L + 3;
    if (bands) {
      let bs = sides;
      if (el.serrate && sides.size) {
        const keep = k % 2 === 0 ? ["N", "S"] : ["E", "W"];
        bs = new Set([...sides].filter((s) => keep.includes(s)));
      }
      const area: Rect = {
        x: wr.x - (bs.has("W") ? 1 : 0),
        z: wr.z - (bs.has("N") ? 1 : 0),
        w: wr.w + (bs.has("W") ? 1 : 0) + (bs.has("E") ? 1 : 0),
        d: wr.d + (bs.has("N") ? 1 : 0) + (bs.has("S") ? 1 : 0),
      };
      band(ctx, area, L + 3, bandColor, `${el.name} floor band`, L, el.levels > 1 ? `${el.name}: level ${k + 1} floor band` : `${el.name}: roof slab`);
      topLayer = L + 4;
      lastBand = area;
    }
  }
  if (!bands) {
    // without bands the roof is the only tie: tile it over the walls
    band(ctx, wr, topLayer, bandColor, `${el.name} roof slab`, null, `${el.name}: roof slab`);
    topLayer += 1;
    lastBand = wr;
  }
  roof(ctx, el, wr, lastBand, topLayer);
}

function compilePodium(ctx: Ctx, el: Extract<Element, { type: "podium" }>) {
  const r = el.rect;
  const base = flatBase(ctx, r, el.name);
  if (base === null) return;
  const n = el.levels ?? 1;
  const color = tintColor(el.tint);
  const deckColor = tintColor(el.deckTint ?? el.tint);
  const style = el.style ?? "colonnade";
  const deckLayer = base + 3 * n;
  ctx.step(`${el.name}: ${style === "colonnade" ? "columns" : "walls"}`);
  if (style === "colonnade") {
    for (const [x, z] of columnRing(r, el.spacing ?? 3)) {
      if (!ctx.column(x, z, base, deckLayer, color, `${el.name} column`, true)) ctx.errors.push(`${el.name}: no room for a column at ${x},${z}`);
    }
  } else {
    const state: WallState = { N: new Set(), S: new Set(), E: new Set(), W: new Set() };
    for (let k = 0; k < n; k++) {
      if (k > 0) ctx.step(`${el.name}: walls, course ${k + 1}`);
      wallCourse(ctx, r, base + 3 * k, k % 2, (s) => {
        if (style === "arcade" && k === 0) return s === (el.arcadeSide ?? "S") ? "arches" : "open";
        return "solid";
      }, color, `${el.name} wall`, state);
    }
  }
  band(ctx, r, deckLayer, deckColor, `${el.name} deck`, base, `${el.name}: deck`);
}

function compileSurface(ctx: Ctx, el: Extract<Element, { type: "surface" }>) {
  const color: ColorKey = el.material === "water" ? "trans" : el.material === "lawn" ? "green" : "dark";
  el.rects.forEach((r, i) => {
    const cells = rectCells(r);
    const blocked = cells.filter(([x, z]) => ctx.heightAt(x, z) !== 1);
    if (blocked.length) {
      const [x, z] = blocked[0];
      ctx.errors.push(`${el.name}: a surface must lie on the bare site, but ${x},${z} is already built on (layer ${ctx.heightAt(x, z)})`);
      return;
    }
    ctx.step(el.rects.length > 1 ? `${el.name} (${i + 1} of ${el.rects.length})` : el.name);
    if (el.material === "paving") {
      const { plan, missing } = ctx.planTiles(cells, 1, "tile", color);
      ctx.commit(plan, 1, color, el.name);
      if (missing.length) {
        const rest = ctx.planTiles(missing, 1, "plate", color);
        ctx.commit(rest.plan, 1, color, el.name);
        ctx.warnings.push(`${el.name}: tiles ran out, so ${missing.length} cells are paved with plates (studs show)`);
        if (rest.missing.length) ctx.errors.push(`${el.name}: ${rest.missing.length} cells could not be paved (no plates left)`);
      }
    } else {
      const { plan, missing } = ctx.planTiles(cells, 1, "plate", color);
      ctx.commit(plan, 1, color, el.name);
      if (missing.length)
        ctx.errors.push(`${el.name}: ${missing.length} cells short of ${el.material === "water" ? "trans-clear plates (the set has 40 1×1 and 50 1×2)" : "plates"}`);
    }
  });
}

function compileGlasshouse(ctx: Ctx, el: Extract<Element, { type: "glasshouse" }>) {
  const r = el.rect;
  if (r.w < 3 || r.d < 3) return void ctx.errors.push(`${el.name}: a glasshouse needs at least 3×3 studs`);
  const base = flatBase(ctx, r, el.name);
  if (base === null) return;
  const tiers = el.tiers ?? 1;
  const x0 = r.x, x1 = r.x + r.w - 1, z0 = r.z, z1 = r.z + r.d - 1;
  for (let t = 0; t < tiers; t++) {
    const L = base + 6 * t;
    ctx.step(tiers > 1 ? `${el.name}: glass walls, tier ${t + 1}` : `${el.name}: glass walls`);
    for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]] as const) {
      ctx.oneByOne(x, z, L, "white", `${el.name} corner post`);
      ctx.oneByOne(x, z, L + 3, "white", `${el.name} corner post`);
    }
    const side = (cells: [number, number][], axis: "x" | "z", facing: Facing) => {
      for (let i = 0; i + 1 < cells.length; i += 2) {
        const [x, z] = cells[i];
        ctx.put("glassPanel", axis === "x" ? 2 : 1, axis === "x" ? 1 : 2, x, z, L, "trans", `${el.name} glazing`, facing);
      }
      if (cells.length % 2) {
        const [x, z] = cells[cells.length - 1];
        ctx.oneByOne(x, z, L, "white", `${el.name} mullion`);
        ctx.oneByOne(x, z, L + 3, "white", `${el.name} mullion`);
      }
    };
    const row = (z: number) => Array.from({ length: r.w - 2 }, (_, i) => [x0 + 1 + i, z] as [number, number]);
    const col = (x: number) => Array.from({ length: r.d - 2 }, (_, i) => [x, z0 + 1 + i] as [number, number]);
    side(row(z0), "x", "N");
    side(row(z1), "x", "S");
    side(col(x0), "z", "W");
    side(col(x1), "z", "E");
  }
  band(ctx, r, base + 6 * tiers, "white", `${el.name} roof`, null, `${el.name}: roof`);
}

function compileTrees(ctx: Ctx, el: Extract<Element, { type: "trees" }>) {
  const style = el.style ?? "round";
  ctx.step(el.name);
  for (const [x, z] of el.at) {
    const h = ctx.heightAt(x, z);
    if (!ctx.studAt(x, z, h) || h === 0) { ctx.errors.push(`${el.name}: no stud to plant on at ${x},${z}`); continue; }
    if (style === "shrub") { ctx.put("roundPlate", 1, 1, x, z, h, "green", `${el.name}`); continue; }
    const trunk = ctx.left("3062b") > 0 ? ctx.put("roundBrick", 1, 1, x, z, h, "dark", `${el.name} trunk`) : ctx.oneByOne(x, z, h, "dark", `${el.name} trunk`);
    if (!trunk) continue;
    if (style === "round") ctx.put("roundPlate", 2, 2, x, z, h + 3, "green", `${el.name} crown`);
    else {
      ctx.put("roundPlate", 1, 1, x, z, h + 3, "green", `${el.name} crown`);
      ctx.put("roundPlate", 1, 1, x, z, h + 4, "green", `${el.name} crown`);
    }
  }
}

function compileWalkway(ctx: Ctx, el: Extract<Element, { type: "walkway" }>) {
  const r = el.rect;
  const deck = 1 + 3 * el.levels;
  const color = tintColor(el.tint);
  const alongX = r.w >= r.d;
  const len = alongX ? r.w : r.d;
  const spacing = el.spacing ?? 4;
  ctx.step(`${el.name}: piers`);
  const at: number[] = [];
  for (let i = 0; i < len; i += spacing) at.push(i);
  if (at[at.length - 1] !== len - 1) at.push(len - 1);
  for (const i of at) {
    const x = alongX ? r.x + i : r.x + Math.floor((r.w - 1) / 2);
    const z = alongX ? r.z + Math.floor((r.d - 1) / 2) : r.z + i;
    const h = ctx.heightAt(x, z);
    if (h === deck) continue;
    if (h > deck || (deck - h) % 3 !== 0 || !ctx.column(x, z, h, deck, color, `${el.name} pier`))
      ctx.errors.push(`${el.name}: cannot stand a pier at ${x},${z} (ground at layer ${h}, deck at ${deck}; the gap must be whole bricks)`);
  }
  band(ctx, r, deck, color, `${el.name} deck`, null, `${el.name}: deck`);
}

function compileParts(ctx: Ctx, el: Extract<Element, { type: "parts" }>) {
  ctx.step(el.name);
  el.items.forEach((it, i) => {
    const kind = it.kind as PartKind;
    const def = partDef(kind, it.w, it.d);
    if (!def) return void ctx.errors.push(`${el.name} item ${i}: there is no ${it.kind} ${it.w}×${it.d}`);
    let layer = it.layer;
    if (layer === undefined) {
      const probe = makePlacement(kind, it.w, it.d, it.x, it.z, 0, "white", "probe", (it.facing ?? "S") as Facing);
      layer = Math.max(...footprintCells(probe).map(([x, z]) => ctx.heightAt(x, z)));
    }
    ctx.put(kind, it.w, it.d, it.x, it.z, layer, (it.color ?? "white") as ColorKey, it.desc ?? el.name, (it.facing ?? "S") as Facing);
  });
}

// ─── finishing: smooth tiles over exposed studs ───

/**
 * Official sets tile their ground and decks. Tiles go on last, so they never
 * block a later element; they also tie the plate joints beneath them. Only
 * as many cells are tiled as the set's tiles allow; the rest stay studded.
 */
function finishing(ctx: Ctx, spec: DesignSpec, phases: CompiledPhase[]) {
  const targets: { name: string; cells: [number, number][] }[] = [];
  for (const el of spec.elements) {
    if (el.type !== "podium" || el.finish !== "tiles") continue;
    const deck = ctx.pieces.filter((p) => p.info.description === `${el.name} deck`);
    const cells: [number, number][] = [];
    for (const p of deck) for (const [x, z] of footprintCells(p)) {
      const t = ctx.top.get(k2(x, z));
      if (t && t.p === p && t.stud) cells.push([x, z]);
    }
    targets.push({ name: `${el.name} deck`, cells });
  }
  if (spec.site.finish === "tiles") {
    const cells: [number, number][] = [];
    for (let z = 0; z < spec.site.d; z++)
      for (let x = 0; x < spec.site.w; x++) if (ctx.heightAt(x, z) === 1) cells.push([x, z]);
    targets.push({ name: "Site", cells });
  }
  if (!targets.length) return;
  const id = `${spec.id}-finish`;
  phases.push({ id, elementId: "finish", type: "parts", name: "Finishing", concept: "Smooth surfaces",
    about: "Official LEGO Architecture sets hide most studs on their ground and decks; tiles make the model read as architecture rather than toy." });
  ctx.beginPhase(id, ["Slide each tile on squarely; a tile seated half a stud off will lift its neighbours."]);
  for (const t of targets) {
    if (!t.cells.length) continue;
    const layer = ctx.heightAt(t.cells[0][0], t.cells[0][1]);
    const same = t.cells.filter(([x, z]) => ctx.heightAt(x, z) === layer);
    ctx.step(`Tile the ${t.name.toLowerCase()}`);
    const { plan, missing } = ctx.planTiles(same, layer, "tile", t.name === "Site" ? "white" : "white");
    ctx.commit(plan, layer, "white", `${t.name} finish`);
    if (missing.length) ctx.warnings.push(`${t.name}: tiles ran out, so ${missing.length} of ${same.length} cells keep their studs`);
  }
}

// ─── connectivity: tie loose site plates ───

function toBuild(ctx: Ctx): { build: BuildPlacements; meta: BuildMeta; order: string[] } {
  const build: BuildPlacements = {};
  const meta: BuildMeta = {};
  const order: string[] = [];
  for (const s of ctx.steps) {
    if (!s.pieces.length) continue;
    if (!build[s.phase]) { build[s.phase] = []; meta[s.phase] = []; order.push(s.phase); }
    // big steps split into chunks of at most 12, lowest layers first
    const sorted = [...s.pieces].sort((a, b) => a.layer - b.layer || a.z - b.z || a.x - b.x);
    const chunks = sorted.length > 14 ? Math.ceil(sorted.length / 12) : 1;
    const size = Math.ceil(sorted.length / chunks);
    for (let c = 0; c < chunks; c++) {
      build[s.phase].push(sorted.slice(c * size, (c + 1) * size));
      meta[s.phase].push({ title: chunks > 1 ? `${s.title} (${c + 1} of ${chunks})` : s.title, tip: s.tip });
    }
  }
  return { build, meta, order };
}

function tieSite(ctx: Ctx, tieStep: StepRec) {
  for (let round = 0; round < 40; round++) {
    const { build } = toBuild(ctx);
    const g = connectionGraph(build);
    const comps = components(g);
    if (comps.length <= 1) return;
    const compOf = new Map<Placement, number>();
    comps.forEach((c, i) => c.forEach((idx) => compOf.set(g.items[idx].p, i)));
    let tied = false;
    outer: for (let z = 0; z < ctx.spec.site.d; z++)
      for (let x = 0; x < ctx.spec.site.w; x++) {
        const a = ctx.occ.get(k3(x, z, 0));
        if (!a) continue;
        for (const [dx, dz] of [[1, 0], [0, 1]] as const) {
          const b = ctx.occ.get(k3(x + dx, z + dz, 0));
          if (!b || compOf.get(a) === compOf.get(b)) continue;
          // free at layer 1 is enough: ties go in before anything else, so a
          // deck or overhang built later above them does not block them
          if (ctx.occ.has(k3(x, z, 1)) || ctx.occ.has(k3(x + dx, z + dz, 1))) continue;
          ctx.cur = tieStep;
          ctx.put("tile", dx ? 2 : 1, dz ? 2 : 1, x, z, 1, "white", "Seam tie");
          tied = true;
          break outer;
        }
      }
    if (!tied) return;
  }
}

// ─── entry point ───

export function compileDesign(spec: DesignSpec): Compiled {
  const empty = (errors: string[]): Compiled => ({
    ok: false, errors, warnings: [], build: {}, meta: {}, phases: [], phaseOrder: [],
    stats: { pieces: 0, steps: 0, heightBricks: 0, footprint: [0, 0], shortages: [], usage: [] },
  });
  const specErrors = checkSpec(spec);
  if (specErrors.length) return empty(specErrors);

  const ctx = new Ctx(spec);
  const phases: CompiledPhase[] = [];
  const sitePhase = `${spec.id}-site`;
  phases.push({ id: sitePhase, elementId: "site", type: "site", name: "The site", concept: "A raft for everything",
    about: "Every LEGO Architecture model starts on one rigid base. These plates are the ground; joints between them are tied by what goes on top." });
  ctx.beginPhase(sitePhase, ["Press every plate fully home; a base that rocks will twist everything built on it."]);
  ctx.step("Site plates");
  const { plan, missing } = ctx.planTiles(rectCells({ x: 0, z: 0, w: spec.site.w, d: spec.site.d }), 0, "plate", "white");
  if (missing.length) ctx.errors.push(`site: not enough plates to cover the ${spec.site.w}×${spec.site.d} site (${missing.length} cells short); make the site smaller`);
  ctx.commit(plan, 0, "white", "Site plate");
  ctx.step("Seam ties", "Small tiles bridge joints that nothing else covers, so the base lifts as one piece.");
  const tieStep = ctx.cur!;

  for (const el of spec.elements) {
    const id = `${spec.id}-${el.id}`;
    phases.push({ id, elementId: el.id, type: el.type, name: el.name, concept: el.concept, about: el.about });
    ctx.beginPhase(id, el.facts ?? []);
    switch (el.type) {
      case "surface": compileSurface(ctx, el); break;
      case "podium": compilePodium(ctx, el); break;
      case "block": compileBlock(ctx, el); break;
      case "glasshouse": compileGlasshouse(ctx, el); break;
      case "trees": compileTrees(ctx, el); break;
      case "walkway": compileWalkway(ctx, el); break;
      case "parts": compileParts(ctx, el); break;
    }
  }
  finishing(ctx, spec, phases);
  tieSite(ctx, tieStep);

  const { build, meta, order } = toBuild(ctx);
  // identical messages (one per level, say) are grouped with a count
  const counts = new Map<string, number>();
  for (const e of ctx.errors) counts.set(e, (counts.get(e) ?? 0) + 1);
  const errors = [...counts].map(([e, n]) => (n > 1 ? `${e} (×${n})` : e));
  const validation = validateBuild(build);
  // summarise the validator: first few of each kind
  const byKind = new Map<string, string[]>();
  for (const v of validation) {
    const kind = v.split(/[ :(]/)[0];
    if (!byKind.has(kind)) byKind.set(kind, []);
    byKind.get(kind)!.push(v);
  }
  for (const [kind, list] of byKind) {
    errors.push(...list.slice(0, 4).map((v) => `validator: ${v}`));
    if (list.length > 4) errors.push(`validator: … and ${list.length - 4} more ${kind}`);
  }

  const usage: PartUsage[] = [...ctx.used].map(([pn, used]) => ({ part: pn, name: ctx.names.get(pn) ?? pn, used, stock: ctx.stock.get(pn) ?? 0 }))
    .sort((a, b) => b.used - a.used);
  const shortages = usage.filter((u) => u.used > u.stock);
  for (const s of shortages) errors.push(`stock: needs ${s.used} × ${s.name} (${s.part}); the set has ${s.stock}`);

  let maxL = 0;
  for (const p of ctx.pieces) maxL = Math.max(maxL, p.layer + p.h);
  const phaseList = phases.filter((p) => build[p.id]);
  return {
    ok: errors.length === 0,
    errors,
    warnings: ctx.warnings,
    build,
    meta,
    phases: phaseList,
    phaseOrder: order,
    stats: {
      pieces: ctx.pieces.length,
      steps: Object.values(build).reduce((s, st) => s + st.length, 0),
      heightBricks: Math.round((maxL / 3) * 10) / 10,
      footprint: [spec.site.w, spec.site.d],
      shortages,
      usage,
    },
  };
}

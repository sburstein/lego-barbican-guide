// Physical validator. A build passes only if a person could actually build
// it from the steps as written, with real parts:
//
//   PARTS      every placement is a real 21050 part, in a colour it exists
//              in, on the integer grid, turned a way the real part can turn
//   SPACE      no two parts share any cell of space
//   SUPPORT    every part above the table has a stud under at least one of
//              the cells its underside can actually grip (an arch grips only
//              with its legs, an inverted slope only with its back row)
//   SNOT       side-clipped parts hang from a real side stud facing their
//              way, into clear air, one part per stud
//   ONE PIECE  the finished model is a single connected object: lift it by
//              any corner and nothing stays behind
//   ORDER      walking the steps in order, each part's support already
//              exists and nothing built earlier sits over its column, so it
//              can be pressed straight down
//
// analyzeBuild() adds softer measurements (weak single-stud joints, bounds)
// used by the quality gate.

import {
  bottomCells,
  defOf,
  footprintCells,
  orientationOk,
  sideStuds,
  studCells,
  FACE_DIR,
  type BuildPlacements,
  type Placement,
} from "./model.ts";
import { partNumberFor } from "./parts.ts";

type Item = { p: Placement; where: string; order: number; idx: number };

function flatten(build: BuildPlacements): Item[] {
  const items: Item[] = [];
  let order = 0;
  for (const [pid, steps] of Object.entries(build)) {
    steps.forEach((step, si) => {
      step.forEach((p, pi) => {
        items.push({
          p,
          where: `${pid} step ${si} piece ${pi} (${p.info.name} @ ${p.x},${p.z},L${p.layer})`,
          order,
          idx: items.length,
        });
      });
      order++;
    });
  }
  return items;
}

const k3 = (x: number, z: number, l: number) => `${x},${z},${l}`;

/** Stud-to-underside connections between placed parts. */
export type Graph = {
  items: Item[];
  /** For each item index: neighbour index -> number of stud connections. */
  adj: Map<number, number>[];
  /** For each item: indices of the parts it stands on (or its SNOT host). */
  supporters: number[][];
};

export function connectionGraph(build: BuildPlacements): Graph {
  const items = flatten(build);
  const adj = items.map(() => new Map<number, number>());
  const supporters: number[][] = items.map(() => []);
  const studAt = new Map<string, number[]>();
  for (const it of items) {
    if (it.p.attach) continue;
    for (const [x, z] of studCells(it.p)) {
      const key = k3(x, z, it.p.layer + it.p.h);
      const arr = studAt.get(key);
      if (arr) arr.push(it.idx);
      else studAt.set(key, [it.idx]);
    }
  }
  const link = (a: number, b: number) => {
    adj[a].set(b, (adj[a].get(b) ?? 0) + 1);
    adj[b].set(a, (adj[b].get(a) ?? 0) + 1);
  };
  for (const it of items) {
    if (it.p.attach || it.p.layer === 0) continue;
    for (const [x, z] of bottomCells(it.p)) {
      for (const s of studAt.get(k3(x, z, it.p.layer)) ?? []) {
        if (s === it.idx) continue;
        link(s, it.idx);
        if (!supporters[it.idx].includes(s)) supporters[it.idx].push(s);
      }
    }
  }
  // SNOT attachments connect to the side-stud part filling their cell
  const hostAt = new Map<string, number>();
  for (const it of items) {
    if (it.p.attach || !defOf(it.p)?.sideStuds.length) continue;
    for (const [x, z] of footprintCells(it.p))
      for (let l = it.p.layer; l < it.p.layer + it.p.h; l++) hostAt.set(k3(x, z, l), it.idx);
  }
  for (const it of items) {
    if (!it.p.attach) continue;
    const host = hostAt.get(k3(it.p.x, it.p.z, it.p.layer));
    if (host !== undefined) {
      link(host, it.idx);
      supporters[it.idx].push(host);
    }
  }
  return { items, adj, supporters };
}

/** Connected components of the stud graph, largest first (item indices). */
export function components(g: Graph): number[][] {
  const seen = new Array(g.items.length).fill(false);
  const comps: number[][] = [];
  for (let s = 0; s < g.items.length; s++) {
    if (seen[s]) continue;
    const comp: number[] = [];
    const stack = [s];
    seen[s] = true;
    while (stack.length) {
      const u = stack.pop()!;
      comp.push(u);
      for (const v of g.adj[u].keys()) {
        if (!seen[v]) {
          seen[v] = true;
          stack.push(v);
        }
      }
    }
    comps.push(comp);
  }
  return comps.sort((a, b) => b.length - a.length);
}

export function validateBuild(build: BuildPlacements): string[] {
  const errors: string[] = [];
  const g = connectionGraph(build);
  const { items } = g;

  // PARTS
  for (const { p, where } of items) {
    const def = defOf(p);
    if (!def) {
      errors.push(`NO SUCH PART: ${p.kind} ${p.w}×${p.d}; ${where}`);
      continue;
    }
    if (!partNumberFor(def, p.color))
      errors.push(`NO ${p.color.toUpperCase()} VERSION of ${def.name}; ${where}`);
    if (![p.w, p.d, p.x, p.z, p.layer].every(Number.isInteger))
      errors.push(`OFF GRID (non-integer): ${where}`);
    if (p.layer < 0) errors.push(`BELOW TABLE: ${where}`);
    if (!p.attach && !orientationOk(p))
      errors.push(
        `MISORIENTED: ${def.name} placed ${p.w}×${p.d} facing ${p.facing}; the real part ` +
          `is ${def.D} deep along its facing; ${where}`
      );
  }

  // SPACE
  const occ = new Map<string, string>();
  for (const { p, where } of items) {
    if (p.attach) continue;
    for (const [x, z] of footprintCells(p)) {
      for (let l = p.layer; l < p.layer + p.h; l++) {
        const key = k3(x, z, l);
        const prev = occ.get(key);
        if (prev) errors.push(`COLLISION at cell (${x},${z}) layer ${l}: ${where} overlaps ${prev}`);
        else occ.set(key, where);
      }
    }
  }

  // SUPPORT
  for (const { p, where, idx } of items) {
    if (p.attach || p.layer === 0) continue;
    if (!g.supporters[idx].length)
      errors.push(`FLOATING (no studs under the cells it can grip): ${where}`);
  }

  // SNOT
  const usedStud = new Map<string, string>();
  for (const { p, where, idx } of items) {
    if (!p.attach) continue;
    if (p.w !== 1 || p.d !== 1) errors.push(`ATTACHMENT TOO LARGE (must be 1×1): ${where}`);
    const hostIdx = g.supporters[idx][0];
    const host = hostIdx === undefined ? undefined : items[hostIdx].p;
    if (!host) {
      errors.push(`NO SIDE-STUD HOST at (${p.x},${p.z}) layer ${p.layer}: ${where}`);
      continue;
    }
    const [fx, fz] = FACE_DIR[p.facing];
    const hasStud = sideStuds(host).some(
      (s) => s.cell[0] === p.x && s.cell[1] === p.z && s.dir[0] === fx && s.dir[1] === fz
    );
    if (!hasStud)
      errors.push(`HOST HAS NO STUD FACING ${p.facing} (${host.info.name} faces ${host.facing}): ${where}`);
    // Side studs sit 10 LDU below the host's top (LDraw 4070, 47905, 4733),
    // so for a brick-tall host the attachment is keyed to its middle plate.
    // Renderers rely on this to draw the part at the right height.
    if (host.h === 3 && p.layer !== host.layer + 1)
      errors.push(`SIDE STUD HEIGHT: attach at layer ${host.layer + 1} (the host's middle plate), not ${p.layer}: ${where}`);
    const studKey = `${hostIdx}:${p.x},${p.z}:${p.facing}`;
    const twin = usedStud.get(studKey);
    if (twin) errors.push(`TWO PARTS ON ONE SIDE STUD: ${where} and ${twin}`);
    else usedStud.set(studKey, where);
    // a 1×1 tile on its side is 2.5 plates tall, centred on the side stud,
    // so it covers the host's own face and hangs into the next cell there
    for (let l = host.layer; l < host.layer + Math.min(host.h, 3); l++) {
      const blocker = occ.get(k3(p.x + fx, p.z + fz, l));
      if (blocker) {
        errors.push(`ATTACHMENT BLOCKED by ${blocker}: ${where}`);
        break;
      }
    }
  }

  // ONE PIECE
  const comps = components(g);
  if (comps.length > 1) {
    const sizes = comps.map((c) => c.length);
    const loose = comps
      .slice(1, 4)
      .map((c) => items[c[0]].where)
      .join("; ");
    errors.push(
      `LOOSE PARTS: the model falls into ${comps.length} separate pieces when lifted ` +
        `(sizes ${sizes.slice(0, 8).join(", ")}). Smaller pieces include: ${loose}`
    );
  }

  // ORDER
  const placedCols = new Map<string, { lo: number; who: string }[]>();
  const byOrder = new Map<number, Item[]>();
  for (const it of items) {
    const arr = byOrder.get(it.order);
    if (arr) arr.push(it);
    else byOrder.set(it.order, [it]);
  }
  for (const order of [...byOrder.keys()].sort((a, b) => a - b)) {
    const step = byOrder.get(order)!;
    for (const { p, where, idx } of step) {
      if (p.attach) {
        const host = g.supporters[idx][0];
        if (host !== undefined && items[host].order > order)
          errors.push(`PLACED BEFORE ITS HOST: ${where} (host comes in a later step)`);
        continue;
      }
      const top = p.layer + p.h;
      for (const [x, z] of footprintCells(p)) {
        const blocker = placedCols.get(`${x},${z}`)?.find((seg) => seg.lo >= top);
        if (blocker) {
          errors.push(`NOT REACHABLE: ${where} slides in under ${blocker.who} built earlier (L${blocker.lo})`);
          break;
        }
      }
      if (p.layer > 0 && g.supporters[idx].length && g.supporters[idx].every((s) => items[s].order > order))
        errors.push(`PLACED BEFORE ITS SUPPORT: ${where} rests only on parts from later steps`);
    }
    for (const it of step) {
      if (it.p.attach) continue;
      for (const [x, z] of footprintCells(it.p)) {
        const key = `${x},${z}`;
        const col = placedCols.get(key) ?? [];
        col.push({ lo: it.p.layer, who: `${it.where.split(" (")[0]} ${it.p.info.name}` });
        placedCols.set(key, col);
      }
    }
  }

  return errors;
}

export type BuildAnalysis = {
  pieces: number;
  components: number;
  /** Parts held by a single stud while spanning 3+ cells: they wobble. */
  weakJoints: string[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number; maxLayer: number };
};

export function analyzeBuild(build: BuildPlacements): BuildAnalysis {
  const g = connectionGraph(build);
  const weak: string[] = [];
  const b = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity, maxLayer: 0 };
  for (const it of g.items) {
    const p = it.p;
    b.minX = Math.min(b.minX, p.x);
    b.maxX = Math.max(b.maxX, p.x + p.w);
    b.minZ = Math.min(b.minZ, p.z);
    b.maxZ = Math.max(b.maxZ, p.z + p.d);
    b.maxLayer = Math.max(b.maxLayer, p.layer + p.h);
    if (p.attach || p.layer === 0) continue;
    const studs = [...g.adj[it.idx].values()].reduce((a, n) => a + n, 0);
    if (studs === 1 && footprintCells(p).length >= 3)
      weak.push(`WEAK JOINT: ${it.where} is held by a single stud`);
  }
  return { pieces: g.items.length, components: components(g).length, weakJoints: weak, bounds: b };
}

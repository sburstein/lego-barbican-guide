// Guide text for compiled designs, in the same Build format the hand-built
// models use, so the app, manual and validator treat AI designs like any
// other build. Phase prose comes from the designer's spec (researched
// "about" and "facts"); step instructions and parts lists come from the
// placements, so they can never drift from the geometry.

import type { Build, Phase, Piece, Step } from "../builds.ts";
import type { Placement } from "../engine/model.ts";
import type { ApprovedDesign } from "../designs/types.ts";
import type { Compiled } from "./compile.ts";

const COLORS = ["#64748B", "#0EA5E9", "#A16207", "#7C3AED", "#DC2626", "#059669", "#D97706", "#2563EB", "#DB2777", "#0D9488"];
const ICONS: Record<string, string> = {
  site: "🏗️", surface: "💧", podium: "🏛️", block: "🏢", glasshouse: "🌿", trees: "🌳", walkway: "🌉", parts: "✨",
};
const GENERIC_TIPS = [
  "Press every piece fully home before moving on; small gaps low down grow as the model rises.",
  "Gather the parts for the whole step before placing any; it halves build time.",
  "Match the coral pieces in the 3D view; rotate it to check the hidden side.",
];

const SET_NAME = (p: Placement) => p.info.name;

function pieceList(step: Placement[]): Piece[] {
  const m = new Map<string, Piece>();
  for (const p of step) {
    const k = `${p.info.partNumber}|${SET_NAME(p)}`;
    const cur = m.get(k);
    if (cur) cur.qty++;
    else m.set(k, { name: SET_NAME(p), part: p.info.partNumber, qty: 1 });
  }
  return [...m.values()].sort((a, b) => b.qty - a.qty);
}

function where(step: Placement[], site: [number, number]): string {
  const mx = step.reduce((s, p) => s + p.x + p.w / 2, 0) / step.length / site[0];
  const mz = step.reduce((s, p) => s + p.z + p.d / 2, 0) / step.length / site[1];
  const ew = mx < 0.34 ? "west" : mx > 0.66 ? "east" : "";
  const ns = mz < 0.34 ? "rear" : mz > 0.66 ? "front" : "";
  if (!ew && !ns) return "in the middle of the site";
  if (ew && ns) return `at the ${ns} ${ew}`;
  return ew ? `on the ${ew} side` : `toward the ${ns}`;
}

function height(step: Placement[]): string {
  const lo = Math.min(...step.map((p) => p.layer));
  if (lo === 0) return "directly on the table";
  if (lo <= 2) return "on the base";
  const bricks = Math.round(lo / 3);
  return `about ${bricks} brick${bricks === 1 ? "" : "s"} up`;
}

function instruction(step: Placement[], site: [number, number]): string {
  const descs = new Map<string, number>();
  for (const p of step) {
    const k = `${p.info.name} (${p.info.description.toLowerCase()})`;
    descs.set(k, (descs.get(k) ?? 0) + 1);
  }
  const items = [...descs].map(([k, q]) => `${q}× ${k}`);
  const list = items.length <= 2 ? items.join(" and ") : `${items.slice(0, -1).join("; ")}; and ${items[items.length - 1]}`;
  return `Place ${list}; ${where(step, site)}, ${height(step)}. Match the coral pieces in the 3D view for exact positions.`;
}

function minutes(pieces: number): string {
  const lo = Math.max(5, Math.round(pieces / 4 / 5) * 5);
  return `${lo}-${lo + 10} min`;
}

export function designToBuild(d: ApprovedDesign, c: Compiled): Build {
  const site = c.stats.footprint;
  let generic = 0;
  const phases: Phase[] = c.phases.map((ph, i) => {
    const steps: Step[] = (c.build[ph.id] ?? []).map((st, si) => {
      const m = c.meta[ph.id]?.[si];
      return {
        title: m?.title ?? `Step ${si + 1}`,
        instruction: instruction(st, site),
        pieces: pieceList(st),
        tip: m?.tip ?? GENERIC_TIPS[generic++ % GENERIC_TIPS.length],
      };
    });
    const count = (c.build[ph.id] ?? []).reduce((s, st) => s + st.length, 0);
    return {
      id: ph.id,
      title: `Phase ${i + 1}: ${ph.name}`,
      concept: ph.concept ?? ph.name,
      color: COLORS[i % COLORS.length],
      icon: ICONS[ph.type] ?? "🧱",
      time: minutes(count),
      location: ph.about ?? `${ph.name}, part of ${d.subject}.`,
      steps,
    };
  });
  const pieces = c.stats.pieces;
  return {
    id: d.spec.id,
    title: d.spec.title,
    shortTitle: d.spec.title.split(/[:(,]/)[0].trim().slice(0, 28),
    subtitle: d.spec.subtitle,
    description: d.spec.description,
    difficulty: pieces < 250 ? 1 : pieces < 600 ? 2 : 3,
    estimatedTime: `${Math.max(1, Math.round(pieces / 150))}-${Math.max(2, Math.round(pieces / 100))} hours`,
    pieceCount: pieces,
    concept: d.spec.concept,
    heroPhoto: "",
    phases,
    photos: {},
    phasePhotos: {},
    ai: {
      model: d.model,
      effort: d.effort,
      quality: d.review.quality,
      fidelity: d.review.fidelity,
      guess: d.review.guess,
      verdict: d.review.verdict,
      approvedAt: d.approvedAt,
      image: d.image,
    },
  };
}

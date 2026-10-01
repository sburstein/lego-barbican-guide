// Design spec: a building described in architectural terms, which the
// compiler (compile.ts) turns into validated LEGO placements. The AI designer
// writes these; it never places individual bricks except through `parts`.
//
// Coordinates: studs. x runs east, z runs south (the front, toward the
// viewer in the standard render). The site raft sits at layer 0; ground
// level for everything else is layer 1. A "level" is one brick course
// (3 plates) plus, by default, a one-plate floor band.

export type Rect = { x: number; z: number; w: number; d: number };
export type Side = "N" | "S" | "E" | "W";
export type Tint = "white" | "dark" | "green";

/** How a wall course is filled. */
export type Facade =
  | "solid" // white bricks in running bond
  | "glass" // corner, then 2-stud trans glass between 1-stud piers
  | "ribbon" // continuous trans glass between solid corners
  | "open" // piers every other stud with voids between (loggias, undercrofts)
  | "grille" // ribbed grille bricks (2877), texture without glass
  | "arches"; // 1×4 arch bricks (ground level only)

export type Roof =
  | { type: "flat"; finish?: "studs" | "tiles" }
  | { type: "vaults"; axis?: "ns" | "ew"; count?: number; rows?: number; at?: number }
  | { type: "rounded" }
  | { type: "pitched"; ridge?: "ew" | "ns" }
  | { type: "glass" };

type Common = {
  id: string;
  name: string;
  /** Phase concept line shown above the steps. */
  concept?: string;
  /** Where this is in the real building and why it matters (phase intro). */
  about?: string;
  /** Short researched facts, used as step tips. */
  facts?: string[];
};

export type Element =
  | (Common & {
      type: "surface";
      material: "water" | "lawn" | "paving";
      rects: Rect[];
    })
  | (Common & {
      type: "podium";
      rect: Rect;
      levels?: number;
      style?: "colonnade" | "solid" | "arcade";
      /** Column spacing for colonnades (studs), default 3. */
      spacing?: number;
      /** Side carrying the arcade for style "arcade", default S. */
      arcadeSide?: Side;
      tint?: Tint;
      deckTint?: Tint;
      /** Tile the deck's exposed studs at the end (as far as tiles last). */
      finish?: "studs" | "tiles";
    })
  | (Common & {
      type: "block";
      /** Outer envelope including any balcony overhang. */
      rect: Rect;
      levels: number;
      facade?: Facade | Partial<Record<Side, Facade>>;
      /** Facade of the first level, if different (shopfronts, undercrofts). */
      groundFacade?: Facade | Partial<Record<Side, Facade>>;
      /** First level on columns instead of walls. */
      pilotis?: boolean;
      /** One-plate floor band each level (default true). */
      bands?: boolean;
      /** Sides whose floor bands project one stud past the walls. */
      balconies?: Side[] | "all";
      /** Alternate the balcony sides level by level (N/S, then E/W). */
      serrate?: boolean;
      roof?: Roof;
      tint?: Tint;
      bandTint?: Tint;
    })
  | (Common & {
      type: "glasshouse";
      rect: Rect;
      /** Glass panels stacked this many high (each is 2 bricks), default 1. */
      tiers?: number;
    })
  | (Common & {
      type: "trees";
      at: [number, number][];
      style?: "round" | "tall" | "shrub";
    })
  | (Common & {
      type: "walkway";
      rect: Rect;
      /** Deck height above ground, in levels of one brick (piers are bricks). */
      levels: number;
      spacing?: number;
      tint?: Tint;
    })
  | (Common & {
      type: "parts";
      items: {
        kind: string;
        w: number;
        d: number;
        x: number;
        z: number;
        /** Absolute layer, or omitted to drop onto whatever is below. */
        layer?: number;
        color?: "white" | "dark" | "green" | "trans";
        facing?: Side;
        desc?: string;
      }[];
    });

export type DesignSpec = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  concept: string;
  /** finish "tiles": tile the bare ground at the end, as far as tiles last. */
  site: { w: number; d: number; finish?: "studs" | "tiles" };
  elements: Element[];
};

const SIDES = new Set(["N", "S", "E", "W"]);
const FACADES = new Set(["solid", "glass", "ribbon", "open", "grille", "arches"]);
const int = (v: unknown) => typeof v === "number" && Number.isInteger(v);

/** Structural checks on a spec, before compiling. Empty means usable. */
export function checkSpec(spec: DesignSpec): string[] {
  const e: string[] = [];
  if (!spec || typeof spec !== "object") return ["spec must be an object"];
  for (const k of ["id", "title", "subtitle", "description", "concept"] as const)
    if (typeof spec[k] !== "string" || !spec[k]) e.push(`spec.${k} must be a non-empty string`);
  if (spec.id && !/^[a-z0-9][a-z0-9-]{1,40}$/.test(spec.id)) e.push("spec.id must be lowercase letters, digits and dashes");
  const site = spec.site;
  if (!site || !int(site.w) || !int(site.d) || site.w < 8 || site.d < 8 || site.w > 48 || site.d > 48)
    e.push("site.w and site.d must be integers from 8 to 48");
  if (!Array.isArray(spec.elements) || spec.elements.length === 0) return [...e, "elements must be a non-empty array"];
  const ids = new Set<string>();
  const inSite = (r: Rect, where: string) => {
    if (!r || ![r.x, r.z, r.w, r.d].every(int) || r.w < 1 || r.d < 1) return e.push(`${where}: rect needs integer x, z, w, d (w, d at least 1)`);
    if (site && (r.x < 0 || r.z < 0 || r.x + r.w > site.w || r.z + r.d > site.d))
      e.push(`${where}: rect ${r.x},${r.z} ${r.w}×${r.d} runs off the ${site.w}×${site.d} site`);
  };
  const facadeOk = (f: unknown, where: string) => {
    if (f === undefined) return;
    if (typeof f === "string") { if (!FACADES.has(f)) e.push(`${where}: unknown facade "${f}"`); return; }
    if (typeof f !== "object" || f === null) return e.push(`${where}: facade must be a name or a per-side map`);
    for (const [s, v] of Object.entries(f)) {
      if (!SIDES.has(s)) e.push(`${where}: facade side "${s}" must be N, S, E or W`);
      if (!FACADES.has(v as string)) e.push(`${where}: unknown facade "${v}"`);
    }
  };
  spec.elements.forEach((el, i) => {
    const where = `elements[${i}]${el && (el as Common).id ? ` (${(el as Common).id})` : ""}`;
    if (!el || typeof el !== "object") return e.push(`${where}: must be an object`);
    if (typeof el.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,40}$/.test(el.id)) e.push(`${where}: id must be lowercase letters, digits and dashes`);
    else if (ids.has(el.id)) e.push(`${where}: duplicate id`);
    ids.add(el.id);
    if (typeof el.name !== "string" || !el.name) e.push(`${where}: name is required`);
    if (el.facts !== undefined && (!Array.isArray(el.facts) || el.facts.some((f) => typeof f !== "string"))) e.push(`${where}: facts must be strings`);
    switch (el.type) {
      case "surface":
        if (!["water", "lawn", "paving"].includes(el.material)) e.push(`${where}: material must be water, lawn or paving`);
        if (!Array.isArray(el.rects) || !el.rects.length) e.push(`${where}: rects must be a non-empty array`);
        else el.rects.forEach((r, j) => inSite(r, `${where}.rects[${j}]`));
        break;
      case "podium":
        inSite(el.rect, where);
        if (el.levels !== undefined && (!int(el.levels) || el.levels < 1 || el.levels > 6)) e.push(`${where}: levels must be 1 to 6`);
        if (el.style && !["colonnade", "solid", "arcade"].includes(el.style)) e.push(`${where}: style must be colonnade, solid or arcade`);
        break;
      case "block":
        inSite(el.rect, where);
        if (!int(el.levels) || el.levels < 1 || el.levels > 60) e.push(`${where}: levels must be 1 to 60`);
        facadeOk(el.facade, where);
        facadeOk(el.groundFacade, `${where}.groundFacade`);
        if (el.balconies !== undefined && el.balconies !== "all" && (!Array.isArray(el.balconies) || el.balconies.some((s) => !SIDES.has(s))))
          e.push(`${where}: balconies must be "all" or a list of sides`);
        if (el.roof && !["flat", "vaults", "rounded", "pitched", "glass"].includes(el.roof.type)) e.push(`${where}: unknown roof type`);
        break;
      case "glasshouse":
        inSite(el.rect, where);
        if (el.tiers !== undefined && (!int(el.tiers) || el.tiers < 1 || el.tiers > 3)) e.push(`${where}: tiers must be 1 to 3`);
        break;
      case "trees":
        if (!Array.isArray(el.at) || !el.at.length) e.push(`${where}: at must list [x, z] points`);
        else el.at.forEach(([x, z], j) => { if (!int(x) || !int(z)) e.push(`${where}.at[${j}]: integers please`); });
        break;
      case "walkway":
        inSite(el.rect, where);
        if (!int(el.levels) || el.levels < 1 || el.levels > 12) e.push(`${where}: levels must be 1 to 12`);
        break;
      case "parts":
        if (!Array.isArray(el.items) || !el.items.length) e.push(`${where}: items must be a non-empty array`);
        break;
      default:
        e.push(`${where}: unknown type "${(el as { type: string }).type}"`);
    }
  });
  return e;
}

// Approved AI designs, compiled once and shared by the viewer, the guide
// and the scripts. Compiling is deterministic, so the spec is the source.
import { APPROVED_DESIGNS } from "../designs/index.ts";
import type { ApprovedDesign } from "../designs/types.ts";
import { compileDesign, type Compiled } from "./compile.ts";

const cache = new Map<string, Compiled>();

export const DESIGN_IDS: string[] = APPROVED_DESIGNS.map((d) => d.spec.id);

export function approvedDesign(id: string): ApprovedDesign | undefined {
  return APPROVED_DESIGNS.find((d) => d.spec.id === id);
}

export function compiledDesign(id: string): Compiled {
  let c = cache.get(id);
  if (!c) {
    const d = approvedDesign(id);
    if (!d) throw new Error(`no approved design ${id}`);
    c = compileDesign(d.spec);
    cache.set(id, c);
  }
  return c;
}

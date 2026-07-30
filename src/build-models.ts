// Registry mapping each guide build to its validated placement model.
// Kept separate from lego-model.ts so the per-build model files can import
// the Builder and catalog without a circular dependency.

import { generateBuild, BP_PHASE_ORDER, type BuildPlacements } from "./lego-model.ts";
import { generateFrobisher, FC_PHASE_ORDER } from "./model-frobisher.ts";

export const BUILD_MODELS: Record<string, () => BuildPlacements> = {
  "barbican-panorama": generateBuild,
  "frobisher-section": generateFrobisher,
};

export const PHASE_ORDER: Record<string, string[]> = {
  "barbican-panorama": BP_PHASE_ORDER,
  "frobisher-section": FC_PHASE_ORDER,
};

export const BUILD_IDS = Object.keys(BUILD_MODELS);

export function modelFor(buildId: string): BuildPlacements {
  const gen = BUILD_MODELS[buildId] ?? BUILD_MODELS["barbican-panorama"];
  return gen();
}

export function phaseOrderFor(buildId: string): string[] {
  return PHASE_ORDER[buildId] ?? PHASE_ORDER["barbican-panorama"];
}

export type BuildBounds = {
  center: [number, number, number]; // world units (1 stud = 1, 1 layer = 0.4)
  radius: number; // half-diagonal of the bounding box
};

const boundsCache = new Map<string, BuildBounds>();

/**
 * Bounding sphere of a finished build, so the viewer can frame each model
 * instead of using one hard-coded camera tuned to the panorama.
 */
export function boundsFor(buildId: string): BuildBounds {
  const cached = boundsCache.get(buildId);
  if (cached) return cached;

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const phase of Object.values(modelFor(buildId))) {
    for (const step of phase) {
      for (const p of step) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x + p.w);
        minZ = Math.min(minZ, p.z);
        maxZ = Math.max(maxZ, p.z + p.d);
        minY = Math.min(minY, p.layer * 0.4);
        maxY = Math.max(maxY, (p.layer + p.h) * 0.4);
      }
    }
  }
  if (!Number.isFinite(minX)) {
    const fallback: BuildBounds = { center: [0, 15, 0], radius: 40 };
    boundsCache.set(buildId, fallback);
    return fallback;
  }

  const bounds: BuildBounds = {
    center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    radius:
      Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2 || 10,
  };
  boundsCache.set(buildId, bounds);
  return bounds;
}

// ─── Full LEGO Architecture Studio 21050 Inventory ──────────────────

export type PieceEntry = {
  partNumber: string;
  name: string;
  category: string;
  totalInSet: number;
};

export const FULL_INVENTORY: PieceEntry[] = [
  // Standard Bricks
  { partNumber: "3005", name: "Brick 1×1", category: "Standard Bricks", totalInSet: 40 },
  { partNumber: "3004", name: "Brick 1×2", category: "Standard Bricks", totalInSet: 40 },
  { partNumber: "3622", name: "Brick 1×3", category: "Standard Bricks", totalInSet: 36 },
  { partNumber: "3010", name: "Brick 1×4", category: "Standard Bricks", totalInSet: 36 },
  { partNumber: "3009", name: "Brick 1×6", category: "Standard Bricks", totalInSet: 18 },
  { partNumber: "3008", name: "Brick 1×8", category: "Standard Bricks", totalInSet: 8 },
  { partNumber: "3003", name: "Brick 2×2", category: "Standard Bricks", totalInSet: 36 },
  { partNumber: "3002", name: "Brick 2×3", category: "Standard Bricks", totalInSet: 16 },
  { partNumber: "3001", name: "Brick 2×4", category: "Standard Bricks", totalInSet: 24 },
  { partNumber: "2456", name: "Brick 2×6", category: "Standard Bricks", totalInSet: 16 },
  // Specialty Bricks
  { partNumber: "2877", name: "Grille Brick 1×2", category: "Specialty Bricks", totalInSet: 16 },
  { partNumber: "6091", name: "Curved Top Brick 1×2", category: "Specialty Bricks", totalInSet: 12 },
  { partNumber: "2357", name: "Brick 2×2 Corner", category: "Specialty Bricks", totalInSet: 12 },
  // Transparent
  { partNumber: "3065", name: "Trans-Clear Brick 1×2", category: "Transparent", totalInSet: 40 },
  { partNumber: "87552", name: "Trans-Clear Panel 1×2×2", category: "Transparent", totalInSet: 16 },
  // Arches
  { partNumber: "3659", name: "Arch 1×4", category: "Arches", totalInSet: 6 },
  // Panels
  { partNumber: "6231", name: "Panel 1×1×1 Corner", category: "Panels", totalInSet: 10 },
  { partNumber: "30413", name: "Panel 1×4×1 Rounded", category: "Panels", totalInSet: 10 },
  // Round
  { partNumber: "3062b", name: "Round Brick 1×1", category: "Round", totalInSet: 16 },
  { partNumber: "3941", name: "Brick 2×2 Round", category: "Round", totalInSet: 12 },
  { partNumber: "85080", name: "Macaroni Brick 2×2", category: "Round", totalInSet: 12 },
  { partNumber: "4073", name: "Plate 1×1 Round", category: "Round", totalInSet: 30 },
  { partNumber: "4032", name: "Plate 2×2 Round", category: "Round", totalInSet: 12 },
  // SNOT
  { partNumber: "4070", name: "Headlight Brick 1×1", category: "SNOT", totalInSet: 16 },
  { partNumber: "4733", name: "Brick 1×1 Studs 4 Sides", category: "SNOT", totalInSet: 12 },
  { partNumber: "47905", name: "Brick 1×1 Studs 2 Sides", category: "SNOT", totalInSet: 12 },
  { partNumber: "30414", name: "Brick 1×4 Side Studs", category: "SNOT", totalInSet: 8 },
  // Standard Plates
  { partNumber: "3024w", name: "Plate 1×1", category: "Plates", totalInSet: 20 },
  { partNumber: "3023w", name: "Plate 1×2", category: "Plates", totalInSet: 20 },
  { partNumber: "3623", name: "Plate 1×3", category: "Plates", totalInSet: 18 },
  { partNumber: "3710", name: "Plate 1×4", category: "Plates", totalInSet: 16 },
  { partNumber: "3666", name: "Plate 1×6", category: "Plates", totalInSet: 12 },
  { partNumber: "4477", name: "Plate 1×10", category: "Plates", totalInSet: 8 },
  { partNumber: "3022", name: "Plate 2×2", category: "Plates", totalInSet: 16 },
  { partNumber: "3021", name: "Plate 2×3", category: "Plates", totalInSet: 20 },
  { partNumber: "3020", name: "Plate 2×4", category: "Plates", totalInSet: 16 },
  { partNumber: "3795", name: "Plate 2×6", category: "Plates", totalInSet: 12 },
  { partNumber: "3034", name: "Plate 2×8", category: "Plates", totalInSet: 12 },
  { partNumber: "3031", name: "Plate 4×4", category: "Plates", totalInSet: 10 },
  { partNumber: "3032", name: "Plate 4×6", category: "Plates", totalInSet: 10 },
  { partNumber: "3035", name: "Plate 4×8", category: "Plates", totalInSet: 8 },
  { partNumber: "3958", name: "Plate 6×6", category: "Plates", totalInSet: 6 },
  { partNumber: "3036", name: "Plate 6×8", category: "Plates", totalInSet: 4 },
  { partNumber: "3033", name: "Plate 6×10", category: "Plates", totalInSet: 4 },
  { partNumber: "41539", name: "Plate 8×8", category: "Plates", totalInSet: 6 },
  // Transparent Plates
  { partNumber: "3024", name: "Trans-Clear Plate 1×1", category: "Transparent Plates", totalInSet: 40 },
  { partNumber: "3023", name: "Trans-Clear Plate 1×2", category: "Transparent Plates", totalInSet: 50 },
  // Specialty Plates
  { partNumber: "15573", name: "Jumper Plate 1×2", category: "Specialty Plates", totalInSet: 20 },
  { partNumber: "2420", name: "Plate 2×2 Corner", category: "Specialty Plates", totalInSet: 18 },
  { partNumber: "30565", name: "Plate 4×4 Round Corner", category: "Specialty Plates", totalInSet: 12 },
  { partNumber: "60474", name: "Plate 4×4 Round w/ Pin", category: "Specialty Plates", totalInSet: 8 },
  // Slopes
  { partNumber: "54200", name: "Cheese Slope 1×1×⅔", category: "Slopes", totalInSet: 18 },
  { partNumber: "3040", name: "Slope 1×2 (45°)", category: "Slopes", totalInSet: 12 },
  { partNumber: "3665", name: "Slope 1×2 Inverted", category: "Slopes", totalInSet: 12 },
  { partNumber: "60481", name: "Slope 1×2×2 (65°)", category: "Slopes", totalInSet: 10 },
  { partNumber: "4460b", name: "Slope 1×2×3 (75°)", category: "Slopes", totalInSet: 10 },
  { partNumber: "4286", name: "Slope 1×3 (25°)", category: "Slopes", totalInSet: 10 },
  { partNumber: "4287", name: "Slope 1×3 Inverted", category: "Slopes", totalInSet: 10 },
  { partNumber: "50950", name: "Curved Slope 3×1", category: "Slopes", totalInSet: 12 },
  { partNumber: "3039", name: "Slope 2×2 (45°)", category: "Slopes", totalInSet: 12 },
  { partNumber: "3660", name: "Slope 2×2 Inverted", category: "Slopes", totalInSet: 12 },
  { partNumber: "3045", name: "Slope 2×2 Double Convex", category: "Slopes", totalInSet: 8 },
  { partNumber: "3298", name: "Slope 2×3 (25°)", category: "Slopes", totalInSet: 12 },
  { partNumber: "3747b", name: "Slope 2×3 Inverted", category: "Slopes", totalInSet: 10 },
  { partNumber: "3037", name: "Slope 2×4 (45°)", category: "Slopes", totalInSet: 12 },
  { partNumber: "30363", name: "Slope 2×4 (18°)", category: "Slopes", totalInSet: 8 },
  { partNumber: "3297", name: "Slope 3×4 (25°)", category: "Slopes", totalInSet: 12 },
  // Tiles
  { partNumber: "3070b", name: "Tile 1×1", category: "Tiles", totalInSet: 30 },
  { partNumber: "3069b", name: "Tile 1×2", category: "Tiles", totalInSet: 20 },
  { partNumber: "2412b", name: "Tile 1×2 Grille", category: "Tiles", totalInSet: 20 },
  { partNumber: "2431", name: "Tile 1×4", category: "Tiles", totalInSet: 12 },
  { partNumber: "6636", name: "Tile 1×6", category: "Tiles", totalInSet: 12 },
  { partNumber: "4162", name: "Tile 1×8", category: "Tiles", totalInSet: 12 },
  { partNumber: "3068b", name: "Tile 2×2", category: "Tiles", totalInSet: 20 },
  // Wedges
  { partNumber: "41768", name: "Wedge 2×4 Left", category: "Wedges", totalInSet: 8 },
  { partNumber: "41767", name: "Wedge 2×4 Right", category: "Wedges", totalInSet: 8 },
];

// All distinct category names for grouping
export const CATEGORIES = [
  "Standard Bricks",
  "Specialty Bricks",
  "Transparent",
  "Plates",
  "Transparent Plates",
  "Specialty Plates",
  "Slopes",
  "Tiles",
  "Arches",
  "Panels",
  "Round",
  "SNOT",
  "Wedges",
] as const;

export type PieceUsage = {
  partNumber: string;
  name: string;
  category: string;
  totalInSet: number;
  used: number;
};

/**
 * Calculate piece usage across selected builds.
 * Returns the full inventory with usage counts for the selected builds.
 */
export function calculatePieceUsage(
  buildIds: string[],
  allBuilds: { id: string; phases: { steps: { pieces: { part: string; qty: number }[] }[] }[] }[]
): PieceUsage[] {
  // Aggregate piece usage from selected builds
  const usageMap = new Map<string, number>();

  for (const buildId of buildIds) {
    const build = allBuilds.find((b) => b.id === buildId);
    if (!build) continue;
    for (const phase of build.phases) {
      for (const step of phase.steps) {
        for (const piece of step.pieces) {
          usageMap.set(piece.part, (usageMap.get(piece.part) || 0) + piece.qty);
        }
      }
    }
  }

  return FULL_INVENTORY.map((entry) => ({
    ...entry,
    used: usageMap.get(entry.partNumber) || 0,
  }));
}

/**
 * Check if any piece exceeds the set's total for the given builds.
 */
export function findConflicts(
  buildIds: string[],
  allBuilds: { id: string; phases: { steps: { pieces: { part: string; qty: number }[] }[] }[] }[]
): PieceUsage[] {
  const usage = calculatePieceUsage(buildIds, allBuilds);
  return usage.filter((p) => p.used > p.totalInSet);
}

// ─── Build Data: The Barbican Estate — Lakeside Panorama ─────────────
// A single comprehensive build maximising the LEGO Architecture Studio
// 21050 set (1,210 pieces). Target: 950–1050 pieces across 12 phases.
// Redesigned with official LEGO instruction-manual granularity:
// 150 steps, 3-8 pieces per step.

export type Piece = {
  name: string;
  part: string;
  qty: number;
};

export type Step = {
  title: string;
  instruction: string;
  pieces: Piece[];
  tip: string;
  highlight?: boolean;
};

export type Phase = {
  id: string;
  title: string;
  concept: string;
  color: string;
  icon: string;
  time: string;
  location: string;
  steps: Step[];
};

export type Photo = {
  url: string;
  caption: string;
  credit: string;
};

export type Build = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: 1 | 2 | 3;
  estimatedTime: string;
  pieceCount: number;
  concept: string;
  heroPhoto: string;
  phases: Phase[];
  photos: Record<string, Photo>;
  phasePhotos: Record<string, string[]>;
};

// ─── Shared Photos ──────────────────────────────────────────────────
const SHARED_PHOTOS: Record<string, Photo> = {
  lakeside: {
    url: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Barbican.flats.london.arp.jpg",
    caption:
      "The iconic lakeside view — towers behind terraces, lake in foreground",
    credit: "Wikimedia Commons, Public Domain",
  },
  terrace: {
    url: "https://upload.wikimedia.org/wikipedia/commons/5/55/Barbican_tour%2C_Frobisher_Crescent_and_Shakespeare_Tower_-_geograph.org.uk_-_4144734.jpg",
    caption:
      "Frobisher Crescent — barrel-vaulted roofline with Shakespeare Tower behind",
    credit: "Stephen Richards, CC BY-SA 2.0",
  },
  tower: {
    url: "https://upload.wikimedia.org/wikipedia/commons/c/c4/Lauderdale_Tower%2C_Barbican_Estate%2C_London.jpg",
    caption:
      "Lauderdale Tower — serrated balconies, horizontal banding, triangular plan",
    credit: "Wikimedia Commons, CC BY-SA 3.0",
  },
  podium: {
    url: "https://upload.wikimedia.org/wikipedia/commons/3/30/Barbican_Estate_Frobisher_Crescent_City_of_London_2026_05.jpg",
    caption: "Colonnade at podium level — concrete pilotis and raised walkways",
    credit: "Wikimedia Commons, CC BY 4.0",
  },
  conservatory: {
    url: "https://upload.wikimedia.org/wikipedia/commons/2/21/Barbican_Conservatory_%2850715551858%29.jpg",
    caption:
      "The Barbican Conservatory — second largest in London after Kew Gardens",
    credit: "Wikimedia Commons, CC0",
  },
  aerial: {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Barbicanestatefromabove.jpg",
    caption:
      "Aerial view — three towers, terrace blocks forming perimeter, lake at center",
    credit: "Wikimedia Commons, CC BY 3.0",
  },
  balconies: {
    url: "https://upload.wikimedia.org/wikipedia/commons/9/94/Barbican_Balconies_-_geograph.org.uk_-_723870.jpg",
    caption:
      "Balcony detail — contrasting profiles of Lauderdale Tower and Defoe House",
    credit: "Stephen McKay, CC BY-SA 2.0",
  },
};

// ═══════════════════════════════════════════════════════════════════════
// THE BARBICAN ESTATE — LAKESIDE PANORAMA
// Full diorama: tower, terraces, conservatory, podium, highwalks, lake
// ═══════════════════════════════════════════════════════════════════════

const barbicanPanorama: Build = {
  id: "barbican-panorama",
  title: "The Barbican Estate — Lakeside Panorama",
  subtitle:
    "The full lakeside composition: tower, terraces, conservatory, podium, and lake",
  description:
    "A large-scale diorama capturing the Barbican's most iconic composition — the full lakeside view with Lauderdale Tower rising behind barrel-vaulted terrace blocks, the colonnade podium, the Conservatory greenhouse, and the ornamental lake. This is a serious, multi-session build using advanced SNOT (Studs Not On Top) techniques for bush-hammered concrete texture, inverted slopes for cantilevered soffits, and layered facades with shadow reveals. Designed to maximise the LEGO Architecture Studio 21050 set.",
  difficulty: 3,
  estimatedTime: "8–12 hours across multiple sessions",
  pieceCount: 1029,
  concept: "Brutalist Urbanism — Layers, Texture & Repetition",
  heroPhoto: SHARED_PHOTOS.lakeside.url,
  photos: {
    lakeside: SHARED_PHOTOS.lakeside,
    terrace: SHARED_PHOTOS.terrace,
    tower: SHARED_PHOTOS.tower,
    podium: SHARED_PHOTOS.podium,
    conservatory: SHARED_PHOTOS.conservatory,
    aerial: SHARED_PHOTOS.aerial,
    balconies: SHARED_PHOTOS.balconies,
  },
  phasePhotos: {
    "bp-foundation": ["lakeside", "aerial"],
    "bp-lake": ["lakeside", "aerial"],
    "bp-podium": ["podium", "lakeside"],
    "bp-terrace-core": ["terrace", "balconies"],
    "bp-terrace-facade": ["balconies", "terrace"],
    "bp-terrace-balconies": ["balconies", "terrace"],
    "bp-barrel-vault": ["terrace", "lakeside"],
    "bp-tower-core": ["tower", "aerial"],
    "bp-tower-facade": ["tower", "balconies"],
    "bp-tower-crown": ["tower", "aerial"],
    "bp-conservatory": ["conservatory", "lakeside"],
    "bp-landscaping": ["aerial", "lakeside"],
  },
  phases: [
    // ════════════════════════════════════════════════════════════════════
    // PHASE 1: FOUNDATION PLATFORM (8 steps, 56 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-foundation",
      title: "Phase 1 — Foundation Platform",
      concept: "Site & Datum",
      color: "#6B7280",
      icon: "🏗️",
      time: "25–35 min",
      location:
        "You are establishing the datum — the ground plane from which everything rises. The Barbican is built on a bombed-out section of the City of London, so the whole estate sits on a massive concrete podium raised above street level. Your base plate represents this podium deck: lake zone in front, building zone behind.",
      steps: [
        {
          title: "Back Row — First Two Large Plates",
          instruction:
            "Place 2 Plate 8×8 side by side on a flat surface, long edges touching. These form the left two-thirds of the back row. Press the joint firmly from above.",
          pieces: [{ name: "Plate 8×8", part: "41539", qty: 2 }],
          tip: "In architecture, the datum is the reference point for every measurement. Start with a perfectly flat surface — if the base warps, the whole diorama tilts.",
          highlight: true,
        },
        {
          title: "Back Row — Third Large Plate",
          instruction:
            "Place the third Plate 8×8 to the right of the first two, completing a 24×8-stud back row. Ensure all three plates are perfectly flush.",
          pieces: [{ name: "Plate 8×8", part: "41539", qty: 1 }],
          tip: "Three 8×8 plates in a row give you 24 studs of width — the panoramic scale that makes the Barbican composition work.",
        },
        {
          title: "Front Row — Two Large Plates",
          instruction:
            "Place 2 more Plate 8×8 in a front row, aligned with the left and centre plates of the back row. Overlap the back-row plates by 2 studs for a strong joint.",
          pieces: [{ name: "Plate 8×8", part: "41539", qty: 2 }],
          tip: "Overlapping by 2 studs locks the rows together. Never let four plate corners meet at one point — stagger joints like real brickwork.",
        },
        {
          title: "Front Row — Sixth Large Plate",
          instruction:
            "Place the final Plate 8×8 at the right end of the front row, completing a 24×16-stud core grid. Press all joints flat.",
          pieces: [{ name: "Plate 8×8", part: "41539", qty: 1 }],
          tip: "You now have a solid 24×16 core — the heart of the site. Everything else extends outward from this grid.",
        },
        {
          title: "Front Extension — Lake Zone Plates",
          instruction:
            "Attach all 4 Plate 6×10 extending forward from the front edge of the core, overlapping by 2 studs. These create the lake zone projecting forward.",
          pieces: [{ name: "Plate 6×10", part: "3033", qty: 4 }],
          tip: "The Barbican's site plan is a roughly rectangular superblock — wider than deep. This forward extension gives the lake its panoramic spread.",
        },
        {
          title: "Side Extensions — Widening the Site",
          instruction:
            "Attach all 4 Plate 6×8 to the left and right sides of the core (2 per side), overlapping by 2 studs. This widens the site to approximately 32 studs total.",
          pieces: [{ name: "Plate 6×8", part: "3036", qty: 4 }],
          tip: "The side plates create the podium zone where the colonnade will stand. They need to be rock-solid because they will bear column loads.",
        },
        {
          title: "Infill — Middle Zone",
          instruction:
            "Fill gaps across the middle zone of the platform with all 8 Plate 4×8, overlapping existing plates by at least 2 studs. Stagger the joints.",
          pieces: [{ name: "Plate 4×8", part: "3035", qty: 8 }],
          tip: "Stagger your plate joints like brickwork — never let four plate corners meet at one point. This is the same structural logic as a real building foundation.",
        },
        {
          title: "Infill — Corner Zones",
          instruction:
            "Fill the corner zones of the platform with all 6 Plate 6×6. Overlap each plate by at least 2 studs over existing plates. The goal is a solid, continuous platform with no gaps.",
          pieces: [{ name: "Plate 6×6", part: "3958", qty: 6 }],
          tip: "Corner plates take the most abuse when the model is picked up or moved. Overlap them generously for a rigid base.",
        },
        {
          title: "Edge Beams",
          instruction:
            "Run all 8 Plate 1×10 along the four edges of the platform, overlapping plate joints. These act as continuous edge beams that tie the entire foundation together.",
          pieces: [{ name: "Plate 1×10", part: "4477", qty: 8 }],
          tip: "Edge beams prevent the platform from spreading apart at the joints. In real construction, a continuous perimeter beam is the first defence against foundation movement.",
          highlight: true,
        },
        {
          title: "Tower Reinforcement Zone",
          instruction:
            "TRIPLE-LAYER the back edge where the tower will sit: stack all 6 Plate 4×6 in an overlapping pattern across the rear 6 rows. Press firmly — this zone must bear the tower's full weight.",
          pieces: [{ name: "Plate 4×6", part: "3032", qty: 6 }],
          tip: "The tower will be the heaviest part of the model by far. Real tower foundations are often 3-5 metres thick. Over-engineer the base — you will thank yourself at Phase 8.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 2: THE LAKE (8 steps, 70 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-lake",
      title: "Phase 2 — The Lake",
      concept: "Negative Space & Reflection",
      color: "#06B6D4",
      icon: "💧",
      time: "20–25 min",
      location:
        "The ornamental lake is the Barbican's emotional centre — the calm mirror that reflects the towers and gives this dense estate its famous sense of space. You are building negative space: the lake defines the buildings by contrast. The water surface sits one plate below the surrounding walkway, creating a visible shadow line at the water's edge.",
      steps: [
        {
          title: "Lake Corners — Border Start",
          instruction:
            "At each corner of the front lake zone (roughly 16×8 studs), place 2 Plate 2×2 Corner pieces, angled to frame the lake perimeter. Place all 8 corners first to define the lake's rectangular shape.",
          pieces: [{ name: "Plate 2×2 Corner", part: "2420", qty: 8 }],
          tip: "The real Barbican lake has a clean concrete kerb. These corner pieces define the sharp geometry of the water's edge — crisp right angles, not organic curves.",
          highlight: true,
        },
        {
          title: "Lake Edge — Straight Border",
          instruction:
            "Between the corner pieces, place 8 Plate 1×4 along all four edges of the lake perimeter. This creates a continuous 1-plate-high lip that holds the transparent water pieces in place.",
          pieces: [{ name: "Plate 1×4", part: "3710", qty: 8 }],
          tip: "This 1-plate step-down creates the shadow line where land meets water — visible even at micro scale. Keep the border perfectly straight.",
        },
        {
          title: "Water Surface — Back Rows",
          instruction:
            "Starting at the back edge of the lake, lay 10 Trans-Clear Plate 1×2 in a row, studs up. Leave occasional 1-stud gaps between pieces — the exposed studs catch light and suggest water ripple.",
          pieces: [{ name: "Trans-Clear Plate 1×2", part: "3023", qty: 10 }],
          tip: "Do not cover every single stud. The irregularity is deliberate — in architecture this is called 'articulated surface.' The bumps read as ripples at this scale.",
        },
        {
          title: "Water Surface — Middle Rows",
          instruction:
            "Continue filling the lake with the next band of 10 Trans-Clear Plate 1×2, working forward from the back rows. Offset each row by half a stud width from the row behind for a natural water pattern.",
          pieces: [{ name: "Trans-Clear Plate 1×2", part: "3023", qty: 10 }],
          tip: "Offsetting rows prevents a visible grid pattern. Real water has no straight lines — the offset suggests organic ripple movement.",
        },
        {
          title: "Water Surface — Front Rows",
          instruction:
            "Fill the next band with 10 more Trans-Clear Plate 1×2, continuing the offset pattern toward the front edge of the lake.",
          pieces: [{ name: "Trans-Clear Plate 1×2", part: "3023", qty: 10 }],
          tip: "Three bands of transparent plates create a convincing water mass. The depth of the clear plastic catches and refracts real light — just like water.",
        },
        {
          title: "Water Surface — Final Fill",
          instruction:
            "Place the remaining 10 Trans-Clear Plate 1×2 to close any remaining gaps in the lake surface. Focus on the edges where the transparent plates meet the border.",
          pieces: [{ name: "Trans-Clear Plate 1×2", part: "3023", qty: 10 }],
          tip: "The lake should now be a continuous transparent surface. A few exposed studs between plates are desirable — they add texture.",
        },
        {
          title: "Depth Variation — Near Edges",
          instruction:
            "Scatter 7 Trans-Clear Plate 1×1 around the lake perimeter, concentrating them near the border. These suggest shallow water near the lake's edge.",
          pieces: [{ name: "Trans-Clear Plate 1×1", part: "3024", qty: 7 }],
          tip: "Real lakes are shallow at the edges and deeper in the centre. These scattered singles near the rim suggest that natural depth gradient.",
        },
        {
          title: "Depth Variation — Centre & Deep Spots",
          instruction:
            "Scatter 7 more Trans-Clear Plate 1×1 across the centre of the lake, placed more sparsely than the edges. The centre should have fewer pieces and more exposed studs to suggest deeper, calmer water.",
          pieces: [{ name: "Trans-Clear Plate 1×1", part: "3024", qty: 7 }],
          tip: "The Architecture Studio guidebook says 'what is not there matters as much as what is.' The sparser centre reads as deeper, stiller water.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 3: PODIUM COLONNADE (6 steps, 40 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-podium",
      title: "Phase 3 — Podium Colonnade",
      concept: "Rhythm & Procession",
      color: "#8B5CF6",
      icon: "🏛️",
      time: "15–20 min",
      location:
        "The Barbican's podium is its connective tissue — a raised walkway system supported by cylindrical concrete columns (pilotis), separating pedestrians above from vehicles below. We place columns first but delay the podium deck — the terrace and tower foundations need to go on the base plate while it is still accessible. The deck, soffits, and parapets will be added in Phase 4 after ground-level elements are in place.",
      steps: [
        {
          title: "Main Columns — First Four",
          instruction:
            "Place 4 Brick 2×2 Round in a line across the podium zone (the strip between lake and terrace), spaced 3 studs apart. Start from the left edge.",
          pieces: [{ name: "Brick 2×2 Round", part: "3941", qty: 4 }],
          tip: "Regular column spacing creates visual rhythm — like beats in music. Count the gaps between columns: that repeating interval IS the Barbican's architectural language.",
          highlight: true,
        },
        {
          title: "Main Columns — Middle Four",
          instruction:
            "Place the next 4 Brick 2×2 Round continuing the line to the right, maintaining the same 3-stud spacing established in Step 1.",
          pieces: [{ name: "Brick 2×2 Round", part: "3941", qty: 4 }],
          tip: "Consistent spacing is critical. If one column is off by even half a stud, the rhythm breaks and the podium deck will not sit flat.",
        },
        {
          title: "Main Columns — Last Four",
          instruction:
            "Place the final 4 Brick 2×2 Round to complete the colonnade line of 12 columns stretching across the full 20-stud podium width.",
          pieces: [{ name: "Brick 2×2 Round", part: "3941", qty: 4 }],
          tip: "Stand at eye level with the base and sight along the column line. All 12 columns should read as a perfectly regular rhythm — the hallmark of Brutalist civic architecture.",
        },
        {
          title: "Column Capitals — Left Half",
          instruction:
            "Top the left 6 main columns with Plate 2×2 Round as capital/bearing pads. Press each plate firmly to ensure a solid seat for the podium deck.",
          pieces: [{ name: "Plate 2×2 Round", part: "4032", qty: 6 }],
          tip: "The round plate capitals widen the bearing surface for the deck plates. They also visually mark the column-to-beam junction — a critical detail in structural expression.",
        },
        {
          title: "Column Capitals — Right Half",
          instruction:
            "Top the right 6 main columns with Plate 2×2 Round, completing all 12 capitals. Every column should now have a flat bearing surface.",
          pieces: [{ name: "Plate 2×2 Round", part: "4032", qty: 6 }],
          tip: "Check each capital sits flat and level. An uneven capital means an uneven deck — problems compound upward in any structure.",
        },
        {
          title: "Secondary Columns — Left Half",
          instruction:
            "Between every other pair of main columns on the left side, place 6 Round Brick 1×1 as secondary structural elements.",
          pieces: [{ name: "Round Brick 1×1", part: "3062b", qty: 6 }],
          tip: "The secondary columns are slender and elegant — they add structural redundancy without the visual mass of the main pilotis.",
        },
        {
          title: "Secondary Columns — Right Half",
          instruction:
            "Place 6 more Round Brick 1×1 between the main column pairs on the right side, completing the secondary column grid.",
          pieces: [{ name: "Round Brick 1×1", part: "3062b", qty: 6 }],
          tip: "In real Brutalist buildings, this mix of thick and thin columns creates visual depth. The colonnade should now have a complex rhythm of large and small verticals.",
        },
        {
          title: "Lateral Bracing",
          instruction:
            "Connect 4 pairs of adjacent columns at mid-height using 4 Plate 1×2 laid horizontally between them. Only brace the back row of columns (closest to the terrace block) — the front row will be stabilized by the podium deck later.",
          pieces: [{ name: "Plate 1×2", part: "3023w", qty: 4 }],
          tip: "Lateral bracing is what separates a column that stands from one that topples. The real Barbican columns are braced by the podium slab itself — at LEGO scale, these hidden braces are your safety net.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 4: GROUND LEVEL & STRUCTURAL CORES (28 steps, 188 pieces)
    // Interleaved terrace + tower build for access
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-terrace-core",
      title: "Phase 4 — Ground Level & Structural Cores",
      concept: "Build Sequence & Access",
      color: "#D97706",
      icon: "🧱",
      time: "50–65 min",
      location:
        "This is the most important phase for buildability. The terrace block and tower are built TOGETHER — interleaved rather than sequentially — because the podium deck will cover the base plate once placed. All ground-level elements (terrace ground course, Arts Centre arches, ground-floor windows, landscaping slopes) must go in BEFORE the podium deck spans across the columns. Then the tower base is placed while the terrace is still only 1-2 courses high. Both structures rise upward simultaneously, interlocking where they meet for maximum structural rigidity.",
      steps: [
        // --- Terrace ground course ---
        {
          title: "Terrace Ground — Left Section",
          instruction:
            "Behind the podium columns, lay 4 Brick 2×6 end-to-end stretching across the left half of the terrace zone. These form the first ground course of the terrace block.",
          pieces: [{ name: "Brick 2×6", part: "2456", qty: 4 }],
          tip: "This is your LAST chance to place ground-level elements before the podium deck covers this zone. Work quickly and carefully.",
          highlight: true,
        },
        {
          title: "Terrace Ground — Right Section",
          instruction:
            "Continue the ground course with 4 more Brick 2×6, completing the terrace base across the full 20-stud width.",
          pieces: [{ name: "Brick 2×6", part: "2456", qty: 4 }],
          tip: "The 2×6 bricks provide excellent spanning strength. Their length bridges over plate joints below, distributing load evenly.",
        },
        {
          title: "Terrace Ground — Bond Course",
          instruction:
            "On top of the 2×6 ground course, place 6 Brick 2×4 offset by 2 studs to create a running bond pattern. The vertical joints must NOT align with the course below.",
          pieces: [{ name: "Brick 2×4", part: "3001", qty: 6 }],
          tip: "Real bricks are always laid in bond (offset) so that vertical joints never align. This interlocking pattern is stronger than stacking — each brick ties its neighbours together.",
        },
        {
          title: "Arts Centre Arches",
          instruction:
            "At the ground floor of the terrace, place all 6 Arch 1×4 to create the arched entrances to the Barbican Arts Centre. Space them evenly across the base, spanning the gaps between the bond course bricks.",
          pieces: [{ name: "Arch 1×4", part: "3659", qty: 6 }],
          tip: "The arches are a deliberate historical reference to Roman aqueducts — place them now while you can still reach the base plate. Once the podium deck goes on, this zone is sealed.",
        },
        {
          title: "Ground-Floor Windows — Left Half",
          instruction:
            "Place 5 Trans-Clear Panel 1×2×2 at the terrace ground floor on the left side. These represent the double-height windows of the Arts Centre foyer. Place them between the arches.",
          pieces: [
            { name: "Trans-Clear Panel 1×2×2", part: "87552", qty: 5 },
          ],
          tip: "These large windows signal public space — the Arts Centre foyer is the most open, inviting part of the Barbican at ground level.",
        },
        {
          title: "Ground-Floor Windows — Right Half",
          instruction:
            "Place 5 more Trans-Clear Panel 1×2×2 at the ground floor on the right side, completing the double-height glazing across the full terrace width.",
          pieces: [
            { name: "Trans-Clear Panel 1×2×2", part: "87552", qty: 5 },
          ],
          tip: "Place these firmly now — once the podium deck spans over this zone, you cannot adjust window positions.",
        },
        {
          title: "Ground-Level Landscaping",
          instruction:
            "Place 4 Slope 2×3 (25 degrees) and 2 Slope 3×4 (25 degrees) around the base of the terrace while accessible. Concentrate them between the podium columns and the terrace block to suggest raised planting beds.",
          pieces: [
            { name: "Slope 2×3 (25°)", part: "3298", qty: 4 },
            { name: "Slope 3×4 (25°)", part: "3297", qty: 2 },
          ],
          tip: "Grade changes (gentle slopes in the ground plane) make a landscape feel natural. Even 1-plate height differences create shadow lines that read as terrain. This is your last chance to reach the ground plane.",
        },
        // --- Podium deck ---
        {
          title: "Podium Deck — Back Plates",
          instruction:
            "Place 5 Plate 2×4 across the back half of the podium zone, spanning from column capital to column capital. These go on normally — no soffits needed on the back section.",
          pieces: [{ name: "Plate 2×4", part: "3020", qty: 5 }],
          tip: "The back deck plates bear load directly above the columns. Press each plate firmly to seat it on the round capitals.",
        },
        {
          title: "Podium Deck — Front Plates",
          instruction:
            "Place 5 more Plate 2×4 across the front half of the podium, completing the deck surface. Overlap the back plates by at least 1 stud for rigidity.",
          pieces: [{ name: "Plate 2×4", part: "3020", qty: 5 }],
          tip: "The front edge of the podium is the most visible horizontal line in the model. Keep it perfectly straight.",
        },
        {
          title: "Podium Deck — Wide Sections",
          instruction:
            "Place 6 Plate 2×6 at key spans across the podium deck, bridging the gaps between column pairs. These wider plates add rigidity to the deck.",
          pieces: [{ name: "Plate 2×6", part: "3795", qty: 6 }],
          tip: "Wider plates resist bending better than narrow ones. Concentrate them at the longest unsupported spans between columns.",
        },
        {
          title: "Podium Soffits — Sub-Assembly",
          instruction:
            "PRE-ASSEMBLE on your work surface: attach 8 Slope 2×3 Inverted underneath 4 Plate 2×6 (2 slopes per plate, studs facing down). Build these sub-assemblies flat, then flip and attach to the front edge of the podium deck. The inverted slopes represent the visible concrete soffit seen from below.",
          pieces: [{ name: "Slope 2×3 Inverted", part: "3747b", qty: 8 }],
          tip: "Pre-assembling the soffit onto the deck plates before placing them is much easier than trying to attach inverted slopes underneath an already-placed deck. Build flat, flip, place.",
        },
        {
          title: "Podium Parapets — Railings",
          instruction:
            "Along both long edges of the podium deck, attach 5 Panel 1×4×1 Rounded on each side (10 total) as walkway railings. Space them evenly.",
          pieces: [
            { name: "Panel 1×4×1 Rounded", part: "30413", qty: 10 },
          ],
          tip: "Parapets are the horizontal lines that make Brutalist buildings look layered when photographed. They cast long shadows that emphasise horizontality.",
        },
        {
          title: "Podium Parapets — Corner Pieces",
          instruction:
            "At each corner and end of the podium railings, place Panel 1×1×1 Corner pieces. Use all 10 to cap every parapet end and corner junction.",
          pieces: [
            { name: "Panel 1×1×1 Corner", part: "6231", qty: 10 },
          ],
          tip: "Corner panels give the parapets a finished look — raw cut-off ends look unresolved. Every line should terminate deliberately.",
        },
        // --- Tower base ---
        {
          title: "Tower Base — First Course Left",
          instruction:
            "Place the tower footprint DIRECTLY ON THE BASE PLATE, behind the terrace ground course. Start with 5 Brick 1×4 spanning the left half of the widened 8×6-stud tower footprint, on the triple-layered rear zone of the foundation.",
          pieces: [{ name: "Brick 1×4", part: "3010", qty: 5 }],
          tip: "Structural engineering 101: a wider base dramatically improves stability. The real Barbican towers have massive foundations extending well below ground.",
          highlight: true,
        },
        {
          title: "Tower Base — First Course Right",
          instruction:
            "Complete the first tower course with 5 more Brick 1×4, filling the right half. The full course should span the entire 8-stud width of the tower footprint.",
          pieces: [{ name: "Brick 1×4", part: "3010", qty: 5 }],
          tip: "The tower base needs to be perfectly centred on the reinforced foundation zone. Check alignment before adding more courses.",
        },
        {
          title: "Tower Base — Second Course",
          instruction:
            "Place 5 Brick 1×2 in a bond pattern on top of the first course, offset by 2 studs so no joints align. Fill gaps at the ends.",
          pieces: [{ name: "Brick 1×2", part: "3004", qty: 5 }],
          tip: "Bond pattern (offset joints) is even more critical in the tower than the terrace — every aligned joint is a potential failure point under the tower's cumulative weight.",
        },
        {
          title: "Tower Base — Third Course",
          instruction:
            "Place 5 more Brick 1×2 for the third tower course, alternating the offset direction from the second course. The tower base should now be 3 courses tall.",
          pieces: [{ name: "Brick 1×2", part: "3004", qty: 5 }],
          tip: "Alternating offset direction every course creates the strongest possible bond. This is called 'stretcher bond' — the standard for structural masonry worldwide.",
        },
        // --- Terrace walls rising ---
        {
          title: "Terrace Wall — Course 3 (Left Half)",
          instruction:
            "Switch back to the terrace. Place 4 Brick 1×8 end-to-end across the left half of the terrace wall, on top of the ground courses.",
          pieces: [{ name: "Brick 1×8", part: "3008", qty: 4 }],
          tip: "Interleaving the terrace and tower build creates a much stronger structure than building them separately. The interlocking bricks at the junction work like a zipper.",
        },
        {
          title: "Terrace Wall — Course 3 (Right Half)",
          instruction:
            "Place 4 more Brick 1×8 across the right half, completing the third wall course. The terrace wall should now be 3 courses tall and 20+ studs wide.",
          pieces: [{ name: "Brick 1×8", part: "3008", qty: 4 }],
          tip: "The 1×8 bricks span long distances, bridging over many joints below. They act like steel beams in real construction — tying the wall together horizontally.",
        },
        {
          title: "Terrace Wall — Courses 4-5 (Left)",
          instruction:
            "Place 5 Brick 2×3 across the left half of the terrace for courses 4-5. Offset from the course below by at least 1 stud.",
          pieces: [{ name: "Brick 2×3", part: "3002", qty: 5 }],
          tip: "Two-stud-deep bricks create a thicker wall that resists lateral forces better. The terrace wall needs this thickness to support the barrel vault above.",
        },
        {
          title: "Terrace Wall — Courses 4-5 (Centre)",
          instruction:
            "Place 6 more Brick 2×3 across the centre section, maintaining the offset bond pattern. Where the terrace meets the tower base, let bricks span both structures.",
          pieces: [{ name: "Brick 2×3", part: "3002", qty: 6 }],
          tip: "Bricks that span the terrace-tower junction interlock the two structures. This creates a unified structural mass — each building braces the other.",
        },
        {
          title: "Terrace Wall — Courses 4-5 (Right)",
          instruction:
            "Complete courses 4-5 with 5 more Brick 2×3 on the right side. The terrace wall is now 5 courses tall across its full width.",
          pieces: [{ name: "Brick 2×3", part: "3002", qty: 5 }],
          tip: "Step back and check: the terrace wall should be a continuous, solid mass — no gaps, no wobbly spots. Press each course firmly before adding the next.",
        },
        {
          title: "Terrace Wall — Upper Courses with 1×6",
          instruction:
            "Place 10 Brick 1×6 across the terrace wall for courses 6-7. Alternate the offset pattern. These long bricks tie the upper wall together across its full width.",
          pieces: [{ name: "Brick 1×6", part: "3009", qty: 10 }],
          tip: "The 1×6 bricks at this height create the horizontal banding visible on the real Barbican terraces — long, unbroken lines that emphasise the building's panoramic width.",
        },
        // --- Tower shaft through terrace height ---
        {
          title: "Tower Shaft — Courses 4-6",
          instruction:
            "Return to the tower. Place 8 Brick 1×4 in 3 courses (offset bond pattern), building the tower shaft up through the height of the terrace block. Where the tower face touches the terrace rear wall, interlock.",
          pieces: [{ name: "Brick 1×4", part: "3010", qty: 8 }],
          tip: "The tower rises behind the terrace — at this stage both structures should be roughly the same height, growing together like twin stems from one root.",
        },
        {
          title: "Tower Shaft — Infill Bricks",
          instruction:
            "Fill remaining gaps in the tower courses with 8 Brick 1×2, maintaining strict bond pattern. No vertical joints should align across more than one course.",
          pieces: [{ name: "Brick 1×2", part: "3004", qty: 8 }],
          tip: "Small infill bricks at course ends are the mortar of LEGO construction — they seal gaps and prevent racking (sideways lean) in the tower.",
        },
        // --- Structural plates ---
        {
          title: "Structural Floor Plates — Terrace",
          instruction:
            "Lay 8 Plate 2×8 across the top of the terrace wall, spanning its full width. These represent the concrete floor slabs and create a rigid cap that ties all the wall bricks together.",
          pieces: [{ name: "Plate 2×8", part: "3034", qty: 8 }],
          tip: "The structural plate every few courses mimics real construction where floor slabs brace the walls against buckling. Without these plates, a tall LEGO wall will eventually lean.",
          highlight: true,
        },
        {
          title: "Shear Walls",
          instruction:
            "Build 2 short perpendicular shear walls extending backward from the terrace, interlocked with the tower base courses. Use 4 Brick 2×4 and 2 Brick 2×6. Each shear wall is 4 studs long, 1 stud wide, and the full terrace height.",
          pieces: [
            { name: "Brick 2×4", part: "3001", qty: 4 },
            { name: "Brick 2×6", part: "2456", qty: 2 },
          ],
          tip: "Shear walls create a direct load path from the tower straight down to the foundation. Without them, the tower's weight bears on flat plates which can flex.",
        },
        {
          title: "Upper Wall Infill",
          instruction:
            "Fill remaining gaps in the upper terrace storeys with 4 Brick 2×4 and 4 Brick 2×6. The finished terrace wall should be a solid mass — 20 studs wide, 2 studs deep, 7+ storeys tall.",
          pieces: [
            { name: "Brick 2×4", part: "3001", qty: 4 },
            { name: "Brick 2×6", part: "2456", qty: 4 },
          ],
          tip: "Step back and look at the profile. You should see the terrace as a solid rectangular mass with the tower rising behind it — both structures built as a unified block from the foundation up.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 5: TERRACE BLOCK — SNOT FACADE (12 steps, 72 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-terrace-facade",
      title: "Phase 5 — Terrace Block: SNOT Facade",
      concept: "Surface & Texture",
      color: "#DC2626",
      icon: "🪟",
      time: "35–45 min",
      location:
        "Now you transform the raw mass into the Barbican's signature bush-hammered concrete facade. The real buildings have a deeply textured surface created by hammering cast concrete to expose aggregate — giving it a rough, almost geological quality. You will recreate this using SNOT (Studs Not On Top) technique: bricks with side studs face their studs outward, and grille tiles attached sideways create the textured surface.",
      steps: [
        {
          title: "SNOT Bricks — Lower Storeys",
          instruction:
            "Attach 4 Brick 1×4 Side Studs to the front face of the structural wall at the 2nd and 3rd storey levels (2 per storey). These bricks have studs pointing OUTWARD from the wall face.",
          pieces: [{ name: "Brick 1×4 Side Studs", part: "30414", qty: 4 }],
          tip: "This is the key SNOT move. The side studs create a new building plane offset half a plate from the structural wall. That offset IS the shadow reveal that makes Brutalist facades photogenic.",
          highlight: true,
        },
        {
          title: "SNOT Bricks — Upper Storeys",
          instruction:
            "Attach 4 more Brick 1×4 Side Studs at the 4th and 6th storey levels, completing the SNOT mounting grid across the full facade height.",
          pieces: [{ name: "Brick 1×4 Side Studs", part: "30414", qty: 4 }],
          tip: "Spacing the SNOT bricks at every other storey creates alternating bands of textured concrete and smooth window strips — the Barbican's signature rhythm.",
        },
        {
          title: "Grille Texture — Bottom Band",
          instruction:
            "Attach 7 Tile 1×2 Grille to the outward-facing studs of the lowest side-stud bricks. The grille pattern, viewed from the front, reads as bush-hammered concrete texture.",
          pieces: [{ name: "Tile 1×2 Grille", part: "2412b", qty: 7 }],
          tip: "The 80/20 texture rule: cover 80% of each band with grille texture, leave 20% as smooth tile or window. This contrast is what makes the texture visible.",
        },
        {
          title: "Grille Texture — Middle Band",
          instruction:
            "Attach 7 more Tile 1×2 Grille to the mid-level side-stud bricks. Fill every available stud position with grille tiles.",
          pieces: [{ name: "Tile 1×2 Grille", part: "2412b", qty: 7 }],
          tip: "Each grille tile is a miniature abstraction of rough concrete. The repeating pattern creates a moiré effect that reads as surface texture from across the room.",
        },
        {
          title: "Grille Texture — Top Band",
          instruction:
            "Attach the final 6 Tile 1×2 Grille to the upper side-stud bricks, completing the textured concrete surface across all three storey bands.",
          pieces: [{ name: "Tile 1×2 Grille", part: "2412b", qty: 6 }],
          tip: "Step back and look at the facade from 1 metre away. The three textured bands should read as a continuous rough concrete surface with window slots between them.",
        },
        {
          title: "Window Reveals — Bottom Row",
          instruction:
            "Between the textured bands, place 6 Headlight Brick 1×1 at the 2nd-storey window positions. The headlight brick's recessed stud creates a half-plate-deep reveal — the shadow pocket where glass meets concrete.",
          pieces: [{ name: "Headlight Brick 1×1", part: "4070", qty: 6 }],
          tip: "Window reveals are the most important detail in Brutalist architecture. The depth of the recess determines how much shadow the window casts across the day as the sun moves.",
        },
        {
          title: "Window Reveals — Middle Row",
          instruction:
            "Place 5 more Headlight Brick 1×1 at the 4th-storey window positions, spaced evenly across the facade width.",
          pieces: [{ name: "Headlight Brick 1×1", part: "4070", qty: 5 }],
          tip: "Consistent spacing between headlight bricks creates the regular window grid that defines Brutalist residential blocks — one window per living room, repeated identically.",
        },
        {
          title: "Window Reveals — Top Row",
          instruction:
            "Place the final 5 Headlight Brick 1×1 at the 6th-storey window positions, completing the window grid across all three levels.",
          pieces: [{ name: "Headlight Brick 1×1", part: "4070", qty: 5 }],
          tip: "The three rows of headlight bricks should form a perfectly regular grid — same spacing, same depth, same rhythm. This repetition IS the Brutalist democratic ideal.",
        },
        {
          title: "Glazing — Lower Windows",
          instruction:
            "Insert 8 Trans-Clear Brick 1×2 into the bottom-row headlight brick recesses. Push them firmly until they sit flush with the outer face of the grille tiles.",
          pieces: [{ name: "Trans-Clear Brick 1×2", part: "3065", qty: 8 }],
          tip: "Deep-set windows are a thermal strategy — the concrete overhang shades the glass from high summer sun while admitting low winter sun. Form follows climate.",
        },
        {
          title: "Glazing — Middle Windows",
          instruction:
            "Insert 8 more Trans-Clear Brick 1×2 into the middle-row headlight recesses. The transparent bricks should be slightly recessed behind the concrete texture.",
          pieces: [{ name: "Trans-Clear Brick 1×2", part: "3065", qty: 8 }],
          tip: "The recess depth creates a visible shadow line around each window — this shadow line is what gives the facade its three-dimensional quality in photographs.",
        },
        {
          title: "Glazing — Upper Windows",
          instruction:
            "Insert 6 Trans-Clear Brick 1×2 into the top-row headlight recesses. Push them firmly until they sit flush with the outer face of the grille tiles.",
          pieces: [{ name: "Trans-Clear Brick 1×2", part: "3065", qty: 6 }],
          tip: "The top-floor windows complete the regular glazing grid — three rows of identically spaced windows expressing the democratic ideal of social housing.",
        },
        {
          title: "Penthouse Windows — Tall Panels",
          instruction:
            "At the topmost storey, place 6 Trans-Clear Panel 1×2×2 for the larger penthouse window openings. These taller panels signal the premium apartments with double-height ceilings.",
          pieces: [{ name: "Trans-Clear Panel 1×2×2", part: "87552", qty: 6 }],
          tip: "The penthouse windows are taller than the standard floors — this variation at the top signals hierarchy. Even social housing has a top floor worth celebrating.",
        },
        {
          title: "Glazing — Remaining Window Fill",
          instruction:
            "Place the final 6 Trans-Clear Brick 1×2 in any remaining window positions across the facade. Every headlight recess should now contain a transparent piece.",
          pieces: [{ name: "Trans-Clear Brick 1×2", part: "3065", qty: 6 }],
          tip: "Check the facade from the front: you should see alternating bands of rough grille texture and deep-set glass. The contrast between opaque and transparent is the facade's defining quality.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 6: TERRACE BLOCK — BALCONIES & SOFFITS (10 steps, 52 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-terrace-balconies",
      title: "Phase 6 — Terrace Block: Balconies & Soffits",
      concept: "Cantilever & Shadow",
      color: "#059669",
      icon: "🏢",
      time: "25–35 min",
      location:
        "Cantilevered balconies are the Barbican's most recognisable residential feature — concrete slabs projecting from the facade, casting deep shadows on the floors below. You will pre-assemble each balcony row as a sub-assembly (plate + inverted slope soffit) before attaching to the facade. This avoids the difficulty of reaching underneath already-placed balcony slabs.",
      steps: [
        {
          title: "Balcony Sub-Assembly 1 — Plates",
          instruction:
            "On your work surface (not on the model), lay 3 Plate 1×6 end-to-end. These form the floor slab of the first (lowest) balcony row.",
          pieces: [{ name: "Plate 1×6", part: "3666", qty: 3 }],
          tip: "Pre-assembling the soffit onto the balcony slab before mounting is much easier than trying to attach inverted slopes underneath an already-placed slab.",
          highlight: true,
        },
        {
          title: "Balcony Sub-Assembly 1 — Soffits",
          instruction:
            "Flip the 3-plate slab over and attach 4 Slope 1×2 Inverted underneath, evenly spaced. These represent the visible concrete soffit seen from below. Flip back and set aside.",
          pieces: [{ name: "Slope 1×2 Inverted", part: "3665", qty: 4 }],
          tip: "The inverted slopes taper the slab edge, creating the characteristic Brutalist cantilever profile — thick at the wall, thin at the outer edge.",
        },
        {
          title: "Balcony Sub-Assembly 2 — Plates & Soffits",
          instruction:
            "Build the second balcony row: 3 Plate 1×6 as the floor slab, then flip and attach 3 Slope 1×3 Inverted underneath for wider soffit profiles. Set aside.",
          pieces: [
            { name: "Plate 1×6", part: "3666", qty: 3 },
            { name: "Slope 1×3 Inverted", part: "4287", qty: 3 },
          ],
          tip: "Varying the soffit type between balcony rows creates visual interest — the real Barbican uses different soffit depths at different levels.",
        },
        {
          title: "Balcony Sub-Assembly 3 — Wide Balcony",
          instruction:
            "Build the third (widest) balcony: place 2 Plate 1×6 as the slab, then flip and attach 4 Slope 2×2 Inverted underneath for the widest cantilever. Also attach 3 Slope 1×3 Inverted at the edges. Set aside.",
          pieces: [
            { name: "Plate 1×6", part: "3666", qty: 2 },
            { name: "Slope 2×2 Inverted", part: "3660", qty: 4 },
            { name: "Slope 1×3 Inverted", part: "4287", qty: 3 },
          ],
          tip: "The 4th-storey balcony is the widest in the real Barbican — it projects furthest and casts the deepest shadow. The 2×2 inverted slopes create this extra depth.",
        },
        {
          title: "Balcony Sub-Assembly 4 — Inverted Slopes",
          instruction:
            "Build the 4th balcony row using 3 Slope 1×2 Inverted and 2 Slope 2×2 Inverted as the soffit profile. Lay the slopes on your work surface, slab on top.",
          pieces: [
            { name: "Slope 1×2 Inverted", part: "3665", qty: 3 },
            { name: "Slope 2×2 Inverted", part: "3660", qty: 2 },
          ],
          tip: "The upper balconies are narrower than the lower ones — the building steps back as it rises, maintaining sunlight access to lower floors.",
        },
        {
          title: "Balcony Sub-Assemblies 5-6 — Soffits",
          instruction:
            "Build the final 2 balcony rows using 3 Slope 1×2 Inverted and 2 Slope 2×2 Inverted as the soffit profiles. Set aside with the other sub-assemblies.",
          pieces: [
            { name: "Slope 1×2 Inverted", part: "3665", qty: 3 },
            { name: "Slope 2×2 Inverted", part: "3660", qty: 2 },
          ],
          tip: "These final two rows are the narrowest balconies — they project just far enough to cast a shadow line on the floor below.",
        },
        {
          title: "Upper Balcony Surface Tiles",
          instruction:
            "Top all 3 upper balcony sub-assemblies with 8 Tile 1×4 as smooth surface strips. These create the smooth walking surfaces that contrast with the rough facade behind.",
          pieces: [{ name: "Tile 1×4", part: "2431", qty: 8 }],
          tip: "The tile strips on top of the balcony slabs create the smooth walking surfaces — the defining textural contrast of Brutalist residential architecture.",
        },
        {
          title: "Attach Balconies — Lower Rows",
          instruction:
            "Clip the 3 lower balcony sub-assemblies onto the facade at storey levels 2, 3, and 4. Work from the bottom up — attach the lowest first. Since the soffits are pre-attached, no reaching underneath is needed.",
          pieces: [],
          tip: "Work from the bottom up — the lower balconies provide a visual reference for aligning the upper ones.",
        },
        {
          title: "Attach Balconies — Upper Rows",
          instruction:
            "Clip the 3 upper balcony sub-assemblies onto storeys 5, 6, and 7. Ensure each row is parallel to the one below. The facade should now have 6 distinct horizontal shadows.",
          pieces: [],
          tip: "Six balcony rows create six shadow lines — this layered horizontal effect is what makes the Barbican terraces so photogenic in low afternoon light.",
        },
        {
          title: "Balcony Surface — Long Tiles",
          instruction:
            "Top each balcony slab with smooth tiles to contrast with the rough textured facade. Place 6 Tile 1×6 across the widest balcony rows as smooth walking surfaces.",
          pieces: [{ name: "Tile 1×6", part: "6636", qty: 6 }],
          tip: "Smooth vs. rough is the fundamental contrast in Brutalist architecture. Smooth surfaces are for touching (floors, handrails); rough surfaces are for looking at (walls, columns).",
        },
        {
          title: "Balcony Surface — Short Tiles",
          instruction:
            "Fill remaining balcony surfaces with 6 Tile 1×2 on the narrower upper balcony rows. Every balcony should have a smooth top surface.",
          pieces: [{ name: "Tile 1×2", part: "3069b", qty: 6 }],
          tip: "The smooth tile contrasts with the studded structure below the slab — you can see the difference between 'floor' and 'ceiling' even at this micro scale.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 7: BARREL VAULT ROOF (10 steps, 52 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-barrel-vault",
      title: "Phase 7 — Barrel Vault Roof",
      concept: "Form & Silhouette",
      color: "#7C3AED",
      icon: "🌀",
      time: "20–30 min",
      location:
        "The barrel vault is the terrace block's crown — a long, curved concrete roof that gives the Barbican its unmistakable silhouette. In the real estate, these vaults cover the top-floor maisonettes and contain the building's mechanical systems. The curve is both structural (a vault is stronger than a flat roof) and sculptural (it breaks the skyline with a soft organic form against the tower's hard geometry). IMPORTANT: Leave the rightmost 6 studs of the terrace block UNBUILT — this reserved section is where the Conservatory will be built in Phase 11.",
      steps: [
        {
          title: "Vault Curve — Left Half",
          instruction:
            "IMPORTANT: Leave the rightmost 6 studs UNBUILT for the Conservatory. Along the left half of the terrace top, place 6 Curved Slope 3×1 in two opposing rows (3 facing left, 3 facing right) to create the barrel vault curve. The curves should meet at the ridge line.",
          pieces: [{ name: "Curved Slope 3×1", part: "50950", qty: 6 }],
          tip: "A barrel vault is a half-cylinder. At LEGO scale, the curve is suggested rather than literal — the brain fills in the smooth curve from these stepped facets.",
          highlight: true,
        },
        {
          title: "Vault Curve — Right Half",
          instruction:
            "Place 6 more Curved Slope 3×1 continuing the vault across the right half of the terrace (stopping 6 studs from the right edge). Mirror the left half's arrangement.",
          pieces: [{ name: "Curved Slope 3×1", part: "50950", qty: 6 }],
          tip: "Symmetry is key — sight along the ridge line to ensure both halves curve identically. Any asymmetry in the vault reads as structural failure.",
        },
        {
          title: "Vault Enrichment — Left",
          instruction:
            "Between and atop the left-half curved slopes, place 6 Curved Top Brick 1×2 to fill gaps and create a smoother profile. These soften the stepped facets of the main curves.",
          pieces: [{ name: "Curved Top Brick 1×2", part: "6091", qty: 6 }],
          tip: "In architecture, 'enrichment' means adding detail to a primary form. The curved top bricks soften the stepped facets — like moulding profiles soften a classical cornice.",
        },
        {
          title: "Vault Enrichment — Right",
          instruction:
            "Place 6 more Curved Top Brick 1×2 across the right half of the vault, matching the left side's enrichment pattern.",
          pieces: [{ name: "Curved Top Brick 1×2", part: "6091", qty: 6 }],
          tip: "The enriched vault should now read as a continuous, smoothly curved surface from end to end. No sharp steps should be visible in profile.",
        },
        {
          title: "Eave Slopes — Narrow Ends",
          instruction:
            "At each end of the vault, place 4 Slope 1×2 (45 degrees) to transition from the curved roof down to the flat end walls. Use 2 per end, angled inward.",
          pieces: [{ name: "Slope 1×2 (45°)", part: "3040", qty: 4 }],
          tip: "The eave (where roof meets wall) is one of the most important lines in any building. A clean, sharp eave makes the vault look intentional.",
        },
        {
          title: "Eave Slopes — Long Sides",
          instruction:
            "Along the front and back eaves (where vault meets facade), place 4 more Slope 1×2 (45 degrees) and 3 Slope 2×2 (45 degrees) to create the broad transition to the vertical walls.",
          pieces: [
            { name: "Slope 1×2 (45°)", part: "3040", qty: 4 },
            { name: "Slope 2×2 (45°)", part: "3039", qty: 3 },
          ],
          tip: "The long-side eaves are the most visible in the lakeside view. They create a continuous shadow line that defines where wall becomes roof.",
        },
        {
          title: "Eave Slopes — Remaining",
          instruction:
            "Place the remaining 3 Slope 2×2 (45 degrees) at the broader faces of the vault transition, filling any gaps between the 1×2 slopes placed in the previous step.",
          pieces: [{ name: "Slope 2×2 (45°)", part: "3039", qty: 3 }],
          tip: "No gaps at the eave line — every opening lets light through and breaks the illusion of a solid concrete roof. Seal every joint.",
        },
        {
          title: "Ridge Cap — Smooth Tiles",
          instruction:
            "Cap the vault's ridge with 6 Tile 1×8 running the full length of the terrace block. The smooth tiles create a clean, unbroken line along the very top of the curve.",
          pieces: [{ name: "Tile 1×8", part: "4162", qty: 6 }],
          tip: "The ridge line is what you see in every photograph of the Barbican's terraces — a long horizontal curve against the sky. Making it smooth (tiled) distinguishes it from the rough textured walls below.",
        },
        {
          title: "Hip Corners — Front",
          instruction:
            "Where the vault ends meet the front end walls, place 4 Slope 2×2 Double Convex to create the hip corners — the compound curves where two roof surfaces intersect.",
          pieces: [{ name: "Slope 2×2 Double Convex", part: "3045", qty: 4 }],
          tip: "Hip corners are where geometry gets complex — two curved surfaces meeting at an angle. In real roofing, this is the hardest joint to waterproof. The double convex slope elegantly resolves this intersection.",
        },
        {
          title: "Hip Corners — Back",
          instruction:
            "Place 4 more Slope 2×2 Double Convex at the back hip corners, completing the vault's compound curve transitions on all four corners.",
          pieces: [{ name: "Slope 2×2 Double Convex", part: "3045", qty: 4 }],
          tip: "The completed vault should now have a smooth, continuous profile from every angle. Run your finger along the ridge — it should feel unbroken from end to end.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 8: LAUDERDALE TOWER — ABOVE THE ROOFLINE (10 steps, 92 pieces)
    // Lower shaft already built in Phase 4
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-tower-core",
      title: "Phase 8 — Lauderdale Tower: Above the Roofline",
      concept: "Verticality & Proportion",
      color: "#BE185D",
      icon: "🗼",
      time: "25–35 min",
      location:
        "The tower base and lower shaft were built in Phase 4 as part of the interleaved terrace+tower construction. This phase covers ONLY the visible portion above the terrace roofline. Lauderdale Tower is the Barbican's tallest residential building at 123 metres (42 storeys). The lower courses are hidden behind the terrace, but they are essential structure carrying all the vertical load down to the foundation.",
      steps: [
        {
          title: "Front Corner SNOT — Left",
          instruction:
            "Place 2 Brick 1×1 Studs 4 Sides on the tower's front-left corner, one at course 10 and one at course 15. These create attachment points for facade cladding on the visible faces.",
          pieces: [{ name: "Brick 1×1 Studs 4 Sides", part: "4733", qty: 2 }],
          tip: "Place SNOT bricks now while the front corners are still accessible — the barrel vault partially obstructs this zone later.",
          highlight: true,
        },
        {
          title: "Front Corner SNOT — Right",
          instruction:
            "Place 2 more Brick 1×1 Studs 4 Sides on the tower's front-right corner at the same heights as the left side.",
          pieces: [{ name: "Brick 1×1 Studs 4 Sides", part: "4733", qty: 2 }],
          tip: "SNOT bricks at corners are the most powerful technique in Architecture Studio building. They allow cladding to wrap around corners seamlessly.",
        },
        {
          title: "Tower Emerging — Courses 10-14",
          instruction:
            "The tower emerges above the terrace vault. Place 8 Brick 1×3 in courses 10-14, maintaining strict bond pattern. These are the first fully visible courses.",
          pieces: [{ name: "Brick 1×3", part: "3622", qty: 8 }],
          tip: "From here up, every course is fully visible and should be clean. No sloppy joints — the tower is the tallest element and draws the eye first.",
        },
        {
          title: "Tower Emerging — Corner Fill",
          instruction:
            "Fill corner positions in courses 10-14 with 8 Brick 1×1. These complete each course's perimeter and create tight corners.",
          pieces: [{ name: "Brick 1×1", part: "3005", qty: 8 }],
          tip: "1×1 bricks at corners allow the bond pattern to shift direction — they are the keystone that locks each course together.",
        },
        {
          title: "Structural Plates — Mid Tower",
          instruction:
            "Insert 4 Plate 2×4 spanning the entire tower cross-section at courses 12 and 14. Press each plate down firmly before continuing.",
          pieces: [{ name: "Plate 2×4", part: "3020", qty: 4 }],
          tip: "Structural plates every 5 courses mimic real construction where floor slabs brace the walls against buckling. Without these plates, a tall LEGO wall will eventually lean or topple.",
        },
        {
          title: "Tower Courses 15-19",
          instruction:
            "Continue building with 8 more Brick 1×3 in strict bond pattern. Every course is fully visible from the lakeside — keep them clean and level.",
          pieces: [{ name: "Brick 1×3", part: "3622", qty: 8 }],
          tip: "The mid-section of the tower is its most regular zone — identical floor plates stacked repetitively. This is the democratic rhythm of social housing: same apartment, same view, 42 times.",
        },
        {
          title: "Tower Courses 15-19 — Corner Fill",
          instruction:
            "Fill corners and ends of courses 15-19 with 8 more Brick 1×1. Maintain the alternating bond pattern established below.",
          pieces: [{ name: "Brick 1×1", part: "3005", qty: 8 }],
          tip: "Consistent bond at every level means the tower reads as a single monolithic structure, not a stack of separate floors.",
        },
        {
          title: "Upper Tower — Hollow Core Courses 20-25",
          instruction:
            "From course 20 upward, build the tower as a hollow shell — walls only, no filled centre. Place 8 Brick 2×2 along the outer perimeter ring, leaving the 4×2 interior empty. This cuts weight by roughly 40%.",
          pieces: [{ name: "Brick 2×2", part: "3003", qty: 8 }],
          tip: "Real skyscrapers are hollow — the structural core is at the perimeter or centre, not solid concrete all the way through. A hollow LEGO tower above course 20 is both more realistic and more stable.",
        },
        {
          title: "Upper Tower — Perimeter Courses 26-28",
          instruction:
            "Continue the hollow perimeter with 5 Brick 2×2 and 2 Brick 1×1 at corners for courses 26-28. Keep the interior hollow.",
          pieces: [
            { name: "Brick 2×2", part: "3003", qty: 5 },
            { name: "Brick 1×1", part: "3005", qty: 2 },
          ],
          tip: "The hollow core is lighter but needs careful alignment. Keep the perimeter walls plumb (perfectly vertical) by pressing each course down firmly.",
        },
        {
          title: "Upper Tower — Perimeter Courses 29-30",
          instruction:
            "Place 5 more Brick 2×2 and 2 Brick 1×1 for courses 29-30. Keep the interior hollow and the perimeter walls plumb.",
          pieces: [
            { name: "Brick 2×2", part: "3003", qty: 5 },
            { name: "Brick 1×1", part: "3005", qty: 2 },
          ],
          tip: "These are the highest brick courses in the tower. Press firmly — any looseness at this height will cause visible lean.",
        },
        {
          title: "Upper Tower — Structural Plates",
          instruction:
            "Insert 6 Plate 2×3 as structural plates through the upper courses, one every 5th course. These lock the thin perimeter walls together.",
          pieces: [{ name: "Plate 2×3", part: "3021", qty: 6 }],
          tip: "Without structural plates, the thin perimeter walls can spread apart under their own weight. These plates are the difference between a tower that stands and one that leans.",
        },
        {
          title: "Upper Tower — Final Visible Courses",
          instruction:
            "Complete the tower shaft to its full height with 6 Plate 2×3 as the final structural plates. The tower should now be a continuous brick stack from base plate to crown — no structural gaps.",
          pieces: [{ name: "Plate 2×3", part: "3021", qty: 6 }],
          tip: "Step back and look at the tower from the side. It should be perfectly vertical — any lean is visible at this height. If it leans, gently straighten it now before adding facade pieces.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 9: TOWER — FACADE & WINDOW BANDS (10 steps, 64 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-tower-facade",
      title: "Phase 9 — Tower: Facade & Window Bands",
      concept: "Grid & Repetition",
      color: "#0891B2",
      icon: "📐",
      time: "30–40 min",
      location:
        "The tower's facade is a strict grid of horizontal concrete bands and vertical window strips. Unlike the terrace's textured wall, the tower reads as a stack of identical floor plates — the same apartment repeated 42 times. This repetition is deliberate: it expresses the democratic ideal of social housing where every resident gets the same quality of space. Front corner SNOT bricks were placed in Phase 8; this phase covers the remaining visible faces.",
      steps: [
        {
          title: "Rear Corner SNOT — 4-Sided Bricks",
          instruction:
            "At each rear corner of the tower, place 4 Brick 1×1 Studs 4 Sides vertically, one every 5 courses. These create corner attachment points for cladding on the back face.",
          pieces: [{ name: "Brick 1×1 Studs 4 Sides", part: "4733", qty: 4 }],
          tip: "The 4-sided SNOT brick handles corners where two cladding planes meet. It provides attachment in all four cardinal directions.",
          highlight: true,
        },
        {
          title: "Rear Corner SNOT — Additional",
          instruction:
            "Place 4 more Brick 1×1 Studs 4 Sides at intermediate positions on the rear corners, filling the vertical gaps between the bricks placed in Step 1.",
          pieces: [{ name: "Brick 1×1 Studs 4 Sides", part: "4733", qty: 4 }],
          tip: "More SNOT mounting points mean smoother cladding attachment. The real tower has continuous cladding — not intermittent patches.",
        },
        {
          title: "Edge SNOT — 2-Sided Bricks",
          instruction:
            "Along each flat face between corners, place 6 Brick 1×1 Studs 2 Sides. Distribute them evenly up the tower height on the side faces.",
          pieces: [{ name: "Brick 1×1 Studs 2 Sides", part: "47905", qty: 6 }],
          tip: "The 2-sided SNOT brick is the workhorse of tower facades — it provides cladding attachment along flat faces while the 4-sided brick handles corners.",
        },
        {
          title: "Edge SNOT — Remaining",
          instruction:
            "Place the remaining 6 Brick 1×1 Studs 2 Sides on the opposite side face. The tower should now have SNOT mounting points on all three visible faces.",
          pieces: [{ name: "Brick 1×1 Studs 2 Sides", part: "47905", qty: 6 }],
          tip: "Together, the 4-sided and 2-sided SNOT bricks create a complete wrapping surface around the tower. Every visible face can now receive cladding.",
        },
        {
          title: "Horizontal Banding — Lower Grilles",
          instruction:
            "At every 5th course on the lower half of the tower, insert 8 Grille Brick 1×2 in horizontal bands across the full facade width. These create the distinctive dark horizontal striping.",
          pieces: [{ name: "Grille Brick 1×2", part: "2877", qty: 8 }],
          tip: "Horizontal banding expresses the floor plates — each line says 'a floor slab is here.' This honest expression of structure is a core Brutalist principle.",
        },
        {
          title: "Horizontal Banding — Upper Grilles",
          instruction:
            "Continue the grille brick banding on the upper half of the tower with 8 more Grille Brick 1×2. The banding should be continuous from base to crown.",
          pieces: [{ name: "Grille Brick 1×2", part: "2877", qty: 8 }],
          tip: "The unbroken horizontal lines from base to top express the tower as a single continuous structure — not separate sections. This continuity is powerful.",
        },
        {
          title: "Staggered Windows — Jumper Plates",
          instruction:
            "Between the grille bands, place 6 Jumper Plate 1×2 in alternating positions on the lower half. These create half-stud offsets suggesting the staggered window pattern of the real towers.",
          pieces: [{ name: "Jumper Plate 1×2", part: "15573", qty: 6 }],
          tip: "Jumper plates are the subtlest detail — a half-stud offset is almost invisible but it breaks the grid just enough to create visual interest. Architects call this 'syncopation.'",
        },
        {
          title: "Staggered Windows — Upper Jumpers",
          instruction:
            "Place 6 more Jumper Plate 1×2 on the upper half of the tower, continuing the staggered pattern established below.",
          pieces: [{ name: "Jumper Plate 1×2", part: "15573", qty: 6 }],
          tip: "The staggered pattern should be consistent from bottom to top — same rhythm, same offset. The eye picks up any irregularity instantly at this height.",
        },
        {
          title: "Smooth Floor Bands — Lower 1×2 Tiles",
          instruction:
            "Between the grille bands on the lower half, fill positions with 8 Tile 1×2 for smooth floor-line surfaces. The narrow tiles fit between the jumper plates.",
          pieces: [{ name: "Tile 1×2", part: "3069b", qty: 8 }],
          tip: "The grille/tile alternation creates a moiré effect when viewed from a distance — the bands seem to shimmer, exactly as the real tower's facade does from the lakeside.",
        },
        {
          title: "Smooth Floor Bands — Lower 2×2 Tiles",
          instruction:
            "Fill the wider positions in the lower floor bands with 3 Tile 2×2. These larger tiles create broader smooth sections between the textured grille bands.",
          pieces: [{ name: "Tile 2×2", part: "3068b", qty: 3 }],
          tip: "The mix of 1×2 and 2×2 tiles prevents a monotonous texture — the variation in tile size creates subtle visual interest within each smooth band.",
        },
        {
          title: "Smooth Floor Bands — Upper Tiles",
          instruction:
            "Fill the remaining upper positions with 6 Tile 1×2 and 3 Tile 2×2, completing the alternating texture rhythm across the full tower height.",
          pieces: [
            { name: "Tile 1×2", part: "3069b", qty: 6 },
            { name: "Tile 2×2", part: "3068b", qty: 3 },
          ],
          tip: "Stand back and view the tower from across the room. The banding should be visible as alternating light and dark horizontal lines — the tower's signature rhythm against the sky.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 10: TOWER — SERRATED EDGES & CROWN (10 steps, 60 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-tower-crown",
      title: "Phase 10 — Tower: Serrated Edges & Crown",
      concept: "Silhouette & Skyline",
      color: "#4338CA",
      icon: "👑",
      time: "25–35 min",
      location:
        "The tower's most distinctive feature is its serrated profile — the saw-tooth balcony edges that give the Barbican towers their jagged silhouette against the sky. The crown (top few storeys) steps back progressively, creating the characteristic tapered profile visible from miles away across the City of London.",
      steps: [
        {
          title: "Serrated Left Edge — Wedge Plates",
          instruction:
            "Along the left edge of the tower, attach all 8 Wedge 2×4 Left at every balcony level (every 5 courses), projecting 1 stud beyond the facade. Work from bottom to top.",
          pieces: [{ name: "Wedge 2×4 Left", part: "41768", qty: 8 }],
          tip: "The wedge pairs MUST mirror each other — left on left, right on right. Stand behind the build and sight along the tower's edge: you should see a zigzag silhouette like shark's teeth.",
          highlight: true,
        },
        {
          title: "Serrated Right Edge — Wedge Plates",
          instruction:
            "Mirror the left edge with all 8 Wedge 2×4 Right on the right edge at the same levels. The tower now has matching saw-tooth profiles on both sides.",
          pieces: [{ name: "Wedge 2×4 Right", part: "41767", qty: 8 }],
          tip: "Check the symmetry by looking straight down at the tower from above. Both edges should zigzag identically — any mismatch breaks the tower's visual balance.",
        },
        {
          title: "Fine Serration — Left Edge",
          instruction:
            "Between the wedge plates on the left edge, place 9 Cheese Slope 1×1 at alternating angles to create finer saw-tooth texture at the smaller scale.",
          pieces: [{ name: "Cheese Slope 1×1×⅔", part: "54200", qty: 9 }],
          tip: "Cheese slopes create the delicate micro-serration between the larger wedge teeth — a fractal detail where the small pattern echoes the large one.",
        },
        {
          title: "Fine Serration — Right Edge",
          instruction:
            "Place 9 more Cheese Slope 1×1 on the right edge, mirroring the left side's micro-serration pattern.",
          pieces: [{ name: "Cheese Slope 1×1×⅔", part: "54200", qty: 9 }],
          tip: "The combined effect of large wedges and small cheese slopes creates a complex serrated profile — the signature of Barbican tower design visible from every angle.",
        },
        {
          title: "Crown — Main 45-Degree Slopes",
          instruction:
            "At the top of the tower, begin the crown taper. Place all 8 Slope 2×4 (45 degrees) on all four sides, angled inward. These create the first major step-back of the crown profile.",
          pieces: [{ name: "Slope 2×4 (45°)", part: "3037", qty: 8 }],
          tip: "The crown taper serves a practical purpose — it houses mechanical equipment while creating the distinctive pointed profile. Form follows function.",
        },
        {
          title: "Crown Transition — Large Gentle Slopes",
          instruction:
            "Above the 45-degree slopes, place 6 Slope 3×4 (25 degrees) to continue the taper at a shallower angle. These create the elongated pyramid profile of the crown.",
          pieces: [{ name: "Slope 3×4 (25°)", part: "3297", qty: 6 }],
          tip: "Using multiple slope angles (45 degrees, then 25 degrees) creates a compound curve — the crown appears to taper smoothly rather than ending in a blunt pyramid.",
        },
        {
          title: "Crown Transition — Medium Slopes",
          instruction:
            "Place 6 Slope 2×3 (25 degrees) above and between the 3×4 slopes, narrowing the crown further. The taper should be getting visibly steeper.",
          pieces: [{ name: "Slope 2×3 (25°)", part: "3298", qty: 6 }],
          tip: "This compound tapering is a signature of 1960s tower design — the crown narrows in stages rather than one abrupt angle.",
        },
        {
          title: "Crown Peak — 65-Degree Slopes",
          instruction:
            "For the upper crown, stack 6 Slope 1×2×2 (65 degrees) to create the steep near-vertical peak zone. Place them in opposing pairs.",
          pieces: [{ name: "Slope 1×2×2 (65°)", part: "60481", qty: 6 }],
          tip: "The transition from 25 degrees to 65 degrees creates a dramatic acceleration — the crown appears to shoot upward in its final few storeys.",
        },
        {
          title: "Crown Peak — 75-Degree Slopes",
          instruction:
            "Place 4 Slope 1×2×3 (75 degrees) at the very top of the crown, creating the near-vertical final peak. These should converge to a narrow point.",
          pieces: [{ name: "Slope 1×2×3 (75°)", part: "4460b", qty: 4 }],
          tip: "A tower's crown is its signature against the skyline — like a person's hat defines their silhouette. The Barbican towers are recognisable from any angle because of this distinctive compound taper.",
        },
        {
          title: "Crown Peak — Final Point",
          instruction:
            "Place the final 4 Slope 1×2×3 (75 degrees) to complete the crown's sharp peak. The tower should terminate in a clean, decisive point — not trail off uncertainly.",
          pieces: [{ name: "Slope 1×2×3 (75°)", part: "4460b", qty: 4 }],
          tip: "Stand at the base of the model and look straight up at the tower. The crown's compound taper should create a dramatic, soaring silhouette that draws the eye upward. This is the emotional climax of the build.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 11: THE CONSERVATORY (12 steps, 64 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-conservatory",
      title: "Phase 11 — The Conservatory",
      concept: "Light & Enclosure",
      color: "#16A34A",
      icon: "🌿",
      time: "25–30 min",
      location:
        "The Barbican Conservatory is the second-largest greenhouse in London, built atop the fly tower of the Barbican Arts Centre. It is a tropical garden enclosed in a curved glass roof — a complete contrast to the heavy concrete around it. You are building this glass jewel atop the right end of the terrace block, where it catches the light and offers views across the lake.",
      steps: [
        {
          title: "Curved Walls — Front Arc",
          instruction:
            "At the right end of the terrace block, in the reserved vault gap, place 4 Macaroni Brick 2×2 (quarter-circle bricks) in an arc with open sides facing inward. These form the front curve of the conservatory glass wall.",
          pieces: [{ name: "Macaroni Brick 2×2", part: "85080", qty: 4 }],
          tip: "The conservatory's organic curved form is deliberate contrast to the rectilinear concrete blocks. This tension between curve and straight line runs through the entire Barbican design.",
          highlight: true,
        },
        {
          title: "Curved Walls — Side Arcs",
          instruction:
            "Place 4 more Macaroni Brick 2×2 curving around the left and right sides of the conservatory footprint, extending the arc from the front.",
          pieces: [{ name: "Macaroni Brick 2×2", part: "85080", qty: 4 }],
          tip: "The curved walls should wrap around at least 270 degrees — the conservatory is almost fully enclosed, with only the terrace-facing side open.",
        },
        {
          title: "Curved Walls — Back Arc",
          instruction:
            "Complete the conservatory enclosure with the final 4 Macaroni Brick 2×2, closing the back of the curved wall. Leave small gaps for the glazing.",
          pieces: [{ name: "Macaroni Brick 2×2", part: "85080", qty: 4 }],
          tip: "The complete curve should read as a continuous wall when viewed from above — a smooth oval against the rectangular terrace block.",
        },
        {
          title: "Corner Infill — Left Side",
          instruction:
            "Fill the angular sections between curves with 6 Brick 2×2 Corner pieces on the left and front sides. These bridge the gaps where the quarter-circle bricks do not quite meet.",
          pieces: [{ name: "Brick 2×2 Corner", part: "2357", qty: 6 }],
          tip: "Corner bricks make the curve appear continuous — without them, the conservatory walls would have visible gaps at every quarter-turn.",
        },
        {
          title: "Corner Infill — Right Side",
          instruction:
            "Place 6 more Brick 2×2 Corner pieces on the right and back sides of the conservatory, completing the wall frame.",
          pieces: [{ name: "Brick 2×2 Corner", part: "2357", qty: 6 }],
          tip: "The completed wall frame should feel solid and self-supporting. It needs to hold glazing and support the roof slopes.",
        },
        {
          title: "Glazing — Front Windows",
          instruction:
            "Fill the openings between the curved frame pieces with 6 Trans-Clear Brick 1×2 on the front-facing wall sections. The transparent bricks suggest steel-framed greenhouse glazing.",
          pieces: [{ name: "Trans-Clear Brick 1×2", part: "3065", qty: 6 }],
          tip: "The white curved bricks represent the steel frame, the transparent bricks represent the glass. This frame-and-infill logic is the same as a curtain wall.",
        },
        {
          title: "Glazing — Side & Back Windows",
          instruction:
            "Place 6 more Trans-Clear Brick 1×2 in the remaining wall openings around the sides and back of the conservatory.",
          pieces: [{ name: "Trans-Clear Brick 1×2", part: "3065", qty: 6 }],
          tip: "The conservatory should now glow with transparency — a glass jewel set against the heavy concrete of the terrace block.",
        },
        {
          title: "Interior Planting — Dense Clusters",
          instruction:
            "Before capping with the roof, scatter 8 Plate 1×1 Round inside the conservatory. Cluster them densely to suggest the tropical garden visible through the glass walls.",
          pieces: [{ name: "Plate 1×1 Round", part: "4073", qty: 8 }],
          tip: "Place the planting before the roof goes on — once the roof is in place, you cannot reach inside. Clustered round plates suggest dense tropical planting from above.",
        },
        {
          title: "Interior Planting — Scattered",
          instruction:
            "Add 8 more Plate 1×1 Round scattered more sparsely around the conservatory interior and surrounding terrace. Leave gaps for floor sections.",
          pieces: [{ name: "Plate 1×1 Round", part: "4073", qty: 8 }],
          tip: "Sparse planting around the edges contrasts with the dense clusters inside. This creates the feel of cultivation grading into wildness.",
        },
        {
          title: "Interior Floor Sections",
          instruction:
            "Place 8 Plate 2×2 as floor sections between the planting areas inside the conservatory. These represent the paths and viewing platforms within the botanical garden.",
          pieces: [{ name: "Plate 2×2", part: "3022", qty: 8 }],
          tip: "The contrast between dense plant clusters and open floor areas creates the feel of a real botanical garden — paths winding between planted beds.",
        },
        {
          title: "Glass Roof",
          instruction:
            "Cap the conservatory with all 8 Slope 2×4 (18 degrees) spanning the full width of the footprint. The shallow pitch allows maximum light penetration while shedding rain.",
          pieces: [{ name: "Slope 2×4 (18°)", part: "30363", qty: 8 }],
          tip: "An 18-degree pitch is typical of greenhouse roofs — steep enough to shed rain, shallow enough to admit winter sun at London's latitude.",
        },
        {
          title: "Rooftop Platform — Round Corners",
          instruction:
            "Surround the conservatory with 8 Plate 4×4 Round Corner to create the curved rooftop viewing platform. In the real Barbican, there is a terrace around the conservatory offering panoramic views.",
          pieces: [
            { name: "Plate 4×4 Round Corner", part: "30565", qty: 8 },
          ],
          tip: "The round corner plates create an organic terrace outline that contrasts with the rectangular platform below — another instance of the Barbican's curve-vs-straight dialogue.",
        },
        {
          title: "Platform Connections — Pin Plates",
          instruction:
            "Connect the rooftop platform to the terrace block below using all 8 Plate 4×4 Round w/ Pin as structural anchors. These lock the conservatory assembly firmly to the terrace.",
          pieces: [
            { name: "Plate 4×4 Round w/ Pin", part: "60474", qty: 8 },
          ],
          tip: "The pin connections prevent the conservatory from sliding or rotating on the terrace surface. This is essential — the conservatory sits at the exposed end of the terrace block where it is most vulnerable to bumps.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 12: LANDSCAPING & DETAILS (15 steps, 119 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-landscaping",
      title: "Phase 12 — Landscaping & Details",
      concept: "Context & Completion",
      color: "#65A30D",
      icon: "🌳",
      time: "30–40 min",
      location:
        "The final phase ties everything together with landscaping, walkway surfaces, and finishing details. The Barbican's landscape design is as deliberate as its architecture — every tree, bench, and paving pattern was specified by the architects. This phase transforms your diorama from a collection of buildings into a place.",
      steps: [
        {
          title: "Garden Grade Changes — Terrace Base",
          instruction:
            "Around the base of the terrace block, place 5 Slope 1×3 (25 degrees) as gentle terrain changes. Concentrate them between the podium and the terrace block to suggest raised planting beds.",
          pieces: [{ name: "Slope 1×3 (25°)", part: "4286", qty: 5 }],
          tip: "Grade changes (gentle slopes in the ground plane) are what make a landscape feel natural. Even 1-plate height differences create shadow lines that read as terrain.",
        },
        {
          title: "Garden Grade Changes — Tower Base",
          instruction:
            "Place 5 more Slope 1×3 (25 degrees) around the tower base and the transition zone where tower meets terrace. These suggest the graded gardens surrounding the real buildings.",
          pieces: [{ name: "Slope 1×3 (25°)", part: "4286", qty: 5 }],
          tip: "The tower base should feel grounded in landscape — not just sitting on a flat plate. Slopes create the visual anchor that connects building to earth.",
        },
        {
          title: "Walkway Tiles — Podium Surface",
          instruction:
            "Scatter 8 Tile 1×1 across the podium deck as smooth walking surfaces. Concentrate them along desire lines — the paths people would naturally walk between buildings.",
          pieces: [{ name: "Tile 1×1", part: "3070b", qty: 8 }],
          tip: "Smooth tiles on the ground plane vs. rough studs on buildings: this contrast tells the viewer what is 'floor' and what is 'wall' — a fundamental architectural distinction.",
        },
        {
          title: "Walkway Tiles — Ground Level",
          instruction:
            "Place 8 more Tile 1×1 at ground level around the base of the terrace and between the podium columns. These create the pedestrian surfaces.",
          pieces: [{ name: "Tile 1×1", part: "3070b", qty: 8 }],
          tip: "Every smooth tile is a signal that says 'walk here.' The studded areas say 'this is structure, not path.' This distinction is legible even at micro scale.",
        },
        {
          title: "Walkway Tiles — Lake Edge",
          instruction:
            "Place 7 Tile 1×1 along the lake edge walkway. These are the highest-traffic zones in the real Barbican — the famous lakeside promenade.",
          pieces: [{ name: "Tile 1×1", part: "3070b", qty: 7 }],
          tip: "The lakeside path is the Barbican's most popular walk — residents, tourists, and office workers all converge here. Dense tiling signals high traffic.",
        },
        {
          title: "Walkway Tiles — Conservatory Entrance",
          instruction:
            "Place 7 more Tile 1×1 around the conservatory entrance area and remaining plaza zones. Every walkway should now have a smooth tiled surface.",
          pieces: [{ name: "Tile 1×1", part: "3070b", qty: 7 }],
          tip: "The conservatory entrance is a key gathering point — people pause here to transition from the open podium to the enclosed tropical garden.",
        },
        {
          title: "Long Walkway Strips",
          instruction:
            "Lay 6 Tile 1×6 in lines across the podium to create long walkway strips. Place them parallel to the terrace block, running the full width of the podium.",
          pieces: [{ name: "Tile 1×6", part: "6636", qty: 6 }],
          tip: "Long tile strips create directional flow — they lead the eye from one end of the podium to the other. Paving direction is a landscape architect's primary tool for guiding movement.",
        },
        {
          title: "Plaza Sections",
          instruction:
            "Use 6 Plate 4×4 as small plaza sections at key intersections — where the podium meets the terrace, where walkways cross, and around the conservatory entrance.",
          pieces: [{ name: "Plate 4×4", part: "3031", qty: 6 }],
          tip: "Plazas (wide, open plate areas) mark social gathering points. In the real Barbican, every junction has a small widening where people pause, meet, and orient themselves.",
        },
        {
          title: "Ground Plane — 1×1 Infill (Centre)",
          instruction:
            "Fill ground-plane gaps around the podium centre with 7 Plate 1×1. Work from the middle outward, sealing every exposed stud.",
          pieces: [{ name: "Plate 1×1", part: "3024w", qty: 7 }],
          tip: "A continuous ground plane with no gaps is essential — every exposed hole in the base reads as an unfinished area.",
        },
        {
          title: "Ground Plane — 1×1 Infill (Edges)",
          instruction:
            "Fill the remaining edge gaps with 7 more Plate 1×1, completing the perimeter of the ground plane surface.",
          pieces: [{ name: "Plate 1×1", part: "3024w", qty: 7 }],
          tip: "Edge infill is the last line of defence against an unfinished-looking base. Every stud sealed contributes to the overall polish.",
        },
        {
          title: "Ground Plane — 1×2 Infill (Podium)",
          instruction:
            "Fill gaps on the podium deck with 6 Plate 1×2. Use these longer plates where two adjacent studs are open.",
          pieces: [{ name: "Plate 1×2", part: "3023w", qty: 6 }],
          tip: "Larger infill plates create a smoother surface. The podium deck is the most visible horizontal surface — keep it clean.",
        },
        {
          title: "Ground Plane — 1×2 Infill (Perimeter)",
          instruction:
            "Fill the remaining perimeter gaps with 6 more Plate 1×2, completing the continuous ground surface around the entire model.",
          pieces: [{ name: "Plate 1×2", part: "3023w", qty: 6 }],
          tip: "A sealed perimeter is the final touch that makes the model look finished. No raw plate edges should be visible from any angle.",
        },
        {
          title: "Highwalk Extensions",
          instruction:
            "Place 4 Plate 1×3 along walkway edges and 2 Plate 2×3 as extended highwalk sections connecting the podium to distant plaza zones.",
          pieces: [
            { name: "Plate 1×3", part: "3623", qty: 4 },
            { name: "Plate 2×3", part: "3021", qty: 2 },
          ],
          tip: "The Barbican's highwalk system is its most radical urban feature — a complete pedestrian network elevated above street level. Your extensions suggest this city-scale ambition.",
        },
        {
          title: "Terrace Extensions & Details",
          instruction:
            "Place 2 Plate 2×6 as extended highwalk sections. Add 4 Plate 2×2 Corner and 2 Plate 1×4 to cap edges and corners of the ground plane.",
          pieces: [
            { name: "Plate 2×6", part: "3795", qty: 2 },
            { name: "Plate 2×2 Corner", part: "2420", qty: 4 },
            { name: "Plate 1×4", part: "3710", qty: 2 },
          ],
          tip: "Edge plates give the ground plane a finished perimeter — no raw plate edges visible from the outside.",
        },
        {
          title: "Edge Reinforcement — Long Bricks",
          instruction:
            "Add 6 Brick 1×4 to reinforce exposed edges on the terrace block and podium. Place them along any visible gaps or thin spots in the wall surfaces.",
          pieces: [{ name: "Brick 1×4", part: "3010", qty: 6 }],
          tip: "Edge reinforcement prevents the model from looking unfinished at its perimeter. Every sealed gap is one less visual distraction.",
        },
        {
          title: "Edge Reinforcement — Short Bricks",
          instruction:
            "Add 10 Brick 1×2 as corner and junction reinforcement throughout the model. Focus on spots where structures meet — terrace-to-tower, podium-to-base.",
          pieces: [{ name: "Brick 1×2", part: "3004", qty: 10 }],
          tip: "Small bricks at junctions act like structural mortar — they lock adjacent elements together and prevent racking.",
        },
        {
          title: "Wall Details — 1×3 Bricks",
          instruction:
            "Place 10 Brick 1×3 on exposed wall faces across the terrace and tower. These fill the mid-length gaps that remain after the main build.",
          pieces: [{ name: "Brick 1×3", part: "3622", qty: 10 }],
          tip: "Mid-length bricks bridge over joints in the courses below — they tie the wall together and prevent individual bricks from working loose.",
        },
        {
          title: "Wall Details — 1×6 Bricks",
          instruction:
            "Place 4 Brick 1×6 as long spanning pieces across the terrace wall. These bridge the widest remaining gaps.",
          pieces: [{ name: "Brick 1×6", part: "3009", qty: 4 }],
          tip: "Long bricks at this stage act like structural stitching — they bind sections of the wall that were built separately.",
        },
        {
          title: "Wall Details — Junction Bricks",
          instruction:
            "Place 8 Brick 2×2 at junction points throughout the model, focusing on where walls meet or structures intersect.",
          pieces: [{ name: "Brick 2×2", part: "3003", qty: 8 }],
          tip: "2×2 bricks are excellent at junctions where two walls meet — they span the gap and lock both walls together.",
        },
        {
          title: "Wall Details — Corner Fill",
          instruction:
            "Place 8 Brick 1×1 at corners and tight spots where you can see exposed studs. Focus on the most visible faces of the model.",
          pieces: [{ name: "Brick 1×1", part: "3005", qty: 8 }],
          tip: "The smallest bricks fill the tiniest gaps. At this stage, you are polishing — sealing every last opening in the structure.",
        },
        {
          title: "Final Brick Infill",
          instruction:
            "Place the remaining 8 Brick 1×1 wherever you see exposed structure — concentrate on the tower base, terrace rear, and podium edges.",
          pieces: [{ name: "Brick 1×1", part: "3005", qty: 8 }],
          tip: "These are the last bricks in the model. Place them where you see gaps or weakness — every builder's model will be slightly different at this final stage.",
        },
        {
          title: "Entrance Thresholds & Walkway Caps",
          instruction:
            "Place 8 Tile 2×2 at building entrances as smooth threshold surfaces. Add 4 Tile 1×8 as long walkway cap pieces along the podium edge, and 2 Tile 1×4 as smooth strips at secondary entrances.",
          pieces: [
            { name: "Tile 2×2", part: "3068b", qty: 8 },
          ],
          tip: "Thresholds mark the transition from exterior to interior — a smooth tile at every doorway signals 'enter here.' This is one of the oldest architectural gestures.",
        },
        {
          title: "Walkway Caps & Bollards",
          instruction:
            "Place 4 Tile 1×8 as long smooth cap pieces along the podium front edge. Add 2 Tile 1×4 as secondary smooth strips. Place 2 Round Brick 1×1 as decorative bollards at walkway junctions.",
          pieces: [
            { name: "Tile 1×8", part: "4162", qty: 4 },
            { name: "Tile 1×4", part: "2431", qty: 2 },
            { name: "Round Brick 1×1", part: "3062b", qty: 2 },
          ],
          tip: "Long smooth tiles along the podium edge create a clean visual termination — the equivalent of a polished stone coping on a real wall.",
        },
        {
          title: "Tree & Planting Positions",
          instruction:
            "Scatter 8 Plate 1×1 Round as tree and planting dot positions around the model — on the podium, around the lake edge, and near the conservatory.",
          pieces: [{ name: "Plate 1×1 Round", part: "4073", qty: 8 }],
          tip: "Each round plate is a tree or planting point. Cluster some together for groves, scatter others individually for specimen trees.",
        },
        {
          title: "Curved Edges & Plaza Extension",
          instruction:
            "Place 4 Plate 4×4 Round Corner as curved terrace edges near the conservatory. Add 2 Plate 4×6 as final plaza sections at key gathering points.",
          pieces: [
            { name: "Plate 4×4 Round Corner", part: "30565", qty: 4 },
            { name: "Plate 4×6", part: "3032", qty: 2 },
          ],
          tip: "The curved edges soften the rectangular platform and echo the conservatory's organic form — the Barbican's signature curve-vs-straight dialogue.",
        },
        {
          title: "Landscape Slopes — Terrain Grading",
          instruction:
            "Place 2 Slope 2×4 (45 degrees) and 4 Slope 3×4 (25 degrees) as terrain transitions around the model. Concentrate them where flat ground meets building bases.",
          pieces: [
            { name: "Slope 2×4 (45°)", part: "3037", qty: 2 },
            { name: "Slope 3×4 (25°)", part: "3297", qty: 4 },
          ],
          tip: "Terrain slopes soften the transition between ground plane and vertical structure. Without them, buildings look like they have been dropped onto a table.",
        },
        {
          title: "Landscape Slopes — Edge Transitions",
          instruction:
            "Place 2 Slope 2×3 (25 degrees), 2 Slope 1×2 (45 degrees), and 2 Slope 2×2 (45 degrees) at remaining edge transitions and garden mounding positions.",
          pieces: [
            { name: "Slope 2×3 (25°)", part: "3298", qty: 2 },
            { name: "Slope 1×2 (45°)", part: "3040", qty: 2 },
            { name: "Slope 2×2 (45°)", part: "3039", qty: 2 },
          ],
          tip: "Multiple slope angles in the landscape create a natural, undulating ground plane — not a flat sterile surface.",
        },
        {
          title: "Structural Soffits — Exposed Deck Edges",
          instruction:
            "Underneath exposed deck edges, attach 1 Slope 1×2 Inverted, 2 Slope 2×2 Inverted, 2 Slope 1×3 Inverted, and 1 Slope 2×3 Inverted as visible soffits. These create the shadow lines under cantilevered sections.",
          pieces: [
            { name: "Slope 1×2 Inverted", part: "3665", qty: 1 },
            { name: "Slope 2×2 Inverted", part: "3660", qty: 2 },
            { name: "Slope 1×3 Inverted", part: "4287", qty: 2 },
            { name: "Slope 2×3 Inverted", part: "3747b", qty: 1 },
          ],
          tip: "The inverted slopes underneath deck edges create the deep shadow lines that distinguish the Barbican's layered horizontal planes. They are the most Brutalist detail in the model.",
        },
        {
          title: "Steep Terrain Features",
          instruction:
            "Place 2 Slope 1×2×2 (65 degrees) and 1 Slope 1×2×3 (75 degrees) as steep terrain features near the tower base, where the podium meets the lower street level.",
          pieces: [
            { name: "Slope 1×2×2 (65°)", part: "60481", qty: 2 },
            { name: "Slope 1×2×3 (75°)", part: "4460b", qty: 1 },
          ],
          tip: "Steep slopes suggest the dramatic terrain change at the estate boundary — the Barbican sits on a raised podium above the surrounding City streets.",
        },
        {
          title: "Final Edge Infill",
          instruction:
            "Fill the last ground-plane gaps with 4 Plate 1×1 and 4 Plate 1×2 around the model perimeter.",
          pieces: [
            { name: "Plate 1×1", part: "3024w", qty: 4 },
            { name: "Plate 1×2", part: "3023w", qty: 4 },
          ],
          tip: "These final infill plates complete the continuous ground surface. No exposed holes should remain anywhere on the base.",
        },
        {
          title: "Final Walkway Strips",
          instruction:
            "Place 2 Plate 1×6 as final walkway strips and 4 Jumper Plate 1×2 at path intersections for half-stud alignment details.",
          pieces: [
            { name: "Plate 1×6", part: "3666", qty: 2 },
            { name: "Jumper Plate 1×2", part: "15573", qty: 4 },
          ],
          tip: "Jumper plates at intersections create half-stud offsets — the walkway appears to shift alignment where paths cross, just as real paving patterns change at junctions.",
        },
        {
          title: "Final Planting Beds",
          instruction:
            "Place the last 4 Plate 1×1 Round as tree positions and 4 Plate 2×2 as planting bed surfaces around the conservatory and lake edge.",
          pieces: [
            { name: "Plate 1×1 Round", part: "4073", qty: 4 },
            { name: "Plate 2×2", part: "3022", qty: 4 },
          ],
          tip: "The final planting dots complete the landscape. Each one represents a tree, shrub, or planting bed that softens the hard concrete geometry.",
        },
        {
          title: "Final Structural Completion",
          instruction:
            "Place the very last pieces: 8 Brick 2×4 and 2 Brick 2×6 to seal any remaining structural gaps in the terrace, podium, and tower base. Walk around the model and fill every visible hole. Your Barbican Estate is complete.",
          pieces: [
            { name: "Brick 2×4", part: "3001", qty: 8 },
            { name: "Brick 2×6", part: "2456", qty: 2 },
          ],
          tip: "Step back and view the completed diorama from lake level — at eye height with the podium. You should see the full Barbican composition: lake reflecting towers, terraces screening the base, podium columns creating rhythm, and the conservatory catching light at the end. This is the view that made the Barbican an icon of Brutalist urbanism.",
          highlight: true,
        },
      ],
    },
  ],
};

// ─── Export ──────────────────────────────────────────────────────────

export const ALL_BUILDS: Build[] = [barbicanPanorama];

export function getBuildById(id: string): Build | undefined {
  return ALL_BUILDS.find((b) => b.id === id);
}

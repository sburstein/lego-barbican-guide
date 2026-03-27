// ─── Build Data: The Barbican Estate — Lakeside Panorama ─────────────
// A single comprehensive build maximising the LEGO Architecture Studio
// 21050 set (1,210 pieces). Target: 950–1050 pieces across 12 phases.

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
  pieceCount: 1019,
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
    // PHASE 1: FOUNDATION PLATFORM (~80 pieces)
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
          title: "Primary Base — Large Plates",
          instruction:
            "Lay out all six 8x8 Plates in a 3-wide by 2-deep grid to create a 24x16 stud core platform. Place them on a flat surface and press firmly at all joints. This is the heart of the site.",
          pieces: [{ name: "Plate 8×8", part: "41539", qty: 6 }],
          tip: "In architecture, the datum is the reference point for every measurement. Get this dead flat — if the base warps, the whole diorama tilts. Press each plate joint from above.",
          highlight: true,
        },
        {
          title: "Front Extension — Lake Zone",
          instruction:
            "Attach all four 6x10 Plates extending forward from the front edge of the 24x16 core, overlapping by 2 studs. This creates the lake zone projecting roughly 16x8 studs forward. Then attach all four 6x8 Plates to the left and right sides of the core to widen the site to approximately 32x16 studs total.",
          pieces: [
            { name: "Plate 6×10", part: "3033", qty: 4 },
            { name: "Plate 6×8", part: "3036", qty: 4 },
          ],
          tip: "The Barbican's site plan is a roughly rectangular superblock — wider than deep. Your base should feel panoramic, not square.",
        },
        {
          title: "Infill & Widening",
          instruction:
            "Fill gaps and extend the platform using all 4x8 Plates across the middle zone and 6x6 Plates at the corners. Overlap each plate by at least 2 studs over existing plates for structural integrity. The goal is a solid, continuous platform roughly 32 studs wide by 24 studs deep with no gaps.",
          pieces: [
            { name: "Plate 4×8", part: "3035", qty: 8 },
            { name: "Plate 6×6", part: "3958", qty: 6 },
          ],
          tip: "Stagger your plate joints like brickwork — never let four plate corners meet at one point. This is the same structural logic as a real building foundation.",
        },
        {
          title: "Edge Reinforcement & Tower Zone",
          instruction:
            "Run 1x10 Plates along all four edges of the completed platform, overlapping plate joints — these are continuous edge beams. Then TRIPLE-LAYER the back edge where the tower will sit: use all 4x6 Plates stacked in an overlapping pattern across the rear 6 rows. This creates a massively reinforced zone that can bear the weight of a 30-course tower without flexing or spreading. The tower zone should feel noticeably thicker and stiffer than the rest of the base when you press on it.",
          pieces: [
            { name: "Plate 1×10", part: "4477", qty: 8 },
            { name: "Plate 4×6", part: "3032", qty: 6 },
          ],
          tip: "The tower will be the heaviest part of the model by far. Every extra plate layer in this zone is insurance. In real construction, tower foundations are often 3-5 metres thick even when the rest of the building sits on a standard slab. Over-engineer the base — you'll thank yourself at Phase 8.",
          highlight: true,
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 2: THE LAKE (~70 pieces)
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
          title: "Lake Border — Raised Lip",
          instruction:
            "Around the front section of the base (the lake zone, roughly 16x8 studs), build a raised perimeter using 2x2 Corner Plates at each corner and 1x4 Plates along the edges. This creates a 1-plate-high lip that defines the lake boundary and holds the transparent pieces.",
          pieces: [
            { name: "Plate 2×2 Corner", part: "2420", qty: 8 },
            { name: "Plate 1×4", part: "3710", qty: 8 },
          ],
          tip: "The real Barbican lake has a clean concrete kerb. This 1-plate step-down creates the shadow line where land meets water — visible even at micro scale.",
          highlight: true,
        },
        {
          title: "Lake Surface — Transparent Fill",
          instruction:
            "Fill the lake interior entirely with Trans-Clear 1x2 Plates laid in rows. Leave occasional 1-stud gaps between pieces — the exposed studs catch light and suggest water ripple. Cover the full lake area systematically from back to front.",
          pieces: [{ name: "Trans-Clear Plate 1×2", part: "3023", qty: 40 }],
          tip: "Do not cover every single stud. The irregularity is deliberate — in architecture this is called 'articulated surface.' The bumps read as ripples at this scale.",
        },
        {
          title: "Lake Depth — Scattered Singles",
          instruction:
            "Scatter Trans-Clear 1x1 Plates randomly across remaining gaps in the lake surface. Concentrate them near the edges and leave the centre slightly sparser — this suggests depth variation and natural water patterns.",
          pieces: [{ name: "Trans-Clear Plate 1×1", part: "3024", qty: 14 }],
          tip: "The Architecture Studio guidebook says 'what is not there matters as much as what is.' The lake is negative space that gives meaning to every structure around it.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 3: PODIUM COLONNADE — COLUMNS ONLY (~40 pieces)
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
          title: "Column Grid — Main Pilotis",
          instruction:
            "Place 12 Round Bricks 2x2 in a regular grid across the podium zone (the strip between lake and terrace, roughly 20 studs wide by 4 studs deep). Space them 3 studs apart. Top each column with a 2x2 Round Plate as a capital/bearing pad.",
          pieces: [
            { name: "Brick 2×2 Round", part: "3941", qty: 12 },
            { name: "Plate 2×2 Round", part: "4032", qty: 12 },
          ],
          tip: "Regular column spacing creates visual rhythm — like beats in music. Count the gaps between columns: that repeating interval IS the Barbican's architectural language.",
          highlight: true,
        },
        {
          title: "Secondary Columns & Lateral Bracing",
          instruction:
            "Between every other main column, place a thinner Round Brick 1x1 as a secondary structural element. Then add LATERAL BRACING: connect pairs of adjacent columns at mid-height using a 1x2 Plate laid horizontally between them. This prevents the colonnade from shearing sideways if the model is bumped. You only need bracing on the back row of columns (closest to the terrace block) — the front row will be stabilized by the podium deck.",
          pieces: [
            { name: "Round Brick 1×1", part: "3062b", qty: 12 },
            { name: "Plate 1×2", part: "3023w", qty: 4 },
          ],
          tip: "Lateral bracing is what separates a column that stands from one that topples. The real Barbican columns are braced by the podium slab itself — but at LEGO scale, the slab plates sitting on round studs have limited shear resistance, so these hidden braces are your safety net.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 4: GROUND LEVEL & STRUCTURAL CORES (~188 pieces)
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
        {
          title: "Terrace Ground Course + Arts Centre Arches",
          instruction:
            "Behind the podium columns, lay the terrace ground course AND place the Arts Centre arch pieces at ground level. This is your LAST chance to place ground-level elements before the podium deck covers this zone. Lay Brick 2x6 stretching 20 studs wide end-to-end, then stack Brick 2x4 on top offset by 2 studs for bond. At the ground floor of the terrace, place Arch 1x4 bricks to create the arched entrances to the Barbican Arts Centre, spaced evenly across the base.",
          pieces: [
            { name: "Brick 2×6", part: "2456", qty: 10 },
            { name: "Brick 2×4", part: "3001", qty: 12 },
            { name: "Arch 1×4", part: "3659", qty: 6 },
          ],
          tip: "Real bricks are always laid in bond (offset) so that vertical joints never align. The arches at ground level are a deliberate historical reference to Roman aqueducts — place them now while you can still reach the base plate.",
          highlight: true,
        },
        {
          title: "Ground-Floor Window Panels",
          instruction:
            "Place Trans-Clear Panels 1x2x2 at the terrace ground floor before the podium deck blocks access. These represent the double-height windows of the Arts Centre foyer at ground level. Place them across the ground floor between the arches.",
          pieces: [
            { name: "Trans-Clear Panel 1×2×2", part: "87552", qty: 10 },
          ],
          tip: "These large windows signal public space — the Arts Centre foyer is the most open, inviting part of the Barbican at ground level. Place them now while the base plate zone is fully accessible.",
        },
        {
          title: "Ground-Level Landscaping",
          instruction:
            "Place terrain slopes around the base of the terrace while accessible. These suggest the raised planting beds and graded gardens that surround the real buildings. Concentrate them between the podium columns and the terrace block.",
          pieces: [
            { name: "Slope 2×3 (25°)", part: "3298", qty: 4 },
            { name: "Slope 3×4 (25°)", part: "3297", qty: 2 },
          ],
          tip: "Grade changes (gentle slopes in the ground plane) are what make a landscape feel natural. Even 1-plate height differences create shadow lines that read as terrain at LEGO scale. This is your last chance to reach the ground plane.",
        },
        {
          title: "Podium Deck (Pre-assembled with Soffits)",
          instruction:
            "PRE-ASSEMBLE the front row of podium deck plates with inverted slopes attached underneath BEFORE spanning them across the columns. Build the front section with soffits as a sub-assembly on the table, then place the complete assembly onto the column capitals. Back deck plates are placed normally. Use 2x4 Plates and 2x6 Plates laid across the columns, overlapping for rigidity.",
          pieces: [
            { name: "Plate 2×4", part: "3020", qty: 10 },
            { name: "Plate 2×6", part: "3795", qty: 6 },
            { name: "Slope 2×3 Inverted", part: "3747b", qty: 8 },
          ],
          tip: "Pre-assembling the soffit onto the deck plates before placing them is much easier than trying to attach inverted slopes underneath an already-placed deck. Build the sub-assembly flat on the table, flip it, and place it as one unit.",
        },
        {
          title: "Podium Parapets",
          instruction:
            "Along both long edges of the podium deck, attach Panels 1x4x1 Rounded as railings/parapets. At each corner, place a Panel 1x1x1 Corner. These low walls define the walkway edges and keep the deck reading as a distinct elevated plane.",
          pieces: [
            { name: "Panel 1×4×1 Rounded", part: "30413", qty: 10 },
            { name: "Panel 1×1×1 Corner", part: "6231", qty: 10 },
          ],
          tip: "Parapets are the horizontal lines that make Brutalist buildings look so layered when photographed. They cast long shadows that emphasise the building's horizontality.",
        },
        {
          title: "Tower Base — Directly on Foundation",
          instruction:
            "Place the tower footprint DIRECTLY ON THE BASE PLATE, behind the terrace ground course. Start with a WIDENED footprint: 8 studs wide, 6 studs deep for the first 5 courses. The tower must sit on the triple-layered rear zone of the foundation (Phase 1, Step 4). The terrace is only 1-2 courses high at this point, so the tower zone is fully accessible. Use Brick 1x4 and Brick 1x2 in alternating bond pattern.",
          pieces: [
            { name: "Brick 1×4", part: "3010", qty: 10 },
            { name: "Brick 1×2", part: "3004", qty: 10 },
          ],
          tip: "Structural engineering 101: a wider base dramatically improves stability. The real Barbican towers have massive reinforced concrete foundations extending well below ground. Your widened base serves the same purpose.",
          highlight: true,
        },
        {
          title: "Terrace & Tower Rising Together",
          instruction:
            "Build the terrace wall and tower base upward TOGETHER. Every 2-3 courses, switch between them. Where the tower's front face meets the terrace's rear wall, interlock by letting some bricks span both structures. This creates a unified structural mass. Use Brick 1x8, Brick 2x3, and Brick 1x6 for the terrace wall, and Brick 1x4 and Brick 1x2 for the tower shaft.",
          pieces: [
            { name: "Brick 1×8", part: "3008", qty: 8 },
            { name: "Brick 2×3", part: "3002", qty: 16 },
            { name: "Brick 1×6", part: "3009", qty: 10 },
            { name: "Brick 1×4", part: "3010", qty: 8 },
            { name: "Brick 1×2", part: "3004", qty: 10 },
          ],
          tip: "Interleaving the terrace and tower creates a much stronger structure than building them separately. The interlocking bricks at the junction work like a zipper — each structure braces the other.",
        },
        {
          title: "Structural Plates & Shear Walls",
          instruction:
            "Every 3 brick-courses (each storey), lay a full-width plate course using 2x8 Plates across the terrace top. These represent the concrete floor slabs. Then build two short perpendicular shear walls extending backward from the terrace, interlocked with the tower base courses. Each shear wall is 4 studs long, 1 stud wide, and the full terrace height.",
          pieces: [
            { name: "Plate 2×8", part: "3034", qty: 8 },
            { name: "Brick 2×4", part: "3001", qty: 4 },
            { name: "Brick 2×6", part: "2456", qty: 2 },
          ],
          tip: "The shear walls create a direct load path from the tower straight down to the foundation. Without them, the tower's weight bears down on flat plates which can flex. In real buildings, these are called 'transfer walls.'",
          highlight: true,
        },
        {
          title: "Wall Infill & Tower Completion to Terrace Height",
          instruction:
            "Fill remaining gaps in the upper storeys of the terrace with Brick 2x4 and Brick 2x6 to complete the solid back wall. The finished terrace wall should be a solid mass — 20 studs wide, 2 studs deep, 7 storeys tall. The tower base should now be at or above the terrace roofline height.",
          pieces: [
            { name: "Brick 2×4", part: "3001", qty: 4 },
            { name: "Brick 2×6", part: "2456", qty: 4 },
          ],
          tip: "Step back and look at the profile. You should see the terrace as a solid rectangular mass with the tower rising behind it — both structures built as a unified block from the foundation up.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 5: TERRACE BLOCK — SNOT FACADE (~72 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-terrace-facade",
      title: "Phase 5 — Terrace Block: SNOT Facade",
      concept: "Surface & Texture",
      color: "#DC2626",
      icon: "🪟",
      time: "35–45 min",
      location:
        "Now you transform the raw mass into the Barbican's signature bush-hammered concrete facade. The real buildings have a deeply textured surface created by hammering cast concrete to expose aggregate — giving it a rough, almost geological quality. You will recreate this using SNOT (Studs Not On Top) technique: bricks with side studs face their studs outward, and grille tiles attached sideways create the textured surface. Ground-floor panels were already placed in Phase 4.",
      steps: [
        {
          title: "SNOT Mounting Points",
          instruction:
            "Attach all 8 Brick 1x4 Side Studs to the front face of the structural wall, evenly spaced across the facade at every other storey. These bricks have studs pointing OUTWARD from the wall face. Place them at the 2nd, 4th, and 6th storey levels, spanning the full 20-stud width.",
          pieces: [
            { name: "Brick 1×4 Side Studs", part: "30414", qty: 8 },
          ],
          tip: "This is the key SNOT move. The side studs create a new building plane offset half a plate from the structural wall. That offset IS the shadow reveal that makes Brutalist facades so photogenic.",
          highlight: true,
        },
        {
          title: "Textured Concrete — Grille Tiles",
          instruction:
            "Attach Grille Tiles 1x2 to the outward-facing studs of the side-stud bricks. The grille pattern, viewed from the front, reads as bush-hammered concrete texture. Fill every available side-stud position with grille tiles. The texture should cover roughly 80% of each storey band.",
          pieces: [
            { name: "Tile 1×2 Grille", part: "2412b", qty: 20 },
          ],
          tip: "The 80/20 texture rule: cover 80% of each band with grille texture, leave 20% as smooth tile or window. This contrast is what makes the texture visible — if everything is textured, nothing reads as textured.",
        },
        {
          title: "Window Reveals — Headlight Bricks",
          instruction:
            "At each window position (between the textured bands), place Headlight Bricks 1x1 into the wall face. The headlight brick's recessed stud creates a half-plate-deep reveal — the shadow pocket where glass meets concrete. Space them in a regular grid: 4 per storey across 4 storey levels.",
          pieces: [
            { name: "Headlight Brick 1×1", part: "4070", qty: 16 },
          ],
          tip: "Window reveals are the most important detail in Brutalist architecture. The depth of the recess determines how much shadow the window casts — and shadow is what gives a concrete building life across the day as the sun moves.",
        },
        {
          title: "Glazing — Transparent Bricks",
          instruction:
            "Insert Trans-Clear Bricks 1x2 into the headlight brick recesses. Push them firmly until they sit flush with the outer face of the grille tiles. The transparent bricks should be slightly recessed behind the concrete texture, creating deep-set windows typical of Brutalist residential blocks. At the top storey, install the remaining Trans-Clear Panels 1x2x2 for larger penthouse window openings.",
          pieces: [
            { name: "Trans-Clear Brick 1×2", part: "3065", qty: 28 },
            { name: "Trans-Clear Panel 1×2×2", part: "87552", qty: 6 },
          ],
          tip: "Deep-set windows are a thermal strategy as much as an aesthetic one — the concrete overhang shades the glass from high summer sun while admitting low winter sun. Form follows climate.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 6: TERRACE BLOCK — BALCONIES & SOFFITS (~58 pieces)
    // Pre-assembly technique for easier construction
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
          title: "Pre-Assemble Balcony Sub-Assemblies",
          instruction:
            "Build each balcony row as a sub-assembly on your work surface: attach Plate 1x6 on top, then flip and attach inverted slopes underneath. Build all 6 balcony rows as sub-assemblies before attaching any to the facade. Use Plate 1x6 and Tile 1x4 for the slab, Inverted Slopes 1x2 and 1x3 for narrow soffits, and Inverted Slopes 2x2 for the widest balcony at the 4th storey.",
          pieces: [
            { name: "Plate 1×6", part: "3666", qty: 8 },
            { name: "Tile 1×4", part: "2431", qty: 8 },
            { name: "Slope 1×2 Inverted", part: "3665", qty: 10 },
            { name: "Slope 1×3 Inverted", part: "4287", qty: 6 },
            { name: "Slope 2×2 Inverted", part: "3660", qty: 8 },
          ],
          tip: "Pre-assembling the soffit onto the balcony slab before mounting is much easier than trying to attach inverted slopes underneath an already-placed slab. Build all sub-assemblies first, then attach in one go.",
          highlight: true,
        },
        {
          title: "Attach Balcony Sub-Assemblies",
          instruction:
            "Clip the pre-assembled balcony rows onto the facade at each storey level. Since the soffit is already attached, no reaching underneath is required. Work from the bottom up — attach the lowest balcony row first, then the next, etc.",
          pieces: [],
          tip: "Work from the bottom up — attach the lowest balcony row first, then the next, etc. The lower balconies provide a visual reference for aligning the upper ones.",
        },
        {
          title: "Balcony Surface — Smooth Tiles",
          instruction:
            "Top each balcony slab with smooth tiles to contrast with the rough textured facade behind. Use Tile 1x6 and Tile 1x2 for smooth walking surfaces. The contrast between smooth balcony and rough wall is essential.",
          pieces: [
            { name: "Tile 1×6", part: "6636", qty: 6 },
            { name: "Tile 1×2", part: "3069b", qty: 6 },
          ],
          tip: "Smooth vs. rough is the fundamental contrast in Brutalist architecture. Smooth surfaces are for touching (floors, handrails); rough surfaces are for looking at (walls, columns). Your build should show this difference clearly.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 7: BARREL VAULT ROOF (~52 pieces)
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
          title: "Vault Curve — Curved Slopes",
          instruction:
            "IMPORTANT: Leave the rightmost 6 studs of the terrace block UNBUILT — do not place curved slopes in this zone. This reserved section is where the Conservatory will be built in Phase 11. Along the rest of the terrace top, place Curved Slopes 3x1 in two opposing rows — 6 facing left and 6 facing right — to create the barrel vault curve. The curves should meet at the ridge line. Start from the centre and work outward to ensure symmetry.",
          pieces: [
            { name: "Curved Slope 3×1", part: "50950", qty: 12 },
          ],
          tip: "A barrel vault is a half-cylinder. At LEGO scale, the curve is suggested rather than literal — the brain fills in the smooth curve from these stepped facets. This is architectural abstraction at its finest.",
          highlight: true,
        },
        {
          title: "Vault Enrichment — Curved Top Bricks",
          instruction:
            "Between and atop the curved slopes, place Curved Top Bricks 1x2 to enrich the double-curve profile. These fill the gaps between the larger curved slopes and create a smoother overall silhouette.",
          pieces: [
            { name: "Curved Top Brick 1×2", part: "6091", qty: 12 },
          ],
          tip: "In architecture, 'enrichment' means adding detail to a primary form. The curved top bricks soften the stepped facets of the main curves — like moulding profiles soften a classical cornice.",
        },
        {
          title: "Vault Edges — Angled Slopes",
          instruction:
            "At each end of the vault and along the eaves (where vault meets wall), place 45-degree slopes to transition from the curved roof to the flat facade below. Use 1x2 Slopes on the narrow ends and 2x2 Slopes on the broader faces.",
          pieces: [
            { name: "Slope 1×2 (45°)", part: "3040", qty: 8 },
            { name: "Slope 2×2 (45°)", part: "3039", qty: 6 },
          ],
          tip: "The eave (where roof meets wall) is one of the most important lines in any building. A clean, sharp eave makes the vault look intentional rather than just piled on top.",
        },
        {
          title: "Ridge Line — Smooth Cap",
          instruction:
            "Cap the vault's ridge with Tile 1x8 pieces running the full length of the terrace block. The smooth tiles create a clean, unbroken line along the very top of the curve — the highest point of the terrace block's silhouette.",
          pieces: [
            { name: "Tile 1×8", part: "4162", qty: 6 },
          ],
          tip: "The ridge line is what you see in every photograph of the Barbican's terraces — a long horizontal curve against the sky. Making it smooth (tiled) distinguishes it from the rough textured walls below.",
        },
        {
          title: "Hip Corners — Double Convex Slopes",
          instruction:
            "Where the vault ends meet the end walls, place Double Convex Slopes 2x2 to create the hip corners — the compound curves where two roof surfaces intersect. Place 4 at each end of the vault.",
          pieces: [
            { name: "Slope 2×2 Double Convex", part: "3045", qty: 8 },
          ],
          tip: "Hip corners are where geometry gets complex — two curved surfaces meeting at an angle. In real roofing, this is the hardest joint to waterproof. In LEGO, the double convex slope elegantly resolves this intersection.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 8: LAUDERDALE TOWER — ABOVE THE ROOFLINE (~72 pieces)
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
          title: "Tower Front Corner SNOT",
          instruction:
            "Place SNOT bricks on the tower's front corners NOW, before the vault makes them harder to reach. At each front corner of the tower, place Brick 1x1 Studs 4 Sides. These create attachment points for the facade cladding on the visible faces.",
          pieces: [
            { name: "Brick 1×1 Studs 4 Sides", part: "4733", qty: 4 },
          ],
          tip: "SNOT bricks at corners are the most powerful technique in Architecture Studio building. Place them now while the front corners are still accessible — the barrel vault will partially obstruct this zone later.",
          highlight: true,
        },
        {
          title: "Tower Emerging — Above the Terrace Roofline",
          instruction:
            "Continue building with Brick 1x3 and Brick 1x1. The tower emerges above the terrace block's barrel vault — this is the dramatic moment where it becomes visible. From here up, the courses are fully visible and should be clean. Every 5 courses, insert a full plate layer (using Plate 2x4 or Plate 2x3) spanning the entire cross-section for structural rigidity.",
          pieces: [
            { name: "Brick 1×3", part: "3622", qty: 20 },
            { name: "Brick 1×1", part: "3005", qty: 20 },
            { name: "Plate 2×4", part: "3020", qty: 4 },
            { name: "Plate 2×3", part: "3021", qty: 6 },
          ],
          tip: "The structural plate every 5 courses mimics real construction where floor slabs brace the walls against buckling. Without these plates, a tall LEGO wall will eventually lean or topple. Press each plate layer down firmly before continuing.",
        },
        {
          title: "Tower Upper — Courses 20–30+ (Hollow Core)",
          instruction:
            "From course 20 upward, build the tower as a hollow shell — walls only, no filled center. This cuts weight by ~40% in the upper portion. Build only the outer perimeter ring: place bricks along all four edges of the 6x4 footprint, leaving the 4x2 interior empty. Continue inserting a plate layer every 5 courses. The tower now has a continuous brick stack from base plate to crown — no structural gaps, no load transfer through thin plates.",
          pieces: [
            { name: "Brick 2×2", part: "3003", qty: 18 },
            { name: "Brick 1×1", part: "3005", qty: 14 },
            { name: "Plate 2×3", part: "3021", qty: 6 },
          ],
          tip: "Real skyscrapers are hollow — the structural core is at the perimeter or center, not solid concrete all the way through. A hollow LEGO tower above course 15 is both more realistic and more stable. The facade pieces you'll add in Phases 9-10 will actually REINFORCE these walls by adding lateral bracing.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 9: TOWER — FACADE & WINDOW BANDS (~64 pieces)
    // Front corner SNOT already placed in Phase 8
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-tower-facade",
      title: "Phase 9 — Tower: Facade & Window Bands",
      concept: "Grid & Repetition",
      color: "#0891B2",
      icon: "📐",
      time: "30–40 min",
      location:
        "The tower's facade is a strict grid of horizontal concrete bands and vertical window strips. Unlike the terrace's textured wall, the tower reads as a stack of identical floor plates — the same apartment repeated 42 times. This repetition is deliberate: it expresses the democratic ideal of social housing where every resident gets the same quality of space. Front corner SNOT bricks were placed in Phase 8; this phase covers the remaining visible (rear + side) faces. The front face is hidden behind the terrace and does not need cladding.",
      steps: [
        {
          title: "Corner & Edge SNOT — Remaining Faces",
          instruction:
            "At each rear corner of the tower, build a vertical column of Brick 1x1 Studs 4 Sides, one every 5 courses (2 per corner). Along each edge between corners, place Brick 1x1 Studs 2 Sides for additional cladding attachment. The front corners were already done in Phase 8.",
          pieces: [
            { name: "Brick 1×1 Studs 4 Sides", part: "4733", qty: 8 },
            { name: "Brick 1×1 Studs 2 Sides", part: "47905", qty: 12 },
          ],
          tip: "The 2-sided SNOT brick is the workhorse of tower facades — it provides cladding attachment along the flat faces while the 4-sided brick handles the corners. Together they create a complete wrapping surface.",
          highlight: true,
        },
        {
          title: "Horizontal Banding — Grille Bricks",
          instruction:
            "At every 5th course up the tower, insert a horizontal band of Grille Bricks 1x2 across the full facade width. These create the distinctive horizontal striping visible on all three Barbican towers — concrete floor-edge bands that read as dark lines against the lighter wall surface.",
          pieces: [
            { name: "Grille Brick 1×2", part: "2877", qty: 16 },
          ],
          tip: "Horizontal banding expresses the floor plates — each line says 'a floor slab is here.' This honest expression of structure is a core Brutalist principle: the building shows you how it is made.",
        },
        {
          title: "Half-Stud Offsets — Jumper Plates",
          instruction:
            "Between the grille brick bands, place Jumper Plates 1x2 in alternating positions. These create half-stud offsets that suggest the staggered window pattern visible on the real towers — where windows on one floor are offset from those above and below.",
          pieces: [
            { name: "Jumper Plate 1×2", part: "15573", qty: 12 },
          ],
          tip: "Jumper plates are the subtlest detail in this build — a half-stud offset is almost invisible but it breaks the grid just enough to create visual interest. Real architects call this 'syncopation' — like jazz rhythms against a steady beat.",
        },
        {
          title: "Smooth Floor Bands — Tiles",
          instruction:
            "Between the grille brick bands, fill remaining positions with Tile 1x2 and Tile 2x2 for smooth floor-line surfaces. These create the alternating texture rhythm: rough grille band, smooth tile band, rough grille band — readable from across the lake.",
          pieces: [
            { name: "Tile 1×2", part: "3069b", qty: 14 },
            { name: "Tile 2×2", part: "3068b", qty: 6 },
          ],
          tip: "The grille/tile alternation creates a moiré effect when viewed from a distance — the bands seem to shimmer and vibrate, exactly as the real tower's facade does when photographed from the lakeside.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 10: TOWER — SERRATED EDGES & CROWN (~60 pieces)
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
          title: "Serrated Edges — Wedge Plates",
          instruction:
            "Along the left edge of the tower, attach Wedge 2x4 Left pieces at every balcony level (every 5 courses), projecting 1 stud beyond the facade. Mirror with Wedge 2x4 Right on the right edge. These create the saw-tooth profile.",
          pieces: [
            { name: "Wedge 2×4 Left", part: "41768", qty: 8 },
            { name: "Wedge 2×4 Right", part: "41767", qty: 8 },
          ],
          tip: "The wedge pairs MUST mirror each other — left on left, right on right. Stand behind the build and sight along the tower's edge: you should see a zigzag silhouette like shark's teeth.",
          highlight: true,
        },
        {
          title: "Fine Serration — Cheese Slopes",
          instruction:
            "Between the wedge plates, fill the serrated edge profile with Cheese Slopes 1x1. Place them at alternating angles to create a finer saw-tooth texture at the smaller scale. Distribute them evenly up both edges of the tower.",
          pieces: [
            { name: "Cheese Slope 1×1×⅔", part: "54200", qty: 18 },
          ],
          tip: "Cheese slopes are the smallest angled element in the Architecture Studio. Here they create the delicate micro-serration between the larger wedge teeth — a fractal detail where the small pattern echoes the large one.",
        },
        {
          title: "Crown Angles — Main Slopes",
          instruction:
            "At the top of the tower, begin the crown taper. Place Slopes 2x4 45° on all four sides, angled inward. These create the first major step-back of the crown profile.",
          pieces: [
            { name: "Slope 2×4 (45°)", part: "3037", qty: 8 },
          ],
          tip: "The crown taper serves a practical purpose — it houses mechanical equipment (lifts, water tanks, antennae) while creating the distinctive pointed profile. Form follows function, but function follows form in the best architecture.",
        },
        {
          title: "Crown Transition — Gentle Slopes",
          instruction:
            "Above the 45-degree slopes, place gentler Slopes 3x4 25° and Slopes 2x3 25° to continue the taper at a shallower angle. These create the elongated pyramid profile of the crown.",
          pieces: [
            { name: "Slope 3×4 (25°)", part: "3297", qty: 6 },
            { name: "Slope 2×3 (25°)", part: "3298", qty: 6 },
          ],
          tip: "Using multiple slope angles (45°, then 25°) creates a compound curve — the crown appears to taper smoothly rather than ending in a blunt pyramid. This compound tapering is a signature of 1960s tower design.",
        },
        {
          title: "Crown Peak — Steep & Vertical",
          instruction:
            "For the very top of the crown, stack steep Slopes 1x2x2 65° and near-vertical Slopes 1x2x3 75° to create the final sharp peak. The tower should terminate in a clean, decisive point — not trail off uncertainly.",
          pieces: [
            { name: "Slope 1×2×2 (65°)", part: "60481", qty: 6 },
            { name: "Slope 1×2×3 (75°)", part: "4460b", qty: 8 },
          ],
          tip: "A tower's crown is its signature against the skyline — like a person's hat defines their silhouette. The Barbican towers are recognisable from any angle because of this distinctive compound taper.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 11: THE CONSERVATORY (~60 pieces)
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
          title: "Conservatory Base — Curved Walls",
          instruction:
            "At the right end of the terrace block, in the reserved vault gap, build the conservatory's curved wall frame using Macaroni Bricks 2x2 (quarter-circle bricks). Arrange them in an arc, open sides facing inward, to create a curved glass wall footprint. Use Brick 2x2 Corner pieces to fill the angular sections between curves.",
          pieces: [
            { name: "Macaroni Brick 2×2", part: "85080", qty: 12 },
            { name: "Brick 2×2 Corner", part: "2357", qty: 12 },
          ],
          tip: "The conservatory's organic curved form is deliberate contrast to the rectilinear concrete blocks. This tension between curve and straight line runs through the entire Barbican design — from the circular Barbican Centre auditorium to the curved Frobisher Crescent.",
          highlight: true,
        },
        {
          title: "Glazing — Transparent Bricks",
          instruction:
            "Fill the openings between the curved frame pieces with Trans-Clear Bricks 1x2 to create the glass walls. The transparent bricks should sit between the curved white frame members, suggesting steel-framed greenhouse glazing.",
          pieces: [
            { name: "Trans-Clear Brick 1×2", part: "3065", qty: 12 },
          ],
          tip: "Real greenhouse glazing is held in steel or aluminum frames — the white curved bricks represent the frame, the transparent bricks represent the glass. This frame-and-infill logic is the same as a curtain wall.",
        },
        {
          title: "Planting — Green Details Inside",
          instruction:
            "Place plants and trees inside the conservatory BEFORE capping with the roof. Scatter Plate 1x1 Round across the conservatory interior and surrounding terrace as planting dots. Concentrate them inside the glass walls (the tropical garden) with a few scattered outside (the exterior landscaping). Add Plate 2x2 pieces as floor sections between the planting areas.",
          pieces: [
            { name: "Plate 1×1 Round", part: "4073", qty: 24 },
            { name: "Plate 2×2", part: "3022", qty: 8 },
          ],
          tip: "Place the planting before the roof goes on — once the roof is in place, you cannot reach inside to position plants. At this scale, clustered round plates suggest dense tropical planting from above.",
        },
        {
          title: "Roof — Gentle Glass Slopes",
          instruction:
            "Cap the conservatory with Slopes 2x4 18° to create the gentle glass roof angle. The shallow pitch allows maximum light penetration while shedding rain. Place them spanning the full width of the conservatory footprint.",
          pieces: [
            { name: "Slope 2×4 (18°)", part: "30363", qty: 8 },
          ],
          tip: "An 18-degree pitch is typical of greenhouse roofs — steep enough to shed rain, shallow enough to admit winter sun at London's latitude. The Architecture Studio's shallow slope piece is perfect for this specific application.",
        },
        {
          title: "Rooftop Platform — Curved Corners",
          instruction:
            "Surround the conservatory with Round Corner Plates 4x4 to create the curved rooftop viewing platform. In the real Barbican, there is a terrace around the conservatory offering panoramic views. Use Round Plates 4x4 with Pin for structural connections to the terrace block below.",
          pieces: [
            { name: "Plate 4×4 Round Corner", part: "30565", qty: 8 },
            { name: "Plate 4×4 Round w/ Pin", part: "60474", qty: 8 },
          ],
          tip: "The round corner plates create an organic terrace outline that contrasts with the rectangular platform below — another instance of the Barbican's curve-vs-straight dialogue.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 12: LANDSCAPING & DETAILS (~60 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-landscaping",
      title: "Phase 12 — Landscaping & Details",
      concept: "Context & Completion",
      color: "#65A30D",
      icon: "🌳",
      time: "20–30 min",
      location:
        "The final phase ties everything together with landscaping, walkway surfaces, and finishing details. The Barbican's landscape design is as deliberate as its architecture — every tree, bench, and paving pattern was specified by the architects. This phase transforms your diorama from a collection of buildings into a place.",
      steps: [
        {
          title: "Garden Grade Changes",
          instruction:
            "Around the base of the terrace block and tower, place Slopes 1x3 25° as gentle terrain changes. These suggest the raised planting beds and graded gardens that surround the real buildings. Concentrate them between the podium and the terrace block.",
          pieces: [
            { name: "Slope 1×3 (25°)", part: "4286", qty: 10 },
          ],
          tip: "Grade changes (gentle slopes in the ground plane) are what make a landscape feel natural. Even 1-plate height differences create shadow lines that read as terrain at LEGO scale.",
        },
        {
          title: "Walkway Surfaces — Small Tiles",
          instruction:
            "Scatter Tile 1x1 across the podium deck and ground-level walkways. These create smooth walking surfaces that contrast with the studded building surfaces. Concentrate them along desire lines — the paths people would naturally walk between buildings.",
          pieces: [
            { name: "Tile 1×1", part: "3070b", qty: 30 },
          ],
          tip: "Smooth tiles on the ground plane vs. rough studs on buildings: this contrast tells the viewer what is 'floor' and what is 'wall' — a fundamental architectural distinction expressed through surface texture alone.",
        },
        {
          title: "Walkway Strips — Long Tiles",
          instruction:
            "Lay Tile 1x6 in lines across the podium to create long walkway strips. These suggest the precast concrete paving slabs used throughout the real Barbican. Place them parallel to the terrace block, running the full width of the podium.",
          pieces: [
            { name: "Tile 1×6", part: "6636", qty: 6 },
          ],
          tip: "Long tile strips create directional flow — they lead the eye (and the imagined pedestrian) from one end of the podium to the other. Paving direction is a landscape architect's primary tool for guiding movement.",
        },
        {
          title: "Plaza Sections & Highwalk Extensions",
          instruction:
            "Use Plate 4x4 pieces as small plaza sections at key intersections — where the podium meets the terrace block, where walkways cross, and around the conservatory entrance. Fill remaining gaps with smaller plates to complete the ground plane.",
          pieces: [
            { name: "Plate 4×4", part: "3031", qty: 6 },
            { name: "Plate 4×4 Round Corner", part: "30565", qty: 4 },
            { name: "Plate 1×1", part: "3024w", qty: 14 },
            { name: "Plate 1×2", part: "3023w", qty: 12 },
          ],
          tip: "Plazas (wide, open plate areas) mark social gathering points. In the real Barbican, every junction has a small widening where people pause, meet, and orient themselves. Your plazas should feel like rest points in the architectural promenade.",
        },
        {
          title: "Final Details & Remaining Pieces",
          instruction:
            "Use all remaining pieces to add final details: Plate 1x3 along walkway edges, Plate 2x3 as garden bed infill, Plate 2x6 as extended highwalk sections, Plate 2x8 for wide terrace extensions, Plate 1x1 Round as scattered bollards and tree positions, and Plate 2x2 as additional planting beds around the conservatory. Place Tile 2x2 at building entrances for smooth threshold surfaces. Add remaining Trans-Clear pieces as additional lake reflections or glass canopy elements.",
          pieces: [
            { name: "Plate 1×3", part: "3623", qty: 4 },
            { name: "Plate 2×3", part: "3021", qty: 2 },
            { name: "Plate 2×6", part: "3795", qty: 2 },
            { name: "Plate 1×1 Round", part: "4073", qty: 4 },
            { name: "Plate 2×2", part: "3022", qty: 4 },
            { name: "Tile 2×2", part: "3068b", qty: 8 },
            { name: "Plate 2×2 Corner", part: "2420", qty: 4 },
            { name: "Plate 1×4", part: "3710", qty: 2 },
            { name: "Plate 4×6", part: "3032", qty: 2 },
            { name: "Brick 1×4", part: "3010", qty: 6 },
            { name: "Brick 1×2", part: "3004", qty: 8 },
            { name: "Brick 1×3", part: "3622", qty: 6 },
            { name: "Brick 2×2", part: "3003", qty: 8 },
            { name: "Brick 1×6", part: "3009", qty: 4 },
            { name: "Brick 1×1", part: "3005", qty: 2 },
            { name: "Brick 2×4", part: "3001", qty: 2 },
            { name: "Plate 1×6", part: "3666", qty: 2 },
            { name: "Jumper Plate 1×2", part: "15573", qty: 4 },
            { name: "Round Brick 1×1", part: "3062b", qty: 2 },
            { name: "Tile 1×4", part: "2431", qty: 2 },
            { name: "Tile 1×8", part: "4162", qty: 4 },
            { name: "Slope 2×4 (45°)", part: "3037", qty: 2 },
            { name: "Slope 3×4 (25°)", part: "3297", qty: 4 },
            { name: "Slope 2×3 (25°)", part: "3298", qty: 2 },
            { name: "Slope 1×2 (45°)", part: "3040", qty: 2 },
            { name: "Slope 2×2 (45°)", part: "3039", qty: 2 },
            { name: "Slope 1×2 Inverted", part: "3665", qty: 1 },
            { name: "Slope 2×2 Inverted", part: "3660", qty: 2 },
            { name: "Slope 1×3 Inverted", part: "4287", qty: 2 },
            { name: "Slope 2×3 Inverted", part: "3747b", qty: 1 },
            { name: "Slope 1×2×2 (65°)", part: "60481", qty: 2 },
            { name: "Slope 1×2×3 (75°)", part: "4460b", qty: 1 },
            { name: "Plate 1×1", part: "3024w", qty: 4 },
            { name: "Plate 1×2", part: "3023w", qty: 4 },
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

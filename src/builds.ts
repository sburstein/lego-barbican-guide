// ─── Build Data: The Barbican Estate — Lakeside Panorama ─────────────
// A single comprehensive build maximising the LEGO Architecture Studio
// 21050 set (1,210 pieces). 671 pieces across 12 phases, 167 steps.
// Piece lists are generated from src/lego-model.ts (scripts/sync-builds.mjs)
// so the guide always matches the physically-validated 3D model.
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
  /** Label for the build switcher. */
  shortTitle?: string;
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
  /** Set for designs made by the AI designer and passed by its reviewer. */
  ai?: {
    model: string;
    effort: string;
    quality: number;
    fidelity: number;
    guess: string;
    verdict: string;
    approvedAt: string;
    image?: string;
  };
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
  shortTitle: "Panorama",
  title: "The Barbican Estate — Lakeside Panorama",
  subtitle:
    "The full lakeside composition: tower, terraces, conservatory, podium, and lake",
  description:
    "A large-scale diorama capturing the Barbican's most iconic composition — the full lakeside view with Lauderdale Tower rising behind barrel-vaulted terrace blocks, the colonnade podium, the Conservatory greenhouse, and the ornamental lake. This is a serious, multi-session build using grille-brick spandrels for bush-hammered concrete texture, inverted slopes for the waterside plinth, serrated balcony bands, and recessed window slots. Every piece is drawn from the set's actual white and trans-clear inventory; the 3D model tints water edging dark and planting green purely as a visual guide — on the table those are the same white parts. Designed to maximise the LEGO Architecture Studio 21050 set.",
  difficulty: 3,
  estimatedTime: "8–12 hours across multiple sessions",
  pieceCount: 668,
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
      title: "Phase 1: Foundation Platform",
      concept: "Site & Datum",
      color: "#6B7280",
      icon: "🏗️",
      time: "15\u201320 min",
      location:
        "Every brick of the Barbican stands on ground the Luftwaffe cleared. The Cripplegate ward was virtually demolished in the Blitz; by 1951 only 48 people lived in it, and in 1957 the City voted to rebuild it as a place to live rather than another office quarter. Chamberlin, Powell and Bon, fresh from the Golden Lane Estate next door, designed a 40-acre walled city on a raised concrete podium. Your baseplates are that podium: lake in front, buildings behind, no cars anywhere.",
      steps: [
        {
          title: "Back row of baseplates",
          instruction: "Place 3× Plate 8×8 (foundation platform); toward the rear of the model, directly on the table. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 8×8", part: "41539", qty: 3 },
          ],
          tip: "The Barbican stands on the Cripplegate ward, flattened in the Blitz; by 1951 just 48 people lived here. Everything you build rises from this cleared ground, exactly as the estate did.",
        },
        {
          title: "Middle row of baseplates",
          instruction: "Place 3× Plate 8×8 (foundation platform); in the centre of the model, directly on the table. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 8×8", part: "41539", qty: 3 },
          ],
          tip: "Chamberlin, Powell and Bon won the commission after their Golden Lane Estate next door. Construction here started in 1965 and ran for eleven years.",
        },
        {
          title: "Lake-zone extension",
          instruction: "Place 4× Plate 6×10 (lake zone extension); toward the front of the model, directly on the table. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 6×10", part: "3033", qty: 4 },
          ],
          tip: "The whole 40-acre estate sits on a raised concrete podium; pedestrians above, service roads and car parks below. Your baseplates are that podium deck.",
        },
        {
          title: "Side extensions",
          instruction: "Place 4× Plate 6×8 (side extension); toward the rear of the model, directly on the table. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 6×8", part: "3036", qty: 4 },
          ],
          tip: "Real baseplates, like real ground beams, want their joints staggered. The side wings widen the site for the gardens and boundary walls to come.",
        },
        {
          title: "Seam ties, west and east",
          instruction: "Place 1× Plate 2×4 (seam tie (west)) and 1× Plate 2×4 (seam tie (east)); toward the rear of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 2×4", part: "3020", qty: 2 },
          ],
          tip: "Plates bridging a joint lock two baseplates into one slab; the same job the podium's expansion joints and ties do across the estate.",
        },
        {
          title: "Ties across the side joints",
          instruction: "Place 4× Plate 1×6 (side seam tie); toward the rear of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 1×6", part: "3666", qty: 4 },
          ],
          tip: "Press each tie down firmly along its whole length before moving on; a loose base joint telegraphs wobble all the way up.",
        },
        {
          title: "Edge beams around the rim",
          instruction: "Place 2× Plate 1×10 (front edge beam); 1× Plate 1×4 (front edge beam); 2× Plate 1×6 (back edge beam); 1× Plate 1×10 (left edge beam); 1× Plate 1×6 (left edge beam); 1× Plate 1×10 (right edge beam); and 1× Plate 1×6 (right edge beam); in the centre of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 1×10", part: "4477", qty: 4 },
            { name: "Plate 1×4", part: "3710", qty: 1 },
            { name: "Plate 1×6", part: "3666", qty: 4 },
          ],
          tip: "The estate reads as a walled city; its name comes from the Latin barbecana, a fortified outer gateway. These dark beams start that defensive edge.",
        },
        {
          title: "Tower raft foundation",
          instruction: "Place 3× Plate 4×6 (tower reinforcement l1) and 2× Plate 4×6 (tower reinforcement l2); toward the rear of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 4×6", part: "3032", qty: 5 },
          ],
          tip: "Ove Arup's engineers gave each tower a massive raft so 43 storeys of concrete could stand beside Underground tunnels. Two stacked plate layers are your raft.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 2: THE LAKE (8 steps, 70 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-lake",
      title: "Phase 2: The Lake",
      concept: "Water & Reflection",
      color: "#06B6D4",
      icon: "💧",
      time: "20\u201325 min",
      location:
        "The architects put an ornamental lake at the centre of the composition so the concrete would always be seen doubled in water. Fountains run along the terrace edge, koi and ghost carp live in it, and the whole basin sits over the estate's hidden service level. Residents' balconies were angled to look onto it; you are building the estate's front garden.",
      steps: [
        {
          title: "Lake corners",
          instruction: "Place 4× Plate 2×2 Corner (lake corner); toward the front of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 2×2 Corner", part: "2420", qty: 4 },
          ],
          tip: "The architects wanted the blocks 'reflected in the ornamental lake'. Four corner plates set out its rectangle; everything else on the estate is arranged to face it.",
        },
        {
          title: "Lake border",
          instruction: "Place 3× Plate 1×4 (lake border (back)); 3× Plate 1×4 (lake border (front)); 1× Plate 1×3 (lake border (left)); and 1× Plate 1×3 (lake border (right)); toward the front of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 1×4", part: "3710", qty: 6 },
            { name: "Plate 1×3", part: "3623", qty: 2 },
          ],
          tip: "The dark border is the lake's concrete lip. In the real thing, fountains run along the terrace side and residents' balconies look straight down onto the water.",
        },
        {
          title: "Water surface, first rows",
          instruction: "Place 12× Trans-Clear Plate 1×2 (lake water); toward the front of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Trans-Clear Plate 1×2", part: "3023", qty: 12 },
          ],
          tip: "Lay the trans-clear plates in neat courses like flooring. Gaps read as missing water, so keep every row complete.",
        },
        {
          title: "Water surface, middle rows",
          instruction: "Place 12× Trans-Clear Plate 1×2 (lake water); toward the front of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Trans-Clear Plate 1×2", part: "3023", qty: 12 },
          ],
          tip: "The real lake holds koi, ghost carp and terrapins. It also does quiet structural work; it sits over the Barbican's service level.",
        },
        {
          title: "Water surface, final row",
          instruction: "Place 6× Trans-Clear Plate 1×2 (lake water); toward the front of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Trans-Clear Plate 1×2", part: "3023", qty: 6 },
          ],
          tip: "One more row closes the surface against the front border.",
        },
        {
          title: "Ripple highlights",
          instruction: "Place 14× Trans-Clear Plate 1×1 (ripple highlight); toward the front of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Trans-Clear Plate 1×1", part: "3024", qty: 14 },
          ],
          tip: "Single trans plates catch light at a different angle than the rows beneath; an old LEGO Architecture trick for making flat water read as moving.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 3: PODIUM COLONNADE (6 steps, 40 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-podium",
      title: "Phase 3: Podium & Colonnade",
      concept: "Pilotis & Undercroft",
      color: "#8B5CF6",
      icon: "🏛️",
      time: "20\u201325 min",
      location:
        "Peter Chamberlin said plainly that the practice's biggest influence was Le Corbusier, and nowhere is it clearer than here: fat round pilotis lift the blocks free of the ground, exactly as at the Unit\u00e9 d'Habitation. The shadowed space beneath became the estate's service world. Pave that floor while you can still reach it; the deck will close over it for good.",
      steps: [
        {
          title: "Main columns",
          instruction: "Place 12× Brick 2×2 Round (podium column); in the centre of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 2×2 Round", part: "3941", qty: 12 },
          ],
          tip: "Peter Chamberlin admitted the biggest influence was Le Corbusier; and these fat round pilotis lifting the blocks over the lake are textbook Corbusier.",
        },
        {
          title: "Column capitals",
          instruction: "Place 6× Plate 2×2 Round (column capital); in the centre of the model, about 2 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 2×2 Round", part: "4032", qty: 6 },
          ],
          tip: "A round plate on each column spreads the load; and gives the deck plates a stud to bite on.",
        },
        {
          title: "Secondary columns",
          instruction: "Place 8× Round Brick 1×1 (secondary column); in the centre of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Round Brick 1×1", part: "3062b", qty: 8 },
          ],
          tip: "Slimmer 1×1 round columns fill the long spans between the main pilotis, just as the estate mixes column sizes under its slabs.",
        },
        {
          title: "Secondary column caps",
          instruction: "Place 4× Plate 1×1 (column cap); in the centre of the model, about 2 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 1×1", part: "3024w", qty: 4 },
          ],
          tip: "A single plate tops each slim column so it finishes level with the big capitals.",
        },
        {
          title: "Undercroft paving, rear",
          instruction: "Place 3× Tile 2×2 (undercroft paving); in the centre of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Tile 2×2", part: "3068b", qty: 3 },
          ],
          tip: "Pave the shaded floor under the deck now, while you can still reach it; once the deck goes on, this space closes up for good, exactly like the estate's service undercrofts.",
        },
        {
          title: "Undercroft paving, front",
          instruction: "Place 6× Tile 2×2 (undercroft paving); in the centre of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Tile 2×2", part: "3068b", qty: 6 },
          ],
          tip: "Smooth tiles read as poured floor slab. Keep them inside the column grid.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 4: GROUND LEVEL & STRUCTURAL CORES (28 steps, 188 pieces)
    // Interleaved terrace + tower build for access
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-terrace-core",
      title: "Phase 4: Ground Level & Structural Cores",
      concept: "Bearing Walls & Deck",
      color: "#D97706",
      icon: "🧱",
      time: "35\u201345 min",
      location:
        "Concrete cross-walls carry the terrace blocks, with the Arts Centre pushed in at ground level. When the Queen opened the Barbican Centre on 3 March 1982 it was the largest performing-arts centre in Europe, and she called the complex 'one of the modern wonders of the world'. This phase also starts Lauderdale Tower and lays the podium deck that all pedestrian life happens on.",
      steps: [
        {
          title: "Bearing walls",
          instruction: "Place 8× Brick 2×4 (bearing wall); toward the rear of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 2×4", part: "3001", qty: 8 },
          ],
          tip: "Four dark cross-walls carry the terrace block, echoing the estate's in-situ concrete party walls. Everything above lands on these.",
        },
        {
          title: "Bond course",
          instruction: "Place 4× Plate 2×4 (bond course); toward the rear of the model, about 2 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 2×4", part: "3020", qty: 4 },
          ],
          tip: "A plate course across the wall heads ties them into one structure before the slab arrives.",
        },
        {
          title: "Arts Centre arcade",
          instruction: "Place 6× Brick 1×1 (arcade pier) and 3× Arch 1×4 (arts centre arch); in the centre of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×1", part: "3005", qty: 6 },
            { name: "Arch 1×4", part: "3659", qty: 3 },
          ],
          tip: "The Barbican Centre; Europe's largest performing-arts centre when the Queen opened it in 1982, calling the complex 'one of the modern wonders of the world'; announces itself at ground level with arched openings.",
        },
        {
          title: "Foyer glazing",
          instruction: "Place 3× Trans-Clear Panel 1×2×2 (foyer glazing); toward the rear of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Trans-Clear Panel 1×2×2", part: "87552", qty: 3 },
          ],
          tip: "Full-height trans-clear panels behind the arcade are the foyer's glass line. Slide each one down between the bearing walls.",
        },
        {
          title: "Landscaped banks",
          instruction: "Place 2× Slope 2×3 (25°) (landscaped bank); in the centre of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Slope 2×3 (25°)", part: "3298", qty: 2 },
          ],
          tip: "Green slopes soften the estate's flanks; the Barbican's landscaping was specified as deliberately as its concrete.",
        },
        {
          title: "Terrace ground slab",
          instruction: "Place 3× Plate 4×4 (terrace ground slab); toward the rear of the model, about 2 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 4×4", part: "3031", qty: 3 },
          ],
          tip: "Plates over the arcade close the ground floor. From here up, the terrace block is residential.",
        },
        {
          title: "Waterside plinth and steps",
          instruction: "Place 4× Slope 1×2 Inverted (waterside plinth) and 4× Plate 1×2 (lakeside step); in the centre of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Slope 1×2 Inverted", part: "3665", qty: 4 },
            { name: "Plate 1×2", part: "3023w", qty: 4 },
          ],
          tip: "Inverted slopes form the podium's battered edge above the lake, with step plates tying the waterfront to the main platform. Place these before the deck goes on; afterwards you can't reach them.",
        },
        {
          title: "Podium deck",
          instruction: "Place 5× Plate 4×6 (podium deck); in the centre of the model, about 3 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 4×6", part: "3032", qty: 5 },
          ],
          tip: "The deck drops onto the column capitals and turns the colonnade into an undercroft. On the estate this level is where all pedestrian life happens; no cars anywhere above ground.",
        },
        {
          title: "Deck upstand",
          instruction: "Place 5× Brick 1×4 (deck upstand); in the centre of the model, about 3 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×4", part: "3010", qty: 5 },
          ],
          tip: "A course of 1×4 bricks edges the deck where it faces the lake. It carries the highwalk later, so it has to be studded: a studless panel here would leave the walkway with nothing to grip.",
        },
        {
          title: "Parapet corners",
          instruction: "Place 4× Panel 1×1×1 Corner (parapet corner); in the centre of the model, about 3 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Panel 1×1×1 Corner", part: "6231", qty: 4 },
          ],
          tip: "Corner panels turn the rail around the deck's back corners.",
        },
        {
          title: "Tower courses 1-2",
          instruction: "Place 4× Brick 1×3 (tower y-plan course); 2× Brick 2×2 (tower y-plan course); and 4× Brick 2×3 (tower y-plan course); toward the rear of the model, about 1 brick up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×3", part: "3622", qty: 4 },
            { name: "Brick 2×2", part: "3003", qty: 2 },
            { name: "Brick 2×3", part: "3002", qty: 4 },
          ],
          tip: "Lauderdale Tower begins. The real towers are triangular in plan with a service core; ours is a Y; three wings around a 2×2 core, which keeps every course self-bracing.",
        },
        {
          title: "Tower courses 3-4",
          instruction: "Place 2× Brick 1×3 (tower y-plan course); 2× Brick 2×2 (tower y-plan course); 3× Brick 2×3 (tower y-plan course); 1× Brick 2×6 (tower y-plan course); 1× Plate 2×6 (tower floor band); and 2× Plate 2×4 (tower floor band); toward the rear of the model, about 3 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×3", part: "3622", qty: 2 },
            { name: "Brick 2×2", part: "3003", qty: 2 },
            { name: "Brick 2×3", part: "3002", qty: 3 },
            { name: "Brick 2×6", part: "2456", qty: 1 },
            { name: "Plate 2×6", part: "3795", qty: 1 },
            { name: "Plate 2×4", part: "3020", qty: 2 },
          ],
          tip: "Alternating course patterns interlock the wings into the core; running bond, the oldest trick in masonry, in concrete and in LEGO.",
        },
        {
          title: "Tower courses 5-6",
          instruction: "Place 2× Brick 1×3 (tower y-plan course); 3× Brick 2×2 (tower y-plan course); 2× Brick 2×3 (tower y-plan course); 1× Brick 2×4 (tower y-plan course); and 3× Grille Brick 1×2 (tower spandrel band); toward the rear of the model, about 5 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×3", part: "3622", qty: 2 },
            { name: "Brick 2×2", part: "3003", qty: 3 },
            { name: "Brick 2×3", part: "3002", qty: 2 },
            { name: "Brick 2×4", part: "3001", qty: 1 },
            { name: "Grille Brick 1×2", part: "2877", qty: 3 },
          ],
          tip: "From here up the wing tips alternate: ribbed spandrel courses, then trans-clear window bands. Each course carries its own facade pieces.",
        },
        {
          title: "Tower courses 7-8",
          instruction: "Place 1× Brick 2×4 (tower y-plan course); 3× Brick 2×2 (tower y-plan course); 3× Trans-Clear Brick 1×2 (tower window band); 1× Brick 2×6 (tower y-plan course); 1× Brick 2×3 (tower y-plan course); 1× Plate 2×6 (tower floor band); and 2× Plate 2×4 (tower floor band); toward the rear of the model, about 7 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 2×4", part: "3001", qty: 1 },
            { name: "Brick 2×2", part: "3003", qty: 3 },
            { name: "Trans-Clear Brick 1×2", part: "3065", qty: 3 },
            { name: "Brick 2×6", part: "2456", qty: 1 },
            { name: "Brick 2×3", part: "3002", qty: 1 },
            { name: "Plate 2×6", part: "3795", qty: 1 },
            { name: "Plate 2×4", part: "3020", qty: 2 },
          ],
          tip: "A plate band after every fourth course marks a floor line, just as the towers' balcony slabs stripe their elevations.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 5: TERRACE BLOCK — SNOT FACADE (12 steps, 72 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-terrace-facade",
      title: "Phase 5: Terrace Block, Storeys & Facade",
      concept: "Repetition & Texture",
      color: "#DC2626",
      icon: "🪟",
      time: "45\u201355 min",
      location:
        "The thirteen real terrace blocks are seven storeys of identical, hand-finished concrete. After each pour had cured for 21 days, workers attacked the whole surface with pick hammers to expose the Penlee granite aggregate: over 200,000 square metres of wall, famously tooled by a team of just six men. Build each storey complete (walls, windows, floor band and balconies) before starting the next; that is the only order real bricks allow.",
      steps: [
        {
          title: "Storey 1: walls and spandrels",
          instruction: "Place 2× Brick 1×6 (terrace back wall); 2× Brick 1×4 (terrace back wall); 2× Brick 1×2 (terrace end wall); and 5× Brick 1×4 (spandrel course); toward the rear of the model, about 3 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×6", part: "3009", qty: 2 },
            { name: "Brick 1×4", part: "3010", qty: 7 },
            { name: "Brick 1×2", part: "3004", qty: 2 },
          ],
          tip: "The terrace blocks are seven storeys in real life; three here. The spandrel course uses 1×4 bricks; read them as the pick-hammered concrete panels between windows.",
        },
        {
          title: "Storey 1: window piers",
          instruction: "Place 8× Brick 1×1 (window pier); in the centre of the model, about 4 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×1", part: "3005", qty: 8 },
          ],
          tip: "Single-stud piers set the window rhythm. The gaps between them take the glazing next.",
        },
        {
          title: "Storey 1: glazing",
          instruction: "Place 6× Trans-Clear Brick 1×2 (window glazing); in the centre of the model, about 4 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Trans-Clear Brick 1×2", part: "3065", qty: 6 },
          ],
          tip: "Trans-clear 1×2 bricks drop between the piers. Narrow vertical slots of glass in deep concrete are the terrace blocks' signature.",
        },
        {
          title: "Storey 1: rear bond course",
          instruction: "Place 2× Brick 1×4 (terrace back wall); 2× Brick 1×6 (terrace back wall); and 2× Brick 1×2 (terrace end wall); toward the rear of the model, about 4 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×4", part: "3010", qty: 2 },
            { name: "Brick 1×6", part: "3009", qty: 2 },
            { name: "Brick 1×2", part: "3004", qty: 2 },
          ],
          tip: "The back wall bonds over the course below; stagger every joint.",
        },
        {
          title: "Storey 1: floor band",
          instruction: "Place 10× Plate 2×3 (terrace floor band); 3× Plate 2×2 (balcony slab (projecting)); and 7× Plate 1×2 (balcony slab (flush)); in the centre of the model, about 5 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 2×3", part: "3021", qty: 10 },
            { name: "Plate 2×2", part: "3022", qty: 3 },
            { name: "Plate 1×2", part: "3023w", qty: 7 },
          ],
          tip: "A full plate band is this storey's floor slab. The rear plates span to the back wall; the front strip alternates flush and projecting.",
        },
        {
          title: "Storey 1: balcony finishing",
          instruction: "Place 2× Tile 1×2 Grille (balcony grille decking) and 2× Plate 1×1 Round (balcony planter); in the centre of the model, about 5 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Tile 1×2 Grille", part: "2412b", qty: 2 },
            { name: "Plate 1×1 Round", part: "4073", qty: 2 },
          ],
          tip: "Grille tiles deck the projecting balconies, and round green plates are the residents' planters; balcony gardening is practically a competitive sport at the Barbican. Do this now: the next storey will close off the reach.",
        },
        {
          title: "Storey 2: walls and spandrels",
          instruction: "Place 2× Brick 1×6 (terrace back wall); 2× Brick 1×4 (terrace back wall); 2× Brick 1×2 (terrace end wall); and 5× Brick 1×4 (spandrel course); toward the rear of the model, about 5 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×6", part: "3009", qty: 2 },
            { name: "Brick 1×4", part: "3010", qty: 7 },
            { name: "Brick 1×2", part: "3004", qty: 2 },
          ],
          tip: "The estate's exposed concrete was hand-finished: after 21 days' curing, workers with pick hammers chipped the whole surface to expose the Penlee granite aggregate; over 200,000 m² of it, reportedly by a team of six.",
        },
        {
          title: "Storey 2: window piers",
          instruction: "Place 8× Headlight Brick 1×1 (window pier (headlight)); in the centre of the model, about 6 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Headlight Brick 1×1", part: "4070", qty: 8 },
          ],
          tip: "This storey's piers are headlight bricks; their recessed faces read as the deep window reveals that give the facades their shadow.",
        },
        {
          title: "Storey 2: glazing",
          instruction: "Place 6× Trans-Clear Brick 1×2 (window glazing); in the centre of the model, about 6 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Trans-Clear Brick 1×2", part: "3065", qty: 6 },
          ],
          tip: "Trans-clear 1×2 bricks drop between the piers. Narrow vertical slots of glass in deep concrete are the terrace blocks' signature.",
        },
        {
          title: "Storey 2: rear bond course",
          instruction: "Place 2× Brick 1×4 (terrace back wall); 2× Brick 1×6 (terrace back wall); and 2× Brick 1×2 (terrace end wall); toward the rear of the model, about 6 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×4", part: "3010", qty: 2 },
            { name: "Brick 1×6", part: "3009", qty: 2 },
            { name: "Brick 1×2", part: "3004", qty: 2 },
          ],
          tip: "The back wall bonds over the course below; stagger every joint.",
        },
        {
          title: "Storey 2: floor band",
          instruction: "Place 10× Plate 2×3 (terrace floor band); 3× Plate 2×2 (balcony slab (projecting)); and 7× Plate 1×2 (balcony slab (flush)); in the centre of the model, about 7 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 2×3", part: "3021", qty: 10 },
            { name: "Plate 2×2", part: "3022", qty: 3 },
            { name: "Plate 1×2", part: "3023w", qty: 7 },
          ],
          tip: "A full plate band is this storey's floor slab. The rear plates span to the back wall; the front strip alternates flush and projecting.",
        },
        {
          title: "Storey 2: balcony finishing",
          instruction: "Place 2× Tile 1×2 Grille (balcony grille decking) and 2× Plate 1×1 Round (balcony planter); in the centre of the model, about 7 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Tile 1×2 Grille", part: "2412b", qty: 2 },
            { name: "Plate 1×1 Round", part: "4073", qty: 2 },
          ],
          tip: "Grille tiles deck the projecting balconies, and round green plates are the residents' planters; balcony gardening is practically a competitive sport at the Barbican. Do this now: the next storey will close off the reach.",
        },
        {
          title: "Storey 3: walls and spandrels",
          instruction: "Place 2× Brick 1×6 (terrace back wall); 2× Brick 1×4 (terrace back wall); 2× Brick 1×2 (terrace end wall); and 5× Brick 1×4 (spandrel course); toward the rear of the model, about 7 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×6", part: "3009", qty: 2 },
            { name: "Brick 1×4", part: "3010", qty: 7 },
            { name: "Brick 1×2", part: "3004", qty: 2 },
          ],
          tip: "Top storey. In the real blocks the uppermost flats are the prized ones, tucked directly under the barrel vaults.",
        },
        {
          title: "Storey 3: window piers",
          instruction: "Place 8× Brick 1×1 (window pier); in the centre of the model, about 8 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×1", part: "3005", qty: 8 },
          ],
          tip: "Single-stud piers set the window rhythm. The gaps between them take the glazing next.",
        },
        {
          title: "Storey 3: glazing",
          instruction: "Place 6× Trans-Clear Brick 1×2 (window glazing); in the centre of the model, about 8 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Trans-Clear Brick 1×2", part: "3065", qty: 6 },
          ],
          tip: "Trans-clear 1×2 bricks drop between the piers. Narrow vertical slots of glass in deep concrete are the terrace blocks' signature.",
        },
        {
          title: "Storey 3: rear bond course",
          instruction: "Place 2× Brick 1×4 (terrace back wall); 2× Brick 1×6 (terrace back wall); and 2× Brick 1×2 (terrace end wall); toward the rear of the model, about 8 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×4", part: "3010", qty: 2 },
            { name: "Brick 1×6", part: "3009", qty: 2 },
            { name: "Brick 1×2", part: "3004", qty: 2 },
          ],
          tip: "The back wall bonds over the course below; stagger every joint.",
        },
        {
          title: "Shear walls",
          instruction: "Place 2× Brick 1×2 (shear wall); toward the rear of the model, about 7 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×2", part: "3004", qty: 2 },
          ],
          tip: "Two interior walls stiffen the top storey against the roof load.",
        },
        {
          title: "Roof cap",
          instruction: "Place 2× Plate 4×8 (roof cap plate) and 1× Plate 4×4 (roof cap plate); toward the rear of the model, about 9 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 4×8", part: "3035", qty: 2 },
            { name: "Plate 4×4", part: "3031", qty: 1 },
          ],
          tip: "Large plates close the block and give the vault roof its bed. The 13 real terrace blocks all finish this way; flat slab, then the white vaults.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 6: TERRACE BLOCK — BALCONIES & SOFFITS (10 steps, 52 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-terrace-balconies",
      title: "Phase 6: Highwalks & Podium Life",
      concept: "Streets in the Sky",
      color: "#059669",
      icon: "🏢",
      time: "10\u201315 min",
      location:
        "The Barbican's elevated walkways were meant to be the first stretch of a city-wide 'pedway' network floating above the traffic. The network never happened, but the estate's piece of it works exactly as drawn: you can walk from flat to concert hall to school without ever meeting a car. Benches, planters and paving make the podium a place rather than a route.",
      steps: [
        {
          title: "Highwalk plates",
          instruction: "Place 5× Plate 1×4 (highwalk plate); in the centre of the model, about 4 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 1×4", part: "3710", qty: 5 },
          ],
          tip: "The estate's highwalks were meant to seed a city-wide network of walkways above the traffic; the 'pedway'. Only fragments were ever built, but the Barbican's stretch still works exactly as drawn.",
        },
        {
          title: "Highwalk paving",
          instruction: "Place 5× Tile 1×4 (highwalk tile); in the centre of the model, about 4 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Tile 1×4", part: "2431", qty: 5 },
          ],
          tip: "Dark tiles give the elevated walk its smooth deck. Yellow lines painted on the real ones guide visitors to the Centre.",
        },
        {
          title: "Deck planters",
          instruction: "Place 2× Plate 1×1 Round (deck planter) and 2× Plate 1×1 Round (deck planting); in the centre of the model, about 3 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 1×1 Round", part: "4073", qty: 4 },
          ],
          tip: "Round planters with greenery break up the podium paving, matching the estate's raised beds.",
        },
        {
          title: "Lakeside benches",
          instruction: "Place 4× Tile 1×2 (lakeside bench); toward the front of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Tile 1×2", part: "3069b", qty: 4 },
          ],
          tip: "Benches face the water on the lakeside walk; the estate's best free seats.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 7: BARREL VAULT ROOF (10 steps, 52 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-barrel-vault",
      title: "Phase 7: Barrel Vault Roof",
      concept: "The Signature Curve",
      color: "#7C3AED",
      icon: "🌀",
      time: "25\u201330 min",
      location:
        "Nothing says Barbican like the white barrel vaults along every terrace roofline. The architects took the curve from Le Corbusier's Maison Jaoul and from whitewashed Greek island churches, then repeated it across all thirteen blocks. Your curved-top bricks crown the rooftop plant room the same way.",
      steps: [
        {
          title: "Rear roof pitch",
          instruction: "Place 7× Slope 2×2 (45°) (roof pitch (rear)); toward the rear of the model, about 10 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Slope 2×2 (45°)", part: "3039", qty: 7 },
          ],
          tip: "The terrace roofs trace back to Le Corbusier's Maison Jaoul vaults and Greek island church roofs; Mediterranean curves over London concrete.",
        },
        {
          title: "Front roof pitch",
          instruction: "Place 3× Slope 2×4 (45°) (roof pitch (front)) and 2× Slope 1×2 (45°) (roof pitch (front)); in the centre of the model, about 10 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Slope 2×4 (45°)", part: "3037", qty: 3 },
            { name: "Slope 1×2 (45°)", part: "3040", qty: 2 },
          ],
          tip: "The south pitch meets the rear at the ridge. Seen from the lake this is the terrace's skyline.",
        },
        {
          title: "Plant room walls",
          instruction: "Place 2× Brick 1×3 (plant room wall (rear)) and 2× Brick 1×2 (plant room wall (side)); at the rear east of the model, about 10 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×3", part: "3622", qty: 2 },
            { name: "Brick 1×2", part: "3004", qty: 2 },
          ],
          tip: "A rooftop plant room anchors the east end; the estate hides all its machinery in blocks like this one.",
        },
        {
          title: "Plant room glazing",
          instruction: "Place 2× Brick 1×1 (plant room corner) and 2× Trans-Clear Brick 1×2 (plant room glazing); on the east side, about 10 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×1", part: "3005", qty: 2 },
            { name: "Trans-Clear Brick 1×2", part: "3065", qty: 2 },
          ],
          tip: "Corner bricks and trans-clear infill give the plant room its clerestory band.",
        },
        {
          title: "Plant room roof",
          instruction: "Place 1× Plate 4×4 (plant room roof) and 1× Plate 2×4 (plant room roof); at the rear east of the model, about 11 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 4×4", part: "3031", qty: 1 },
            { name: "Plate 2×4", part: "3020", qty: 1 },
          ],
          tip: "Plates cap the box, ready for the vaults.",
        },
        {
          title: "Barrel vaults, rear row",
          instruction: "Place 6× Slope Curved 2×1×1⅓ (barrel vault cap); at the rear east of the model, about 11 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Slope Curved 2×1×1⅓", part: "6091", qty: 6 },
          ],
          tip: "Curved-top bricks laid side by side are the Barbican's most famous motif in miniature: the white barrel vaults that crown the terrace blocks. Point each hump north, away from the lake; the flat end with the recessed stud faces the ridge.",
        },
        {
          title: "Barrel vaults, front row",
          instruction: "Place 6× Slope Curved 2×1×1⅓ (barrel vault cap); on the east side, about 11 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Slope Curved 2×1×1⅓", part: "6091", qty: 6 },
          ],
          tip: "The front row faces the other way, humps toward the lake, so the two rows meet back to back and read as one continuous vault.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 8: LAUDERDALE TOWER — ABOVE THE ROOFLINE (10 steps, 92 pieces)
    // Lower shaft already built in Phase 4
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-tower-core",
      title: "Phase 8: Lauderdale Tower, The Shaft",
      concept: "Verticality",
      color: "#BE185D",
      icon: "🗼",
      time: "45\u201360 min",
      location:
        "Cromwell, Shakespeare and Lauderdale rise 43 and 44 storeys to about 123 metres, among the tallest residential towers in Europe when they topped out. Each is triangular in plan with serrated balcony edges; ours is a Y around a solid core, which keeps every course self-bracing. The window bands build in as you climb, so the shaft arrives finished.",
      steps: [
        {
          title: "Tower courses 9-10",
          instruction: "Place 2× Brick 1×3 (tower y-plan course); 3× Brick 2×2 (tower y-plan course); 2× Brick 2×3 (tower y-plan course); 1× Brick 2×4 (tower y-plan course); and 3× Grille Brick 1×2 (tower spandrel band); toward the rear of the model, about 10 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×3", part: "3622", qty: 2 },
            { name: "Brick 2×2", part: "3003", qty: 3 },
            { name: "Brick 2×3", part: "3002", qty: 2 },
            { name: "Brick 2×4", part: "3001", qty: 1 },
            { name: "Grille Brick 1×2", part: "2877", qty: 3 },
          ],
          tip: "The three real towers; Cromwell, Shakespeare and Lauderdale; rise 43 and 44 storeys to about 123 metres, among the tallest residential towers in Europe when they topped out.",
        },
        {
          title: "Tower courses 11-12",
          instruction: "Place 1× Brick 2×4 (tower y-plan course); 3× Brick 2×2 (tower y-plan course); 3× Trans-Clear Brick 1×2 (tower window band); 1× Brick 2×6 (tower y-plan course); 1× Brick 2×3 (tower y-plan course); 1× Plate 2×6 (tower floor band); and 2× Plate 2×4 (tower floor band); toward the rear of the model, about 12 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 2×4", part: "3001", qty: 1 },
            { name: "Brick 2×2", part: "3003", qty: 3 },
            { name: "Trans-Clear Brick 1×2", part: "3065", qty: 3 },
            { name: "Brick 2×6", part: "2456", qty: 1 },
            { name: "Brick 2×3", part: "3002", qty: 1 },
            { name: "Plate 2×6", part: "3795", qty: 1 },
            { name: "Plate 2×4", part: "3020", qty: 2 },
          ],
          tip: "Keep pressing each course fully home; a tall thin tower amplifies any gap below.",
        },
        {
          title: "Tower courses 13-14",
          instruction: "Place 1× Brick 2×4 (tower y-plan course); 2× Brick 2×2 (tower y-plan course); 2× Brick 1×3 (tower y-plan course); 2× Brick 1×2 (tower y-plan course); and 3× Grille Brick 1×2 (tower spandrel band); toward the rear of the model, about 14 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 2×4", part: "3001", qty: 1 },
            { name: "Brick 2×2", part: "3003", qty: 2 },
            { name: "Brick 1×3", part: "3622", qty: 2 },
            { name: "Brick 1×2", part: "3004", qty: 2 },
            { name: "Grille Brick 1×2", part: "2877", qty: 3 },
          ],
          tip: "The window bands continue automatically as you climb; grille spandrels, then glass.",
        },
        {
          title: "Tower courses 15-16",
          instruction: "Place 2× Brick 1×3 (tower y-plan course); 2× Brick 1×2 (tower y-plan course); 3× Trans-Clear Brick 1×2 (tower window band); 2× Brick 1×6 (tower y-plan course); 1× Brick 2×2 (tower y-plan course); 1× Plate 2×8 (tower floor band); 1× Plate 2×2 (tower floor band); and 2× Cheese Slope 1×1×⅔ (serrated fin); toward the rear of the model, about 16 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×3", part: "3622", qty: 2 },
            { name: "Brick 1×2", part: "3004", qty: 2 },
            { name: "Trans-Clear Brick 1×2", part: "3065", qty: 3 },
            { name: "Brick 1×6", part: "3009", qty: 2 },
            { name: "Brick 2×2", part: "3003", qty: 1 },
            { name: "Plate 2×8", part: "3034", qty: 1 },
            { name: "Plate 2×2", part: "3022", qty: 1 },
            { name: "Cheese Slope 1×1×⅔", part: "54200", qty: 2 },
          ],
          tip: "The towers' floors were cast around slip-formed cores; your plate bands play the part of the floor slabs.",
        },
        {
          title: "Tower courses 17-18",
          instruction: "Place 1× Brick 2×4 (tower y-plan course); 2× Brick 2×2 (tower y-plan course); 2× Brick 1×3 (tower y-plan course); 2× Brick 1×2 (tower y-plan course); and 3× Grille Brick 1×2 (tower spandrel band); toward the rear of the model, about 18 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 2×4", part: "3001", qty: 1 },
            { name: "Brick 2×2", part: "3003", qty: 2 },
            { name: "Brick 1×3", part: "3622", qty: 2 },
            { name: "Brick 1×2", part: "3004", qty: 2 },
            { name: "Grille Brick 1×2", part: "2877", qty: 3 },
          ],
          tip: "Press every piece fully home before moving on; gaps low down telegraph all the way up.",
        },
        {
          title: "Tower courses 19-20",
          instruction: "Place 2× Brick 1×3 (tower y-plan course); 2× Brick 1×2 (tower y-plan course); 3× Trans-Clear Brick 1×2 (tower window band); 2× Brick 1×6 (tower y-plan course); 1× Brick 2×2 (tower y-plan course); 1× Plate 2×8 (tower floor band); 1× Plate 2×2 (tower floor band); and 2× Cheese Slope 1×1×⅔ (serrated fin); toward the rear of the model, about 20 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×3", part: "3622", qty: 2 },
            { name: "Brick 1×2", part: "3004", qty: 2 },
            { name: "Trans-Clear Brick 1×2", part: "3065", qty: 3 },
            { name: "Brick 1×6", part: "3009", qty: 2 },
            { name: "Brick 2×2", part: "3003", qty: 1 },
            { name: "Plate 2×8", part: "3034", qty: 1 },
            { name: "Plate 2×2", part: "3022", qty: 1 },
            { name: "Cheese Slope 1×1×⅔", part: "54200", qty: 2 },
          ],
          tip: "First setback: the wings shorten as the tower rises, sharpening the silhouette.",
        },
        {
          title: "Tower courses 21-22",
          instruction: "Place 1× Brick 2×4 (tower y-plan course); 2× Brick 2×2 (tower y-plan course); 2× Brick 1×3 (tower y-plan course); 2× Brick 1×2 (tower y-plan course); and 3× Grille Brick 1×2 (tower spandrel band); toward the rear of the model, about 23 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 2×4", part: "3001", qty: 1 },
            { name: "Brick 2×2", part: "3003", qty: 2 },
            { name: "Brick 1×3", part: "3622", qty: 2 },
            { name: "Brick 1×2", part: "3004", qty: 2 },
            { name: "Grille Brick 1×2", part: "2877", qty: 3 },
          ],
          tip: "Check the row against the 3D view before seating it; sliding bricks sideways to correct is harder than placing them right.",
        },
        {
          title: "Tower courses 23-24",
          instruction: "Place 2× Brick 1×3 (tower y-plan course); 2× Brick 1×2 (tower y-plan course); 3× Trans-Clear Brick 1×2 (tower window band); 1× Brick 2×4 (tower y-plan course); 2× Brick 2×2 (tower y-plan course); 1× Plate 2×8 (tower floor band); 1× Plate 2×2 (tower floor band); and 2× Cheese Slope 1×1×⅔ (serrated fin); toward the rear of the model, about 25 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×3", part: "3622", qty: 2 },
            { name: "Brick 1×2", part: "3004", qty: 2 },
            { name: "Trans-Clear Brick 1×2", part: "3065", qty: 3 },
            { name: "Brick 2×4", part: "3001", qty: 1 },
            { name: "Brick 2×2", part: "3003", qty: 2 },
            { name: "Plate 2×8", part: "3034", qty: 1 },
            { name: "Plate 2×2", part: "3022", qty: 1 },
            { name: "Cheese Slope 1×1×⅔", part: "54200", qty: 2 },
          ],
          tip: "Line the pieces up on the table in order first; real LEGO designers call this presorting, and it halves build time.",
        },
        {
          title: "Tower courses 25-26",
          instruction: "Place 2× Brick 1×3 (tower y-plan course); 2× Brick 1×2 (tower y-plan course); 1× Brick 2×2 (tower y-plan course); and 3× Brick 1×2 (tower spandrel course); toward the rear of the model, about 27 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×3", part: "3622", qty: 2 },
            { name: "Brick 1×2", part: "3004", qty: 5 },
            { name: "Brick 2×2", part: "3003", qty: 1 },
          ],
          tip: "Second setback; from here the wings are single studs, all point.",
        },
        {
          title: "Tower courses 27-28",
          instruction: "Place 1× Brick 2×2 (tower y-plan course); 2× Tile 1×2 Grille (tower vent course); 1× Brick 1×2 (tower spandrel course); 1× Brick 2×4 (tower y-plan course); 1× Brick 1×2 (tower y-plan course); 1× Plate 2×6 (tower floor band); 1× Plate 2×2 (tower floor band); and 4× Cheese Slope 1×1×⅔ (serrated fin); toward the rear of the model, about 29 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 2×2", part: "3003", qty: 1 },
            { name: "Tile 1×2 Grille", part: "2412b", qty: 2 },
            { name: "Brick 1×2", part: "3004", qty: 2 },
            { name: "Brick 2×4", part: "3001", qty: 1 },
            { name: "Plate 2×6", part: "3795", qty: 1 },
            { name: "Plate 2×2", part: "3022", qty: 1 },
            { name: "Cheese Slope 1×1×⅔", part: "54200", qty: 4 },
          ],
          tip: "Rotate the 3D model to see this step from behind before you place anything.",
        },
        {
          title: "Tower courses 29-30",
          instruction: "Place 2× Brick 1×3 (tower y-plan course); 2× Brick 1×2 (tower y-plan course); 1× Brick 2×2 (tower y-plan course); 2× Tile 1×2 Grille (tower vent course); and 1× Brick 1×2 (tower spandrel course); toward the rear of the model, about 31 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×3", part: "3622", qty: 2 },
            { name: "Brick 1×2", part: "3004", qty: 3 },
            { name: "Brick 2×2", part: "3003", qty: 1 },
            { name: "Tile 1×2 Grille", part: "2412b", qty: 2 },
          ],
          tip: "Top courses. Each real tower finishes with two or three floors of penthouses.",
        },
        {
          title: "Top platform",
          instruction: "Place 1× Plate 2×4 (tower top platform) and 1× Plate 2×2 (tower top platform (rear)); toward the rear of the model, about 33 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 2×4", part: "3020", qty: 1 },
            { name: "Plate 2×2", part: "3022", qty: 1 },
          ],
          tip: "Plates cap the shaft and carry the penthouse block.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 9: TOWER — FACADE & WINDOW BANDS (10 steps, 64 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-tower-facade",
      title: "Phase 9: Tower Penthouse & Trims",
      concept: "The Top Floors",
      color: "#0891B2",
      icon: "📐",
      time: "10\u201315 min",
      location:
        "The top two or three floors of each tower hold just three penthouse flats apiece, the estate's grandest addresses, with London laid out below their wraparound terraces. A solid penthouse block and the last trims finish the shaft you just raised.",
      steps: [
        {
          title: "Penthouse base course",
          instruction: "Place 1× Brick 2×4 (crown base) and 1× Brick 2×2 (crown base (rear)); toward the rear of the model, about 34 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 2×4", part: "3001", qty: 1 },
            { name: "Brick 2×2", part: "3003", qty: 1 },
          ],
          tip: "The top floors of each tower hold three penthouse flats apiece; the Barbican's grandest addresses. A solid course starts ours.",
        },
        {
          title: "Penthouse upper course",
          instruction: "Place 1× Brick 2×4 (crown course) and 1× Brick 2×2 (crown course (rear)); toward the rear of the model, about 35 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 2×4", part: "3001", qty: 1 },
            { name: "Brick 2×2", part: "3003", qty: 1 },
          ],
          tip: "A second course brings the penthouse to height.",
        },
        {
          title: "Band edge tiles",
          instruction: "Place 2× Tile 1×1 (band edge tile); toward the rear of the model, about 31 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Tile 1×1", part: "3070b", qty: 2 },
          ],
          tip: "Smooth tiles trim the topmost band where it shows.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 10: TOWER — SERRATED EDGES & CROWN (10 steps, 60 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-tower-crown",
      title: "Phase 10: Tower Crown",
      concept: "Silhouette",
      color: "#4338CA",
      icon: "👑",
      time: "15\u201320 min",
      location:
        "A Barbican tower is recognisable from a mile away by its crown: plant rooms, tank rooms and window-washing rigs wrapped in the same serrated concrete as the balconies below. The mast and its aircraft beacon top out the model at the scale equivalent of 123 metres.",
      steps: [
        {
          title: "Crown platform",
          instruction: "Place 1× Plate 2×4 (crown platform) and 1× Plate 2×2 (crown platform (rear)); toward the rear of the model, about 36 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 2×4", part: "3020", qty: 1 },
            { name: "Plate 2×2", part: "3022", qty: 1 },
          ],
          tip: "Plates over the penthouse form the roof terrace.",
        },
        {
          title: "Crown core, first course",
          instruction: "Place 1× Brick 2×2 (crown core); toward the rear of the model, about 36 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 2×2", part: "3003", qty: 1 },
          ],
          tip: "The lift motor room rises from the centre of the platform.",
        },
        {
          title: "Crown core, second course",
          instruction: "Place 1× Brick 2×2 (crown core); toward the rear of the model, about 37 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 2×2", part: "3003", qty: 1 },
          ],
          tip: "One more course; the real towers' crowns hold plant, tanks and window-washing rigs.",
        },
        {
          title: "Crown serrations",
          instruction: "Place 4× Cheese Slope 1×1×⅔ (crown serration); toward the rear of the model, about 36 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Cheese Slope 1×1×⅔", part: "54200", qty: 4 },
          ],
          tip: "Cheese slopes ring the core so even the crown keeps the saw-tooth profile.",
        },
        {
          title: "Rear platform trim",
          instruction: "Place 2× Tile 1×1 (platform trim tile); toward the rear of the model, about 36 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Tile 1×1", part: "3070b", qty: 2 },
          ],
          tip: "Tiles finish the rear terrace smooth.",
        },
        {
          title: "Crown roof",
          instruction: "Place 2× Slope 1×2 (45°) (crown roof); toward the rear of the model, about 38 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Slope 1×2 (45°)", part: "3040", qty: 2 },
          ],
          tip: "Two slopes side by side close the motor room with a single pitch falling toward the lake.",
        },
        {
          title: "Mast and beacon",
          instruction: "Place 1× Round Brick 1×1 (mast base); 2× Plate 1×1 Round (mast ring); and 1× Plate 1×1 Round (mast beacon); toward the rear of the model, about 36 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Round Brick 1×1", part: "3062b", qty: 1 },
            { name: "Plate 1×1 Round", part: "4073", qty: 3 },
          ],
          tip: "A slim mast with its aircraft beacon tops out at the equivalent of 123 metres. Cromwell Tower's real beacon blinks over the City every night.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 11: THE CONSERVATORY (12 steps, 64 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-conservatory",
      title: "Phase 11: The Conservatory",
      concept: "The Hidden Greenhouse",
      color: "#16A34A",
      icon: "🌿",
      time: "25\u201330 min",
      location:
        "London's second-largest conservatory exists to solve an embarrassment: the Barbican Theatre's fly tower stuck up above the roofline, so the architects wrapped it in glass and filled it with plants. Planted in 1980-81 and opened in 1984, it holds about 1,500 species under 23,000 square feet of steel and glass, some now rare or extinct in the wild.",
      steps: [
        {
          title: "Conservatory base",
          instruction: "Place 1× Plate 4×4 (conservatory base) and 1× Plate 2×4 (conservatory base); on the east side, about 3 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 4×4", part: "3031", qty: 1 },
            { name: "Plate 2×4", part: "3020", qty: 1 },
          ],
          tip: "London's second-largest conservatory (after Kew's Princess of Wales house) exists for a sly reason: to hide the Barbican Theatre's fly tower. Scenery drops from inside it to a stage six storeys below.",
        },
        {
          title: "Corner posts, lower",
          instruction: "Place 4× Brick 1×1 (corner post); on the east side, about 3 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×1", part: "3005", qty: 4 },
          ],
          tip: "Four posts set out the steel frame.",
        },
        {
          title: "Corner posts, upper",
          instruction: "Place 4× Brick 1×1 (corner post); on the east side, about 4 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×1", part: "3005", qty: 4 },
          ],
          tip: "Double-height posts match the glazing panels' height.",
        },
        {
          title: "Glazing panels all round",
          instruction: "Place 2× Trans-Clear Panel 1×2×2 (side glazing); 2× Trans-Clear Panel 1×2×2 (rear glazing); and 2× Trans-Clear Panel 1×2×2 (front glazing); on the east side, about 3 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Trans-Clear Panel 1×2×2", part: "87552", qty: 6 },
          ],
          tip: "Trans-clear wall panels close the glass house. The real steel-and-glass roof covers 23,000 square feet over hand-mixed soil beds.",
        },
        {
          title: "Ring beam",
          instruction: "Place 1× Plate 1×6 (ring plate (front)); 1× Plate 1×6 (ring plate (back)); and 2× Plate 1×2 (ring plate (side)); on the east side, about 5 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 1×6", part: "3666", qty: 2 },
            { name: "Plate 1×2", part: "3023w", qty: 2 },
          ],
          tip: "Plates over the panels form the ring beam that carries the glass roof.",
        },
        {
          title: "Planting",
          instruction: "Place 5× Plate 1×1 Round (conservatory planting); on the east side, about 3 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 1×1 Round", part: "4073", qty: 5 },
          ],
          tip: "Around 1,500 species grow inside, planted in 1980-81 before opening in 1984; some now rare or extinct in the wild. Green round plates are your finger palms and tree ferns.",
        },
        {
          title: "Paths and entry",
          instruction: "Place 1× Tile 1×2 (interior path); 1× Tile 1×1 (interior path); and 1× Tile 1×2 (conservatory entry); on the east side, about 3 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Tile 1×2", part: "3069b", qty: 2 },
            { name: "Tile 1×1", part: "3070b", qty: 1 },
          ],
          tip: "Dark tiles thread a visitor path through the beds and mark the entrance outside.",
        },
        {
          title: "Glass roof, front half",
          instruction: "Place 6× Trans-Clear Plate 1×2 (glass roof); on the east side, about 6 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Trans-Clear Plate 1×2", part: "3023", qty: 6 },
          ],
          tip: "Trans-clear plates lie flat across the ring beam; each pane anchors on the ring at one end.",
        },
        {
          title: "Glass roof, rear half",
          instruction: "Place 6× Trans-Clear Plate 1×2 (glass roof); on the east side, about 6 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Trans-Clear Plate 1×2", part: "3023", qty: 6 },
          ],
          tip: "The rear panes complete the canopy over the planting.",
        },
      ],
    },

    // ════════════════════════════════════════════════════════════════════
    // PHASE 12: LANDSCAPING & DETAILS (15 steps, 119 pieces)
    // ════════════════════════════════════════════════════════════════════
    {
      id: "bp-landscaping",
      title: "Phase 12: Landscaping & Details",
      concept: "Making a Place",
      color: "#65A30D",
      icon: "🌳",
      time: "30\u201340 min",
      location:
        "The landscape was designed as deliberately as the towers: every tree, bench and paving line was specified by the architects. Fragments of the Roman and medieval London Wall survive inside the estate, the ancient barbican, or fortified gateway, that gave the place its name. Finished, the estate houses over 4,000 residents in more than 2,000 flats, and the whole complex has been Grade II listed since September 2001.",
      steps: [
        {
          title: "Deck paving",
          instruction: "Place 5× Tile 1×4 (deck paving); in the centre of the model, about 3 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Tile 1×4", part: "2431", qty: 5 },
          ],
          tip: "Dark tile runs across the podium mark the pedestrian desire lines to the Centre.",
        },
        {
          title: "Lakeside promenade",
          instruction: "Place 1× Tile 1×4 (promenade (west)); 1× Tile 1×2 (promenade (west)); 1× Tile 1×4 (promenade (east)); and 1× Tile 1×2 (promenade (east)); in the centre of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Tile 1×4", part: "2431", qty: 2 },
            { name: "Tile 1×2", part: "3069b", qty: 2 },
          ],
          tip: "The promenade along the water is the estate's social spine; cafe tables from the Centre spill onto the real one.",
        },
        {
          title: "Bollards",
          instruction: "Place 6× Plate 1×1 Round (bollard); toward the front of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Plate 1×1 Round", part: "4073", qty: 6 },
          ],
          tip: "Round plates as bollards edge the water; the only traffic they stop is pigeons.",
        },
        {
          title: "Lakeside walks",
          instruction: "Place 2× Tile 1×6 (lakeside walk); toward the front of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Tile 1×6", part: "6636", qty: 2 },
          ],
          tip: "Long tiles run the walks down both lake flanks.",
        },
        {
          title: "Waterfront trim",
          instruction: "Place 4× Tile 1×2 (waterfront trim) and 2× Tile 1×2 (waterfront strip); toward the front of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Tile 1×2", part: "3069b", qty: 6 },
          ],
          tip: "Short tiles finish the water's outer edges, including strips on the front edge beams.",
        },
        {
          title: "Highwalk extensions",
          instruction: "Place 2× Tile 1×2 (highwalk extension); on the west side, about 3 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Tile 1×2", part: "3069b", qty: 2 },
          ],
          tip: "Two more tile runs extend the podium routes westward.",
        },
        {
          title: "Boundary wall",
          instruction: "Place 4× Brick 1×3 (boundary wall) and 1× Brick 1×2 (boundary wall); at the rear west of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 1×3", part: "3622", qty: 4 },
            { name: "Brick 1×2", part: "3004", qty: 1 },
          ],
          tip: "A low wall closes the western edge. Fragments of the Roman and medieval London Wall survive inside the real estate; the ancient barbican that named the place.",
        },
        {
          title: "Boundary details",
          instruction: "Place 1× Brick 2×2 (boundary junction); 1× Brick 1×1 (boundary marker); and 1× Brick 1×3 (service block); in the centre of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Brick 2×2", part: "3003", qty: 1 },
            { name: "Brick 1×1", part: "3005", qty: 1 },
            { name: "Brick 1×3", part: "3622", qty: 1 },
          ],
          tip: "A junction block, an eastern marker and a service block behind the tower finish the estate edge.",
        },
        {
          title: "Threshold and walkway cap",
          instruction: "Place 1× Tile 1×2 (entrance threshold) and 1× Tile 1×2 (walkway cap); in the centre of the model, about 3 bricks up. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Tile 1×2", part: "3069b", qty: 2 },
          ],
          tip: "Dark tiles mark the Centre's entrance threshold on the deck.",
        },
        {
          title: "Waterside trees, west",
          instruction: "Place 2× Round Brick 1×1 (tree trunk); 2× Plate 2×2 Round (tree canopy); and 2× Plate 1×1 Round (tree crown); at the rear west of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Round Brick 1×1", part: "3062b", qty: 2 },
            { name: "Plate 2×2 Round", part: "4032", qty: 2 },
            { name: "Plate 1×1 Round", part: "4073", qty: 2 },
          ],
          tip: "Trees soften the hard landscape; every planting position on the estate was specified by the architects.",
        },
        {
          title: "Waterside trees, east",
          instruction: "Place 2× Round Brick 1×1 (tree trunk); 2× Plate 2×2 Round (tree canopy); and 2× Plate 1×1 Round (tree crown); at the rear east of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Round Brick 1×1", part: "3062b", qty: 2 },
            { name: "Plate 2×2 Round", part: "4032", qty: 2 },
            { name: "Plate 1×1 Round", part: "4073", qty: 2 },
          ],
          tip: "The eastern pair mirrors the west bank.",
        },
        {
          title: "Landscaped banks",
          instruction: "Place 2× Slope 2×3 (25°) (landscaped bank); toward the rear of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Slope 2×3 (25°)", part: "3298", qty: 2 },
          ],
          tip: "Two more green banks blend the boundary into the gardens.",
        },
        {
          title: "Plinth extensions",
          instruction: "Place 4× Slope 1×2 Inverted (plinth extension); in the centre of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Slope 1×2 Inverted", part: "3665", qty: 4 },
          ],
          tip: "Extra inverted slopes stretch the waterside plinth along the deck front.",
        },
        {
          title: "Rear trees",
          instruction: "Place 2× Round Brick 1×1 (tree trunk); 2× Plate 2×2 Round (tree canopy); and 2× Plate 1×1 Round (tree crown); toward the rear of the model, on the baseplate studs. Match the coral pieces in the 3D view for exact positions.",
          pieces: [
            { name: "Round Brick 1×1", part: "3062b", qty: 2 },
            { name: "Plate 2×2 Round", part: "4032", qty: 2 },
            { name: "Plate 1×1 Round", part: "4073", qty: 2 },
          ],
          tip: "Two last trees behind the tower complete the estate; home today to more than 4,000 residents in over 2,000 flats, Grade II listed since September 2001.",
        },
      ],
    },
  ],
};


// One Barbican design: the Lakeside Panorama. The Frobisher Section and
// London Wall builds were retired on 2026-10-02 (recoverable from tag v2.0.1).
export const ALL_BUILDS: Build[] = [barbicanPanorama];

export function getBuildById(id: string): Build | undefined {
  return ALL_BUILDS.find((b) => b.id === id);
}

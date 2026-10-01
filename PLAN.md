# LEGO Barbican Guide: audit and redesign plan (2026-09-30)

Companion to the Brick Remix rebuild (`~/lego-remix/PLAN.md`), scoped to this
project: one set (Architecture Studio 21050, 1,210 white and trans-clear
pieces), but able to design many different architectural models, not just the
three hand-built Barbican ones. Findings are in REVIEW.md.

## Goal

Ask for a building ("the Barbican Estate", "Habitat 67", "a brutalist
library") and get a model that:

1. uses only parts in one 21050 box, in quantities the box holds;
2. is physically sound: real part shapes, every piece gripping studs, one
   connected object, each step pressable straight down in order;
3. reads as its subject at LEGO Architecture quality, checked by an
   independent reviewer that sees only the renders, before anyone is shown it;
4. ships with a LEGO-style printable manual and the interactive web guide,
   both generated from the same placements.

## Architecture

```
subject ─► Opus 5.5 (xhigh) designer ──spec──► architecture compiler ──► placements
              ▲   tools: web_search,                (deterministic:            │
              │   compile_design, render_views,      recipes for walls,        ▼
              │   submit_design                      floors, towers, roofs,  engine validator
              │                                      podiums, water, trees)  (parts, space,
              │                                                              support, one piece,
              └──── critique ◄── blind reviewer (Opus 5.5, renders only) ◄── order)
                                       │ pass
                                       ▼
                    src/designs/<id>.json ─► web guide + print manual + gallery
```

The designer never places bricks. It writes a spec in architectural terms
(site, blocks, towers, podiums, water, landscaping, roof and facade styles,
storey counts, positions in studs). The compiler turns the spec into bricks
with recipes that are correct by construction (running bond, corner laps,
floor bands that tie walls, deck plates that span columns, seam ties across
baseplates) and allocates every part from the 21050 inventory. The designer
can compile and look at renders as often as it likes before submitting, so
it judges proportions from pictures, not from numbers.

A design is accepted only when:
- the engine validator reports zero errors (all six checks in REVIEW.md);
- the inventory audit passes against the real set;
- a blind reviewer, shown only four rendered views, names the subject (or,
  for a generic brief, the building type) and scores it 7+/10 against an
  official LEGO Architecture set;
- a second pass with the subject named scores massing fidelity 7+/10.

Rejected designs go back to the designer with the reviewer's notes, up to
three times. A design that never passes is not saved.

## Status (2026-09-30)

Phase 1 is done and verified (REVIEW.md). Phase 5 has started: the harness
runs every offline check. Phases 2 and 3 have not started: the designer
calls the Anthropic API and needs its own key in this repo's `.env`, plus a
go-ahead for the spend. Nothing is deployed.

## Phases

| # | Phase | Output | Done when |
|---|---|---|---|
| 1 | Engine | `src/engine/` part table (LDraw-verified), placement maths, validator with connectivity, real slope axes, arch legs, support-in-order; renderer and manual fixed to match | `check-parts` passes; the three hand-built models re-validated and repaired |
| 2 | Compiler | `src/design/` spec schema, recipes, inventory allocator, step sequencer with titles and tips | a hand-written Barbican spec compiles to a valid model with no violations |
| 3 | Designer + gate | `scripts/design.mjs`: Opus 5.5 xhigh tool loop, renderer to PNG, blind reviewer, cost log | "the Barbican Estate" passes the gate end to end |
| 4 | App + manual | designs registry, gallery and suggested designs, guide text and print manual from any design | a generated design opens in the web guide and prints a booklet |
| 5 | Harness | `node scripts/harness.mjs <cmd>` (doctor, parts, validate, test, design, suggest, manual, build, deploy) | `harness all` green from a clean checkout |
| 6 | Ship | docs, commit, deploy | live site shows the approved designs |

## Decisions (defaults; change any)

- **Where the AI runs:** locally (CLI, and a design page under `npm run dev`).
  The public site shows approved designs only, so there is no API key in the
  browser, no public spend, and nothing unvetted on the web.
- **Model:** `claude-opus-5-5`, effort `xhigh`, adaptive thinking, server-side
  refusal fallback enabled. Each design run logs its token cost.
- **Inventory:** each AI design may use the whole 1,210-piece set. The three
  hand-built models stay as reference builds and engine regression tests.
- **Manual:** keep the existing A4 landscape booklet and its `--print` bleed
  variant (the 129-page Barbican booklet already uses it).
- **Suggested designs:** a short list of subjects that suit a white and
  trans-clear brick set (brutalist and modernist buildings) is generated
  offline; only designs that passed the gate appear as suggestions.

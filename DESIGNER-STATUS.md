# AI designer: status and checkpoint (2026-10-02)

> **Decision, 2026-10-02:** one Barbican design is needed, and it is the
> repaired Lakeside Panorama. Frobisher Section and London Wall are retired
> from the site, and the AI designer stays a local tool. Nothing below is
> needed for the site; it records where the local designer stands.

The guide, booklets and release (v2.0.1, live) are unaffected by this work.
The AI designer is built and tested offline, but it is **not production
ready**. No real design has passed its review gate. It is disabled on the
public site, and the Anthropic account is out of API credit.

## Evidence so far

| What | Result |
|---|---|
| Live run, 2026-10-01 | Opus 5.5 at `xhigh` effort, 9 compiles, about $9.26 by token count. The first compile needed 311 1×1 bricks against 40 in the set; the run reached a valid design by compile 5. The blind reviewer named it "Barbican Estate, London" but scored quality 5/10 and fidelity 5/10. The revision was cut off by "credit balance is too low". The spec, review, render and result are kept in `tests/fixtures/live-run-2026-10-01/`. |
| Failure path through the app | A job started from the panel stopped at once with "out of API credit", saved nothing and cost $0. |
| Offline tests | 71 pass (`npm test`): compiler, geometry, designer loop with a scripted client, HTTP route, renderer agreement, validator. |

## Correction, 2026-10-04: the review was not blind

Every render sent to the reviewer, including the live run's, showed the
design's title in its header. The live run's "named the Barbican" verdict
may have come from that text. The gate now renders without a title and a
test pins it. Truly blind, `tests/fixtures/barbican-critique.json` is named
as the Barbican and scores quality 6, fidelity 6 (`reviews/`).

**Known compiler weakness:** on a stepped triangular plan, `tower` slabs
never bridge the joint between the apex rows and the rest, so the apex
column is held only by the top slab. The validator checks connection, not
stiffness, so it passes. Fix before the designer is trusted with towers:
make each slab, or alternate courses, span that joint.

## What the review asked for, and what the compiler can now express

The reviewer's actionable points, and the offline response:

| Reviewer point | Now in the compiler | Proof |
|---|---|---|
| Towers are square stacks; they should be triangular with saw-tooth balconies | `tower` element: rasterised equilateral triangle (or square), slabs serrating N/S then E/W | `tests/geometry.test.mjs` |
| Tower heights unequal | Equal `levels` and `courses` give equal heights | the fixture test checks the three tops |
| Crowns underplayed | `crown: "fins"`: steep-slope fins leaning outward | fin-orientation test |
| Vault rhythm too coarse | roof `scallops`: one hump every 2 studs | scallop test |
| Podium a "table on legs", studs everywhere | podium `parapet` (railing panels) and `finish: "tiles"` | parapet test, tiled finishing |
| Terrace should cross the lake on columns | blocks with `pilotis` over water (worked before; shown in the fixture) | `tests/fixtures/barbican-critique.json` |
| Hand-placed towers (281 raw parts in the reviewed spec) | the designer prompt now documents `tower`, `scallops`, `parapet`, `courses` | prompt check |

Not addressed: St Giles church and the Barbican Centre, which are content
choices for the designer; and a nameplate, which needs printed tiles the set
does not have.

`tests/fixtures/barbican-critique.json` applies these points in one model:
466 pieces, valid, within the set. Its 54-page booklet prints every new
recipe. It has **not** been reviewed, because that needs the API.

## Live validation still owed

Run these in order once the account has credit. Each one spends money.

```bash
node scripts/harness.mjs api
npm run design -- "the Barbican Estate, City of London: three equal triangular towers with serrated balconies and finned crowns, terrace blocks with vaulted roofs over the lake, the podium" --budget 20
npm run dev
```

1. The first command is the key and credit check, about a cent. Expect
   `reply "OK"`.
2. The second command is the real gate test. Approval saves
   `src/designs/<id>.ts` and a render. Then run `node scripts/harness.mjs all`
   and look at the design in the app.
3. Under `npm run dev`, start one design from the app's panel and watch it
   to completion. That is the route and UI end to end with a real approval.

Only after a real approval should an AI design be released, through the
RELEASE.md steps (draft deploy, checks, publish). The release adds the
approved design and its booklet to the public site; the designer itself
stays off there.

## Decisions

1. **Settled 2026-10-02:** one Barbican design (the Panorama). No public
   designer and no AI gallery.
2. **Open, only if the local designer is wanted again:** API credit for the
   key in `.env`.
3. **Open:** merging `repair/engine-2026-09-30` into `main` (still the August
   record) when GitHub's default branch should show the current guide.

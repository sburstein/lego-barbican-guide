# Release and rollback

Targets: the public guide on Netlify
(https://lego-barbican-guide.netlify.app, site `67225a16-eab6-4ba7-b136-b5f5345330ce`,
deployed from this machine with the Netlify CLI, not from git) and the GitHub
repo `sburstein/lego-barbican-guide`.

## What runs where

| Feature | Netlify (public) | Local (`npm run dev`, `npm run design`) |
|---|---|---|
| 3D step-by-step guide: the Lakeside Panorama | yes | yes |
| Downloadable booklet (HTML, PDF) | yes | yes |
| AI designer (Opus 5.5) | no, by decision (2026-10-02) | yes, with `ANTHROPIC_API_KEY` and headless Chrome |

The site carries one Barbican design, the Panorama. The designer is a local
tool only; its panel is built only into the dev server.

## Release

```bash
node scripts/harness.mjs all
node scripts/harness.mjs api
npm run build
netlify deploy --prod --dir dist --site 67225a16-eab6-4ba7-b136-b5f5345330ce
```

The first command runs all offline checks, manuals, renders and the build.
The second makes one real Opus 5.5 call, which costs about a cent. The
third builds the site with its booklets and version stamp, and the last
deploys it.

Then verify live:

```bash
curl -s https://lego-barbican-guide.netlify.app/version.json
curl -s https://lego-barbican-guide.netlify.app/manuals/index.json
```

Both should show this build's commit and booklet. Then open the site
and check a build, a step deep link and a booklet download.

## Rollback

Netlify keeps every deploy. To return to a previous one, list them, then
restore by id:

```bash
netlify api listSiteDeploys --data '{"site_id":"67225a16-eab6-4ba7-b136-b5f5345330ce","per_page":5}'
netlify api restoreSiteDeploy --data '{"site_id":"67225a16-eab6-4ba7-b136-b5f5345330ce","deploy_id":"<id>"}'
```

| Deploy | Date (UTC) | What it is |
|---|---|---|
| `6a7ffb1fc278571ce2db6228` | 2026-08-15 | The August models, as printed in the booklet |
| `6abe3c122d1a6565a9214cf3` | 2026-10-01 10:55 | The engine repair (September 30 review) |
| `6abeb1ea5c0cd5453f2b3685` | 2026-10-01 19:19 | v2.0.1 (`b7c7f52`): compiler, designer route, booklets; verified as a draft, then published unchanged |

In git, the August state is tagged `august-2026-booklet`. Releases are
tagged `vX.Y.Z` on the commit that was deployed.

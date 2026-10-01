# Release and rollback

Targets: the public guide on Netlify
(https://lego-barbican-guide.netlify.app, site `67225a16-eab6-4ba7-b136-b5f5345330ce`,
deployed from this machine with the Netlify CLI, not from git) and the GitHub
repo `sburstein/lego-barbican-guide`.

## What runs where

| Feature | Netlify (public, static) | Local or Node host (`npm run dev`, `npm run designer:serve`) |
|---|---|---|
| 3D step-by-step guide, all builds | yes | yes |
| Downloadable booklets (HTML, PDF) | yes | yes |
| Approved AI designs | yes | yes |
| AI designer (Opus 5.5) | no: the panel says so | yes, with `ANTHROPIC_API_KEY` and headless Chrome |

The designer needs a long-running server process: a run takes several
minutes, it holds the API key server-side, and it renders with headless
Chrome. The Netlify site is static. Netlify Functions time out long before a
run finishes, and the CLI deploy carries no secrets. Running the designer
publicly would need a Node host with the key, Chrome and an access gate
(`scripts/designer-server.mjs` is that server, minus the gate). That is a
deliberate deployment decision, so it is not switched on.

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
curl -s -o /dev/null -w "%{http_code}\n" https://lego-barbican-guide.netlify.app/api/design/health
```

The first two should show this build's commit and booklets. The third should
return 404, since the static host has no designer route. Then open the site
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

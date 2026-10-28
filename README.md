# Open Actuary

Independent interactive actuarial learning app. Read courses at **https://open-actuary.subasj02.workers.dev**. Users do not need ChatGPT. Private source: https://github.com/subasj0/open-actuary.

React static frontend + Cloudflare Worker + D1. Passkey accounts sync private notes and reading progress. The author studio keeps drafts, immutable revisions, exact-revision reviews, and published snapshots separate. Self-contained interactive widgets retain their sandboxed, readable alternatives.

Author in ChatGPT using the existing skills and the OAuth MCP server at **https://open-actuary.subasj02.workers.dev/mcp**. No AI API subscription is part of the app. See [account and ChatGPT setup](docs/SETUP.md), [architecture and hosting assessment](docs/ARCHITECTURE.md), and [operations](docs/OPERATIONS.md).

## Development

Node 22.19+:

```sh
npm ci
npm run build
npx wrangler d1 migrations apply open-actuary --local
npm run preview
```

Use `npm run dev` in another terminal for frontend development with API proxying. Build before previewing the complete app. Local D1 is separate from production.

```sh
npm run typecheck
npm test
node scripts/tests/accounts.mjs
node scripts/tests/oauth.mjs
python3 scripts/tests/content-integration.py
```

Account and integration checks create disposable local records. `accounts.mjs` can target an explicitly chosen HTTPS deployment with TEST_ORIGIN; it creates a test reader, never grants author permission. OAuth/content fixtures are local-only. Mathematical and content validation tests are independent of server identity.

## Deploy

The initial production deployment used the authenticated Cloudflare plugin. For future CLI/CI deployment, authenticate Wrangler or configure a Cloudflare API token with only Workers Scripts Write and D1 Write for this account. Never commit tokens.

```sh
npm run build
npx wrangler d1 migrations apply open-actuary --remote
npx wrangler deploy
```

The checked-in configuration identifies the deployed app/database. Choose a new database and Worker name for forks; never test against production accidentally. GitHub CI checks changes. The manual deployment workflow requires a repository secret `CLOUDFLARE_API_TOKEN`; it is not populated by the initial plugin deployment.

Content edits use the API/MCP and do not require deployment. The migration contains the exact two published course outlines and four published lessons retrieved on 28 October 2026. The original Site remains available; unpublished source drafts and prior hosted revision history still require owner export. Existing ChatGPT learner IDs are not silently mapped to new accounts.

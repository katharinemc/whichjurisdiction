# Jurisdiction quiz analytics worker

Standalone Cloudflare Worker + KV project. Not served by GitHub Pages — deploy
it separately from Cloudflare's dashboard or CLI.

## One-time setup

1. `cd worker && npm install`
2. `npx wrangler login`
3. `npx wrangler kv namespace create QUIZ_COUNTS`
   Copy the printed `id` into `wrangler.toml`, replacing
   `REPLACE_WITH_REAL_KV_NAMESPACE_ID`.
4. In `src/worker.js`, replace `ALLOWED_ORIGIN` with the site's real deployed
   domain (must match the `CNAME` file at the repo root — currently the
   placeholder `your-domain-here.com`, same as everywhere else in this repo).
5. `npx wrangler deploy`
6. Note the deployed worker URL (or set up a custom route/domain for it in
   the Cloudflare dashboard), and update `ANALYTICS_ENDPOINT` in
   `../js/analytics.js` to point at it.

## Routes

- `POST /count?result=<GOA|Antiochian|OCA|ROCOR|Jerusalem|HOCNA>` — increments that jurisdiction's count, returns `{ result, count }`.
- `GET /counts` — returns all six counts as JSON.

## Local test

`npm test` (uses Node's built-in test runner with an in-memory fake KV — no
Cloudflare account needed to run the tests).

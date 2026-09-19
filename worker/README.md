# Jurisdiction quiz analytics worker

Standalone Cloudflare Worker + KV project. Not served by GitHub Pages — deploy
it separately from Cloudflare's dashboard or CLI.

## One-time setup

1. `cd worker && npm install`
2. `npx wrangler login`
3. `npx wrangler kv namespace create QUIZ_COUNTS`
   Copy the printed `id` into `wrangler.toml`, replacing
   `REPLACE_WITH_REAL_KV_NAMESPACE_ID`.
4. `ALLOWED_ORIGIN` in `src/worker.js` is already set to `https://whichjurisdiction.com`,
   matching the `CNAME` file at the repo root. Only change it if the site's
   domain ever changes.
5. `npx wrangler deploy`
6. Set up a custom route/domain for the worker in the Cloudflare dashboard —
   `../js/analytics.js`'s `ANALYTICS_ENDPOINT` already points at
   `https://analytics.whichjurisdiction.com`, so route the worker to that
   exact subdomain (Workers & Pages → this worker → Settings → Domains &
   Routes) rather than picking a different one.

## Routes

- `POST /count?result=<GOA|Antiochian|OCA|ROCOR|Jerusalem|HOCNA>` — increments that jurisdiction's count, returns `{ result, count }`.
- `GET /counts` — returns all six counts as JSON.

## Local test

`npm test` (uses Node's built-in test runner with an in-memory fake KV — no
Cloudflare account needed to run the tests).

# Deployment status — whichjurisdiction.com

Last updated: 2026-09-19. Picks up mid-deployment — read this before resuming.

## Facts

- Domain: `whichjurisdiction.com` (apex, not a subdomain)
- Feedback email: `whichjurisdiction@gmail.com`
- GitHub repo: `katharinemc/whichjurisdiction` (public, pushed, up to date with local `main` as of commit `3c8f228`)
- DNS host: Cloudflare
- GitHub Pages: source = `main` branch, root; custom domain field = `whichjurisdiction.com`

## Done

- [x] All code built, tested (36 site + 6 worker tests), independently reviewed.
- [x] `docs/` and `.superpowers/` excluded from the published site via root `_config.yml` (Jekyll `exclude`).
- [x] Domain/email placeholders swapped throughout the repo (CNAME, sitemap.xml, robots.txt, index.html OG image, faq.html mailto, js/analytics.js `ANALYTICS_ENDPOINT` — set to `https://analytics.whichjurisdiction.com`, worker/src/worker.js `ALLOWED_ORIGIN`).
- [x] GitHub repo created and pushed.
- [x] GitHub Pages enabled, custom domain set to the apex.
- [x] Cloudflare DNS records added:
  - 4× `A` record, name `@`, targets `185.199.108.153` / `.109.153` / `.110.153` / `.111.153`
  - 1× `CNAME` record, name `www`, target `katharinemc.github.io` (so `www` redirects to the apex)
- [x] Diagnosed and self-corrected one hiccup: the GitHub Pages "Custom domain" field had briefly been set to `www.whichjurisdiction.com` (which GitHub writes into the repo's `CNAME` file), producing an `InvalidDNSError`. Fixed by resetting it to the apex `whichjurisdiction.com` — confirmed in commit `3c8f228`.

## In progress / blocked

- [ ] **"Enforce HTTPS" is showing "Unavailable... domain not properly configured"** in GitHub Pages settings. Most likely cause, not yet confirmed fixed: the DNS records above may still be set to **Proxied** (orange cloud) in Cloudflare instead of **DNS only** (grey cloud). GitHub needs to reach its own servers directly to verify the domain and issue the Let's Encrypt cert — a Cloudflare proxy in front blocks that.

**Next step to resume:** In Cloudflare → DNS → Records, check the proxy-status cloud icon on all 5 records (the 4 `A` records and the `www` `CNAME`). Any that are orange, click to toggle to grey/"DNS only." Then wait — GitHub re-checks periodically; cert issuance can take a few minutes to about an hour after DNS is correct. "Enforce HTTPS" should become available on its own once GitHub's check succeeds. If it's still stuck after ~30–60 minutes with everything on DNS-only, next diagnostic step is running `dig whichjurisdiction.com` and `dig www.whichjurisdiction.com` and checking the actual resolved records.

## Remaining steps

### Phase 5 — Deploy the Cloudflare Worker (separate product from the DNS zone, same account)

1. `cd worker && npm install`
2. `npx wrangler login` — opens a browser to authorize.
3. `npx wrangler kv namespace create QUIZ_COUNTS` — copy the printed `id`.
4. Paste that id into `worker/wrangler.toml`, replacing `REPLACE_WITH_REAL_KV_NAMESPACE_ID`.
5. `npx wrangler deploy` (`ALLOWED_ORIGIN` in `worker/src/worker.js` is already set to `https://whichjurisdiction.com` — no edit needed there).
6. In the Cloudflare dashboard, set up a custom domain/route for the worker on the same zone: Workers & Pages → this worker → Settings → Domains & Routes → route it to `analytics.whichjurisdiction.com` specifically (not a different subdomain — `js/analytics.js`'s `ANALYTICS_ENDPOINT` already hardcodes that exact value).
7. Once that's live, verify `js/analytics.js` doesn't need any further edit (it shouldn't — the endpoint is already correct), just confirm the worker actually responds at that URL.

### Phase 6 — Verify

- [ ] Visit the live domain, click through: landing → quiz → results (check the carousel/dots, including a case with 2+ cards) → directory → FAQ.
- [ ] Confirm `https://whichjurisdiction.com/jerusalem.html` and similar guesses 404 (no route to the hidden jurisdictions).
- [ ] Complete the quiz once for real, then check the Cloudflare Worker's `GET /counts` route (e.g. `https://analytics.whichjurisdiction.com/counts`) shows an incremented count.

### New requests to fold in next session (not started)

- [ ] **Mobile optimization pass.** Nothing mobile-specific has been checked yet — the CSS uses a single `max-width: 640px` centered column with no media queries, and the results-page carousel (scroll-snap horizontal cards) hasn't been touched on an actual small viewport. Needs a real look at: touch-target sizing on `.choice-button`/`.carousel-dot`, whether the carousel's swipe gesture feels right on a phone, and general readability/spacing at narrow widths.
- [ ] **Real `assets/og-image.png`.** `index.html`'s `og:image` tag already points at `https://whichjurisdiction.com/assets/og-image.png`, but no file has ever been created — `assets/` is empty. This is the preview image that'll show when the link is shared on Reddit/social; needed before that looks right. Needs actual image content (I can't generate one) — once you have it, drop it at `assets/og-image.png` and it'll just work with the existing tag, no code changes needed.

## Reference

Full original build plan and design spec (not published — excluded from Pages): `docs/superpowers/plans/2026-09-18-jurisdiction-quiz.md` and `docs/superpowers/specs/2026-09-18-jurisdiction-quiz-design.md`. Progress ledger from the original build: `.superpowers/sdd/progress.md`.

# "Which Orthodox Jurisdiction Are You?" — Design Spec

Date: 2026-09-18

## Purpose

A satirical, static, no-backend 19-question personality quiz ("Which Orthodox
Jurisdiction Are You?"), deployed to GitHub Pages under a custom domain, with
a small separate Cloudflare Worker for anonymous result-count analytics.

Six possible outcomes: GOA, Antiochian, OCA, ROCOR, Jerusalem Patriarchate,
HOCNA. Only the first four are ordinarily browsable (landing page, directory,
individual writeup pages, sitemap). Jerusalem Patriarchate and HOCNA are
reachable *only* by completing the quiz and landing on them via the results
screen — no route, no directory entry, no sitemap/robots entry for either.

## Non-goals

- No framework, no build step, no bundler.
- No server-side scoring or storage of individual answers.
- No attempt to hide the two unlisted jurisdictions' content from someone
  reading the shipped JS (impossible without a backend, and not the goal —
  the goal is no *ordinary browsing path*, not source-code secrecy).

## Source material handling

Three source docs exist in `~/Downloads/`:

- `orthodox-jurisdiction-quiz.md` — 19 questions + choices. Ships into the
  repo as structured data, content unchanged.
- `jurisdiction-quiz-results.md` — six full result writeups. Ships into the
  repo as structured data, content unchanged.
- `orthodox-jurisdiction-quiz-notes.md` — **never copied into the repo.**
  Contains the deterministic point table (needed — extracted into
  `js/data-questions.js` as plain structured data below) and editorial
  material that must **not** ship: the two test subjects' recorded answers
  and results, the HOCNA abuse-history editorial reasoning, and the
  named-living-clergy editorial reasoning. None of that editorial material is
  needed for the app to function, so it is simply not carried over.

Safety net: `.gitignore` includes defensive patterns (`*notes*`, `/local/`)
in case a copy of the notes file is ever dropped into the project directory
by mistake. Before any push, run `git ls-files` and eyeball the full tracked
list — this is called out explicitly because it's the kind of thing that's
easy to forget once it's "one more file in the folder."

## Architecture

Plain multi-page static site. One `.html` file per route, no client-side
router. Data lives in plain global-scope `<script>` files (not ES modules,
not `fetch`), so the site works from a local double-click, not just over
HTTPS via Pages.

```
jurisdiction-quiz/                 (repo root, served by GitHub Pages)
  index.html                       landing page, OG meta tags
  quiz.html                        19-question client-side state machine
  results.html                     scores + renders result(s) client-side
  directory.html                   lists GOA / Antiochian / OCA / ROCOR only
  jurisdictions/
    goa.html
    antiochian.html
    oca.html
    rocor.html
  faq.html                         static content + mailto: feedback link
  sitemap.xml                      lists only the pages above
  robots.txt
  CNAME                            placeholder domain, swap before go-live
  css/
    styles.css                     design system: colors, type, cards, cross glyph
  js/
    data-questions.js              19 Qs, choices, point values (global const)
    data-jurisdictions.js          6 jurisdiction writeups + metadata
    scoring.js                     pure: answers[] -> { jurisdiction: points }
    quiz.js                        state machine + sessionStorage persistence
    results.js                     renders results.html from sessionStorage
    analytics.js                   fire-and-forget POST, sessionStorage guard
  .gitignore
  worker/                          separate Cloudflare project (not Pages-served)
    src/worker.js
    wrangler.toml                  placeholder KV namespace id
    README.md                      manual deploy steps (user runs wrangler)
```

## Content data (extracted from notes file — structured only, no editorial text)

### Jurisdictions

| Key | Full name | Directory/writeup page? |
|---|---|---|
| GOA | Greek Orthodox Archdiocese of America | Yes |
| Antiochian | Antiochian Orthodox Christian Archdiocese | Yes |
| OCA | Orthodox Church in America | Yes |
| ROCOR | Russian Orthodox Church Outside Russia | Yes |
| Jerusalem | Jerusalem Patriarchate | **No — results-screen only** |
| HOCNA | HOCNA | **No — results-screen only** |

Each jurisdiction's full writeup text comes verbatim from
`jurisdiction-quiz-results.md`.

### Point table (19 questions)

| Q | Answer | Points |
|---|---|---|
| 1 | Father | OCA 2, Antiochian 1, GOA 1 |
| 1 | Saint | ROCOR 2, HOCNA 2 |
| 2 | Schmemann | OCA 4 |
| 2 | De Young | OCA 2, Antiochian 1 |
| 2 | Trenham | ROCOR 1, HOCNA 1, Antiochian 1 |
| 2 | McPherson | ROCOR 4 |
| 2 | "just go to liturgy" | 0 |
| 3 | True (soup) | ROCOR 1, HOCNA 1 |
| 3 | False (soup) | 0 |
| 4 | No, never pants | ROCOR 3, HOCNA 3 |
| 4 | Yes, but not to church | ROCOR 2, HOCNA 1, Antiochian 1 |
| 4 | Yes, pants to church too | 0 |
| 5 | Brick by brick, 1920s | OCA 1 |
| 5 | $40M gala cathedral | GOA 4 |
| 5 | Converted Baptist church | HOCNA 2 |
| 5 | Monastery, possible miracle | Jerusalem 4 |
| 6 | Slick video + Give button | GOA 2, Antiochian 1 |
| 6 | Entire site in Church Slavonic | ROCOR 2 |
| 6 | Hasn't updated since 2009 | HOCNA 2, ROCOR 1 |
| 6 | Monastery photo, no text | Jerusalem 2 |
| 7 | Explain unprompted | Antiochian 4 |
| 7 | Just say Orthodox | OCA 4 |
| 7 | Correct terminology | ROCOR 2, HOCNA 1 |
| 7 | Mention metropolitan by name | GOA 4 |
| 8 | Robert's Rules | 0 |
| 8 | Referendum on calendar | ROCOR 2, OCA 1 |
| 8 | Disagreements resolved before meeting | GOA 2 |
| 8 | No council, just Father | HOCNA 2, Jerusalem 1 |
| 9 | Potluck, grandmother | OCA 1 |
| 9 | Small, serious, shows up early | ROCOR 4 |
| 9 | Small, serious, unsure who's in communion | HOCNA 4 |
| 9 | Catered, Instagram | GOA 4 |
| 9 | Nobody outside knows | Jerusalem 2 |
| 10 | Dunkin Donuts | OCA 1 |
| 10 | Doesn't exist | HOCNA 2, Jerusalem 2 |
| 10 | Theological debate over pastries | OCA 2, Antiochian 2 |
| 10 | Full spread, seating chart, icon-screen donor | GOA 4 |
| 11 | "There's a debate?" | 0 |
| 11 | Mildly smug | OCA 2 |
| 11 | 20-min explanation | ROCOR 2, Antiochian 1 |
| 11 | Left last jurisdiction over it | HOCNA 4 |
| 12 | Nothing, hasn't issued one | Jerusalem 2 |
| 12 | Capital campaign | GOA 4 |
| 12 | Canonical dispute | HOCNA 2, ROCOR 1 |
| 12 | Doesn't know bishop's name | HOCNA 1 |
| 13 | YouTube apologetics under known pseudonym | Antiochian 2 |
| 13 | Building fund missing | GOA 4 |
| 13 | Comm with another synod | HOCNA 2, ROCOR 2 |
| 13 | Monastery's own communion status unclear | ROCOR 2 |
| 13 | Flew to Jerusalem for Holy Fire, mentions it every coffee hour | Jerusalem 4 |
| 14 | Fordhamite | GOA 0.5, OCA 0.5, Antiochian 0.5 |
| 14 | SCOBAdox | GOA 2, Antiochian 1, OCA 1 |
| 14 | Non-canonical | HOCNA 4 |
| 14 | Phyletist | GOA 1 |
| 15 | Quiet correction | OCA 4 |
| 15 | Table erupts | ROCOR 4 |
| 15 | Four-paragraph text to priest | Antiochian 2, OCA 1 |
| 15 | Nobody notices | 0 |
| 16 | "What's Great Lent?" | GOA 1, Antiochian 1 |
| 16 | Strict, no big deal | OCA 2 |
| 16 | Strict, everyone knows | ROCOR 2, HOCNA 1, Antiochian 1 |
| 16 | Fasts from screens | GOA 0.5, Antiochian 0.5, OCA 0.5 |
| 16 | Not as well as I should | GOA 0.5, Antiochian 0.5, OCA 0.5 |
| 17 | Byzantine chant | GOA 2, Antiochian 2 |
| 17 | Four-part harmony | OCA 4 |
| 17 | Hymnal, four-part, vaguely Anglican | Antiochian 2 |
| 17 | Znamenny chant | ROCOR 2, HOCNA 1 |
| 18 | Wedding dance opinions | GOA 2 |
| 18 | Summer camp in the mountains | Antiochian 4 |
| 18 | Homeschooled | ROCOR 2 |
| 18 | No children | Jerusalem 2 |
| 19 | Latin Mass refugees / March for Life vs. confused about pews | Antiochian 4 |
| 19 | Recurring coffee-strength argument | Antiochian 2 |
| 19 | Three converts were youth pastors | Antiochian 2 |
| 19 | Explaining service difference gets a blank look | 0 |

## Scoring

1. Sum points per jurisdiction across all 19 answered questions.
2. `percentage = jurisdiction_total / sum(all 6 jurisdiction totals) * 100`,
   rounded to one decimal place.
3. Sort descending.
4. If the gap between rank 1 and rank 2 is **≤ 5 percentage points**, treat
   as a **split**: both get the purple/settle-fade "winner" treatment,
   shown side by side as a tied headline.
5. Otherwise rank 1 alone gets the winner treatment.
6. Any other jurisdiction ≥ 10% is listed below as "leaning," as a ranked
   list with thin horizontal bars (no pie chart).
7. Anything < 10% is not shown.

Answers are recorded into `sessionStorage` question-by-question during the
quiz. `results.html` reads them on load and recomputes the score client-side
— never from a URL parameter — so a refresh doesn't lose the result and
there's no score to tamper with via the URL.

## Pages

- **`index.html`** — pitch + CTA into `quiz.html`. Open Graph tags: title,
  description, image placeholder (`og-image.png` placeholder asset).
- **`quiz.html`** — single route; 19 questions one at a time via JS state
  machine; thin progress bar at top; each answer written to
  `sessionStorage` as it's picked; final question routes to `results.html`.
- **`results.html`** — recomputes score from `sessionStorage` on load; if no
  answers are present, prompts back to the quiz rather than erroring; on
  first successful render, fires the analytics POST (see below) guarded by a
  `sessionStorage` flag so a refresh doesn't double count. Renders winner(s)
  and leaning list; all six jurisdictions are reachable here, including the
  two with no dedicated page.
- **`directory.html`** — GOA / Antiochian / OCA / ROCOR only, links to each
  writeup page.
- **`jurisdictions/{goa,antiochian,oca,rocor}.html`** — one writeup each,
  full text from `jurisdiction-quiz-results.md`.
- **`faq.html`** — static content, plain `mailto:feedback@your-domain-here.com`
  link (placeholder, swap for the real address).
- **`sitemap.xml` / `robots.txt`** — list only the pages above; Jerusalem and
  HOCNA are absent by omission (no page exists to list).

## Visual design system

CSS custom properties: `--parchment: #EDE4D3`, `--ink: #23262F`,
`--oxblood: #7A2E2E` (selected states, interactive elements), `--gold:
#B8933D` (results reveal only), `--purple: #4A2E5C` (winning jurisdiction
name + results-card border only).

Typography: **Lora** (serif, question text + results reveal) and **Inter**
(humanist sans, UI chrome — buttons/progress/nav), loaded via Google Fonts
`<link>`, never mixed within one element. Sentence case throughout.

Layout: single centered column, one question per screen. Cards have a
rounded-arch top edge (top-corner `border-radius`, more pronounced on the
results card than question cards).

Three-bar Orthodox cross glyph: inline SVG, thin lines, used as a section
divider on the results screen only — top bar medium, middle bar longest,
bottom bar narrowest and slanted.

Motion: one settle/fade on the jurisdiction name on results-screen entry.
No hover animations on every row; no per-question transition beyond a plain
screen swap.

Percentage breakdown: ranked list with thin horizontal bars, not a pie chart.

## Analytics (Cloudflare Worker, separate directory)

- `worker/src/worker.js`: `POST /count?result=<key>` increments that KV
  integer key (one of GOA/Antiochian/OCA/ROCOR/Jerusalem/HOCNA); `GET
  /counts` returns all six as JSON. CORS allows only the site's domain
  (placeholder constant, swap alongside `CNAME`).
- `worker/wrangler.toml`: placeholder KV namespace `id`.
- `worker/README.md`: manual steps — `wrangler login`, `wrangler kv
  namespace create`, paste the real id into `wrangler.toml`, `wrangler
  deploy`. None of this is run automatically; the user runs it themselves.
- `js/analytics.js`: on first successful results render, fire-and-forget
  `POST` to the worker for the winning result. On a split, both jurisdictions
  count — one `POST` per side, since a split means both genuinely happened
  for this respondent. Guarded by a single `sessionStorage` flag so one
  browser session only fires once regardless of how many results it counts.
  Errors are swallowed; never blocks or delays rendering.

## Deployment

- `CNAME` at repo root with a clearly-marked placeholder domain.
- GitHub Pages served from `main` branch root (not `/docs`).
- HTTPS via Pages' automatic provisioning once DNS resolves — no action
  needed beyond setting the custom domain in repo settings.
- This session prepares the repo locally (`git init`, commits) and stops
  before any push; the user reviews and pushes themselves.

## Deferred to the user, post-handoff

- Real OG image, feedback email, and custom domain are swapped in later by
  the user; all are clearly marked placeholders in the code (see Deployment).

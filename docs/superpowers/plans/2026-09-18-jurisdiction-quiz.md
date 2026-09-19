# Which Orthodox Jurisdiction Are You? — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the static, no-backend 19-question "Which Orthodox Jurisdiction Are You?" quiz site plus a small separate Cloudflare Worker for anonymous result-count analytics, per `docs/superpowers/specs/2026-09-18-jurisdiction-quiz-design.md`.

**Architecture:** Plain multi-page static HTML/CSS/JS site (no framework, no build step), one `.html` file per route, served by GitHub Pages from the repo root. Shared logic (scoring, results derivation, quiz state) lives in small plain-JS files using a dual CommonJS/browser-global export pattern so it's both `<script>`-loadable and `require()`-able from Node tests. A separate `worker/` directory holds an independent Cloudflare Worker + KV project for analytics, never served by Pages.

**Tech Stack:** Vanilla HTML/CSS/JS. Node's built-in `node:test` + `node:assert` for unit tests (no test framework dependency). Cloudflare Workers + KV, deployed with `wrangler` (worker-only devDependency).

## Global Constraints

- No build step for the site. Plain HTML/CSS/JS only, served as-is by GitHub Pages from the repo root on `main`.
- Pure-logic files (`data-questions.js`, `data-jurisdictions.js`, `scoring.js`, `results-view.js`, `quiz-state.js`, `worker/src/worker.js`) use the dual-export pattern: `typeof module !== "undefined" && module.exports` for Node, else attach to `window`/`global`. This makes them unit-testable with `node --test` without adding any test framework.
- DOM-wiring files (`quiz.js`, `results.js`) and all HTML/CSS are verified manually in a browser per task — no jsdom or browser-test dependency is introduced, to keep the shipped site genuinely build-free. This is a deliberate scope decision, not a skipped step.
- `orthodox-jurisdiction-quiz-notes.md` (in `~/Downloads/`) is never copied into this repo. Only its structured point table and jurisdiction list are extracted into `js/data-questions.js` / `js/data-jurisdictions.js` as plain data — no editorial commentary, no test-subject answers, anywhere in this repo, including test fixtures (fixtures use fresh synthetic numbers, never the notes file's worked examples).
- Jerusalem Patriarchate and HOCNA get no `.html` file, no directory entry, no sitemap/robots entry, ever. They render only inside `results.html`, driven by `js/data-jurisdictions.js`.
- Colors: parchment `#EDE4D3`, ink `#23262F`, oxblood `#7A2E2E` (selected/interactive), gold `#B8933D` (results reveal only), purple `#4A2E5C` (winning jurisdiction name + results-card border only).
- Typography: Lora (serif — question text + results reveal headings only) and Inter (humanist sans — everything else), loaded via Google Fonts, never mixed within one element. Sentence case throughout, no all-caps labels.
- Scoring: `percentage = jurisdiction_total / sum(all 6 jurisdiction totals) * 100`, rounded to one decimal place. Split threshold: rank 1 and rank 2 within **≤ 5** percentage points → both are winners. Leaning threshold: **≥ 10%** and not a winner. Below 10%: not shown.
- All placeholder values (`your-domain-here.com`, `feedback@your-domain-here.com`, the worker endpoint, the KV namespace id, the OG image path) are centralized to one clearly-commented spot per file so they're easy to find and swap later.
- This session prepares the repo locally and stops before any `git push`. Before considering the work done, run `git ls-files` and confirm the notes file is not present.

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `CNAME`
- Create directories: `js/`, `css/`, `jurisdictions/`, `assets/`, `worker/src/`, `worker/test/`

**Interfaces:**
- Produces: `npm test` runnable from repo root (runs `node --test js/`).

- [ ] **Step 1: Create the directory skeleton**

```bash
cd /Users/glenmcleod/Desktop/katharinecode/jurisdiction-quiz
mkdir -p js css jurisdictions assets worker/src worker/test
```

- [ ] **Step 2: Write the root `package.json`**

```json
{
  "name": "jurisdiction-quiz",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "test": "node --test js/"
  }
}
```

- [ ] **Step 3: Write `.gitignore`**

```
.DS_Store
node_modules/

# Safety net: the working-notes file (with test-subject answers and
# editorial reasoning) must never be tracked in this repo.
*notes*
/local/
```

- [ ] **Step 4: Write the placeholder `CNAME`**

```
your-domain-here.com
```

- [ ] **Step 5: Verify `npm test` runs cleanly with zero tests**

Run: `npm test`
Expected: exits 0 (Node reports 0 tests found; no error)

- [ ] **Step 6: Commit**

```bash
git add package.json .gitignore CNAME
git commit -m "Scaffold project structure"
```

---

### Task 2: Question data

**Files:**
- Create: `js/data-questions.js`
- Test: `js/data-questions.test.js`

**Interfaces:**
- Produces: `QUESTIONS` — array of 19 `{ id: number, prompt: string, choices: [{ id: string, label: string, points: { [jurisdictionKey]: number } }] }`. Point objects omit zero-value jurisdictions (treat missing key as 0). Exported as `module.exports.QUESTIONS` (Node) or `window.QuizData.QUESTIONS` (browser).

- [ ] **Step 1: Write the failing test**

```js
// js/data-questions.test.js
const test = require("node:test");
const assert = require("node:assert");
const { QUESTIONS } = require("./data-questions.js");

const VALID_KEYS = ["GOA", "Antiochian", "OCA", "ROCOR", "Jerusalem", "HOCNA"];

test("there are exactly 19 questions", () => {
  assert.strictEqual(QUESTIONS.length, 19);
});

test("every question has at least two choices with a non-empty label", () => {
  QUESTIONS.forEach((question) => {
    assert.ok(question.choices.length >= 2, `question ${question.id} has fewer than 2 choices`);
    question.choices.forEach((choice) => {
      assert.ok(choice.label && choice.label.length > 0, `question ${question.id} has an empty choice label`);
    });
  });
});

test("every choice id is unique within its question", () => {
  QUESTIONS.forEach((question) => {
    const ids = question.choices.map((choice) => choice.id);
    assert.strictEqual(new Set(ids).size, ids.length, `question ${question.id} has duplicate choice ids`);
  });
});

test("all point values use known jurisdiction keys and are non-negative", () => {
  QUESTIONS.forEach((question) => {
    question.choices.forEach((choice) => {
      Object.keys(choice.points).forEach((key) => {
        assert.ok(VALID_KEYS.includes(key), `question ${question.id} choice ${choice.id} has unknown key ${key}`);
        assert.ok(choice.points[key] >= 0, `question ${question.id} choice ${choice.id} has a negative point value`);
      });
    });
  });
});

test("question 2 McPherson choice awards ROCOR 4 points (spot check)", () => {
  const question2 = QUESTIONS.find((q) => q.id === 2);
  const mcpherson = question2.choices.find((c) => c.label.indexOf("McPherson") !== -1);
  assert.strictEqual(mcpherson.points.ROCOR, 4);
});

test("question 5 monastery choice awards Jerusalem 4 points (spot check)", () => {
  const question5 = QUESTIONS.find((q) => q.id === 5);
  const monastery = question5.choices.find((c) => c.label.indexOf("monastery") !== -1);
  assert.strictEqual(monastery.points.Jerusalem, 4);
});

test("question 19 youth-pastor choice belongs only to Antiochian (spot check)", () => {
  const question19 = QUESTIONS.find((q) => q.id === 19);
  const youthPastors = question19.choices.find((c) => c.label.indexOf("youth pastors") !== -1);
  assert.deepStrictEqual(youthPastors.points, { Antiochian: 2 });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test js/data-questions.test.js`
Expected: FAIL with "Cannot find module './data-questions.js'"

- [ ] **Step 3: Write `js/data-questions.js`**

```js
(function (global) {
  var QUESTIONS = [
    {
      id: 1,
      prompt: `Fill in the blank: "_____ Seraphim Rose"`,
      choices: [
        { id: "1A", label: "Father", points: { OCA: 2, Antiochian: 1, GOA: 1 } },
        { id: "1B", label: "Saint", points: { ROCOR: 2, HOCNA: 2 } }
      ]
    },
    {
      id: 2,
      prompt: "Who is your preferred influencer priest?",
      choices: [
        { id: "2A", label: "Fr. Alexander Schmemann", points: { OCA: 4 } },
        { id: "2B", label: "Fr. Stephen De Young", points: { OCA: 2, Antiochian: 1 } },
        { id: "2C", label: "Fr. Josiah Trenham", points: { ROCOR: 1, HOCNA: 1, Antiochian: 1 } },
        { id: "2D", label: "Fr. Moses McPherson", points: { ROCOR: 4 } },
        { id: "2E", label: "I don't really follow priests online, I just go to liturgy", points: {} }
      ]
    },
    {
      id: 3,
      prompt: "True or False: Soup is effeminate.",
      choices: [
        { id: "3T", label: "True", points: { ROCOR: 1, HOCNA: 1 } },
        { id: "3F", label: "False", points: {} }
      ]
    },
    {
      id: 4,
      prompt: "Imagine you have a wife. Does she wear pants?",
      choices: [
        { id: "4A", label: "No", points: { ROCOR: 3, HOCNA: 3 } },
        { id: "4B1", label: "Yes, to church too", points: {} },
        { id: "4B2", label: "Yes, but not around the house", points: { ROCOR: 2, HOCNA: 1, Antiochian: 1 } }
      ]
    },
    {
      id: 5,
      prompt: "Your cathedral was built...",
      choices: [
        { id: "5A", label: "By immigrants, brick by brick, in the 1920s", points: { OCA: 1 } },
        { id: "5B", label: "With a $40M capital campaign and a gala", points: { GOA: 4 } },
        { id: "5C", label: `It's a converted Baptist church we still call "the building"`, points: { HOCNA: 2 } },
        { id: "5D", label: "It's a monastery, and also possibly the site of a genuine miracle", points: { Jerusalem: 4 } }
      ]
    },
    {
      id: 6,
      prompt: "What's on your jurisdiction's homepage?",
      choices: [
        { id: "6A", label: `A slick video and a "Give" button`, points: { GOA: 2, Antiochian: 1 } },
        { id: "6B", label: "The whole site is in Church Slavonic and you can't find the service times", points: { ROCOR: 2 } },
        { id: "6C", label: "Hasn't been updated since 2009", points: { HOCNA: 2, ROCOR: 1 } },
        { id: "6D", label: "One photo of an ancient monastery, no text", points: { Jerusalem: 2 } }
      ]
    },
    {
      id: 7,
      prompt: "Someone asks what jurisdiction you're in. Your instinct is to...",
      choices: [
        { id: "7A", label: "Explain the whole thing, unprompted", points: { Antiochian: 4 } },
        { id: "7B", label: `Just say "Orthodox" and hope they don't ask more`, points: { OCA: 4 } },
        { id: "7C", label: "Correct their canonical terminology", points: { ROCOR: 2, HOCNA: 1 } },
        { id: "7D", label: "Mention the metropolitan by name like a personal friend", points: { GOA: 4 } }
      ]
    },
    {
      id: 8,
      prompt: "Your parish council meeting is conducted mostly in...",
      choices: [
        { id: "8A", label: "English, with Robert's Rules", points: {} },
        { id: "8B", label: "English, but it always finds a way to become a referendum on which calendar we're using", points: { ROCOR: 2, OCA: 1 } },
        { id: "8C", label: "English, and every disagreement is quietly resolved before the meeting even starts", points: { GOA: 2 } },
        { id: "8D", label: "There is no parish council, there's just Father", points: { HOCNA: 2, Jerusalem: 1 } }
      ]
    },
    {
      id: 9,
      prompt: "What's the vibe of your jurisdiction's patron-saint feast day?",
      choices: [
        { id: "9A", label: "Potluck, folding tables, someone's grandmother is in charge", points: { OCA: 1 } },
        { id: "9B", label: "A small group of very serious people who show up an hour early to make sure everything's done right", points: { ROCOR: 4 } },
        { id: "9C", label: "A small group of very serious people, and you're not entirely sure who's still in communion with whom", points: { HOCNA: 4 } },
        { id: "9D", label: "Catered, photographed, on the diocesan Instagram", points: { GOA: 4 } },
        { id: "9E", label: "Nobody outside the monastery knows it happened", points: { Jerusalem: 2 } }
      ]
    },
    {
      id: 10,
      prompt: "Coffee hour is...",
      choices: [
        { id: "10A", label: "A folding table with a Dunkin' Donuts box", points: { OCA: 1 } },
        { id: "10B", label: "There isn't one, everyone just leaves", points: { HOCNA: 2, Jerusalem: 2 } },
        { id: "10C", label: "A theological debate that started over pastries and hasn't ended", points: { OCA: 2, Antiochian: 2 } },
        { id: "10D", label: "A full spread, an unspoken seating chart, and a very clear sense of whose family paid for the icon screen", points: { GOA: 4 } }
      ]
    },
    {
      id: 11,
      prompt: "The New Calendar vs. Old Calendar debate makes you feel...",
      choices: [
        { id: "11A", label: `"There's a debate?"`, points: {} },
        { id: "11B", label: "Mildly smug that you already know the answer", points: { OCA: 2 } },
        { id: "11C", label: "Ready to produce a 20-minute explanation unprompted", points: { ROCOR: 2, Antiochian: 1 } },
        { id: "11D", label: "This is the actual reason you left your last jurisdiction", points: { HOCNA: 4 } }
      ]
    },
    {
      id: 12,
      prompt: "Your bishop's most recent public statement was about...",
      choices: [
        { id: "12A", label: "Nothing, you don't think he's issued one this year", points: { Jerusalem: 2 } },
        { id: "12B", label: "A capital campaign or a new cathedral project", points: { GOA: 4 } },
        { id: "12C", label: "A canonical dispute with another jurisdiction", points: { HOCNA: 2, ROCOR: 1 } },
        { id: "12D", label: "You genuinely don't know his name off the top of your head", points: { HOCNA: 1 } }
      ]
    },
    {
      id: 13,
      prompt: "The craziest rumor circulating at your parish is...",
      choices: [
        { id: "13A", label: "Someone in the parish comment-debates atheists on YouTube under a pseudonym everyone's already figured out", points: { Antiochian: 2 } },
        { id: "13B", label: "The building fund money went somewhere it shouldn't have", points: { GOA: 4 } },
        { id: "13C", label: "Father is secretly in communication with some other synod entirely", points: { HOCNA: 2, ROCOR: 2 } },
        { id: "13D", label: "Nobody's sure if the monastery down the road is still in communion with anyone, including itself", points: { ROCOR: 2 } },
        { id: "13E", label: "Someone flew to Jerusalem just for the Holy Fire, and it's come up at every coffee hour since", points: { Jerusalem: 4 } }
      ]
    },
    {
      id: 14,
      prompt: "When other Orthodox want to mud-sling, they call you...",
      choices: [
        { id: "14A", label: "Fordhamite", points: { GOA: 0.5, OCA: 0.5, Antiochian: 0.5 } },
        { id: "14B", label: "SCOBAdox", points: { GOA: 2, Antiochian: 1, OCA: 1 } },
        { id: "14C", label: "Non-canonical", points: { HOCNA: 4 } },
        { id: "14D", label: "Phyletist", points: { GOA: 1 } }
      ]
    },
    {
      id: 15,
      prompt: "Your uncle says something wrong about the Trinity at Thanksgiving. What happens next?",
      choices: [
        { id: "15A", label: "Someone quietly corrects him under their breath, never mentioned again", points: { OCA: 4 } },
        { id: "15B", label: "The whole table erupts, three people are shouting different patristic quotes", points: { ROCOR: 4 } },
        { id: "15C", label: "You write your priest a four-paragraph text about it later", points: { Antiochian: 2, OCA: 1 } },
        { id: "15D", label: "Nobody notices, nobody was really listening", points: {} }
      ]
    },
    {
      id: 16,
      prompt: "How do you fast during Great Lent?",
      choices: [
        { id: "16A", label: "What's Great Lent?", points: { GOA: 1, Antiochian: 1 } },
        { id: "16B", label: "Strictly — vegan, no oil on weekdays — and you don't make a big deal about it", points: { OCA: 2 } },
        { id: "16C", label: "Strictly, and everyone in a 10-foot radius knows about it", points: { ROCOR: 2, HOCNA: 1, Antiochian: 1 } },
        { id: "16D", label: "You fast from something modern instead — screens, complaining", points: { GOA: 0.5, Antiochian: 0.5, OCA: 0.5 } },
        { id: "16E", label: "Not as well as I should", points: { GOA: 0.5, Antiochian: 0.5, OCA: 0.5 } }
      ]
    },
    {
      id: 17,
      prompt: "What does the chanting sound like at your parish?",
      choices: [
        { id: "17A", label: "Byzantine — monophonic, modal, someone holding the drone", points: { GOA: 2, Antiochian: 2 } },
        { id: "17B", label: "Four-part harmony, sounds like a hymnal choir concert", points: { OCA: 4 } },
        { id: "17C", label: "Hymns from a hymnal, four-part, and vaguely Anglican", points: { Antiochian: 2 } },
        { id: "17D", label: "Znamenny chant — monastic, ancient, austere", points: { ROCOR: 2, HOCNA: 1 } }
      ]
    },
    {
      id: 18,
      prompt: "The children in our parish...",
      choices: [
        { id: "18A", label: "Already have strong opinions about wedding dance formations", points: { GOA: 2 } },
        { id: "18B", label: "Vanish for six weeks every summer to a camp in the mountains all their friends also go to", points: { Antiochian: 4 } },
        { id: "18C", label: "Are homeschooled, partly to keep the culture war out of the curriculum", points: { ROCOR: 2 } },
        { id: "18D", label: "There are no children", points: { Jerusalem: 2 } }
      ]
    },
    {
      id: 19,
      prompt: "Something distinctive about your parish:",
      choices: [
        { id: "19A", label: "Half the congregation crosses themselves backwards out of habit and is already organizing a bus for March for Life, and the other half can't figure out why there are pews", points: { Antiochian: 4 } },
        { id: "19B", label: "There's a low-grade, recurring argument about how strong the coffee should be, and it predates everyone currently in the parish", points: { Antiochian: 2 } },
        { id: "19C", label: "At least three converts here used to be youth pastors", points: { Antiochian: 2 } },
        { id: "19D", label: "Explaining what's different about the Sunday service gets you a look like you've said something in another language", points: {} }
      ]
    }
  ];

  var api = { QUESTIONS: QUESTIONS };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.QuizData = Object.assign(global.QuizData || {}, api);
  }
})(typeof window !== "undefined" ? window : globalThis);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test js/data-questions.test.js`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add js/data-questions.js js/data-questions.test.js
git commit -m "Add quiz question data with point table"
```

---

### Task 3: Jurisdiction data

**Files:**
- Create: `js/data-jurisdictions.js`
- Test: `js/data-jurisdictions.test.js`

**Interfaces:**
- Produces: `JURISDICTIONS` — object keyed by jurisdiction key (`GOA`, `Antiochian`, `OCA`, `ROCOR`, `Jerusalem`, `HOCNA`), each `{ key: string, name: string, hasPage: boolean, slug: string|null, writeup: string[] }`. `writeup` paragraphs may contain `<em>...</em>` for emphasis (rendered via `innerHTML`, not `textContent`, by `results.js` in Task 9). Exported as `module.exports.JURISDICTIONS` (Node) or `window.JurisdictionData.JURISDICTIONS` (browser).

- [ ] **Step 1: Write the failing test**

```js
// js/data-jurisdictions.test.js
const test = require("node:test");
const assert = require("node:assert");
const { JURISDICTIONS } = require("./data-jurisdictions.js");

const EXPECTED_KEYS = ["GOA", "Antiochian", "OCA", "ROCOR", "Jerusalem", "HOCNA"];

test("all six jurisdictions are present", () => {
  assert.deepStrictEqual(Object.keys(JURISDICTIONS).sort(), [...EXPECTED_KEYS].sort());
});

test("exactly four jurisdictions have a public page", () => {
  const withPage = EXPECTED_KEYS.filter((key) => JURISDICTIONS[key].hasPage);
  assert.deepStrictEqual(withPage.sort(), ["Antiochian", "GOA", "OCA", "ROCOR"].sort());
});

test("Jerusalem and HOCNA have no page and no slug", () => {
  assert.strictEqual(JURISDICTIONS.Jerusalem.hasPage, false);
  assert.strictEqual(JURISDICTIONS.Jerusalem.slug, null);
  assert.strictEqual(JURISDICTIONS.HOCNA.hasPage, false);
  assert.strictEqual(JURISDICTIONS.HOCNA.slug, null);
});

test("every jurisdiction has at least one writeup paragraph", () => {
  EXPECTED_KEYS.forEach((key) => {
    assert.ok(Array.isArray(JURISDICTIONS[key].writeup) && JURISDICTIONS[key].writeup.length > 0, `${key} has no writeup`);
  });
});

test("no jurisdiction entry contains test-subject or editorial fields", () => {
  EXPECTED_KEYS.forEach((key) => {
    const entry = JURISDICTIONS[key];
    assert.deepStrictEqual(Object.keys(entry).sort(), ["hasPage", "key", "name", "slug", "writeup"].sort());
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test js/data-jurisdictions.test.js`
Expected: FAIL with "Cannot find module './data-jurisdictions.js'"

- [ ] **Step 3: Write `js/data-jurisdictions.js`**

```js
(function (global) {
  var JURISDICTIONS = {
    GOA: {
      key: "GOA",
      name: "Greek Orthodox Archdiocese of America",
      hasPage: true,
      slug: "goa",
      writeup: [
        `You were right about most things before you turned thirty, and you've never seen a reason to revisit that. You like beautiful things and you don't apologize for it. If you aren't already a mover and a shaker in town, you're on your way up, and you have the committee appointment and social calendar to prove it. You think competence is a form of respect, and you notice when other people don't have it.`,
        `You're not devout in the fasting-and-weeping sense — you're devout the way old money is Episcopalian, completely, and without needing to discuss it. The parish runs in your family — Orthodoxy is just what your family <em>does.</em> (And if you're actually a convert — you're a natural institutionalist. You didn't join a faith so much as recognize an organization that already runs the way you think organizations should run. And you really care about governance.)`,
        `GOA fits you because it doesn't ask you to perform faith, it assumes you already have it, the same way it assumes the dome will get built and the capital campaign will hit its number. The building is beautiful, the chanter has been feuding with the choir director since the Clinton administration, and you will absolutely have an opinion about whether the new priest's homilies are too long.`
      ]
    },
    Antiochian: {
      key: "Antiochian",
      name: "Antiochian Orthodox Christian Archdiocese",
      hasPage: true,
      slug: "antiochian",
      writeup: [
        `You found this by accident, on purpose. Somewhere in your twenties there was a reading list — Lewis, then the Fathers, then a podcast, then it was too late — and you consumed an entire tradition in eighteen months the way other people binge a show. You don't do anything halfway. You're the type to memorize the seven ecumenical councils before you've even been chrismated, and you genuinely enjoy being the person at the table who actually knows the history. You weren't looking for beauty. You were looking for the correct answer, and once you found it, you needed everyone else to see it too.`,
        `You're not devout the quiet way — you're devout the way a debate champion is devout, unable to let a claim sit unexamined, especially your own. Somewhere back there you left a nondenominational church, or a Baptist one, or possibly a pulpit, and you brought the argumentative instincts with you; you just pointed them at Rome and Geneva instead. (If you're an Arab cradle reading this — you already know. Keep teaching them to dabke for the festival; someone has to.)`,
        `Antiochian fits you because it's the jurisdiction built by people who argued their way in — ex-youth-pastors, Western Rite refugees, podcast apologists — and it makes room for the argument to keep going. There's always a text thread mid-debate, always someone who left over something specific and will tell you exactly what, and always, somewhere, an Arabic coffee that no convert manages to drink correctly on the first try.`
      ]
    },
    OCA: {
      key: "OCA",
      name: "Orthodox Church in America",
      hasPage: true,
      slug: "oca",
      writeup: [
        `You are quietly, thoroughly right about things, and you've never once needed anyone else to confirm it. You find people who perform their faith a little exhausting — not because they're wrong, but because the performance is the tell that they're still working something out, and you finished working it out a while ago. You'd rather read Schmemann alone on a Tuesday than discuss Schmemann at coffee hour. You're obedient to your spiritual father, but no one else needs to know you have a spiritual father. You correct people once, quietly, and let it go; you don't need witnesses to be right.`,
        `Here's the thing about you, though — I genuinely cannot tell if you're a convert or a cradle, and neither can your own parish. Nobody's ever made you explain your path in, you've never asked anyone else to explain theirs, and your last name isn't giving anything away. That's not an accident of your particular parish. It's the whole design: American as apple pie, no ethnic flex required, no interesting backstory necessary. You could've shown up last Tuesday or been baptized as an infant in 1974, it wouldn't change a single thing about how you act at coffee hour.`,
        `OCA fits you because it was built by people trying to invent an Orthodoxy with no adjective in front of it, and at your parish, they basically pulled it off. Coffee hour runs on Dunkin Donuts and a grandmother who's been doing it since 1987, and if you ask what jurisdiction someone is, they just say "Orthodox" — like you asked something slightly odd.`
      ]
    },
    ROCOR: {
      key: "ROCOR",
      name: "Russian Orthodox Church Outside Russia",
      hasPage: true,
      slug: "rocor",
      writeup: [
        `You think most other Orthodox Christians are doing it wrong, and you're not especially good at pretending otherwise. You corrected someone's fasting rule at a potluck once and you'd do it again. You didn't leave your last jurisdiction so much as escort yourself out of it, on your way to something more serious.`,
        `You call this rigor. Other people call it being a little too enthusiastic about the Tsar, for someone born in New Jersey. Your priest deadlifts in his cassock and posts the video, and you consider this a leadership quality.`,
        `You didn't convert to Orthodoxy so much as convert to the version of Orthodoxy with the clearest chain of command.`,
        `And yet — underneath the posting, you actually keep the fasts. All of them, the hard way, without the modern workarounds, and you've been doing it long enough that it's not a discipline anymore, it's just Tuesday. Whatever you do with your prayer rule stays between you and God, which, given everything else, might be the most surprising thing about you. Say what you want about the rest of it — you're not performing this part.`,
        `ROCOR fits you because it was built by people who left rather than compromise, and it still runs on that same refusal — old calendar, long services, zero patience for anyone who thinks "keeping it simple" is a virtue. Somewhere in your parish there's Znamenny chant nobody outside can follow, a homeschool co-op that meets more than the local public school, and a table that will genuinely erupt over a calendar question you brought up on purpose.`
      ]
    },
    Jerusalem: {
      key: "Jerusalem",
      name: "Jerusalem Patriarchate",
      hasPage: false,
      slug: null,
      writeup: [
        `Okay. First, how. There are maybe a dozen Jerusalem Patriarchate parishes in the entire United States, and by some genuine coincidence of geography, boredom, or fate, you found one — or more likely, one found you, because nobody stumbles into this jurisdiction.`,
        `That tracks, because you're the type this happens to. You're not a joiner in the ordinary sense — you don't collect affiliations, you don't need a large room to feel like you belong in it, and you've never once needed your commitments validated by other people making the same ones. You like things that are old less for the aesthetic and more for the fact of it — you'd rather stand in a place where something actually happened than a place that's merely beautiful. You've flown somewhere once for a single specific religious reason and you didn't feel the need to explain the trip to anyone.`,
        `Which is the whole shape of this jurisdiction: all ancient-lineage confidence, no institutional muscle to back it up, and somehow that's the appeal rather than the drawback. Your parish is real, your bishop is real, nobody at coffee hour is pretending otherwise — there just aren't enough of you for anyone outside to have noticed you exist, and you've made a kind of peace with that. You mention Holy Fire at every coffee hour, not because you're trying to impress anyone, but because there's genuinely no one else in your life who understands why it matters, and you have to tell someone.`
      ]
    },
    HOCNA: {
      key: "HOCNA",
      name: "HOCNA",
      hasPage: false,
      slug: null,
      writeup: [
        `Okay, first: are you doing alright? Genuinely asking. This result was built as a throwaway — nobody was supposed to land here by accident, and the scoring made sure of it. You didn't stumble in here. Landing on HOCNA requires making some pretty specific choices. I have some follow-up questions I'd like to ask you gently, over coffee, somewhere with good lighting.`,
        `Here's what I can tell about you: You've left at least one jurisdiction, possibly several, each time it was because everyone else had gone soft, which is a sentence you've said out loud more than once. You're not entirely sure who's currently in communion with whom, and you've made peace with that being a moving target rather than a settled fact. There's no council at your parish, just Father, which you have decided is a feature rather than a structural risk. Your website hasn't been updated since 2009 and updating it now would feel, to you, like admitting defeat.`,
        `You didn't convert to Orthodoxy so much as convert away from every other version of it, sequentially, in order, until there was nowhere left to go but here.`,
        `HOCNA fits you because it's the last stop — the jurisdiction for people who ran out of jurisdictions to be disappointed in. I'm not going to pretend I fully understand how you got here. But if you ever want to talk about it, I'm around. I also think you should meet more people.`
      ]
    }
  };

  var api = { JURISDICTIONS: JURISDICTIONS };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.JurisdictionData = Object.assign(global.JurisdictionData || {}, api);
  }
})(typeof window !== "undefined" ? window : globalThis);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test js/data-jurisdictions.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add js/data-jurisdictions.js js/data-jurisdictions.test.js
git commit -m "Add jurisdiction writeup data"
```

---

### Task 4: Scoring engine

**Files:**
- Create: `js/scoring.js`
- Test: `js/scoring.test.js`

**Interfaces:**
- Consumes: a `questions` array shaped like `QUESTIONS` from Task 2 (only `id` and `choices[].{id,points}` are used — tests use small fake fixtures, not the real 19).
- Produces: `scoreQuiz(answers, questions) -> { totals: {[key]: number}, percentages: {[key]: number}, grandTotal: number }` and `JURISDICTION_KEYS` (array of the 6 keys). `answers` is `{ [questionId]: choiceId }`. Exported as `module.exports` (Node) or `window.Scoring` (browser).

- [ ] **Step 1: Write the failing test**

```js
// js/scoring.test.js
const test = require("node:test");
const assert = require("node:assert");
const { scoreQuiz, JURISDICTION_KEYS } = require("./scoring.js");

// Synthetic fixtures only — never the notes file's worked examples.
const FAKE_QUESTIONS = [
  { id: 1, choices: [
    { id: "1A", points: { OCA: 2, GOA: 1 } },
    { id: "1B", points: { ROCOR: 2 } }
  ]},
  { id: 2, choices: [
    { id: "2A", points: { OCA: 4 } },
    { id: "2B", points: { GOA: 4 } }
  ]}
];

test("scoreQuiz sums points per jurisdiction across answered questions", () => {
  const result = scoreQuiz({ 1: "1A", 2: "2A" }, FAKE_QUESTIONS);
  assert.strictEqual(result.totals.OCA, 6);
  assert.strictEqual(result.totals.GOA, 1);
  assert.strictEqual(result.totals.ROCOR, 0);
});

test("scoreQuiz converts totals to percentages of the grand total, one decimal place", () => {
  const result = scoreQuiz({ 1: "1A", 2: "2B" }, FAKE_QUESTIONS);
  assert.strictEqual(result.grandTotal, 7);
  assert.strictEqual(result.percentages.OCA, 28.6);
  assert.strictEqual(result.percentages.GOA, 71.4);
});

test("unanswered questions contribute zero", () => {
  const result = scoreQuiz({ 1: "1B" }, FAKE_QUESTIONS);
  assert.strictEqual(result.totals.ROCOR, 2);
  assert.strictEqual(result.grandTotal, 2);
});

test("scoreQuiz returns all six jurisdiction keys even when unused", () => {
  const result = scoreQuiz({ 1: "1A" }, FAKE_QUESTIONS);
  assert.deepStrictEqual(Object.keys(result.totals).sort(), [...JURISDICTION_KEYS].sort());
});

test("an unrecognized choice id for a question is ignored, not an error", () => {
  const result = scoreQuiz({ 1: "not-a-real-choice" }, FAKE_QUESTIONS);
  assert.strictEqual(result.grandTotal, 0);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test js/scoring.test.js`
Expected: FAIL with "Cannot find module './scoring.js'"

- [ ] **Step 3: Write `js/scoring.js`**

```js
(function (global) {
  var JURISDICTION_KEYS = ["GOA", "Antiochian", "OCA", "ROCOR", "Jerusalem", "HOCNA"];

  function scoreQuiz(answers, questions) {
    var totals = {};
    JURISDICTION_KEYS.forEach(function (key) { totals[key] = 0; });

    questions.forEach(function (question) {
      var chosenId = answers[question.id];
      if (!chosenId) return;
      var choice = question.choices.find(function (c) { return c.id === chosenId; });
      if (!choice) return;
      JURISDICTION_KEYS.forEach(function (key) {
        totals[key] += choice.points[key] || 0;
      });
    });

    var grandTotal = JURISDICTION_KEYS.reduce(function (sum, key) { return sum + totals[key]; }, 0);

    var percentages = {};
    JURISDICTION_KEYS.forEach(function (key) {
      percentages[key] = grandTotal === 0 ? 0 : Math.round((totals[key] / grandTotal) * 1000) / 10;
    });

    return { totals: totals, percentages: percentages, grandTotal: grandTotal };
  }

  var api = { scoreQuiz: scoreQuiz, JURISDICTION_KEYS: JURISDICTION_KEYS };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.Scoring = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test js/scoring.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add js/scoring.js js/scoring.test.js
git commit -m "Add scoring engine"
```

---

### Task 5: Results-view derivation (winner / split / leaning)

**Files:**
- Create: `js/results-view.js`
- Test: `js/results-view.test.js`

**Interfaces:**
- Consumes: `percentages` object shaped like `scoreQuiz(...).percentages` (Task 4) and a `jurisdictionKeys` array (pass `Scoring.JURISDICTION_KEYS`).
- Produces: `deriveResultsView(percentages, jurisdictionKeys) -> { winners: [{key, percentage}], leaning: [{key, percentage}] }`, plus exported constants `SPLIT_THRESHOLD` (5) and `LEANING_THRESHOLD` (10). Exported as `module.exports` (Node) or `window.ResultsView` (browser).

- [ ] **Step 1: Write the failing test**

```js
// js/results-view.test.js
const test = require("node:test");
const assert = require("node:assert");
const { deriveResultsView, SPLIT_THRESHOLD, LEANING_THRESHOLD } = require("./results-view.js");

// Synthetic percentage sets only — never the notes file's worked examples.
const KEYS = ["GOA", "Antiochian", "OCA", "ROCOR", "Jerusalem", "HOCNA"];

test("a clear leader with a wide gap is the sole winner", () => {
  const percentages = { GOA: 50, Antiochian: 20, OCA: 15, ROCOR: 10, Jerusalem: 3, HOCNA: 2 };
  const view = deriveResultsView(percentages, KEYS);
  assert.strictEqual(view.winners.length, 1);
  assert.strictEqual(view.winners[0].key, "GOA");
});

test("a gap within the split threshold produces two winners", () => {
  const percentages = { ROCOR: 40, HOCNA: 37, GOA: 15, OCA: 5, Antiochian: 2, Jerusalem: 1 };
  const view = deriveResultsView(percentages, KEYS);
  assert.strictEqual(view.winners.length, 2);
  assert.deepStrictEqual(view.winners.map((w) => w.key).sort(), ["HOCNA", "ROCOR"].sort());
  assert.deepStrictEqual(view.leaning.map((w) => w.key), ["GOA"]);
});

test("leaning list includes anything at or above 10 percent that isn't a winner", () => {
  const percentages = { GOA: 50, OCA: 20, Antiochian: 16, ROCOR: 9, Jerusalem: 3, HOCNA: 2 };
  const view = deriveResultsView(percentages, KEYS);
  assert.strictEqual(view.winners.length, 1);
  assert.strictEqual(view.winners[0].key, "GOA");
  assert.deepStrictEqual(view.leaning.map((w) => w.key), ["OCA", "Antiochian"]);
});

test("anything below 10 percent is never shown, even at rank 2", () => {
  const percentages = { GOA: 95, Antiochian: 5, OCA: 0, ROCOR: 0, Jerusalem: 0, HOCNA: 0 };
  const view = deriveResultsView(percentages, KEYS);
  assert.strictEqual(view.leaning.length, 0);
});

test("threshold constants match the spec", () => {
  assert.strictEqual(SPLIT_THRESHOLD, 5);
  assert.strictEqual(LEANING_THRESHOLD, 10);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test js/results-view.test.js`
Expected: FAIL with "Cannot find module './results-view.js'"

- [ ] **Step 3: Write `js/results-view.js`**

```js
(function (global) {
  var SPLIT_THRESHOLD = 5;
  var LEANING_THRESHOLD = 10;

  function deriveResultsView(percentages, jurisdictionKeys) {
    var ranked = jurisdictionKeys
      .map(function (key) { return { key: key, percentage: percentages[key] }; })
      .sort(function (a, b) { return b.percentage - a.percentage; });

    var top = ranked[0];
    var second = ranked[1];

    var winners;
    var rest;
    if (second && (top.percentage - second.percentage) <= SPLIT_THRESHOLD) {
      winners = [top, second];
      rest = ranked.slice(2);
    } else {
      winners = [top];
      rest = ranked.slice(1);
    }

    var leaning = rest.filter(function (entry) { return entry.percentage >= LEANING_THRESHOLD; });

    return { winners: winners, leaning: leaning };
  }

  var api = {
    deriveResultsView: deriveResultsView,
    SPLIT_THRESHOLD: SPLIT_THRESHOLD,
    LEANING_THRESHOLD: LEANING_THRESHOLD
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.ResultsView = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test js/results-view.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add js/results-view.js js/results-view.test.js
git commit -m "Add results-view winner/split/leaning derivation"
```

---

### Task 6: Quiz state machine (pure reducer)

**Files:**
- Create: `js/quiz-state.js`
- Test: `js/quiz-state.test.js`

**Interfaces:**
- Produces: `createInitialState(questions) -> {index: 0, answers: {}, total: number}`, `recordAnswer(state, questionId, choiceId) -> state` (immutable), `advance(state) -> state` (immutable, clamps at `total`), `isComplete(state) -> boolean`. Exported as `module.exports` (Node) or `window.QuizState` (browser). Task 8's `quiz.js` is the only consumer.

- [ ] **Step 1: Write the failing test**

```js
// js/quiz-state.test.js
const test = require("node:test");
const assert = require("node:assert");
const { createInitialState, recordAnswer, advance, isComplete } = require("./quiz-state.js");

const FAKE_QUESTIONS = [{ id: 1 }, { id: 2 }, { id: 3 }];

test("createInitialState starts at index 0 with no answers", () => {
  const state = createInitialState(FAKE_QUESTIONS);
  assert.strictEqual(state.index, 0);
  assert.deepStrictEqual(state.answers, {});
  assert.strictEqual(state.total, 3);
});

test("recordAnswer stores the choice without mutating the original state", () => {
  const state = createInitialState(FAKE_QUESTIONS);
  const next = recordAnswer(state, 1, "1A");
  assert.deepStrictEqual(state.answers, {});
  assert.deepStrictEqual(next.answers, { 1: "1A" });
});

test("advance increments index but never past total", () => {
  let state = createInitialState(FAKE_QUESTIONS);
  state = advance(advance(advance(advance(state))));
  assert.strictEqual(state.index, 3);
});

test("isComplete is true once index reaches total", () => {
  let state = createInitialState(FAKE_QUESTIONS);
  assert.strictEqual(isComplete(state), false);
  state = advance(advance(advance(state)));
  assert.strictEqual(isComplete(state), true);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test js/quiz-state.test.js`
Expected: FAIL with "Cannot find module './quiz-state.js'"

- [ ] **Step 3: Write `js/quiz-state.js`**

```js
(function (global) {
  function createInitialState(questions) {
    return { index: 0, answers: {}, total: questions.length };
  }

  function recordAnswer(state, questionId, choiceId) {
    var answers = Object.assign({}, state.answers);
    answers[questionId] = choiceId;
    return Object.assign({}, state, { answers: answers });
  }

  function advance(state) {
    return Object.assign({}, state, { index: Math.min(state.index + 1, state.total) });
  }

  function isComplete(state) {
    return state.index >= state.total;
  }

  var api = {
    createInitialState: createInitialState,
    recordAnswer: recordAnswer,
    advance: advance,
    isComplete: isComplete
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.QuizState = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test js/quiz-state.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Run the full data/logic suite together**

Run: `npm test`
Expected: PASS (all tests across `data-questions.test.js`, `data-jurisdictions.test.js`, `scoring.test.js`, `results-view.test.js`, `quiz-state.test.js`)

- [ ] **Step 6: Commit**

```bash
git add js/quiz-state.js js/quiz-state.test.js
git commit -m "Add quiz state machine reducer"
```

---

### Task 7: Design system CSS

**Files:**
- Create: `css/styles.css`

**Interfaces:**
- Produces: class names consumed by Tasks 8–12's HTML: `.page`, `.site-nav`, `.hero`, `.btn`, `.progress-track`/`.progress-fill`, `.card`, `.question-prompt`, `.choice-list`/`.choice-button`, `.result-card`, `.result-name`, `.settle-fade`, `.result-paragraph`, `.cross-divider`/`.cross-bar-top`/`.cross-bar-mid`/`.cross-bar-bottom`, `.leaning-heading`, `.bar-list`/`.bar-row`/`.bar-label`/`.bar-track`/`.bar-fill`, `.writeup`, `.site-footer`.

- [ ] **Step 1: Write `css/styles.css`**

```css
:root {
  --parchment: #EDE4D3;
  --ink: #23262F;
  --oxblood: #7A2E2E;
  --gold: #B8933D;
  --purple: #4A2E5C;
  --font-serif: 'Lora', Georgia, serif;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--parchment);
  color: var(--ink);
  font-family: var(--font-sans);
  line-height: 1.5;
}

.page {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
}

nav.site-nav {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem 1.25rem;
  font-family: var(--font-sans);
  font-size: 0.95rem;
}

nav.site-nav a {
  color: var(--ink);
  text-decoration: none;
}

nav.site-nav a:hover {
  color: var(--oxblood);
}

.question-prompt, .result-name {
  font-family: var(--font-serif);
  font-weight: 600;
}

.hero h1 {
  font-size: 2.25rem;
  margin-bottom: 0.5rem;
}

.hero p {
  font-size: 1.1rem;
}

.btn {
  display: inline-block;
  font-family: var(--font-sans);
  background: var(--oxblood);
  color: var(--parchment);
  border: none;
  padding: 0.85rem 1.75rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
}

.btn:hover {
  opacity: 0.9;
}

.progress-track {
  width: 100%;
  height: 4px;
  background: rgba(35, 38, 47, 0.12);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 2.5rem;
}

.progress-fill {
  height: 100%;
  background: var(--oxblood);
  transition: width 0.2s ease;
}

.card {
  background: #fff8ec;
  border: 1px solid rgba(35, 38, 47, 0.1);
  border-radius: 32px 32px 8px 8px;
  padding: 2rem;
}

.question-prompt {
  font-size: 1.4rem;
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.choice-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.choice-button {
  font-family: var(--font-sans);
  text-align: left;
  background: transparent;
  border: 1px solid rgba(35, 38, 47, 0.2);
  border-radius: 6px;
  padding: 0.85rem 1rem;
  font-size: 1rem;
  color: var(--ink);
  cursor: pointer;
}

.choice-button:hover,
.choice-button:focus {
  border-color: var(--oxblood);
  background: rgba(122, 46, 46, 0.06);
}

.result-card {
  background: #fff8ec;
  border: 2px solid var(--purple);
  border-radius: 90px 90px 12px 12px;
  padding: 3rem 2rem 2rem;
  text-align: center;
}

.result-name {
  color: var(--purple);
  font-size: 2rem;
  margin: 0 0 1.5rem;
}

.settle-fade {
  animation: settleFade 0.7s ease-out;
}

@keyframes settleFade {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-paragraph {
  text-align: left;
  font-size: 1rem;
  line-height: 1.65;
}

.cross-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  margin: 2.5rem 0 1.5rem;
}

.cross-bar {
  display: block;
  height: 1px;
  background: var(--gold);
}

.cross-bar-top { width: 40px; }
.cross-bar-mid { width: 70px; }
.cross-bar-bottom { width: 24px; transform: rotate(4deg); }

.leaning-heading {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.95rem;
  text-align: center;
  color: var(--ink);
  margin-bottom: 1rem;
}

.bar-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.bar-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.bar-label {
  font-family: var(--font-sans);
  font-size: 0.9rem;
}

.bar-track {
  display: block;
  height: 6px;
  background: rgba(35, 38, 47, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.bar-fill {
  display: block;
  height: 100%;
  background: var(--gold);
}

.writeup p {
  line-height: 1.7;
}

footer.site-footer {
  text-align: center;
  font-size: 0.85rem;
  padding: 2rem 1.25rem;
  color: rgba(35, 38, 47, 0.6);
}
```

- [ ] **Step 2: Commit**

```bash
git add css/styles.css
git commit -m "Add design system stylesheet"
```

(Visual verification happens once real pages exist to render it — Tasks 8–11.)

---

### Task 8: Quiz page

**Files:**
- Create: `js/quiz.js`
- Create: `quiz.html`

**Interfaces:**
- Consumes: `window.QuizData.QUESTIONS` (Task 2), `window.QuizState.{createInitialState,recordAnswer,advance,isComplete}` (Task 6).
- Produces: browser-only side effects — writes `sessionStorage["jurisdictionQuizAnswers"]` as JSON (`{ [questionId]: choiceId }`) after each answer; navigates to `results.html` on completion. No exports (guarded IIFE, does nothing under Node).

- [ ] **Step 1: Write `js/quiz.js`**

```js
(function () {
  if (typeof document === "undefined") return;

  var STORAGE_KEY = "jurisdictionQuizAnswers";
  var questions = window.QuizData.QUESTIONS;
  var state = window.QuizState.createInitialState(questions);

  var stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    var storedAnswers = JSON.parse(stored);
    Object.keys(storedAnswers).forEach(function (questionId) {
      state = window.QuizState.recordAnswer(state, Number(questionId), storedAnswers[questionId]);
    });
    state.index = Object.keys(storedAnswers).length;
  }

  var progressBar = document.getElementById("progress-bar");
  var questionContainer = document.getElementById("question-container");

  function render() {
    if (window.QuizState.isComplete(state)) {
      window.location.href = "results.html";
      return;
    }

    var question = questions[state.index];
    progressBar.style.width = Math.round((state.index / questions.length) * 100) + "%";

    questionContainer.innerHTML = "";

    var promptEl = document.createElement("h2");
    promptEl.className = "question-prompt";
    promptEl.textContent = question.prompt;
    questionContainer.appendChild(promptEl);

    var choiceList = document.createElement("div");
    choiceList.className = "choice-list";

    question.choices.forEach(function (choice) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "choice-button";
      button.textContent = choice.label;
      button.addEventListener("click", function () {
        selectChoice(question.id, choice.id);
      });
      choiceList.appendChild(button);
    });

    questionContainer.appendChild(choiceList);
  }

  function selectChoice(questionId, choiceId) {
    state = window.QuizState.recordAnswer(state, questionId, choiceId);
    state = window.QuizState.advance(state);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.answers));
    render();
  }

  render();
})();
```

- [ ] **Step 2: Write `quiz.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Take the quiz — Which Orthodox Jurisdiction Are You?</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Lora:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <main class="page">
    <div class="progress-track">
      <div class="progress-fill" id="progress-bar" style="width: 0%"></div>
    </div>
    <div class="card" id="question-container"></div>
  </main>
  <script src="js/data-questions.js"></script>
  <script src="js/quiz-state.js"></script>
  <script src="js/quiz.js"></script>
</body>
</html>
```

- [ ] **Step 3: Manually verify in a browser**

Run: `python3 -m http.server 8000` from the repo root, then open `http://localhost:8000/quiz.html`.

Expected: question 1 renders with two choices; clicking a choice advances to question 2 and the progress bar grows; open DevTools → Application → Session Storage and confirm `jurisdictionQuizAnswers` updates after each click; reloading mid-quiz resumes at the next unanswered question (not question 1); answering all 19 redirects to `results.html` (a 404 is expected until Task 9 exists — that confirms the redirect fired).

- [ ] **Step 4: Commit**

```bash
git add js/quiz.js quiz.html
git commit -m "Add quiz page and DOM wiring"
```

---

### Task 9: Results page + analytics client

**Files:**
- Create: `js/analytics.js`
- Create: `js/results.js`
- Create: `results.html`

**Interfaces:**
- Consumes: `window.QuizData.QUESTIONS` (Task 2), `window.JurisdictionData.JURISDICTIONS` (Task 3), `window.Scoring.{scoreQuiz,JURISDICTION_KEYS}` (Task 4), `window.ResultsView.deriveResultsView` (Task 5), `sessionStorage["jurisdictionQuizAnswers"]` (written by Task 8).
- Produces: `window.QuizAnalytics.reportResults(resultKeys: string[])` and `window.QuizAnalytics.ANALYTICS_ENDPOINT` (placeholder URL, swap after the worker is deployed in Task 13). `results.js` has no exports — it renders directly into `results.html`'s DOM and calls `reportResults` once per page load.

- [ ] **Step 1: Write `js/analytics.js`**

```js
(function (global) {
  var FLAG_KEY = "jurisdictionQuizAnalyticsSent";
  // Placeholder — replace with the deployed worker's URL (see worker/README.md, Task 13).
  var ANALYTICS_ENDPOINT = "https://analytics.your-domain-here.com";

  function reportResults(resultKeys) {
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem(FLAG_KEY)) return;
    sessionStorage.setItem(FLAG_KEY, "1");

    resultKeys.forEach(function (key) {
      fetch(ANALYTICS_ENDPOINT + "/count?result=" + encodeURIComponent(key), {
        method: "POST",
        mode: "cors"
      }).catch(function () {});
    });
  }

  global.QuizAnalytics = { reportResults: reportResults, ANALYTICS_ENDPOINT: ANALYTICS_ENDPOINT };
})(typeof window !== "undefined" ? window : globalThis);
```

- [ ] **Step 2: Write `js/results.js`**

```js
(function () {
  if (typeof document === "undefined") return;

  var STORAGE_KEY = "jurisdictionQuizAnswers";
  var stored = sessionStorage.getItem(STORAGE_KEY);

  if (!stored) {
    window.location.href = "quiz.html";
    return;
  }

  var rawAnswers = JSON.parse(stored);
  var answers = {};
  Object.keys(rawAnswers).forEach(function (questionId) {
    answers[Number(questionId)] = rawAnswers[questionId];
  });

  var questions = window.QuizData.QUESTIONS;
  var jurisdictions = window.JurisdictionData.JURISDICTIONS;

  var scored = window.Scoring.scoreQuiz(answers, questions);
  var view = window.ResultsView.deriveResultsView(scored.percentages, window.Scoring.JURISDICTION_KEYS);

  var winnersEl = document.getElementById("results-winners");
  var leaningEl = document.getElementById("results-leaning");

  winnersEl.innerHTML = "";
  view.winners.forEach(function (entry) {
    var jurisdiction = jurisdictions[entry.key];

    var card = document.createElement("div");
    card.className = "result-card settle-fade";

    var name = document.createElement("h1");
    name.className = "result-name";
    name.textContent = jurisdiction.name;
    card.appendChild(name);

    jurisdiction.writeup.forEach(function (paragraph) {
      var p = document.createElement("p");
      p.className = "result-paragraph";
      p.innerHTML = paragraph;
      card.appendChild(p);
    });

    winnersEl.appendChild(card);
  });

  leaningEl.innerHTML = "";
  if (view.leaning.length > 0) {
    var divider = document.createElement("div");
    divider.className = "cross-divider";
    divider.innerHTML =
      '<span class="cross-bar cross-bar-top"></span>' +
      '<span class="cross-bar cross-bar-mid"></span>' +
      '<span class="cross-bar cross-bar-bottom"></span>';
    leaningEl.appendChild(divider);

    var heading = document.createElement("h3");
    heading.className = "leaning-heading";
    heading.textContent = "Leaning";
    leaningEl.appendChild(heading);

    var list = document.createElement("ul");
    list.className = "bar-list";

    view.leaning.forEach(function (entry) {
      var jurisdiction = jurisdictions[entry.key];
      var item = document.createElement("li");
      item.className = "bar-row";

      var label = document.createElement("span");
      label.className = "bar-label";
      label.textContent = jurisdiction.name + " " + entry.percentage + "%";
      item.appendChild(label);

      var track = document.createElement("span");
      track.className = "bar-track";
      var fill = document.createElement("span");
      fill.className = "bar-fill";
      fill.style.width = entry.percentage + "%";
      track.appendChild(fill);
      item.appendChild(track);

      list.appendChild(item);
    });

    leaningEl.appendChild(list);
  }

  if (window.QuizAnalytics) {
    var resultKeys = view.winners.map(function (entry) { return entry.key; });
    window.QuizAnalytics.reportResults(resultKeys);
  }
})();
```

- [ ] **Step 3: Write `results.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Your result — Which Orthodox Jurisdiction Are You?</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Lora:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <main class="page">
    <div id="results-winners"></div>
    <div id="results-leaning"></div>
    <p style="text-align:center; margin-top: 2.5rem;"><a class="btn" href="quiz.html">Take it again</a></p>
  </main>
  <script src="js/data-questions.js"></script>
  <script src="js/data-jurisdictions.js"></script>
  <script src="js/scoring.js"></script>
  <script src="js/results-view.js"></script>
  <script src="js/analytics.js"></script>
  <script src="js/results.js"></script>
</body>
</html>
```

- [ ] **Step 4: Manually verify in a browser**

With the local server still running, open `http://localhost:8000/quiz.html` and complete all 19 questions.

Expected: lands on `results.html`; the winning jurisdiction's name renders in purple with the arch-shaped card and a visible fade/settle on load; if `sessionStorage` is cleared and `results.html` is opened directly, it redirects to `quiz.html`; reloading `results.html` after completing the quiz re-renders the same result without losing it; opening DevTools → Network shows one failed (expected — no worker deployed yet) `POST` to `analytics.your-domain-here.com/count?result=...` per winner, and reloading again does not re-fire it (`jurisdictionQuizAnalyticsSent` flag in Session Storage).

- [ ] **Step 5: Commit**

```bash
git add js/analytics.js js/results.js results.html
git commit -m "Add results page with scoring, split/leaning display, and analytics client"
```

---

### Task 10: Landing, directory, and FAQ pages

**Files:**
- Create: `index.html`
- Create: `directory.html`
- Create: `faq.html`

**Interfaces:**
- Consumes: `css/styles.css` classes from Task 7. No JS.

- [ ] **Step 1: Write `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Which Orthodox Jurisdiction Are You?</title>
  <meta name="description" content="A 19-question satirical personality quiz for Orthodox Christians who already have opinions about jurisdictions.">
  <meta property="og:title" content="Which Orthodox Jurisdiction Are You?">
  <meta property="og:description" content="A 19-question satirical personality quiz for Orthodox Christians who already have opinions about jurisdictions.">
  <meta property="og:image" content="https://your-domain-here.com/assets/og-image.png">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Lora:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <nav class="site-nav">
    <a href="index.html">Home</a>
    <a href="directory.html">Directory</a>
    <a href="faq.html">FAQ</a>
  </nav>
  <main class="page hero">
    <h1>Which Orthodox jurisdiction are you?</h1>
    <p>Nineteen questions. No wrong answers, several deeply telling ones. Find out which jurisdiction actually fits you — not the one on your baptismal certificate.</p>
    <p><a class="btn" href="quiz.html">Take the quiz</a></p>
  </main>
  <footer class="site-footer">
    <p>A satirical quiz, made with affection. <a href="faq.html">Questions or feedback?</a></p>
  </footer>
</body>
</html>
```

- [ ] **Step 2: Write `directory.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Jurisdiction directory — Which Orthodox Jurisdiction Are You?</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Lora:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <nav class="site-nav">
    <a href="index.html">Home</a>
    <a href="directory.html">Directory</a>
    <a href="faq.html">FAQ</a>
  </nav>
  <main class="page">
    <h1>Jurisdiction directory</h1>
    <p>Four of the quiz's possible results, written up in full. The other two, you'll have to earn.</p>
    <ul>
      <li><a href="jurisdictions/goa.html">Greek Orthodox Archdiocese of America (GOA)</a></li>
      <li><a href="jurisdictions/antiochian.html">Antiochian Orthodox Christian Archdiocese</a></li>
      <li><a href="jurisdictions/oca.html">Orthodox Church in America (OCA)</a></li>
      <li><a href="jurisdictions/rocor.html">Russian Orthodox Church Outside Russia (ROCOR)</a></li>
    </ul>
  </main>
</body>
</html>
```

- [ ] **Step 3: Write `faq.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>FAQ — Which Orthodox Jurisdiction Are You?</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Lora:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <nav class="site-nav">
    <a href="index.html">Home</a>
    <a href="directory.html">Directory</a>
    <a href="faq.html">FAQ</a>
  </nav>
  <main class="page">
    <h1>FAQ</h1>
    <h2>Is this serious?</h2>
    <p>No. It's a satirical personality quiz. If you recognize the jokes, they're for you; if you don't, no harm done.</p>
    <h2>How is the result calculated?</h2>
    <p>Every answer is worth a fixed number of points toward each jurisdiction. Your nineteen answers are summed and converted to a percentage. Nothing is random, and nothing is stored on a server — the scoring happens entirely in your browser.</p>
    <h2>Why can't I find every jurisdiction in the directory?</h2>
    <p>The directory only lists a few. The rest, you'll have to take the quiz to meet.</p>
    <h2>I have feedback, or you got something wrong.</h2>
    <p>Fair. Email <a href="mailto:feedback@your-domain-here.com">feedback@your-domain-here.com</a> and tell me about it.</p>
  </main>
</body>
</html>
```

- [ ] **Step 4: Manually verify in a browser**

With the local server running, open `http://localhost:8000/index.html`, `directory.html`, and `faq.html`.

Expected: nav links work between all three; the "Take the quiz" button goes to `quiz.html`; the directory lists exactly the four public jurisdictions (no Jerusalem, no HOCNA) and its links currently 404 (expected until Task 11); the FAQ's feedback link opens a mail compose window addressed to the placeholder address.

- [ ] **Step 5: Commit**

```bash
git add index.html directory.html faq.html
git commit -m "Add landing, directory, and FAQ pages"
```

---

### Task 11: Jurisdiction writeup pages

**Files:**
- Create: `jurisdictions/goa.html`
- Create: `jurisdictions/antiochian.html`
- Create: `jurisdictions/oca.html`
- Create: `jurisdictions/rocor.html`

**Interfaces:**
- Consumes: `../css/styles.css` (Task 7). Text must match `js/data-jurisdictions.js` (Task 3) for these four keys — copied statically here (not JS-rendered) so the pages are crawlable without JS.

- [ ] **Step 1: Write `jurisdictions/goa.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>GOA — Which Orthodox Jurisdiction Are You?</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Lora:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
  <nav class="site-nav">
    <a href="../index.html">Home</a>
    <a href="../directory.html">Directory</a>
    <a href="../faq.html">FAQ</a>
  </nav>
  <main class="page writeup">
    <h1>Greek Orthodox Archdiocese of America (GOA)</h1>
    <p>You were right about most things before you turned thirty, and you've never seen a reason to revisit that. You like beautiful things and you don't apologize for it. If you aren't already a mover and a shaker in town, you're on your way up, and you have the committee appointment and social calendar to prove it. You think competence is a form of respect, and you notice when other people don't have it.</p>
    <p>You're not devout in the fasting-and-weeping sense — you're devout the way old money is Episcopalian, completely, and without needing to discuss it. The parish runs in your family — Orthodoxy is just what your family <em>does.</em> (And if you're actually a convert — you're a natural institutionalist. You didn't join a faith so much as recognize an organization that already runs the way you think organizations should run. And you really care about governance.)</p>
    <p>GOA fits you because it doesn't ask you to perform faith, it assumes you already have it, the same way it assumes the dome will get built and the capital campaign will hit its number. The building is beautiful, the chanter has been feuding with the choir director since the Clinton administration, and you will absolutely have an opinion about whether the new priest's homilies are too long.</p>
    <p><a href="../quiz.html">Take the quiz</a></p>
  </main>
</body>
</html>
```

- [ ] **Step 2: Write `jurisdictions/antiochian.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Antiochian — Which Orthodox Jurisdiction Are You?</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Lora:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
  <nav class="site-nav">
    <a href="../index.html">Home</a>
    <a href="../directory.html">Directory</a>
    <a href="../faq.html">FAQ</a>
  </nav>
  <main class="page writeup">
    <h1>Antiochian Orthodox Christian Archdiocese</h1>
    <p>You found this by accident, on purpose. Somewhere in your twenties there was a reading list — Lewis, then the Fathers, then a podcast, then it was too late — and you consumed an entire tradition in eighteen months the way other people binge a show. You don't do anything halfway. You're the type to memorize the seven ecumenical councils before you've even been chrismated, and you genuinely enjoy being the person at the table who actually knows the history. You weren't looking for beauty. You were looking for the correct answer, and once you found it, you needed everyone else to see it too.</p>
    <p>You're not devout the quiet way — you're devout the way a debate champion is devout, unable to let a claim sit unexamined, especially your own. Somewhere back there you left a nondenominational church, or a Baptist one, or possibly a pulpit, and you brought the argumentative instincts with you; you just pointed them at Rome and Geneva instead. (If you're an Arab cradle reading this — you already know. Keep teaching them to dabke for the festival; someone has to.)</p>
    <p>Antiochian fits you because it's the jurisdiction built by people who argued their way in — ex-youth-pastors, Western Rite refugees, podcast apologists — and it makes room for the argument to keep going. There's always a text thread mid-debate, always someone who left over something specific and will tell you exactly what, and always, somewhere, an Arabic coffee that no convert manages to drink correctly on the first try.</p>
    <p><a href="../quiz.html">Take the quiz</a></p>
  </main>
</body>
</html>
```

- [ ] **Step 3: Write `jurisdictions/oca.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>OCA — Which Orthodox Jurisdiction Are You?</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Lora:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
  <nav class="site-nav">
    <a href="../index.html">Home</a>
    <a href="../directory.html">Directory</a>
    <a href="../faq.html">FAQ</a>
  </nav>
  <main class="page writeup">
    <h1>Orthodox Church in America (OCA)</h1>
    <p>You are quietly, thoroughly right about things, and you've never once needed anyone else to confirm it. You find people who perform their faith a little exhausting — not because they're wrong, but because the performance is the tell that they're still working something out, and you finished working it out a while ago. You'd rather read Schmemann alone on a Tuesday than discuss Schmemann at coffee hour. You're obedient to your spiritual father, but no one else needs to know you have a spiritual father. You correct people once, quietly, and let it go; you don't need witnesses to be right.</p>
    <p>Here's the thing about you, though — I genuinely cannot tell if you're a convert or a cradle, and neither can your own parish. Nobody's ever made you explain your path in, you've never asked anyone else to explain theirs, and your last name isn't giving anything away. That's not an accident of your particular parish. It's the whole design: American as apple pie, no ethnic flex required, no interesting backstory necessary. You could've shown up last Tuesday or been baptized as an infant in 1974, it wouldn't change a single thing about how you act at coffee hour.</p>
    <p>OCA fits you because it was built by people trying to invent an Orthodoxy with no adjective in front of it, and at your parish, they basically pulled it off. Coffee hour runs on Dunkin Donuts and a grandmother who's been doing it since 1987, and if you ask what jurisdiction someone is, they just say "Orthodox" — like you asked something slightly odd.</p>
    <p><a href="../quiz.html">Take the quiz</a></p>
  </main>
</body>
</html>
```

- [ ] **Step 4: Write `jurisdictions/rocor.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>ROCOR — Which Orthodox Jurisdiction Are You?</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Lora:wght@500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
  <nav class="site-nav">
    <a href="../index.html">Home</a>
    <a href="../directory.html">Directory</a>
    <a href="../faq.html">FAQ</a>
  </nav>
  <main class="page writeup">
    <h1>Russian Orthodox Church Outside Russia (ROCOR)</h1>
    <p>You think most other Orthodox Christians are doing it wrong, and you're not especially good at pretending otherwise. You corrected someone's fasting rule at a potluck once and you'd do it again. You didn't leave your last jurisdiction so much as escort yourself out of it, on your way to something more serious.</p>
    <p>You call this rigor. Other people call it being a little too enthusiastic about the Tsar, for someone born in New Jersey. Your priest deadlifts in his cassock and posts the video, and you consider this a leadership quality.</p>
    <p>You didn't convert to Orthodoxy so much as convert to the version of Orthodoxy with the clearest chain of command.</p>
    <p>And yet — underneath the posting, you actually keep the fasts. All of them, the hard way, without the modern workarounds, and you've been doing it long enough that it's not a discipline anymore, it's just Tuesday. Whatever you do with your prayer rule stays between you and God, which, given everything else, might be the most surprising thing about you. Say what you want about the rest of it — you're not performing this part.</p>
    <p>ROCOR fits you because it was built by people who left rather than compromise, and it still runs on that same refusal — old calendar, long services, zero patience for anyone who thinks "keeping it simple" is a virtue. Somewhere in your parish there's Znamenny chant nobody outside can follow, a homeschool co-op that meets more than the local public school, and a table that will genuinely erupt over a calendar question you brought up on purpose.</p>
    <p><a href="../quiz.html">Take the quiz</a></p>
  </main>
</body>
</html>
```

- [ ] **Step 5: Manually verify in a browser**

With the local server running, open `directory.html` and click through to all four jurisdiction pages.

Expected: each page renders its writeup, the GOA page's second paragraph shows "does" in italics, and "Home"/"Directory"/"FAQ" nav links correctly resolve one directory level up.

- [ ] **Step 6: Commit**

```bash
git add jurisdictions/
git commit -m "Add GOA, Antiochian, OCA, and ROCOR writeup pages"
```

---

### Task 12: sitemap.xml and robots.txt

**Files:**
- Create: `sitemap.xml`
- Create: `robots.txt`

**Interfaces:**
- None — static files, no shared code.

- [ ] **Step 1: Write `sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://your-domain-here.com/</loc></url>
  <url><loc>https://your-domain-here.com/quiz.html</loc></url>
  <url><loc>https://your-domain-here.com/directory.html</loc></url>
  <url><loc>https://your-domain-here.com/faq.html</loc></url>
  <url><loc>https://your-domain-here.com/jurisdictions/goa.html</loc></url>
  <url><loc>https://your-domain-here.com/jurisdictions/antiochian.html</loc></url>
  <url><loc>https://your-domain-here.com/jurisdictions/oca.html</loc></url>
  <url><loc>https://your-domain-here.com/jurisdictions/rocor.html</loc></url>
</urlset>
```

- [ ] **Step 2: Write `robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://your-domain-here.com/sitemap.xml
```

- [ ] **Step 3: Verify neither file mentions the hidden jurisdictions**

Run: `grep -iE "jerusalem|hocna" sitemap.xml robots.txt`
Expected: no output (no matches)

- [ ] **Step 4: Commit**

```bash
git add sitemap.xml robots.txt
git commit -m "Add sitemap and robots.txt"
```

---

### Task 13: Cloudflare Worker analytics

**Files:**
- Create: `worker/src/worker.js`
- Create: `worker/wrangler.toml`
- Create: `worker/package.json`
- Create: `worker/test/worker.test.js`
- Create: `worker/README.md`

**Interfaces:**
- Produces: default export `{ fetch(request, env) }` where `env.QUIZ_COUNTS` is a KV namespace binding (any object exposing async `get(key)`/`put(key, value)` — the test uses an in-memory fake). `POST /count?result=<key>` increments; `GET /counts` returns all six; unknown `result` values get HTTP 400; unmatched routes get HTTP 404; `OPTIONS` returns a 204 CORS preflight response.

- [ ] **Step 1: Write `worker/package.json`**

```json
{
  "name": "jurisdiction-quiz-analytics",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test test/"
  },
  "devDependencies": {
    "wrangler": "^3.0.0"
  }
}
```

- [ ] **Step 2: Write the failing test**

```js
// worker/test/worker.test.js
import test from "node:test";
import assert from "node:assert";
import worker from "../src/worker.js";

function createEnv(initial) {
  const store = new Map(Object.entries(initial || {}));
  return {
    QUIZ_COUNTS: {
      async get(key) { return store.has(key) ? store.get(key) : null; },
      async put(key, value) { store.set(key, value); }
    }
  };
}

test("POST /count increments an existing key", async () => {
  const env = createEnv({ GOA: "3" });
  const request = new Request("https://analytics.example.com/count?result=GOA", { method: "POST" });
  const response = await worker.fetch(request, env);
  const body = await response.json();
  assert.strictEqual(response.status, 200);
  assert.strictEqual(body.count, 4);
});

test("POST /count starts a missing key at 1", async () => {
  const env = createEnv({});
  const request = new Request("https://analytics.example.com/count?result=HOCNA", { method: "POST" });
  const response = await worker.fetch(request, env);
  const body = await response.json();
  assert.strictEqual(body.count, 1);
});

test("POST /count rejects an unknown result key", async () => {
  const env = createEnv({});
  const request = new Request("https://analytics.example.com/count?result=NotAJurisdiction", { method: "POST" });
  const response = await worker.fetch(request, env);
  assert.strictEqual(response.status, 400);
});

test("GET /counts returns all six jurisdictions", async () => {
  const env = createEnv({ GOA: "2", ROCOR: "1" });
  const request = new Request("https://analytics.example.com/counts", { method: "GET" });
  const response = await worker.fetch(request, env);
  const body = await response.json();
  assert.strictEqual(response.status, 200);
  assert.deepStrictEqual(body, { GOA: 2, Antiochian: 0, OCA: 0, ROCOR: 1, Jerusalem: 0, HOCNA: 0 });
});

test("OPTIONS preflight returns CORS headers with no body", async () => {
  const env = createEnv({});
  const request = new Request("https://analytics.example.com/count", { method: "OPTIONS" });
  const response = await worker.fetch(request, env);
  assert.strictEqual(response.status, 204);
  assert.ok(response.headers.get("Access-Control-Allow-Origin"));
});

test("an unmatched route returns 404", async () => {
  const env = createEnv({});
  const request = new Request("https://analytics.example.com/nope", { method: "GET" });
  const response = await worker.fetch(request, env);
  assert.strictEqual(response.status, 404);
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd worker && node --test test/`
Expected: FAIL — cannot find `../src/worker.js`

- [ ] **Step 4: Write `worker/src/worker.js`**

```js
const JURISDICTION_KEYS = ["GOA", "Antiochian", "OCA", "ROCOR", "Jerusalem", "HOCNA"];
// Placeholder — replace with the site's real deployed domain before going live.
const ALLOWED_ORIGIN = "https://your-domain-here.com";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: Object.assign({ "Content-Type": "application/json" }, corsHeaders())
  });
}

async function handleCount(request, env) {
  const url = new URL(request.url);
  const result = url.searchParams.get("result");
  if (!JURISDICTION_KEYS.includes(result)) {
    return jsonResponse({ error: "invalid result key" }, 400);
  }
  const current = parseInt((await env.QUIZ_COUNTS.get(result)) || "0", 10);
  const next = current + 1;
  await env.QUIZ_COUNTS.put(result, String(next));
  return jsonResponse({ result: result, count: next }, 200);
}

async function handleCounts(env) {
  const counts = {};
  for (const key of JURISDICTION_KEYS) {
    counts[key] = parseInt((await env.QUIZ_COUNTS.get(key)) || "0", 10);
  }
  return jsonResponse(counts, 200);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === "/count" && request.method === "POST") {
      return handleCount(request, env);
    }

    if (url.pathname === "/counts" && request.method === "GET") {
      return handleCounts(env);
    }

    return jsonResponse({ error: "not found" }, 404);
  }
};
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd worker && node --test test/`
Expected: PASS (6 tests)

- [ ] **Step 6: Write `worker/wrangler.toml`**

```toml
name = "jurisdiction-quiz-analytics"
main = "src/worker.js"
compatibility_date = "2026-09-18"

kv_namespaces = [
  { binding = "QUIZ_COUNTS", id = "REPLACE_WITH_REAL_KV_NAMESPACE_ID" }
]
```

- [ ] **Step 7: Write `worker/README.md`**

```markdown
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
   domain (must match the `CNAME` file at the repo root, e.g.
   `https://your-real-domain.com`).
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
```

- [ ] **Step 8: Commit**

```bash
git add worker/
git commit -m "Add Cloudflare Worker for result-count analytics"
```

---

### Task 14: Final integration check and notes-file safety audit

**Files:**
- No new files. Verification only.

**Interfaces:**
- None.

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test && (cd worker && npm test)`
Expected: all tests pass (site: `data-questions`, `data-jurisdictions`, `scoring`, `results-view`, `quiz-state`; worker: 6 route tests)

- [ ] **Step 2: Confirm the notes file was never tracked**

Run: `git ls-files | grep -i notes`
Expected: no output. If anything appears, `git rm --cached <file>` it and confirm it's covered by `.gitignore` before re-committing.

- [ ] **Step 3: Review the full tracked file list**

Run: `git ls-files`
Expected: only the files created in Tasks 1–13 (`package.json`, `.gitignore`, `CNAME`, `css/styles.css`, `js/*.js` + `js/*.test.js`, `index.html`, `quiz.html`, `results.html`, `directory.html`, `faq.html`, `jurisdictions/*.html`, `sitemap.xml`, `robots.txt`, `worker/**`, `docs/superpowers/**`) — nothing from `~/Downloads/`.

- [ ] **Step 4: Full manual click-through**

With `python3 -m http.server 8000` running from the repo root:
1. `index.html` → "Take the quiz" → answer all 19 questions → land on `results.html` with a rendered result.
2. From `results.html`, click "Take it again" and confirm a fresh run can produce a different result.
3. Visit `directory.html` and confirm exactly 4 links, all resolving.
4. Visit `faq.html` and confirm the mailto link.
5. `curl -s http://localhost:8000/jerusalem.html` and `curl -s http://localhost:8000/hocna.html` (and any other guessed filename) return 404 — there is no ordinary route to either hidden jurisdiction.

Expected: all pass.

- [ ] **Step 5: Final commit**

```bash
git status
git add -A
git commit -m "Final integration pass" --allow-empty
```

(If Step 5's `git status` before staging shows nothing beyond what's already committed, the `--allow-empty` commit may be skipped — this step exists to catch anything missed by earlier per-task commits.)

**Do not push.** Review `git log --oneline` and `git ls-files` yourself before pushing to GitHub, per the notes-file handling constraint above. When ready, you'll need to create the GitHub repo yourself and push `main`, then set the custom domain and enable HTTPS in the repo's Pages settings once DNS resolves.

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

test("ROCOR and HOCNA display names spell out the full jurisdiction with the abbreviation appended", () => {
  assert.strictEqual(JURISDICTIONS.ROCOR.name, "Russian Orthodox Church Outside Russia (ROCOR)");
  assert.strictEqual(JURISDICTIONS.HOCNA.name, "The Holy Orthodox Church of North America (HOCNA)");
});

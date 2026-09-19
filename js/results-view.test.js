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

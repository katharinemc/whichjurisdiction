// js/results-view.test.js
const test = require("node:test");
const assert = require("node:assert");
const { deriveResultsView, MAJORITY_THRESHOLD } = require("./results-view.js");

// Synthetic percentage sets only — never the notes file's worked examples.
const KEYS = ["GOA", "Antiochian", "OCA", "ROCOR", "Jerusalem", "HOCNA"];

test("a decisive top result alone reaches the majority threshold", () => {
  const percentages = { GOA: 65, Antiochian: 20, OCA: 10, ROCOR: 3, Jerusalem: 1, HOCNA: 1 };
  const view = deriveResultsView(percentages, KEYS);
  assert.strictEqual(view.winners.length, 1);
  assert.strictEqual(view.winners[0].key, "GOA");
});

test("exactly at the threshold needs only one card", () => {
  const percentages = { GOA: 51, Antiochian: 49, OCA: 0, ROCOR: 0, Jerusalem: 0, HOCNA: 0 };
  const view = deriveResultsView(percentages, KEYS);
  assert.strictEqual(view.winners.length, 1);
  assert.strictEqual(view.winners[0].key, "GOA");
});

test("a top result under the threshold pulls in the next-highest until cumulative crosses it", () => {
  const percentages = { ROCOR: 40, HOCNA: 37, GOA: 15, OCA: 5, Antiochian: 2, Jerusalem: 1 };
  const view = deriveResultsView(percentages, KEYS);
  // 40 + 37 = 77 >= 51, stop after 2 — the third-place GOA (15) is not needed.
  assert.deepStrictEqual(view.winners.map((w) => w.key), ["ROCOR", "HOCNA"]);
});

test("a fragmented spread can take three or more cards", () => {
  const percentages = { GOA: 20, Antiochian: 18, OCA: 17, ROCOR: 16, Jerusalem: 15, HOCNA: 14 };
  const view = deriveResultsView(percentages, KEYS);
  // 20 + 18 + 17 = 55 >= 51, stop after 3.
  assert.deepStrictEqual(view.winners.map((w) => w.key), ["GOA", "Antiochian", "OCA"]);
});

test("cards are ordered by descending percentage regardless of key order", () => {
  const percentages = { HOCNA: 55, GOA: 45, Antiochian: 0, OCA: 0, ROCOR: 0, Jerusalem: 0 };
  const view = deriveResultsView(percentages, KEYS);
  assert.deepStrictEqual(view.winners.map((w) => w.key), ["HOCNA"]);
});

test("the majority threshold constant is 51", () => {
  assert.strictEqual(MAJORITY_THRESHOLD, 51);
});

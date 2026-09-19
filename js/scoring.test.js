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

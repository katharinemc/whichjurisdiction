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

// js/quiz-state.test.js
const test = require("node:test");
const assert = require("node:assert");
const { createInitialState, recordAnswer, advance, isComplete, visibleQuestions } = require("./quiz-state.js");

const FAKE_QUESTIONS = [{ id: 1 }, { id: 2 }, { id: 3 }];

const BRANCHING_QUESTIONS = [
  { id: 1 },
  {
    id: 2,
    choices: [
      { id: "2A", label: "No" },
      { id: "2B", label: "Yes" }
    ]
  },
  { id: 2.5, dependsOn: { questionId: 2, choiceId: "2B" } },
  { id: 3 }
];

test("createInitialState starts at index 0 with no answers", () => {
  const state = createInitialState(FAKE_QUESTIONS);
  assert.strictEqual(state.index, 0);
  assert.deepStrictEqual(state.answers, {});
});

test("recordAnswer stores the choice without mutating the original state", () => {
  const state = createInitialState(FAKE_QUESTIONS);
  const next = recordAnswer(state, 1, "1A");
  assert.deepStrictEqual(state.answers, {});
  assert.deepStrictEqual(next.answers, { 1: "1A" });
});

test("visibleQuestions includes every question with no dependsOn", () => {
  const visible = visibleQuestions(FAKE_QUESTIONS, {});
  assert.strictEqual(visible.length, 3);
});

test("visibleQuestions excludes a dependent question when its trigger answer isn't recorded", () => {
  const visible = visibleQuestions(BRANCHING_QUESTIONS, { 2: "2A" });
  assert.deepStrictEqual(visible.map((q) => q.id), [1, 2, 3]);
});

test("visibleQuestions includes a dependent question when its trigger answer is recorded", () => {
  const visible = visibleQuestions(BRANCHING_QUESTIONS, { 2: "2B" });
  assert.deepStrictEqual(visible.map((q) => q.id), [1, 2, 2.5, 3]);
});

test("advance increments index but never past the visible total", () => {
  let state = createInitialState(FAKE_QUESTIONS);
  state = advance(advance(advance(advance(state, FAKE_QUESTIONS), FAKE_QUESTIONS), FAKE_QUESTIONS), FAKE_QUESTIONS);
  assert.strictEqual(state.index, 3);
});

test("advance respects a shorter visible total when a branch is skipped", () => {
  let state = createInitialState(BRANCHING_QUESTIONS);
  state = recordAnswer(state, 2, "2A");
  state = advance(state, BRANCHING_QUESTIONS);
  state = advance(state, BRANCHING_QUESTIONS);
  state = advance(state, BRANCHING_QUESTIONS);
  state = advance(state, BRANCHING_QUESTIONS);
  assert.strictEqual(state.index, 3);
});

test("advance allows a longer visible total when a branch is taken", () => {
  let state = createInitialState(BRANCHING_QUESTIONS);
  state = recordAnswer(state, 2, "2B");
  state = advance(state, BRANCHING_QUESTIONS);
  state = advance(state, BRANCHING_QUESTIONS);
  state = advance(state, BRANCHING_QUESTIONS);
  state = advance(state, BRANCHING_QUESTIONS);
  state = advance(state, BRANCHING_QUESTIONS);
  assert.strictEqual(state.index, 4);
});

test("isComplete is true once index reaches the visible total", () => {
  let state = createInitialState(FAKE_QUESTIONS);
  assert.strictEqual(isComplete(state, FAKE_QUESTIONS), false);
  state = advance(advance(advance(state, FAKE_QUESTIONS), FAKE_QUESTIONS), FAKE_QUESTIONS);
  assert.strictEqual(isComplete(state, FAKE_QUESTIONS), true);
});

test("isComplete accounts for a skipped branch (shorter path)", () => {
  let state = createInitialState(BRANCHING_QUESTIONS);
  state = recordAnswer(state, 2, "2A");
  state = advance(state, BRANCHING_QUESTIONS);
  state = advance(state, BRANCHING_QUESTIONS);
  state = advance(state, BRANCHING_QUESTIONS);
  assert.strictEqual(isComplete(state, BRANCHING_QUESTIONS), true);
});

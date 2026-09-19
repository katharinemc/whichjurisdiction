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

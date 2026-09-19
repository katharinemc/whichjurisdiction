(function (global) {
  function visibleQuestions(questions, answers) {
    return questions.filter(function (question) {
      if (!question.dependsOn) return true;
      return answers[question.dependsOn.questionId] === question.dependsOn.choiceId;
    });
  }

  function createInitialState() {
    return { index: 0, answers: {} };
  }

  function recordAnswer(state, questionId, choiceId) {
    var answers = Object.assign({}, state.answers);
    answers[questionId] = choiceId;
    return Object.assign({}, state, { answers: answers });
  }

  function advance(state, questions) {
    var total = visibleQuestions(questions, state.answers).length;
    return Object.assign({}, state, { index: Math.min(state.index + 1, total) });
  }

  function isComplete(state, questions) {
    return state.index >= visibleQuestions(questions, state.answers).length;
  }

  var api = {
    createInitialState: createInitialState,
    recordAnswer: recordAnswer,
    advance: advance,
    isComplete: isComplete,
    visibleQuestions: visibleQuestions
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.QuizState = api;
  }
})(typeof window !== "undefined" ? window : globalThis);

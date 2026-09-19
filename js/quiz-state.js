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

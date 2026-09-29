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

  function back(state, questions) {
    if (state.index <= 0) return state;

    var newIndex = state.index - 1;
    var keepIds = visibleQuestions(questions, state.answers)
      .slice(0, newIndex + 1)
      .map(function (question) { return question.id; });

    var answers = {};
    keepIds.forEach(function (id) {
      if (state.answers[id] !== undefined) answers[id] = state.answers[id];
    });

    return Object.assign({}, state, { index: newIndex, answers: answers });
  }

  var api = {
    createInitialState: createInitialState,
    recordAnswer: recordAnswer,
    advance: advance,
    isComplete: isComplete,
    visibleQuestions: visibleQuestions,
    back: back
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.QuizState = api;
  }
})(typeof window !== "undefined" ? window : globalThis);

(function () {
  if (typeof document === "undefined") return;

  var STORAGE_KEY = "jurisdictionQuizAnswers";
  // Must match js/analytics.js's FLAG_KEY.
  var ANALYTICS_FLAG_KEY = "jurisdictionQuizAnalyticsSent";
  var questions = window.QuizData.QUESTIONS;
  var state = window.QuizState.createInitialState();

  var stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    var storedAnswers = JSON.parse(stored);
    var restoredState = window.QuizState.createInitialState();
    Object.keys(storedAnswers).forEach(function (questionId) {
      restoredState = window.QuizState.recordAnswer(restoredState, Number(questionId), storedAnswers[questionId]);
    });
    restoredState.index = Object.keys(storedAnswers).length;

    if (window.QuizState.isComplete(restoredState, questions)) {
      // A previously completed quiz is still in storage — landing on this
      // page again (e.g. "Take it again") means starting over, not resuming.
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(ANALYTICS_FLAG_KEY);
    } else {
      state = restoredState;
    }
  }

  var progressBar = document.getElementById("progress-bar");
  var questionContainer = document.getElementById("question-container");

  function render() {
    if (window.QuizState.isComplete(state, questions)) {
      window.location.href = "results.html";
      return;
    }

    var visible = window.QuizState.visibleQuestions(questions, state.answers);
    var question = visible[state.index];
    progressBar.style.width = Math.round((state.index / visible.length) * 100) + "%";

    questionContainer.innerHTML = "";

    var promptEl = document.createElement("h2");
    promptEl.className = "question-prompt";
    promptEl.textContent = question.prompt;
    questionContainer.appendChild(promptEl);

    var choiceList = document.createElement("div");
    choiceList.className = "choice-list";

    question.choices.forEach(function (choice) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "choice-button";
      button.textContent = choice.label;
      button.addEventListener("click", function () {
        selectChoice(question.id, choice.id);
      });
      choiceList.appendChild(button);
    });

    questionContainer.appendChild(choiceList);
  }

  function selectChoice(questionId, choiceId) {
    state = window.QuizState.recordAnswer(state, questionId, choiceId);
    state = window.QuizState.advance(state, questions);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.answers));
    render();
  }

  render();
})();

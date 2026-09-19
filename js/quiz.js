(function () {
  if (typeof document === "undefined") return;

  var STORAGE_KEY = "jurisdictionQuizAnswers";
  var questions = window.QuizData.QUESTIONS;
  var state = window.QuizState.createInitialState();

  var stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    var storedAnswers = JSON.parse(stored);
    Object.keys(storedAnswers).forEach(function (questionId) {
      state = window.QuizState.recordAnswer(state, Number(questionId), storedAnswers[questionId]);
    });
    state.index = Object.keys(storedAnswers).length;
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

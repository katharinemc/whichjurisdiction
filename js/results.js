(function () {
  if (typeof document === "undefined") return;

  var STORAGE_KEY = "jurisdictionQuizAnswers";
  var stored = sessionStorage.getItem(STORAGE_KEY);

  if (!stored) {
    window.location.href = "quiz.html";
    return;
  }

  var rawAnswers = JSON.parse(stored);
  var answers = {};
  Object.keys(rawAnswers).forEach(function (questionId) {
    answers[Number(questionId)] = rawAnswers[questionId];
  });

  var questions = window.QuizData.QUESTIONS;
  var jurisdictions = window.JurisdictionData.JURISDICTIONS;

  var scored = window.Scoring.scoreQuiz(answers, questions);
  var view = window.ResultsView.deriveResultsView(scored.percentages, window.Scoring.JURISDICTION_KEYS);

  var winnersEl = document.getElementById("results-winners");
  var leaningEl = document.getElementById("results-leaning");

  winnersEl.innerHTML = "";
  view.winners.forEach(function (entry) {
    var jurisdiction = jurisdictions[entry.key];

    var card = document.createElement("div");
    card.className = "result-card settle-fade";

    var name = document.createElement("h1");
    name.className = "result-name";
    name.textContent = jurisdiction.name;
    card.appendChild(name);

    jurisdiction.writeup.forEach(function (paragraph) {
      var p = document.createElement("p");
      p.className = "result-paragraph";
      p.innerHTML = paragraph;
      card.appendChild(p);
    });

    winnersEl.appendChild(card);
  });

  leaningEl.innerHTML = "";
  if (view.leaning.length > 0) {
    var divider = document.createElement("div");
    divider.className = "cross-divider";
    divider.innerHTML =
      '<span class="cross-bar cross-bar-top"></span>' +
      '<span class="cross-bar cross-bar-mid"></span>' +
      '<span class="cross-bar cross-bar-bottom"></span>';
    leaningEl.appendChild(divider);

    var heading = document.createElement("h3");
    heading.className = "leaning-heading";
    heading.textContent = "Leaning";
    leaningEl.appendChild(heading);

    var list = document.createElement("ul");
    list.className = "bar-list";

    view.leaning.forEach(function (entry) {
      var jurisdiction = jurisdictions[entry.key];
      var item = document.createElement("li");
      item.className = "bar-row";

      var label = document.createElement("span");
      label.className = "bar-label";
      label.textContent = jurisdiction.name + " " + entry.percentage + "%";
      item.appendChild(label);

      var track = document.createElement("span");
      track.className = "bar-track";
      var fill = document.createElement("span");
      fill.className = "bar-fill";
      fill.style.width = entry.percentage + "%";
      track.appendChild(fill);
      item.appendChild(track);

      list.appendChild(item);
    });

    leaningEl.appendChild(list);
  }

  if (window.QuizAnalytics) {
    var resultKeys = view.winners.map(function (entry) { return entry.key; });
    window.QuizAnalytics.reportResults(resultKeys);
  }
})();

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

  var carousel = document.getElementById("result-carousel");
  var dotsEl = document.getElementById("carousel-dots");

  carousel.innerHTML = "";
  dotsEl.innerHTML = "";

  view.winners.forEach(function (entry) {
    var jurisdiction = jurisdictions[entry.key];

    var card = document.createElement("div");
    card.className = "result-card settle-fade";

    var name = document.createElement("h1");
    name.className = "result-name";
    name.textContent = jurisdiction.name;
    card.appendChild(name);

    var percentage = document.createElement("p");
    percentage.className = "result-percentage";
    percentage.textContent = entry.percentage + "%";
    card.appendChild(percentage);

    jurisdiction.writeup.forEach(function (paragraph) {
      var p = document.createElement("p");
      p.className = "result-paragraph";
      p.innerHTML = paragraph;
      card.appendChild(p);
    });

    carousel.appendChild(card);
  });

  if (view.winners.length > 1) {
    view.winners.forEach(function (entry, index) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot" + (index === 0 ? " active" : "");
      dot.setAttribute("aria-label", "Show result " + (index + 1) + " of " + view.winners.length);
      dot.addEventListener("click", function () {
        carousel.scrollTo({ left: index * carousel.clientWidth, behavior: "smooth" });
      });
      dotsEl.appendChild(dot);
    });

    carousel.addEventListener("scroll", function () {
      var activeIndex = Math.round(carousel.scrollLeft / carousel.clientWidth);
      var dots = dotsEl.querySelectorAll(".carousel-dot");
      dots.forEach(function (dot, index) {
        dot.classList.toggle("active", index === activeIndex);
      });
    });
  }

  if (window.QuizAnalytics) {
    var resultKeys = view.winners.map(function (entry) { return entry.key; });
    window.QuizAnalytics.reportResults(resultKeys);
  }
})();

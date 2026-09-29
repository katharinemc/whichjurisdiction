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

    var bodyContainer = document.createElement("div");
    bodyContainer.className = "result-body";

    function renderBody(paragraphs) {
      bodyContainer.innerHTML = "";
      paragraphs.forEach(function (paragraph) {
        var p = document.createElement("p");
        p.className = "result-paragraph";
        p.innerHTML = paragraph;
        bodyContainer.appendChild(p);
      });
    }

    if (jurisdiction.writeupVariants) {
      var variantOptions = [
        { key: "convert", label: "Convert" },
        { key: "cradle", label: "Cradle" }
      ];
      var activeVariant = "convert";
      var toggle = document.createElement("div");
      toggle.className = "writeup-toggle";

      var variantButtons = variantOptions.map(function (variant) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "writeup-toggle-btn";
        button.textContent = variant.label;
        button.setAttribute("aria-pressed", String(variant.key === activeVariant));
        button.addEventListener("click", function () {
          if (variant.key === activeVariant) return;
          activeVariant = variant.key;
          variantButtons.forEach(function (variantButton) {
            variantButton.button.setAttribute("aria-pressed", String(variantButton.key === activeVariant));
          });
          renderBody(jurisdiction.writeupVariants[activeVariant]);
        });
        toggle.appendChild(button);
        return { key: variant.key, button: button };
      });

      card.appendChild(toggle);
      renderBody(jurisdiction.writeupVariants[activeVariant]);
    } else {
      renderBody(jurisdiction.writeup);
    }

    card.appendChild(bodyContainer);
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

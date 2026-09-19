(function (global) {
  var JURISDICTION_KEYS = ["GOA", "Antiochian", "OCA", "ROCOR", "Jerusalem", "HOCNA"];

  function scoreQuiz(answers, questions) {
    var totals = {};
    JURISDICTION_KEYS.forEach(function (key) { totals[key] = 0; });

    questions.forEach(function (question) {
      var chosenId = answers[question.id];
      if (!chosenId) return;
      var choice = question.choices.find(function (c) { return c.id === chosenId; });
      if (!choice) return;
      JURISDICTION_KEYS.forEach(function (key) {
        totals[key] += choice.points[key] || 0;
      });
    });

    var grandTotal = JURISDICTION_KEYS.reduce(function (sum, key) { return sum + totals[key]; }, 0);

    var percentages = {};
    JURISDICTION_KEYS.forEach(function (key) {
      percentages[key] = grandTotal === 0 ? 0 : Math.round((totals[key] / grandTotal) * 1000) / 10;
    });

    return { totals: totals, percentages: percentages, grandTotal: grandTotal };
  }

  var api = { scoreQuiz: scoreQuiz, JURISDICTION_KEYS: JURISDICTION_KEYS };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.Scoring = api;
  }
})(typeof window !== "undefined" ? window : globalThis);

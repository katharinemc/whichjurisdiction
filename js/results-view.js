(function (global) {
  var MAJORITY_THRESHOLD = 51;

  function deriveResultsView(percentages, jurisdictionKeys) {
    var ranked = jurisdictionKeys
      .map(function (key) { return { key: key, percentage: percentages[key] }; })
      .sort(function (a, b) { return b.percentage - a.percentage; });

    var winners = [];
    var cumulative = 0;
    for (var i = 0; i < ranked.length && cumulative < MAJORITY_THRESHOLD; i++) {
      winners.push(ranked[i]);
      cumulative += ranked[i].percentage;
    }

    return { winners: winners };
  }

  var api = {
    deriveResultsView: deriveResultsView,
    MAJORITY_THRESHOLD: MAJORITY_THRESHOLD
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.ResultsView = api;
  }
})(typeof window !== "undefined" ? window : globalThis);

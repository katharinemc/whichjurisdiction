(function (global) {
  var SPLIT_THRESHOLD = 5;
  var LEANING_THRESHOLD = 10;

  function deriveResultsView(percentages, jurisdictionKeys) {
    var ranked = jurisdictionKeys
      .map(function (key) { return { key: key, percentage: percentages[key] }; })
      .sort(function (a, b) { return b.percentage - a.percentage; });

    var top = ranked[0];
    var second = ranked[1];

    var winners;
    var rest;
    if (second && (top.percentage - second.percentage) <= SPLIT_THRESHOLD) {
      winners = [top, second];
      rest = ranked.slice(2);
    } else {
      winners = [top];
      rest = ranked.slice(1);
    }

    var leaning = rest.filter(function (entry) { return entry.percentage >= LEANING_THRESHOLD; });

    return { winners: winners, leaning: leaning };
  }

  var api = {
    deriveResultsView: deriveResultsView,
    SPLIT_THRESHOLD: SPLIT_THRESHOLD,
    LEANING_THRESHOLD: LEANING_THRESHOLD
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.ResultsView = api;
  }
})(typeof window !== "undefined" ? window : globalThis);

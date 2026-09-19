(function (global) {
  var FLAG_KEY = "jurisdictionQuizAnalyticsSent";
  // Placeholder — replace with the deployed worker's URL (see worker/README.md, Task 13).
  var ANALYTICS_ENDPOINT = "https://analytics.your-domain-here.com";

  function reportResults(resultKeys) {
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem(FLAG_KEY)) return;
    sessionStorage.setItem(FLAG_KEY, "1");

    resultKeys.forEach(function (key) {
      fetch(ANALYTICS_ENDPOINT + "/count?result=" + encodeURIComponent(key), {
        method: "POST",
        mode: "cors"
      }).catch(function () {});
    });
  }

  global.QuizAnalytics = { reportResults: reportResults, ANALYTICS_ENDPOINT: ANALYTICS_ENDPOINT };
})(typeof window !== "undefined" ? window : globalThis);

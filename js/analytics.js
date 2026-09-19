(function (global) {
  var FLAG_KEY = "jurisdictionQuizAnalyticsSent";
  // Requires the worker (worker/) to be deployed and routed to this subdomain
  // first — see worker/README.md. Until then, this fetch will just fail
  // silently (caught below), which is harmless but means no counts land.
  var ANALYTICS_ENDPOINT = "https://analytics.whichjurisdiction.com";

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

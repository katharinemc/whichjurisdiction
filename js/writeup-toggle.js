(function () {
  if (typeof document === "undefined") return;

  document.querySelectorAll(".writeup-toggle").forEach(function (toggle) {
    var buttons = toggle.querySelectorAll(".writeup-toggle-btn");
    var sections = toggle.parentElement.querySelectorAll("[data-writeup-variant]");

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        var variant = button.getAttribute("data-variant");

        buttons.forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === button));
        });
        sections.forEach(function (section) {
          section.hidden = section.getAttribute("data-writeup-variant") !== variant;
        });
      });
    });
  });
})();

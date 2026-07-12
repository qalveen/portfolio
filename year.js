/* year.js — shared site script (footer year + theme toggle). */

/* 1) Footer year */
document.querySelectorAll(".year").forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

/* 2) Theme toggle: cycles Auto -> Light -> Dark -> Auto and remembers the choice.
      "auto" leaves the <html data-theme> attribute off so the CSS media query
      (the browser's own preference) decides.                                   */
(function () {
  var btn = document.getElementById("themeToggle");
  if (!btn) return;

  var order  = ["auto", "light", "dark"];
  var labels = { auto: "Auto", light: "Light", dark: "Dark" };
  var icons  = { auto: "\u25D0", light: "\u2600", dark: "\u263E" }; // ◐ ☀ ☾
  var iconEl = btn.querySelector(".theme-toggle__icon");
  var textEl = btn.querySelector(".theme-toggle__text");

  function current() { return localStorage.getItem("theme") || "auto"; }

  function apply(mode) {
    if (mode === "light" || mode === "dark") {
      document.documentElement.setAttribute("data-theme", mode);
    } else {
      document.documentElement.removeAttribute("data-theme"); // auto
    }
    localStorage.setItem("theme", mode);
    render(mode);
  }

  function render(mode) {
    iconEl.textContent = icons[mode];
    textEl.textContent = labels[mode];
    btn.setAttribute("aria-label", "Theme: " + labels[mode] + " (click to change)");
    btn.setAttribute("title", "Theme: " + labels[mode]);
  }

  btn.addEventListener("click", function () {
    apply(order[(order.indexOf(current()) + 1) % order.length]);
  });

  render(current());
})();

/* 3) Portfolio tabs: switches between Projects / Certificates / Tech Stack panels. */
(function () {
  var tabs = document.querySelectorAll(".tab");
  if (!tabs.length) return;

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var target = tab.getAttribute("data-tab");

      tabs.forEach(function (t) {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      document.querySelectorAll(".tab-panel").forEach(function (panel) {
        var isTarget = panel.id === "tab-" + target;
        panel.classList.toggle("active", isTarget);
        panel.hidden = !isTarget;
      });
    });
  });
})();

// Fills every <span class="year"></span> with the current year.
// Shared across all pages so you only maintain it in one place.
document.querySelectorAll(".year").forEach(function (el) {
  el.textContent = new Date().getFullYear();
});
// Fills every <span class="year"></span> with the current year.
document.querySelectorAll(".year").forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

(() => {
  "use strict";

  const grid = document.getElementById("events-grid");
  if (!grid) return;

  const filterButtons = [...document.querySelectorAll(".filter-btn")];

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      // Karty se doplňují po načtení dat (render-public.js), proto je hledáme až při kliknutí.
      grid.querySelectorAll(".event-card").forEach((item) => {
        const show = filter === "all" || item.dataset.filterType === filter;
        item.classList.toggle("is-hidden", !show);
      });
    });
  });
})();

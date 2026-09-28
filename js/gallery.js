/*
  Veřejná galerie: fotky se berou z VTStore (tabulka vik_gallery, upravuje se
  v admin.html) a vykreslí se po načtení dat. Lightbox listuje všemi fotkami.
*/
(() => {
  "use strict";

  const grid = document.getElementById("gallery-grid");
  if (!grid || !window.VTStore) return;

  const lightbox = document.getElementById("lightbox");
  const lightboxMedia = document.getElementById("lightbox-media");
  const closeBtn = document.getElementById("lightbox-close");
  const prevBtn = document.getElementById("lightbox-prev");
  const nextBtn = document.getElementById("lightbox-next");

  let photos = [];
  let currentIndex = 0;

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function openLightbox(index) {
    if (!photos.length) return;
    currentIndex = (index + photos.length) % photos.length;
    const p = photos[currentIndex];
    lightboxMedia.innerHTML =
      `<img src="${escapeHtml(p.photo)}" alt="${escapeHtml(p.caption || "")}">` +
      `<div class="lightbox-caption">${escapeHtml(p.caption || "")}</div>`;
    lightbox.classList.add("open");
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
  }

  function render() {
    photos = VTStore.galerie.all().filter((g) => g.published !== false && g.photo);
    document.getElementById("gallery-empty").hidden = photos.length > 0;
    grid.innerHTML = photos.map((p, i) => `
      <button class="gallery-item" type="button" data-index="${i}" aria-label="${escapeHtml(p.caption || "Zvětšit fotku")}">
        <img src="${escapeHtml(p.photo)}" alt="${escapeHtml(p.caption || "")}" loading="lazy">
      </button>
    `).join("");
  }

  grid.addEventListener("click", (e) => {
    const item = e.target.closest(".gallery-item");
    if (item) openLightbox(Number(item.dataset.index));
  });

  closeBtn.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  prevBtn.addEventListener("click", () => openLightbox(currentIndex - 1));
  nextBtn.addEventListener("click", () => openLightbox(currentIndex + 1));

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") openLightbox(currentIndex - 1);
    if (e.key === "ArrowRight") openLightbox(currentIndex + 1);
  });

  VTStore.ready.then(render);
})();

/*
  VFRESH DC one-page: menu, aktuality a galerie z VTStore, lightbox,
  tlačítka „Přihlásit se" u crew a odeslání přihlášky.
  Rozvrh, styly, benefity a texty jsou přímo v index.html.
*/
(() => {
  "use strict";

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  // ------------------------------------------------------------- menu --
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }));
  }

  // Odkaz na druhý web (hlavní web SK Viktoria) z VTStore.siteUrls.
  if (window.VTStore) {
    document.querySelectorAll("[data-vt-site-link]").forEach((link) => {
      const url = VTStore.siteUrls && VTStore.siteUrls[link.dataset.vtSiteLink];
      if (url) link.href = url;
    });
  }

  // ------------------------------------------- zkušební lekce u crew --
  const form = document.getElementById("contact-form");
  const category = document.getElementById("f-category");
  document.querySelectorAll(".crew-cta[data-crew]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (category) category.value = btn.dataset.crew;
      const target = document.getElementById("prihlaska");
      if (target) target.scrollIntoView({ behavior: "smooth" });
      if (form) {
        form.classList.add("is-highlight");
        setTimeout(() => form.classList.remove("is-highlight"), 1600);
        const name = document.getElementById("f-name");
        if (name) setTimeout(() => name.focus({ preventScroll: true }), 500);
      }
    });
  });

  // ------------------------------------------------------ přihláška --
  const note = document.getElementById("form-note");
  if (form && note) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = form.name.value.trim();
      const cat = form.category.value;
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      const consent = !!(form.consent && form.consent.checked);

      if (!name || !email || !message) {
        note.textContent = "Vyplň prosím jméno, e-mail a zprávu.";
        note.style.color = "#ff6b5b";
        return;
      }
      if (!consent) {
        note.textContent = "Pro odeslání potvrď prosím souhlas se zpracováním osobních údajů.";
        note.style.color = "#ff6b5b";
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      // Přihláška se uloží do databáze (označená webem vfresh). Když se to
      // nepovede, otevře se e-mail, aby o dotaz nikdo nepřišel.
      let saved = false;
      if (window.VTStore) {
        try {
          await VTStore.submissions.add({ name, email, category: cat, message, status: "new", consent: true });
          saved = true;
        } catch (e) {
          console.warn("Přihlášku se nepodařilo uložit do databáze.", e);
        }
      }

      if (submitBtn) submitBtn.disabled = false;
      if (saved) {
        note.textContent = "Díky, přihláška dorazila. Ozveme se co nejdřív!";
        note.style.color = "var(--lime)";
        form.reset();
        return;
      }
      const subject = encodeURIComponent(`Přihláška z webu VFRESH DC: ${cat}`);
      const body = encodeURIComponent(`Jméno: ${name}\nCrew: ${cat}\nE-mail: ${email}\n\n${message}`);
      note.textContent = "Přihlášku se nepodařilo uložit, otevírá se e-mail s vyplněnou zprávou…";
      note.style.color = "var(--lime)";
      window.location.href = `mailto:lena.cimpova@seznam.cz?subject=${subject}&body=${body}`;
    });
  }

  if (!window.VTStore) return;

  // ------------------------------------------------------- lightbox --
  const lightbox = document.getElementById("lightbox");
  const lbMedia = document.getElementById("lightbox-media");
  let photos = [];
  let current = 0;

  function openLightbox(i) {
    if (!photos.length || !lightbox) return;
    current = (i + photos.length) % photos.length;
    const p = photos[current];
    lbMedia.innerHTML = `<img src="${escapeHtml(p.photo)}" alt="${escapeHtml(p.caption || "")}">` +
      (p.caption ? `<figcaption>${escapeHtml(p.caption)}</figcaption>` : "");
    lightbox.classList.add("open");
  }
  function closeLightbox() { lightbox.classList.remove("open"); }

  if (lightbox) {
    document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
    document.getElementById("lightbox-prev").addEventListener("click", () => openLightbox(current - 1));
    document.getElementById("lightbox-next").addEventListener("click", () => openLightbox(current + 1));
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") openLightbox(current - 1);
      if (e.key === "ArrowRight") openLightbox(current + 1);
    });
  }

  // ------------------------------------------- data z VTStore (admin) --
  function render() {
    // Aktuality webu vfresh (+ both): úzký pruh pod běžícím pásem.
    const newsSection = document.getElementById("aktuality");
    const newsList = document.getElementById("news-list");
    const news = VTStore.aktuality.all();
    if (newsSection && newsList) {
      newsSection.hidden = news.length === 0;
      newsList.innerHTML = news.map((n) => `
        <div class="news-item">
          <span class="mono">// ${escapeHtml(n.date || "AKTUÁLNĚ")}</span>
          <p>${escapeHtml(n.text)}</p>
        </div>`).join("");
    }

    // Galerie: pás fotek, všechny se dají proklikat v lightboxu.
    const strip = document.getElementById("gallery-strip");
    const gallery = document.getElementById("galerie");
    photos = VTStore.galerie.all().filter((g) => g.published !== false && g.photo);
    if (gallery) gallery.hidden = photos.length === 0;
    if (strip) {
      const shown = photos.slice(0, 6);
      strip.style.setProperty("--cols", Math.max(1, Math.min(shown.length, 6)));
      strip.innerHTML = shown.map((p, i) => `
        <button class="gallery-item" type="button" data-index="${i}" aria-label="${escapeHtml(p.caption || "Zvětšit fotku")}">
          <img src="${escapeHtml(p.photo)}" alt="${escapeHtml(p.caption || "")}" loading="lazy">
        </button>`).join("");
      strip.addEventListener("click", (e) => {
        const item = e.target.closest(".gallery-item");
        if (item) openLightbox(Number(item.dataset.index));
      });
    }
  }

  VTStore.ready.then(render);
})();

/*
  VFRESH DC one-page: menu, aktuality a galerie z VTStore, lightbox,
  karty crew v Rozvrhu z VTStore (kurzy aktivit s kategorií VFRESH DC),
  tlačítka „Přihlásit se" u crew a odeslání přihlášky.
  Styly, benefity a texty jsou přímo v index.html. Detail kurzu: kurz.html.
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
  // Předvyplní crew ve formuláři (přidá volbu, kdyby v seznamu chyběla).
  function selectCrew(label) {
    if (!category || !label) return;
    if (![...category.options].some((o) => o.value === label)) {
      const opt = document.createElement("option");
      opt.value = label; opt.textContent = label;
      const other = [...category.options].find((o) => o.value === "Jiné");
      category.insertBefore(opt, other || null);
    }
    category.value = label;
  }
  function goToForm(label, smooth) {
    selectCrew(label);
    const target = document.getElementById("prihlaska");
    if (target) target.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    if (form) {
      form.classList.add("is-highlight");
      setTimeout(() => form.classList.remove("is-highlight"), 1600);
      const name = document.getElementById("f-name");
      if (name) setTimeout(() => name.focus({ preventScroll: true }), 500);
    }
  }
  // Karty crew se vykreslují dynamicky, proto delegace kliknutí.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".crew-cta[data-crew]");
    if (btn) goToForm(btn.dataset.crew, true);
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

  // ------------------------------------------------- karty crew --
  const DAY_SHORT = { 1: "Po", 2: "Út", 3: "St", 4: "Čt", 5: "Pá", 6: "So", 7: "Ne" };
  function crewLabel(g) { return g.ageLabel ? `${g.name} (${g.ageLabel})` : g.name; }
  function slotLine(slots) {
    return slots.map((s) => `${DAY_SHORT[s.weekday] || ""} ${s.endTime ? `${s.startTime}–${s.endTime}` : s.startTime}`).join(" · ");
  }
  // Místa mimo taneční centrum v CUT (např. ZŠ Helsinská) se píšou na kartu.
  function otherPlaces(slots) {
    const names = new Set();
    slots.forEach((s) => {
      const p = s.placeId ? VTStore.mista.get(s.placeId) : null;
      if (p && p.slug !== "cut") names.add(p.shortName || p.name);
    });
    return [...names];
  }

  function renderCrews() {
    const grid = document.getElementById("crew-grid");
    const courses = VTStore.coursesOfProgram("vfresh", true);
    if (!grid || !courses.length) return; // bez dat zůstane záložní obsah z HTML
    const note = grid.querySelector(".crew-note");
    grid.innerHTML = courses.map((g, i) => {
      const slots = VTStore.slotsOf(g.id, true);
      const info = [
        slots.length ? slotLine(slots) : "Termín upřesníme",
        g.trialLesson ? (g.trialNote ? `Zkušební: ${g.trialNote}` : "Zkušební po domluvě") : "",
        ...otherPlaces(slots).map((p) => `· ${p}`),
        g.shortDescription ? `· ${g.shortDescription}` : "",
      ].filter(Boolean);
      return `
        <article class="crew">
          <div class="crew-top"><span class="mono dim">${String(i + 1).padStart(2, "0")}</span>${g.badge ? `<span class="crew-tag">${escapeHtml(g.badge)}</span>` : ""}</div>
          <h3><a href="${escapeHtml(VTStore.courseHref(g))}">${escapeHtml(g.name)}</a></h3>
          ${g.ageLabel ? `<span class="crew-age">${escapeHtml(g.ageLabel)}</span>` : ""}
          <div class="crew-info">${info.map((t) => `<span>${escapeHtml(t)}</span>`).join("")}</div>
          <div class="crew-actions">
            <a class="btn btn-outline" href="${escapeHtml(VTStore.courseHref(g))}">Detail →</a>
            <button class="btn btn-outline crew-cta" type="button" data-crew="${escapeHtml(crewLabel(g))}">Přihlásit se →</button>
          </div>
        </article>`;
    }).join("");
    if (note) grid.appendChild(note);

    // Nabídka crew ve formuláři podle aktuálních kurzů.
    if (category) {
      const current = category.value;
      category.innerHTML = courses.map((g) => `<option value="${escapeHtml(crewLabel(g))}">${escapeHtml(crewLabel(g))}</option>`).join("")
        + '<option value="Jiné">Jiný dotaz</option>';
      if ([...category.options].some((o) => o.value === current)) category.value = current;
    }
  }

  // ?crew=… (odkaz z detailu kurzu) předvyplní formulář a sjede k němu.
  function crewFromUrl() {
    const crew = new URLSearchParams(window.location.search).get("crew");
    if (crew) goToForm(crew, false);
  }

  // ------------------------------------------- data z VTStore (admin) --
  function render() {
    renderCrews();
    crewFromUrl();

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

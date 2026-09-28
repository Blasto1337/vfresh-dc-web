/*
  Renders kroužky/akce/aktuality/galerie/rozvrh onto the public pages from VTStore.
  Every item lives in the Supabase database (edited through admin.html) and is
  rendered from VTStore once VTStore.ready resolves; there is no separate
  hand-written HTML fallback for these grids/lists.
*/
(() => {
  "use strict";

  if (!window.VTStore) return;

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function render() {
    // --- Aktuality -----------------------------------------------------
    // Nejnovější aktualita je velká karta s výzvou, ostatní jsou kompaktní řádky.
    const alertsList = document.getElementById("alerts-list");
    if (alertsList) {
      const bellIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>';
      const items = VTStore.aktuality.all();
      const newsSection = document.getElementById("aktuality");
      if (newsSection) newsSection.hidden = items.length === 0;

      if (items.length) {
        const [first, ...rest] = items;
        alertsList.appendChild(el(`
          <article class="alert-item is-featured" data-vt-id="${first.id}">
            ${first.photo ? `<img class="alert-photo" src="${escapeHtml(first.photo)}" alt="" loading="lazy">` : ""}
            <div class="alert-body">
              <span class="alert-flag">Nejnovější</span>
              <div class="alert-date">${escapeHtml(first.date)}</div>
              <p>${escapeHtml(first.text)}</p>
              <a class="btn btn-hero" href="#kontakt">Napsat nám</a>
            </div>
          </article>
        `));
        if (rest.length) {
          const restBox = el('<div class="alert-rest"></div>');
          rest.forEach((item) => {
            const iconHtml = item.photo
              ? `<img src="${escapeHtml(item.photo)}" alt="" loading="lazy">`
              : bellIcon;
            restBox.appendChild(el(`
              <div class="alert-item" data-vt-id="${item.id}">
                <span class="alert-icon" aria-hidden="true">${iconHtml}</span>
                <div>
                  <div class="alert-date">${escapeHtml(item.date)}</div>
                  <p>${escapeHtml(item.text)}</p>
                </div>
              </div>
            `));
          });
          alertsList.appendChild(restBox);
        } else {
          alertsList.classList.add("is-single");
        }
      }
    }

    // --- Akce (events) ---------------------------------------------------
    function akceHref(item) {
      return item.detailHref || `akce-detail.html?id=${encodeURIComponent(item.id)}`;
    }

    function eventCardHtml(item, withDescription) {
      const tagClass = `tag-${item.color || "teal"}`;
      const media = item.photo
        ? `<img src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.title)}" loading="lazy">`
        : `<div class="ph" aria-hidden="true"><span>foto</span></div>`;
      return `
        <a class="event-card event-accent-${escapeHtml(item.color || "teal")}" href="${akceHref(item)}" data-filter-type="${escapeHtml(item.category || "nabor")}" data-vt-id="${item.id}">
          ${media}
          <div class="event-body">
            <div class="event-meta"><span class="tag ${tagClass}">${escapeHtml(item.tag || "AKCE")}</span><time>${escapeHtml(item.date)}</time></div>
            <h3>${escapeHtml(item.title)}</h3>
            ${withDescription && item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
          </div>
        </a>
      `;
    }

    // homepage: náhled akce rovnou s plným detailem (foto, popis/kroky, místo, CTA na přihlášku) -- žádná prokliková stránka
    function eventDetailCardHtml(item) {
      const tagClass = `tag-${item.color || "teal"}`;
      const media = item.photo
        ? `<img src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.title)}" loading="lazy">`
        : `<div class="ph" aria-hidden="true"><span>foto</span></div>`;
      const bullets = Array.isArray(item.bullets) ? item.bullets.filter(Boolean) : [];
      const detailHtml = bullets.length
        ? `<ul class="event-detail-list">${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
        : item.description
          ? `<p>${escapeHtml(item.description)}</p>`
          : "";
      const locationHtml = item.location
        ? `<span class="event-location"><span class="event-detail-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg></span>${escapeHtml(item.location)}</span>`
        : "";
      return `
        <article class="event-card event-accent-${escapeHtml(item.color || "teal")}" data-vt-id="${item.id}">
          ${media}
          <div class="event-body">
            <div class="event-meta"><span class="tag ${tagClass}">${escapeHtml(item.tag || "AKCE")}</span><time>${escapeHtml(item.date)}</time>${locationHtml}</div>
            <h3>${escapeHtml(item.title)}</h3>
            ${detailHtml}
            <a class="btn btn-hero event-cta" href="#kontakt">Přihlásit se →</a>
          </div>
        </article>
      `;
    }

    const eventsPreview = document.getElementById("events-grid-preview");
    if (eventsPreview) {
      VTStore.akce.all().filter((item) => item.featured).forEach((item) => {
        eventsPreview.appendChild(el(eventDetailCardHtml(item)));
      });
    }

    const eventsFull = document.getElementById("events-grid");
    if (eventsFull) {
      VTStore.akce.all().forEach((item) => {
        eventsFull.appendChild(el(eventCardHtml(item, true)));
      });
      // re-apply the current filter so newly injected cards obey it too
      const activeFilter = document.querySelector(".filter-btn.active");
      if (activeFilter && activeFilter.dataset.filter !== "all") {
        const filter = activeFilter.dataset.filter;
        eventsFull.querySelectorAll(".event-card").forEach((card) => {
          if (card.dataset.filterType !== filter) card.classList.add("is-hidden");
        });
      }
    }

    // --- Rozvrh (týden po dnech, barva podle programu) -----------------
    const ttWeek = document.getElementById("tt-week");
    if (ttWeek) {
      const DAYS = { 1: "Pondělí", 2: "Úterý", 3: "Středa", 4: "Čtvrtek", 5: "Pátek", 6: "Sobota", 7: "Neděle" };
      const slots = VTStore.rozvrh.all().filter((r) => r.published !== false);
      const hasWeekend = slots.some((r) => r.weekday > 5);
      const dayNumbers = hasWeekend ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4, 5];
      const today = new Date().getDay() || 7; // JS: neděle = 0, rozvrh: neděle = 7
      ttWeek.style.setProperty("--tt-cols", dayNumbers.length);
      ttWeek.innerHTML = dayNumbers.map((d) => {
        const list = slots.filter((r) => r.weekday === d);
        const items = list.length
          ? list.map((r) => {
              const group = ["vfresh", "zumba", "volnocas"].includes(r.program) ? r.program : "volnocas";
              return `<li class="tt-slot tt-${group}" data-group="${group}"><time>${escapeHtml(r.time)}</time><span class="tt-name">${escapeHtml(r.name)}</span>${r.note ? `<span class="tt-note">${escapeHtml(r.note)}</span>` : ""}</li>`;
            }).join("")
          : '<li class="tt-empty">bez tréninku</li>';
        return `<div class="tt-day${d === today ? " is-today" : ""}" data-dow="${d}"><h3 class="tt-dayname">${DAYS[d]}</h3><ul class="tt-slots">${items}</ul></div>`;
      }).join("");
      // filtr zvolený před dokončením načtení dat se použije i na nové řádky
      const activeFilter = document.querySelector(".tt-filter.active");
      if (activeFilter && activeFilter.dataset.ttFilter !== "all") {
        ttWeek.querySelectorAll(".tt-slot").forEach((slot) => {
          slot.classList.toggle("is-dim", slot.dataset.group !== activeFilter.dataset.ttFilter);
        });
      }
    }


    // --- Kroužky (courses) ------------------------------------------------
    function krouzekHref(item) {
      return item.detailHref || `kurz-detail.html?id=${encodeURIComponent(item.id)}`;
    }

    function courseCardHtml(item) {
      const iconSvg = window.vtIconSvg ? window.vtIconSvg(item.icon) : "";
      const hasPhoto = !!item.photo;
      const photoHtml = hasPhoto
        ? `<div class="course-photo"><img src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.name)}" loading="lazy"></div>`
        : "";
      const body = `
        <div${hasPhoto ? ' class="course-card-body"' : ""}>
          <div>
            <div class="course-icon" aria-hidden="true">${iconSvg}</div>
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.description || "")}</p>
            ${item.location ? `<div class="course-loc">📍 ${escapeHtml(item.location)}</div>` : ""}
          </div>
          <div class="course-foot">
            <span class="age-badge">${escapeHtml(item.age || "Novinka")}</span>
            <span class="course-arrow" aria-hidden="true">→</span>
          </div>
        </div>
      `;
      return `
        <a class="course-card course-${escapeHtml(item.color || "teal")}${hasPhoto ? " has-photo" : ""}" href="${krouzekHref(item)}" data-vt-id="${item.id}">
          ${photoHtml}${body}
        </a>
      `;
    }

    const coursesVfresh = document.getElementById("courses-grid-vfresh");
    if (coursesVfresh) {
      VTStore.krouzky.all().filter((item) => item.group === "vfresh").forEach((item) => {
        coursesVfresh.appendChild(el(courseCardHtml(item)));
      });
    }

    const coursesGrid = document.getElementById("courses-grid");
    if (coursesGrid) {
      VTStore.krouzky.all().filter((item) => (item.group || "volnocas") !== "vfresh").forEach((item) => {
        coursesGrid.appendChild(el(courseCardHtml(item)));
      });
    }

    const coursesPreviewVfresh = document.getElementById("courses-grid-preview-vfresh");
    if (coursesPreviewVfresh) {
      VTStore.krouzky.all().filter((item) => item.featured && item.group === "vfresh").forEach((item) => {
        coursesPreviewVfresh.appendChild(el(courseCardHtml(item)));
      });
    }

    const coursesPreviewVolnocas = document.getElementById("courses-grid-preview-volnocas");
    if (coursesPreviewVolnocas) {
      VTStore.krouzky.all().filter((item) => item.featured && (item.group || "volnocas") !== "vfresh").forEach((item) => {
        coursesPreviewVolnocas.appendChild(el(courseCardHtml(item)));
      });
    }

    // Contact form category dropdown — present only on the homepage, but
    // independent of which (if any) courses grid exists on this page.
    const categorySelect = document.getElementById("f-category");
    if (categorySelect) {
      const jineOption = [...categorySelect.options].find((o) => o.value === "Jiné");
      VTStore.krouzky.all().forEach((item) => {
        if (jineOption && [...categorySelect.options].some((o) => o.value === item.name)) return;
        const opt = document.createElement("option");
        opt.value = item.name;
        opt.textContent = `${item.name} (${item.age || "Novinka"})`;
        if (jineOption) categorySelect.insertBefore(opt, jineOption);
        else categorySelect.appendChild(opt);
      });

      const kurzname = new URLSearchParams(window.location.search).get("kurzname");
      if (kurzname) categorySelect.value = kurzname;
    }
  }

  // Data se načítají ze Supabase, vykreslujeme až po načtení.
  VTStore.ready.then(render);
})();

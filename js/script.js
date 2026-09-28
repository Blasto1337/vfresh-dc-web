(() => {
  "use strict";

  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Rozvrh: filtr podle programu (dny a řádky vykresluje render-public.js).
  const week = document.querySelector(".tt-week");
  if (week) {
    const filters = [...document.querySelectorAll(".tt-filter")];
    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        filters.forEach((b) => {
          b.classList.toggle("active", b === btn);
          b.setAttribute("aria-pressed", String(b === btn));
        });
        const group = btn.dataset.ttFilter;
        week.querySelectorAll(".tt-slot").forEach((slot) => {
          slot.classList.toggle("is-dim", group !== "all" && slot.dataset.group !== group);
        });
      });
    });
  }

  const form = document.getElementById("contact-form");
  const note = document.getElementById("form-note");

  if (form) {
    const courseParam = new URLSearchParams(window.location.search).get("kurz");
    const courseMap = {
      gymnastika: "Sportovní gymnastika",
      "vfresh-dc": "VFRESH DC",
      telovychova: "Sportuj s VIKTORKOU",
      zumba: "Zumba & Dance",
      "dramaticky-klub": "Dramatický klub",
      viktorianek: "Viktoriánek",
    };
    if (courseParam && courseMap[courseParam]) {
      form.category.value = courseMap[courseParam];
    }
  }

  if (form && note) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = form.name.value.trim();
      const category = form.category.value;
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      const consent = !!(form.consent && form.consent.checked);

      if (!name || !email || !message) {
        note.textContent = "Vyplňte prosím jméno, e-mail a zprávu.";
        note.style.color = "#e8483d";
        return;
      }

      if (!consent) {
        note.textContent = "Pro odeslání potvrďte prosím souhlas se zpracováním osobních údajů.";
        note.style.color = "#e8483d";
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      // Přihláška se uloží do databáze. Když se to nepovede, zpráva se stejně
      // otevře v e-mailu, aby o dotaz nikdo nepřišel.
      let saved = false;
      if (window.VTStore) {
        try {
          await VTStore.submissions.add({ name, email, category, message, status: "new", consent: true });
          saved = true;
        } catch (e) {
          console.warn("Přihlášku se nepodařilo uložit do databáze.", e);
        }
      }

      const subject = encodeURIComponent(`Dotaz z webu: ${category}`);
      const body = encodeURIComponent(
        `Jméno: ${name}\nKategorie: ${category}\nE-mail: ${email}\n\n${message}`
      );

      note.textContent = saved
        ? "Přihláška uložena a otevírá se e-mailový klient s vyplněnou zprávou…"
        : "Přihlášku se nepodařilo uložit, ale otevírá se e-mailový klient s vyplněnou zprávou…";
      note.style.color = "#ffcf5c";
      form.reset();
      if (submitBtn) submitBtn.disabled = false;

      window.location.href = `mailto:lena.cimpova@seznam.cz?subject=${subject}&body=${body}`;
    });
  }
})();

/*
  Detail kurzu na webu VFRESH (kurz.html?k=<slug kurzu>): termíny a místo,
  cena, info k termínu, zkušební lekce a popis. Data jsou z databáze
  (admin: Kurzy), stejně jako boxy kurzů na webu SK Viktoria.
*/
(() => {
  "use strict";
  if (!window.VTStore) return;

  function esc(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }
  const DAYS = { 1: "Pondělí", 2: "Úterý", 3: "Středa", 4: "Čtvrtek", 5: "Pátek", 6: "Sobota", 7: "Neděle" };
  const $ = (id) => document.getElementById(id);
  function show(id, html) { const el = $(id); el.innerHTML = html; el.hidden = !html; }

  function render() {
    const key = new URLSearchParams(window.location.search).get("k");
    const all = VTStore.coursesOfProgram("vfresh", true);
    const g = all.find((c) => c.slug === key || c.id === key);

    if (!g) {
      $("k-name").textContent = "Kurz nenalezen";
      $("k-age").textContent = "Možná byl zrušen nebo je odkaz neplatný. Všechny crew najdeš v rozvrhu.";
      document.title = "Kurz nenalezen | VFRESH DC Tábor";
      return;
    }

    const activity = VTStore.krouzky.get(g.activityId);
    const label = g.ageLabel ? `${g.name} (${g.ageLabel})` : g.name;
    document.title = `${g.name} | VFRESH DC Tábor`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", `${g.name}${g.ageLabel ? ", " + g.ageLabel : ""}: termíny, cena a zkušební lekce. VFRESH DC Tábor.`);

    $("k-activity").textContent = activity ? activity.name : "VFRESH DC";
    $("k-badge").textContent = g.badge || "";
    $("k-name").textContent = g.name;
    $("k-age").textContent = [g.ageLabel, g.shortDescription].filter(Boolean).join(" · ");

    // Termíny: den, čas, místo (u každého termínu, místa se můžou lišit).
    const slots = VTStore.slotsOf(g.id, true);
    $("k-slots").innerHTML = slots.length ? slots.map((s) => {
      const p = s.placeId ? VTStore.mista.get(s.placeId) : null;
      const place = p ? [p.name, p.address && !p.name.includes(p.address) ? p.address : "", p.note].filter(Boolean).join(", ") : "";
      return `
        <div class="kurz-slot">
          <span class="kurz-day">${esc(DAYS[s.weekday] || "")}</span>
          <span class="kurz-time">${esc(s.endTime ? `${s.startTime}–${s.endTime}` : s.startTime)}</span>
          ${s.note ? `<span class="muted">${esc(s.note)}</span>` : ""}
          ${place ? `<span class="kurz-place">📍 ${esc(place)}</span>` : ""}
        </div>`;
    }).join("") : '<p class="muted">Termín brzy upřesníme. Napiš nám nebo zavolej.</p>';

    // Cena a další ceny.
    const chips = [];
    if (g.priceCzk) chips.push(`<div class="kurz-price main"><b>${esc(Number(g.priceCzk).toLocaleString("cs-CZ"))} Kč</b><span>${esc(g.priceNote || "")}</span></div>`);
    (g.priceExtra || []).forEach((x) => chips.push(`<div class="kurz-price"><b>${esc(x.value)}</b><span>${esc(x.label)}</span></div>`));
    $("k-prices").innerHTML = chips.length ? chips.join("") : '<p class="muted">Cenu ti rádi sdělíme, napiš nebo zavolej.</p>';
    if (g.termNote) { $("k-term").textContent = g.termNote; $("k-term").hidden = false; }
    $("k-price-card").hidden = false;

    show("k-trial", g.trialLesson ? `<b>🎟 Zkušební lekce zdarma</b><span>${esc(g.trialNote || "po domluvě")}</span>` : "");
    show("k-desc", (g.description || "").split("\n").map((p) => p.trim()).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join(""));
    $("k-cta").href = `index.html?crew=${encodeURIComponent(label)}#prihlaska`;
    $("k-body").hidden = false;

    // Ostatní crew pro rychlé přepnutí.
    const others = all.filter((c) => c.id !== g.id);
    show("k-others-list", others.map((c) => `
      <a class="kurz-other" href="${esc(VTStore.courseHref(c))}">
        <span class="crew-tag">${esc(c.badge || "")}</span>
        <b>${esc(c.name)}</b>
        <span class="muted">${esc(c.ageLabel || "")}</span>
      </a>`).join(""));
    $("k-others").hidden = !others.length;
  }

  VTStore.ready.then(render);
})();

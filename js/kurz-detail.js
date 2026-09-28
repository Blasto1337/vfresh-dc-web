(() => {
  "use strict";

  if (!window.VTStore) return;

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function render() {
    const id = new URLSearchParams(window.location.search).get("id");
    const item = id ? VTStore.krouzky.get(id) : null;

    if (!item) {
      document.getElementById("k-root").innerHTML = `
        <section class="detail">
          <div class="wrap">
            <a class="back-link" href="krouzky.html">← Zpět na kroužky</a>
            <p class="detail-lead">Tento kroužek jsme nenašli. Možná byl odebrán nebo je odkaz neplatný.</p>
          </div>
        </section>
      `;
      return;
    }

    document.title = `${item.name} | SK Viktoria Tábor`;

    document.getElementById("k-hero").className = `course-hero course-${escapeHtml(item.color || "teal")}`;
    document.getElementById("k-root").className = `detail-accent-${escapeHtml(item.color || "teal")}`;
    document.getElementById("k-name").textContent = item.name;
    document.getElementById("k-age").textContent = item.age || "Novinka";
    document.getElementById("k-desc").textContent = item.description || "";
    document.getElementById("k-location").textContent = item.location || "Bude upřesněno.";

    const photoWrap = document.getElementById("k-photo-wrap");
    if (photoWrap && item.photo) {
      photoWrap.innerHTML = `<img class="detail-photo" src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.name)}">`;
    }

    const scheduleEl = document.getElementById("k-schedule");
    const schedule = Array.isArray(item.schedule) ? item.schedule : [];
    if (schedule.length) {
      scheduleEl.innerHTML = schedule
        .map((row) => `<li><b>${escapeHtml(row.label)}</b><span>${escapeHtml(row.time)}</span></li>`)
        .join("");
    } else {
      scheduleEl.outerHTML = `<p id="k-schedule">Rozvrh bude upřesněn.</p>`;
    }

    const cta = document.getElementById("k-cta");
    cta.href = `index.html?kurzname=${encodeURIComponent(item.name)}#kontakt`;
  }

  VTStore.ready.then(render);
})();

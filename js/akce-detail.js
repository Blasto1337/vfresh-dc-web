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
    const item = id ? VTStore.akce.get(id) : null;

    if (!item) {
      document.getElementById("a-root").innerHTML = `
        <section class="event-detail">
          <div class="wrap">
            <a class="back-link" href="akce.html">← Zpět na akce</a>
            <p class="detail-lead">Tuto akci jsme nenašli. Možná byla odebrána nebo je odkaz neplatný.</p>
          </div>
        </section>
      `;
      return;
    }

    document.title = `${item.title} | SK Viktoria Tábor`;

    const tagEl = document.getElementById("a-tag");
    tagEl.textContent = item.tag || "AKCE";
    tagEl.className = `tag tag-${escapeHtml(item.color || "teal")}`;
    document.getElementById("a-root").className = `detail-accent-${escapeHtml(item.color || "teal")}`;

    document.getElementById("a-title").textContent = item.title;
    document.getElementById("a-date").textContent = item.date || "—";
    document.getElementById("a-location").textContent = item.location || "Bude upřesněno";

    const photoWrap = document.getElementById("a-photo-wrap");
    if (photoWrap && item.photo) {
      photoWrap.innerHTML = `<img class="detail-photo" src="${escapeHtml(item.photo)}" alt="${escapeHtml(item.title)}">`;
    }

    const listEl = document.getElementById("a-list");
    const bullets = Array.isArray(item.bullets) ? item.bullets.filter(Boolean) : [];
    if (bullets.length) {
      listEl.innerHTML = bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("");
    } else if (item.description) {
      listEl.innerHTML = `<li>${escapeHtml(item.description)}</li>`;
    }
  }

  VTStore.ready.then(render);
})();

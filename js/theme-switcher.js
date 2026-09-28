/*
  Přepínač designu webu VFRESH DC (dev nástroj pro ukázku klientovi).
  Výchozí je tmavé téma Night Street: tělu přidá třídu .vfresh-night, o kterou
  se opírá css/night-street.css. Starý fialový design jde zapnout přes ?dev.
  Volba se pamatuje v localStorage a platí i bez ?dev v URL, takže si admin
  může nechat vybrané téma trvale zapnuté pro návštěvníky. Panel s tlačítky
  se ale zobrazí jen s ?dev.
*/
(() => {
  "use strict";

  const STORAGE_KEY = "vfresh_theme";
  const THEME_CLASS = "vfresh-night";

  function applyTheme(theme) {
    document.body.classList.toggle(THEME_CLASS, theme === "night-street");
  }

  function switchTheme(theme) {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* localStorage nedostupné, téma zůstane jen pro tuto návštěvu */
    }
    console.log(`🎨 Téma: ${theme}`);
  }

  let saved = "night-street";
  try {
    saved = localStorage.getItem(STORAGE_KEY) || "night-street";
  } catch (e) {
    saved = "night-street";
  }
  applyTheme(saved);

  if (new URLSearchParams(location.search).has("dev")) {
    const panel = document.createElement("div");
    panel.innerHTML = `
      <div style="position:fixed;bottom:20px;right:20px;z-index:9999;background:#1a1a1a;
          border:1px solid #f1f0ec;padding:12px;border-radius:4px;font-family:monospace;
          font-size:12px;color:#f1f0ec;gap:8px;display:flex;flex-direction:column">
        <button type="button" data-theme="default"
                style="padding:6px 12px;background:transparent;border:1px solid #f1f0ec;
                color:#f1f0ec;cursor:pointer;font-size:11px">
          ☀️ Starý design
        </button>
        <button type="button" data-theme="night-street"
                style="padding:6px 12px;background:#c6f432;border:1px solid #c6f432;
                color:#0e0e0f;cursor:pointer;font-size:11px;font-weight:bold">
          🌙 Night Street
        </button>
      </div>
    `;
    panel.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => switchTheme(btn.dataset.theme));
    });
    document.body.appendChild(panel);
  }
})();

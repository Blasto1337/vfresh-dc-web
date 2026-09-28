/*
  VTStore: datová vrstva webu nad Supabase (REST, Auth, Storage), bez knihoven.

  Zbytek webu mluví jen s VTStore. Čtení zůstává synchronní (all/get) nad
  pamětí, do které se data načtou jednou při startu stránky:

    - veřejné stránky: await VTStore.ready  (anon klíč, vidí jen publikovaný obsah)
    - admin.html:      VTStore.auth.signIn(...) a pak await VTStore.loadAdmin()

  Zápisy (add/update/remove) jsou async a vrací Promise. Přihlášky z formuláře
  smí anonymní návštěvník jen vložit, číst je smí pouze přihlášený admin.

  Když Supabase není dostupný, veřejné stránky se vykreslí z poslední úspěšné
  kopie (localStorage) a jako poslední možnost z js/seed.js, takže web nikdy
  nezůstane prázdný.

  Dva weby, jedna databáze: každý řádek má sloupec site (viktoria / vfresh /
  both). Veřejná stránka načítá jen svůj web + both. Který web to je, určí
  (v tomto pořadí) window.VT_SITE, atribut <html data-site="...">, nebo doména
  (obsahuje "vfresh" = vfresh), jinak viktoria. Admin načítá obsah obou webů.
  Kurzy VFRESH DC mají site = both: zobrazí se i v nabídce a rozvrhu Viktorie
  (rozcestník), ale jejich karty vedou na web VFRESH (VTStore.hrefFor).
*/
(() => {
  "use strict";

  const SUPABASE_URL = "https://alfshitbiewvpkavhbvx.supabase.co";
  // Publishable klíč je určený do prohlížeče, data chrání RLS pravidla v databázi.
  const SUPABASE_KEY = "sb_publishable_7IKtOAse4pJiMGGC0kGX4w_3v9-6-aU";
  const PHOTO_BUCKET = "vik-photos";
  const LOAD_TIMEOUT_MS = 6000;

  const IS_ADMIN_PAGE = !!(document.body && document.body.classList.contains("admin-body"));

  const SITES = ["viktoria", "vfresh"];
  const SITE = (() => {
    const explicit = window.VT_SITE || (document.documentElement && document.documentElement.dataset.site);
    if (SITES.includes(explicit)) return explicit;
    return /vfresh/i.test(location.hostname) ? "vfresh" : "viktoria";
  })();
  // Veřejné adresy obou webů. Kroužek, jehož domovský web je jiný než ten
  // aktuální (např. VFRESH DC na viktoria-tabor.cz), odkazuje na detail tam.
  const SITE_URLS = {
    viktoria: "https://www.viktoria-tabor.cz/",
    vfresh: "https://www.vfreshdc.cz/",
  };
  // Domovský web položky: taneční skupina VFRESH patří na web vfresh, zbytek na viktoria.
  function homeSite(item) {
    if (item && (item.group === "vfresh" || item.program === "vfresh")) return "vfresh";
    if (item && SITES.includes(item.site)) return item.site;
    return "viktoria";
  }
  // Odkaz na detail: relativní na vlastním webu, absolutní na druhý web.
  // Web VFRESH je one-page, takže jeho kurzy vedou na sekci #rozvrh.
  function hrefFor(item, fallback) {
    const href = (item && item.detailHref) || fallback || "";
    if (/^[a-z]+:/i.test(href)) return href;
    const home = homeSite(item);
    if (home === SITE) return href;
    if (home === "vfresh") return SITE_URLS.vfresh + "#rozvrh";
    return SITE_URLS[home] + href.replace(/^\//, "");
  }
  function isExternal(item) { return homeSite(item) !== SITE; }

  // Položka patří na tento web? (řádek bez site = viktoria, jako výchozí hodnota v DB)
  function onThisSite(item) {
    const s = (item && item.site) || "viktoria";
    return s === SITE || s === "both";
  }

  const AUTH_KEY = "vt_auth";
  // Kopie dat je pro každý web zvlášť, aby se při vývoji na localhost obsah nemíchal.
  const CACHE_KEY = `vt_cache_v2_${SITE}`;

  // ------------------------------------------------------------ pomocné --
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, "0"));
    return `${h.slice(0, 4).join("")}-${h.slice(4, 6).join("")}-${h.slice(6, 8).join("")}-${h.slice(8, 10).join("")}-${h.slice(10).join("")}`;
  }

  function lsGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function lsSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* prohlížeč úložiště nedovolil */ }
  }
  function lsRemove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* nic */ }
  }

  function httpError(status, body) {
    const err = new Error(body && (body.message || body.msg || body.error_description || body.error) || `HTTP ${status}`);
    err.status = status;
    return err;
  }

  // ------------------------------------------------------------- přihlášení --
  let session = null;
  try { session = JSON.parse(lsGet(AUTH_KEY) || "null"); } catch (e) { session = null; }

  function storeSession(data) {
    session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at ? data.expires_at * 1000 : Date.now() + (data.expires_in || 3600) * 1000,
      email: (data.user && data.user.email) || (session && session.email) || "",
    };
    lsSet(AUTH_KEY, JSON.stringify(session));
  }

  function clearSession() {
    session = null;
    lsRemove(AUTH_KEY);
  }

  async function authPost(path, body, token) {
    const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, { method: "POST", headers, body: JSON.stringify(body || {}) });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }
    if (!res.ok) throw httpError(res.status, json);
    return json;
  }

  async function accessToken() {
    if (!session) return null;
    if (session.expires_at - Date.now() > 60000) return session.access_token;
    try {
      storeSession(await authPost("token?grant_type=refresh_token", { refresh_token: session.refresh_token }));
      return session.access_token;
    } catch (e) {
      clearSession();
      return null;
    }
  }

  // ----------------------------------------------------------------- REST --
  async function rest(path, opts = {}) {
    const { method = "GET", body, admin = false, prefer, timeout } = opts;
    const headers = { apikey: SUPABASE_KEY };
    if (admin) {
      const token = await accessToken();
      if (!token) throw httpError(401, { message: "Nejste přihlášeni." });
      headers.Authorization = `Bearer ${token}`;
    }
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (prefer) headers.Prefer = prefer;

    const ctrl = timeout ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), timeout) : null;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: ctrl ? ctrl.signal : undefined,
      });
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }
      if (!res.ok) throw httpError(res.status, json);
      return json;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  // ---------------------------------------------------------------- mapování --
  // Web používá camelCase pole, databáze snake_case sloupce.
  const COLLECTIONS = {
    krouzky: {
      table: "vik_courses",
      fields: {
        group: "group_key", name: "name", age: "age_label", location: "location_label",
        description: "description", icon: "icon", color: "color", schedule: "schedule",
        photo: "photo_url", detailHref: "detail_href", featured: "featured", site: "site",
      },
    },
    akce: {
      table: "vik_events",
      fields: {
        tag: "tag", color: "color", category: "category", title: "title", date: "date_label",
        location: "place_text", description: "description", bullets: "bullets",
        photo: "photo_url", detailHref: "detail_href", featured: "featured", site: "site",
      },
    },
    aktuality: {
      table: "vik_news",
      fields: { date: "date_label", text: "body", photo: "photo_url", site: "site" },
    },
    galerie: {
      table: "vik_gallery",
      order: "sort_order.asc,created_at.desc",
      compare: (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
      fields: { photo: "photo_url", caption: "caption", sortOrder: "sort_order", published: "published", site: "site" },
    },
    rozvrh: {
      table: "vik_timetable",
      order: "weekday.asc,start_time.asc",
      compare: (a, b) => (a.weekday - b.weekday) || (timeMinutes(a.time) - timeMinutes(b.time)) || String(a.name).localeCompare(String(b.name), "cs"),
      fields: { weekday: "weekday", time: "start_time", name: "name", note: "note", program: "program", published: "published", site: "site" },
    },
    submissions: {
      table: "vik_inquiries",
      adminOnlyRead: true,
      fields: {
        name: "name", email: "email", category: "category", message: "message",
        status: "status", consent: "consent_gdpr", site: "site",
      },
    },
  };

  // "08:15:00" nebo "8:15" na minuty od půlnoci (pro řazení rozvrhu)
  function timeMinutes(t) {
    const m = /^(\d{1,2}):(\d{2})/.exec(String(t || ""));
    return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
  }

  function toRow(cfg, item) {
    const row = {};
    Object.keys(cfg.fields).forEach((key) => {
      if (item[key] !== undefined) row[cfg.fields[key]] = item[key];
    });
    return row;
  }

  function fromRow(cfg, row) {
    const item = { id: row.id, createdAt: row.created_at };
    if ("is_seed" in row) item.seed = !!row.is_seed;
    Object.keys(cfg.fields).forEach((key) => {
      const col = cfg.fields[key];
      if (col in row) item[key] = row[col];
    });
    if (item.schedule == null && cfg.table === "vik_courses") item.schedule = [];
    if (item.bullets == null && cfg.table === "vik_events") item.bullets = [];
    // Čas z databáze ("08:15:00") ukazujeme jako "8:15".
    if (cfg.table === "vik_timetable" && item.time) item.time = item.time.replace(/^0(\d):/, "$1:").replace(/^(\d{1,2}:\d{2}):\d{2}$/, "$1");
    return item;
  }

  function makeCollection(cfg) {
    let cache = [];
    // Kolekce s vlastním řazením (galerie, rozvrh) drží paměť seřazenou přes cfg.compare.
    function sortCache() {
      if (!cfg.compare) return;
      cache = cache
        .map((it, i) => ({ it, i }))
        .sort((a, b) => cfg.compare(a.it, b.it) || (a.i - b.i))
        .map((x) => x.it);
    }
    return {
      all() { return cache.slice(); },
      get(id) { return cache.find((it) => it.id === id) || null; },
      _set(rows) { cache = rows.map((r) => fromRow(cfg, r)); sortCache(); },
      _setItems(items) { cache = items.slice(); sortCache(); },

      async add(item) {
        const row = toRow(cfg, item);
        row.id = uuid();
        if (cfg.adminOnlyRead) {
          // Veřejný formulář: anon smí jen vložit, zpět nic přečíst nemůže.
          // Přihláška se označí webem, ze kterého přišla.
          if (!row.site) row.site = SITE;
          await rest(cfg.table, { method: "POST", body: row, prefer: "return=minimal" });
          const record = { ...item, id: row.id, createdAt: new Date().toISOString() };
          return record;
        }
        const out = await rest(cfg.table, { method: "POST", body: row, admin: true, prefer: "return=representation" });
        if (!out || !out.length) throw httpError(403, { message: "Položku se nepodařilo uložit." });
        const record = fromRow(cfg, out[0]);
        cache.unshift(record);
        sortCache();
        return record;
      },

      async update(id, patch) {
        const out = await rest(`${cfg.table}?id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH", body: toRow(cfg, patch), admin: true, prefer: "return=representation",
        });
        if (!out || !out.length) throw httpError(403, { message: "Změna se neuložila (chybí oprávnění nebo položka neexistuje)." });
        const record = fromRow(cfg, out[0]);
        cache = cache.map((it) => (it.id === id ? record : it));
        sortCache();
        return record;
      },

      async remove(id) {
        const out = await rest(`${cfg.table}?id=eq.${encodeURIComponent(id)}`, {
          method: "DELETE", admin: true, prefer: "return=representation",
        });
        if (!out || !out.length) throw httpError(403, { message: "Položku se nepodařilo smazat (chybí oprávnění nebo už neexistuje)." });
        cache = cache.filter((it) => it.id !== id);
      },
    };
  }

  const store = {
    submissions: makeCollection(COLLECTIONS.submissions),
    aktuality: makeCollection(COLLECTIONS.aktuality),
    akce: makeCollection(COLLECTIONS.akce),
    krouzky: makeCollection(COLLECTIONS.krouzky),
    galerie: makeCollection(COLLECTIONS.galerie),
    rozvrh: makeCollection(COLLECTIONS.rozvrh),
    source: "none", // "live" | "cache" | "seed"
  };

  // ----------------------------------------------------------------- načtení --
  const PUBLIC_NAMES = ["krouzky", "akce", "aktuality", "galerie", "rozvrh"];
  const ALL_NAMES = ["krouzky", "akce", "aktuality", "galerie", "rozvrh", "submissions"];

  async function fetchCollections(names, admin) {
    // Veřejná stránka si bere jen obsah svého webu, admin vidí oba weby.
    const siteFilter = admin ? "" : `&site=in.(${SITE},both)`;
    const results = await Promise.all(names.map((name) =>
      rest(`${COLLECTIONS[name].table}?select=*${siteFilter}&order=${COLLECTIONS[name].order || "created_at.desc"}`, { admin, timeout: LOAD_TIMEOUT_MS })
    ));
    const data = {};
    names.forEach((name, i) => { data[name] = results[i] || []; });
    return data;
  }

  function loadFallback() {
    let cached = null;
    try { cached = JSON.parse(lsGet(CACHE_KEY) || "null"); } catch (e) { cached = null; }
    const seed = window.VT_SEED || {};
    // Kopie z prohlížeče, u kolekcí které v ní chybí (starší verze webu) záloha ze seed.js.
    const hasCache = !!(cached && ["krouzky", "akce", "aktuality"].every((n) => Array.isArray(cached[n])));
    PUBLIC_NAMES.forEach((n) => {
      if (hasCache && Array.isArray(cached[n])) {
        store[n]._set(cached[n]);
        return;
      }
      const items = (seed[n] || []).filter(onThisSite).map((it, i) => ({
        createdAt: new Date(Date.now() - i * 1000).toISOString(), ...it,
      }));
      store[n]._setItems(items);
    });
    store.source = hasCache ? "cache" : "seed";
  }

  async function loadPublic() {
    try {
      const data = await fetchCollections(PUBLIC_NAMES, false);
      PUBLIC_NAMES.forEach((n) => store[n]._set(data[n]));
      store.source = "live";
      lsSet(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Data se nepodařilo načíst ze serveru, používá se záložní obsah.", e);
      loadFallback();
    }
  }

  async function loadAdmin() {
    const data = await fetchCollections(ALL_NAMES, true);
    ALL_NAMES.forEach((n) => store[n]._set(data[n]));
    store.source = "live";
  }

  // ------------------------------------------------------------------- fotky --
  const PHOTO_PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/`;

  async function uploadPhoto(blob, folder) {
    const token = await accessToken();
    if (!token) throw httpError(401, { message: "Nejste přihlášeni." });
    const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
    const path = `${folder}/${uuid()}.${ext}`;
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${PHOTO_BUCKET}/${path}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": blob.type || "image/jpeg", "cache-control": "max-age=31536000" },
      body: blob,
    });
    if (!res.ok) {
      let json = null;
      try { json = await res.json(); } catch (e) { json = null; }
      throw httpError(res.status, json);
    }
    return PHOTO_PUBLIC_PREFIX + path;
  }

  // Smaže starou fotku z úložiště, jen pokud je z našeho bucketu. Chyby se ignorují.
  async function deletePhoto(url) {
    if (!url || typeof url !== "string" || !url.startsWith(PHOTO_PUBLIC_PREFIX)) return;
    try {
      const token = await accessToken();
      if (!token) return;
      await fetch(`${SUPABASE_URL}/storage/v1/object/${PHOTO_BUCKET}/${url.slice(PHOTO_PUBLIC_PREFIX.length)}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
      });
    } catch (e) { /* nevadí, soubor zůstane v úložišti */ }
  }

  store.site = SITE;        // "viktoria" | "vfresh"
  store.sites = SITES.slice();
  store.onThisSite = onThisSite;
  store.siteUrls = { ...SITE_URLS };
  store.homeSite = homeSite;
  store.hrefFor = hrefFor;
  store.isExternal = isExternal;
  store.uploadPhoto = uploadPhoto;
  store.deletePhoto = deletePhoto;
  store.loadAdmin = loadAdmin;

  store.auth = {
    session() { return session ? { email: session.email } : null; },
    async signIn(email, password) {
      storeSession(await authPost("token?grant_type=password", { email, password }));
    },
    async signOut() {
      const token = session && session.access_token;
      clearSession();
      if (token) { try { await authPost("logout", {}, token); } catch (e) { /* nevadí */ } }
    },
    // Je přihlášený uživatel zapsaný mezi správci webu (tabulka vik_admins)?
    async isAdmin() {
      const rows = await rest("vik_admins?select=user_id", { admin: true, timeout: LOAD_TIMEOUT_MS });
      return Array.isArray(rows) && rows.length > 0;
    },
  };

  window.VTStore = store;

  // Veřejné stránky se načtou samy, admin si data načte až po přihlášení.
  store.ready = IS_ADMIN_PAGE ? Promise.resolve() : loadPublic();
})();

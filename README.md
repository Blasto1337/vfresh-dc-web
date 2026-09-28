# VFRESH DC — web

One-page web taneční skupiny VFRESH DC (Viktoria Fresh Dance Center), oddělený od hlavního webu SK Viktoria Tábor (repo sk-viktoria-web). Design podle návrhu „Noční street" (1b): tmavé pozadí, neonová lime, Anton / Archivo / JetBrains Mono.

- Statický web: HTML + CSS + vanilla JS, bez buildu. Náhled: `python3 -m http.server 4174` → http://localhost:4174
- `index.html` — celá stránka: hero, pruh stylů, aktuality, rozvrh crew, styly, proč my, benefity, galerie, kde trénujeme, přihláška.
- `css/vfresh.css` — veškeré styly, tokeny v `:root`.
- `js/vfresh.js` — menu, aktuality a galerie z databáze, lightbox, tlačítka „Zkušební lekce" (předvyplní crew ve formuláři), odeslání přihlášky.
- `js/store.js`, `js/seed.js` — datová vrstva sdílená se sk-viktoria-web, změny dělat v obou repech.

Data: `<html data-site="vfresh">`, takže `js/store.js` načítá ze sdílené Supabase jen řádky `site = vfresh | both`. Z databáze se tu berou aktuality a galerie (upravují se v adminu na hlavním webu) a přihlášky se ukládají s `site = vfresh`. Karty crew v rozvrhu jsou zatím napsané přímo v `index.html`.

Kurzy a rozvrh VFRESH mají v DB `site = both`, takže je ukazuje i hlavní web (rozcestník) a jeho karty vedou sem na `#rozvrh`. Adresy webů jsou v `SITE_URLS` v `js/store.js`.

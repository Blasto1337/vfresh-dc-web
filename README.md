# VFRESH DC — web

Taneční web VFRESH DC (Viktoria Fresh Dance Center), oddělený od hlavního webu SK Viktoria Tábor (repo sk-viktoria-web).

- Statický web: HTML + CSS + vanilla JS, bez buildu. Náhled: `python3 -m http.server 4174`.
- Tmavý vzhled Night Street (`css/night-street.css` nad `css/style.css`) je výchozí, starý fialový design jde přepnout přes `?dev`.
- Každá stránka má `<html lang="cs" data-site="vfresh">`. Podle toho `js/store.js` načítá ze sdílené Supabase jen řádky `site = vfresh | both`.
- Obsah se upravuje ve společném adminu na hlavním webu (admin.html v sk-viktoria-web), tady admin není.

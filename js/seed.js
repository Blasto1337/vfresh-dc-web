/*
  Záložní obsah webu. Ostrá data jsou v Supabase (tabulky vik_courses,
  vik_events, vik_news, vik_gallery, vik_timetable) a upravují se přes admin.html. Tento soubor se použije
  jen tehdy, když se data nepodaří načíst ze serveru a v prohlížeči není žádná
  dřívější kopie, aby web nikdy nezůstal prázdný. Při větší změně obsahu ho
  udržujte přibližně v souladu s databází.

  Každá položka má site stejně jako v DB (viktoria / vfresh / both), store.js
  z ní vezme jen to, co patří na aktuální web. Kurzy a rozvrh VFRESH DC jsou
  both, aby je hlavní web jako rozcestník ukázal taky.
*/
window.VT_SEED = {
  krouzky: [
    {
      id: "vfresh-dc", seed: true, site: "both", group: "vfresh", featured: true,
      when: "Út–Pá odpoledne",
      icon: "dance", color: "purple",
      name: "VFRESH DC",
      age: "3–20 let", location: "CUT Tábor, Vančurova 2904",
      description: "Street dance pro děti a mládež: Freshík, Mini Beat, soutěžní DVK/JVK/A crew i rekreační street.",
      photo: null, detailHref: "kurz-vfresh-dc.html",
    },
    {
      id: "zumba", seed: true, site: "viktoria", group: "volnocas", featured: true,
      when: "Po 17:45 · Út 19:00 · St 8:15", photoHint: "skupina dospělých při Zumbě v tanečním sále",
      icon: "pulse", color: "pink",
      name: "Zumba & Dance",
      age: "dospělí", location: "Tábor (CUT) & Planá n. L.",
      description: "Taneční fitness pro dospělé: Tábor út večer a st ráno (s hlídáním dětí), Planá po večer.",
      photo: null, detailHref: "kurz-zumba.html",
    },
    {
      id: "street-deti", seed: true, site: "both", group: "vfresh", featured: false,
      when: "Út 15:30–17:00", photoHint: "děti při street dance v tělocvičně ZŠ Helsinská",
      icon: "dance", color: "purple",
      name: "Rekreační STREET DANCE děti",
      age: "7–14 let", location: "ZŠ Helsinská, Tábor",
      description: "Street dance pro radost bez soutěžení, úterý 15:30–17:00 na Sídlišti nad Lužnicí.",
      photo: null, detailHref: "kurz-vfresh-dc.html",
    },
    {
      id: "gymnastika", seed: true, site: "viktoria", group: "volnocas", featured: true,
      when: "St 15:30–17:30", photoHint: "děti při sestavě na kladině nebo akrobacii v tělocvičně Gymnázia",
      hero: true, heroOrder: 40, heroLead: "Od prvních kotoulů po závodní medaile. Trénujeme obratnost, sílu i odvahu v tělocvičně Gymnázia Tábor.",
      icon: "medal", color: "teal",
      name: "Sportovní gymnastika",
      age: "5–15 let", location: "Gymnázium Tábor",
      description: "Od prvních kotoulů po závodní medaile. Středa 15:30–17:30.",
      photo: null, detailHref: "kurz-gymnastika.html",
    },
    {
      id: "telovychova", seed: true, site: "viktoria", group: "volnocas", featured: true,
      when: "Čt 15:30 · St 16:00 a 17:00", photoHint: "děti při pohybových hrách s míčem nebo na překážkové dráze",
      icon: "kids-sport", color: "yellow",
      name: "Sportuj s VIKTORKOU",
      age: "3–12 let", location: "CUT Tábor & ZŠ Helsinská",
      description: "Pohybové hry a soutěže (3–7) nebo míčové hry a atletika (4–12). Bez stresu z víkendových zápasů.",
      photo: null, detailHref: "kurz-telovychova.html",
    },
    {
      id: "dramaticky-klub", seed: true, site: "viktoria", group: "volnocas", featured: true,
      when: "St 14:00 a 15:00", photoHint: "děti hrají divadlo v kostýmech, scéna z Dramáčku",
      hero: true, heroOrder: 30, heroLead: "Dramáček pro 3–6 let a Dramalab pro 7–12 let. Divadelní hra, správná mluva a zdravé sebevědomí.",
      icon: "theater", color: "blue",
      name: "Dramatický klub",
      age: "3–12 let", location: "CUT Tábor",
      description: "Dramáček (3–6) a Dramalab (7–12): divadelní hra, správná mluva a zdravé sebevědomí.",
      photo: null, detailHref: "kurz-dramaticky-klub.html",
    },
    {
      id: "viktorianek", seed: true, site: "viktoria", group: "volnocas", featured: true,
      when: "Út a Čt 9:30", photoHint: "maminka s batoletem na žíněnce, společné cvičení",
      hero: true, heroOrder: 10, heroLead: "Společné dopolední cvičení s maminkou nebo tátou. Říkanky, překážkové dráhy a první kotrmelce, potom herna Safari.",
      icon: "toddler", color: "red",
      name: "Viktoriánek",
      age: "1,5–3 roky", location: "CUT Tábor",
      description: "Dopolední cvičení rodiče a děti, út a čt 9:30, po cvičení herna Safari.",
      photo: null, detailHref: "kurz-viktorianek.html",
    },
  ],

  akce: [
    {
      id: "sportuj-v-parku", seed: true, site: "viktoria", featured: true,
      age: "děti 3–12 let", photoHint: "děti sportují venku v parku",
      hero: true, heroOrder: 20, heroLead: "Venkovní sportovní odpoledne pro děti: hry, pohyb a ochutnávka tréninků Sportuj s VIKTORKOU pod širým nebem.",
      tag: "NÁBOR", color: "red", category: "nabor",
      title: "Sportuj v parku s VIKTORKOU",
      date: "16. 9. 2026", location: "Tábor",
      description: "Venkovní sportovní odpoledne pro děti, hry, pohyb a základy sportů pod širým nebem.",
      bullets: [
        "Venkovní sportovní odpoledne pro děti, hry, pohyb a základy nejrůznějších sportů",
        "Ochutnávka pravidelných tréninků Sportuj s VIKTORKOU přímo pod širým nebem",
        "Vhodné oblečení do přírody a sportovní obuv",
        "Zájemci se mohou přihlásit i rovnou na pravidelné tréninky",
      ],
      photo: "assets/akce/sportuj-s-viktorkou.jpg",
      detailHref: "akce-sportuj-v-parku.html",
    },
    {
      id: "silvestrovsky-beh", seed: true, site: "viktoria", featured: true,
      age: "děti i dospělí", photoHint: "běžci na startu v zimním Táboře",
      hero: true, heroOrder: 50, heroLead: "Tradiční sportovní rozloučení se starým rokem, pro děti i dospělé, bez ohledu na výkonnost.",
      tag: "ZÁVOD", color: "teal", category: "zavody",
      title: "Silvestrovský běh",
      date: "30. 12. 2026", location: "Tábor",
      description: "Tradiční sportovní rozloučení se starým rokem, pro děti i dospělé.",
      bullets: [
        "Tradiční sportovní rozloučení se starým rokem, pro děti i dospělé, bez ohledu na výkonnost",
        "Otevřeno všem, kdo si chtějí protáhnout nohy před silvestrovskou oslavou",
        "Podrobnosti k trase, startovnému a registraci doplníme",
      ],
      photo: null,
      detailHref: "akce-silvestrovsky-beh.html",
    },
  ],

  rozvrh: [
    { id: "r1", seed: true, site: "viktoria", published: true, weekday: 1, time: "17:45", name: "Zumba & Dance", note: "Planá n. L. · dospělí", program: "zumba" },
    { id: "r2", seed: true, site: "viktoria", published: true, weekday: 2, time: "9:30", name: "Viktoriánek", note: "1,5–3 roky, s rodičem", program: "volnocas" },
    { id: "r3", seed: true, site: "both", published: true, weekday: 2, time: "15:00", name: "DVK crew", note: "8–12 let", program: "vfresh" },
    { id: "r4", seed: true, site: "both", published: true, weekday: 2, time: "15:30", name: "Street děti", note: "7–14 let · ZŠ Helsinská", program: "vfresh" },
    { id: "r5", seed: true, site: "both", published: true, weekday: 2, time: "16:30", name: "Mini Beat", note: "5–8 let", program: "vfresh" },
    { id: "r6", seed: true, site: "both", published: true, weekday: 2, time: "17:30", name: "A crew", note: "14–20 let", program: "vfresh" },
    { id: "r7", seed: true, site: "viktoria", published: true, weekday: 2, time: "19:00", name: "Zumba & Dance", note: "Tábor · dospělí", program: "zumba" },
    { id: "r8", seed: true, site: "viktoria", published: true, weekday: 3, time: "8:15", name: "Zumba & Dance", note: "Tábor · s hlídáním dětí", program: "zumba" },
    { id: "r9", seed: true, site: "viktoria", published: true, weekday: 3, time: "14:00", name: "Dramalab", note: "7–12 let", program: "volnocas" },
    { id: "r10", seed: true, site: "viktoria", published: true, weekday: 3, time: "15:00", name: "Dramáček", note: "3–6 let", program: "volnocas" },
    { id: "r11", seed: true, site: "viktoria", published: true, weekday: 3, time: "15:30", name: "Gymnastika", note: "5–15 let · Gymnázium", program: "volnocas" },
    { id: "r12", seed: true, site: "both", published: true, weekday: 3, time: "16:00", name: "Freshík", note: "3–4 roky", program: "vfresh" },
    { id: "r13", seed: true, site: "viktoria", published: true, weekday: 3, time: "16:00", name: "Sportuj B", note: "ZŠ Helsinská", program: "volnocas" },
    { id: "r14", seed: true, site: "both", published: true, weekday: 3, time: "17:00", name: "JVK crew", note: "12–15 let", program: "vfresh" },
    { id: "r15", seed: true, site: "viktoria", published: true, weekday: 3, time: "17:00", name: "Sportuj B", note: "ZŠ Helsinská", program: "volnocas" },
    { id: "r16", seed: true, site: "both", published: true, weekday: 3, time: "18:30", name: "Fresh Mates", note: "dospělí", program: "vfresh" },
    { id: "r17", seed: true, site: "viktoria", published: true, weekday: 4, time: "9:30", name: "Viktoriánek", note: "1,5–3 roky, s rodičem", program: "volnocas" },
    { id: "r18", seed: true, site: "viktoria", published: true, weekday: 4, time: "15:30", name: "Sportuj A", note: "3–7 let", program: "volnocas" },
    { id: "r19", seed: true, site: "both", published: true, weekday: 4, time: "16:30", name: "DVK crew", note: "8–12 let", program: "vfresh" },
    { id: "r20", seed: true, site: "both", published: true, weekday: 4, time: "18:00", name: "A crew", note: "14–20 let", program: "vfresh" },
    { id: "r21", seed: true, site: "both", published: true, weekday: 5, time: "15:00", name: "JVK crew", note: "12–15 let", program: "vfresh" },
  ],

  galerie: [
    { id: "g1", seed: true, site: "vfresh", sortOrder: 10, published: true, photo: "assets/gallery/soutez-1.jpg", caption: "VFRESH DC na MIA Festivalu" },
    { id: "g2", seed: true, site: "vfresh", sortOrder: 20, published: true, photo: "assets/akce/vfresh-dc.jpg", caption: "VFRESH DC" },
    { id: "g3", seed: true, site: "vfresh", sortOrder: 30, published: true, photo: "assets/gallery/soutez-2.jpg", caption: "VFRESH DC na MIA Festivalu" },
    { id: "g4", seed: true, site: "vfresh", sortOrder: 40, published: true, photo: "assets/gallery/soutez-3.jpg", caption: "VFRESH DC na MIA Festivalu" },
    { id: "g5", seed: true, site: "viktoria", sortOrder: 50, published: true, photo: "assets/akce/dramaticky-klub.jpg", caption: "Dramatický klub" },
    { id: "g6", seed: true, site: "vfresh", sortOrder: 60, published: true, photo: "assets/gallery/soutez-4.jpg", caption: "VFRESH DC na MIA Festivalu" },
    { id: "g7", seed: true, site: "vfresh", sortOrder: 70, published: true, photo: "assets/gallery/soutez-5.jpg", caption: "VFRESH DC na MIA Festivalu" },
    { id: "g8", seed: true, site: "viktoria", sortOrder: 80, published: true, photo: "assets/akce/sportuj-s-viktorkou.jpg", caption: "Sportuj s Viktorkou" },
  ],

  aktuality: [
    {
      id: "posledni-mista", seed: true, site: "vfresh",
      title: "Poslední volná místa ve FRESHÍKU a MINI BEAT",
      date: "září 2026",
      text: "Poslední volná místa: Taneční školička FRESHÍK 3–4 roky (st 16:00), 5 míst, VFRESH MINI BEAT 5–8 let (út 16:30), 7 míst. Přihlášky: 607 825 318 nebo lena.cimpova@seznam.cz.",
      photo: null,
    },
    {
      id: "zkusebni-lekce", seed: true, site: "both",
      title: "Zkušební lekce zdarma celé září",
      date: "do 30. 9. 2026",
      text: "Zkušební lekce zdarma ve všech aktivitách celé září. Nestihli jste termín? Domluvte si svoji 1 lekci zdarma do konce září.",
      photo: null,
    },
    {
      id: "zumba-tabor", seed: true, site: "viktoria",
      title: "Nový podzimní blok Zumba & Dance",
      date: "od 17. 9. 2026",
      text: "Nový podzimní blok Zumba & Dance v Táboře (CUT): úterý 19:00 a středa 8:15 s hlídáním dětí v ceně. Ukázková lekce zdarma 9. 9. v 18:00.",
      photo: null,
    },
  ],
};

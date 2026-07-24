/* ============================================================
   PODCAST — sursă unică de date pentru playerul propriu
   ------------------------------------------------------------
   Cheia fiecărui episod = spotifyId (același din data-spotify=""
   pe butoanele/cardurile .sp-trigger din pagini).

   audioUrl = URL-ul canonic <enclosure> din feed-ul RSS oficial
   (https://anchor.fm/s/112193468/podcast/rss). Trece printr-un
   redirect anchor.fm → CloudFront, deci e adresa stabilă,
   întreținută de Spotify. NU folosi URL-urile de preview din
   dashboard (…-44100-2-….m4a) — sunt fișiere interne, diferite.

   chapters = listă opțională: [{ t: secunde, title: "..." }]
   Lasă [] dacă episodul nu are capitole încă — playerul ascunde
   automat panoul de capitole.
   ============================================================ */
(function () {
  var RSS = "https://anchor.fm/s/112193468/podcast/play/";
  var CF  = "/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F";

  window.PODCAST_EPISODES = [
    /* ---------- Sezonul 2 ---------- */
    {
      id: "4ag71LYvnsQLYcyg4w6XYl", ep: "E04", group: "Sezonul 2",
      title: "Prezentări financiare interactive prin fișiere HTML",
      audioUrl: RSS + "123137075" + CF + "2026-6-21%2Fb2e566b2-5a5d-61a1-2a1d-68d0ea1c855f.m4a",
      /* TIMPI ESTIMAȚI — de înlocuit cu secundele reale după ascultare (t = secunde) */
      chapters: [
        { t: 0,    title: "Intro — de ce uităm prezentările cu slide-uri" },
        { t: 180,   title: "Ideea: o pagină HTML, nu un PowerPoint" },
        { t: 314,  title: "O pagină care reacționează (TVA, buclă, dulap, arcade)" },
        { t: 637,  title: "De ce tocmai HTML: pânza albă" },
        { t: 677,  title: "Ce e un MVP și exemple practice" },
        { t: 883,  title: "Limitele reale ale abordării" },
        { t: 967,  title: "Securitate: cod care se execută + igiena" },
        { t: 1130, title: "Concluzii și unde găsești prezentarea" }
      ]
    },
    {
      id: "3cOJcviFFf8FxRjqSSHGnb", ep: "E03", group: "Sezonul 2",
      title: "Vibe Coding aplicat în contabilitate",
      audioUrl: RSS + "121575301" + CF + "2026-5-16%2Fd01b3e97-8247-743b-3823-b6b937e3c578.m4a",
      chapters: []
    },
    {
      id: "0hZnb2nnOPdCrLTqVicq80", ep: "E02", group: "Sezonul 2",
      title: "Agentul AI nu știe să țină un secret",
      audioUrl: RSS + "119754164" + CF + "2026-4-10%2Fc116ecb9-d9eb-adbf-8f6a-a1a5dce5aa3f.m4a",
      chapters: []
    },
    {
      id: "5enoAz2nrHLOOLg80JDcsW", ep: "E01", group: "Sezonul 2",
      title: "RO e-Factura: când ANAF vede viitorul prin AI, iar tu ești blocat în UI-ul anului 2007",
      audioUrl: RSS + "119380489" + CF + "2026-4-2%2F74712743-eb03-984a-569e-56daa6a3da7a.m4a",
      chapters: []
    },

    /* ---------- Seria fondatoare ---------- */
    {
      id: "4k0YbxKWkKNWGpKFJ3JklL", ep: "M01", group: "Seria fondatoare",
      title: "Contextul Revoluției AI: de la ChatGPT la AI Agents",
      audioUrl: RSS + "119306240" + CF + "2026-3-30%2F9eddcc6f-4138-6756-d06b-c5e8b8d4cbe2.m4a",
      chapters: []
    },
    {
      id: "0hb9PUgaN6QNCN37qLwzPt", ep: "M02", group: "Seria fondatoare",
      title: "Evoluția Contabilității: de la registre pe hârtie la era AI",
      audioUrl: RSS + "119306450" + CF + "2026-3-30%2F685d5fcd-cd02-61fa-3ac9-5b7ac61472bf.m4a",
      chapters: []
    },
    {
      id: "3FfSF66urjapVHvrPlOi6T", ep: "M03", group: "Seria fondatoare",
      title: "Skilluri pentru Profesioniști: de la tabele Pivot la Prompt Engineering",
      audioUrl: RSS + "119306737" + CF + "2026-3-30%2Fac0e066b-ac6e-208c-f4da-1ffee615722f.m4a",
      chapters: []
    },
    {
      id: "1OFGHOtAYGsBjZJHUsRHgD", ep: "M04", group: "Seria fondatoare",
      title: "Viitorul Profesiei: cum va arăta contabilitatea în 5–10 ani",
      audioUrl: RSS + "119307001" + CF + "2026-3-30%2Fec292201-576a-483f-33d7-68a65d309847.m4a",
      chapters: []
    },
    {
      id: "7IsybDIfyJawn5Hv3PZG97", ep: "M05", group: "Seria fondatoare",
      title: "Misiunea AI Accounting Hub",
      audioUrl: RSS + "119307119" + CF + "2026-3-30%2F30224b68-9b7a-b19e-3f63-14d750d6c0a3.m4a",
      chapters: []
    }
  ];
})();

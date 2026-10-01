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

   date = data publicării (AAAA-LL-ZZ). Se copiază în updates.json când
   semnalăm episodul ca noutate în aplicație.

   chapters = listă opțională: [{ t: secunde, title: "..." }]
   Lasă [] dacă episodul nu are capitole încă — playerul ascunde
   automat panoul de capitole.

   NOTĂ TIMPI: E04 e cronometrat de autor. E01/E02/E03 folosesc
   marcajele din script. M01–M05 au timpi ESTIMAȚI — de corectat
   după ascultare.
   ============================================================ */
(function () {
  var RSS = "https://anchor.fm/s/112193468/podcast/play/";
  var CF  = "/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F";

  window.PODCAST_EPISODES = [
    /* ---------- Sezonul 3 · AI Journal ---------- */
    {
      id: "0hoGQP05DQmJPfTWZZOzvG", slug: "jurnal-s6", ep: "E07", group: "Sezonul 3 · AI Journal",
      date: "2026-10-01",
      title: "Documente, date și conexiuni: „munca grea”",
      audioUrl: RSS + "126618424" + CF + "2026-9-1%2Fb7b4fff1-0b2e-da80-95b5-097620d4ab4d.m4a",
      /* TIMPI ESTIMAȚI — proporțional cu lungimea replicilor din script, raportat
         la durata reală (12:57). De corectat după ascultare. */
      chapters: [
        { t: 0   , title: "Intro: de ce munca grea vine ultima" },
        { t: 70 , title: "Extragerea din facturi și erorile tipice" },
        { t: 370 , title: "Documentul lung și filtrul personal" },
        { t: 467 , title: "Calculul cu lanț de raționament" },
        { t: 555 , title: "Conectarea, doar dacă politica firmei permite" },
        { t: 640 , title: "Capcanele ultimei săptămâni" },
        { t: 691 , title: "Ce rămâne după 30 de zile" }
      ]
    },
    {
      id: "4b5GiUtdTyoxZP0tvBxiTf", slug: "jurnal-s5", ep: "E06", group: "Sezonul 3 · AI Journal",
      date: "2026-10-01",
      title: "Projects și rutine: ieși din „o conversație nouă de fiecare dată”",
      audioUrl: RSS + "126618364" + CF + "2026-9-1%2F650d881d-6b42-b18f-1178-e5ed0fb7cf51.m4a",
      /* TIMPI ESTIMAȚI — proporțional cu lungimea replicilor din script, raportat
         la durata reală (15:52). De corectat după ascultare. */
      chapters: [
        { t: 0   , title: "Intro: contextul rescris în fiecare conversație" },
        { t: 248 , title: "Alegerea temei pentru Project" },
        { t: 435 , title: "Instrucțiunile permanente, în patru blocuri" },
        { t: 450 , title: "Documentele de referință și Projectul-depozit" },
        { t: 650 , title: "Căutarea semantică și golurile din proceduri" },
        { t: 706 , title: "Rutina programată" },
        { t: 799 , title: "Mediul greșit și câștigul de consistență" },
        { t: 850 , title: "Ce rămâne și ce urmează" }
      ]
    },
    {
      id: "6Yw7LlS1tD8jFSBjLEpkO2", slug: "jurnal-s4", ep: "E05", group: "Sezonul 3 · AI Journal",
      date: "2026-10-01",
      title: "Riscurile Shadow AI în contabilitate",
      audioUrl: RSS + "126618208" + CF + "2026-9-1%2F268cfe1b-481b-2436-3d76-614e9a5136fc.m4a",
      /* TIMPI ESTIMAȚI — proporțional cu lungimea replicilor din script, raportat
         la durata reală (22:48). De corectat după ascultare. */
      chapters: [
        { t: 0   , title: "Intro: interdicția care produce Shadow AI" },
        { t: 325 , title: "Lista instrumentelor aprobate" },
        { t: 384 , title: "Cele trei medii: enterprise, open weight, cont personal" },
        { t: 710 , title: "Minimizare, contractele cu clienții și ce e interzis oriunde" },
        { t: 840 , title: "Regula de verificare în trei niveluri" },
        { t: 930 , title: "Curățenia: umplutura generată" },
        { t: 1072, title: "Biblioteca de prompturi" },
        { t: 1171, title: "Capcanele și ce rămâne" }
      ]
    },
    {
      id: "3PCiNPHtITHJHQncDJOCiX", slug: "jurnal-s3", ep: "E04", group: "Sezonul 3 · AI Journal",
      date: "2026-10-01",
      title: "Compară modelele AI",
      audioUrl: RSS + "126614123" + CF + "2026-9-1%2F51216b2b-36d8-396b-be92-2870ce36b0d0.m4a",
      /* TIMPI ESTIMAȚI — proporțional cu lungimea replicilor din script, raportat
         la durata reală (14:07). De corectat după ascultare. */
      chapters: [
        { t: 0   , title: "Intro: greșeala care arată ca un răspuns corect" },
        { t: 201 , title: "Trei tipuri de modele și regula de alegere" },
        { t: 305 , title: "Același prompt, două modele" },
        { t: 376 , title: "Testul multimodal: bonuri și facturi" },
        { t: 528 , title: "Verificarea la sursă și „ești sigur?”" },
        { t: 593 , title: "Prima halucinație și semnalele de alarmă" },
        { t: 687 , title: "Capcanele săptămânii" },
        { t: 770 , title: "Ce rămâne și ce urmează" }
      ]
    },
    {
      id: "79qV0H3rA8x74BJsX4A6dB", slug: "jurnal-s2", ep: "E03", group: "Sezonul 3 · AI Journal",
      date: "2026-10-01",
      title: "Prompturi care chiar funcționează",
      audioUrl: RSS + "126613921" + CF + "2026-9-1%2F6d2495b2-8be0-dd00-5299-83f5f5bdffc4.m4a",
      /* TIMPI ESTIMAȚI — proporțional cu lungimea replicilor din script, raportat
         la durata reală (13:58). De corectat după ascultare. */
      chapters: [
        { t: 0   , title: "Intro: juniorul care n-a fost la nicio ședință" },
        { t: 155 , title: "Trei sarcini reale și cele patru straturi" },
        { t: 321 , title: "Exemplul: mailul pentru documentele lipsă" },
        { t: 414 , title: "Rescrii promptul, nu răspunsul" },
        { t: 607 , title: "Pasul 4: testul limitelor" },
        { t: 672 , title: "Capcanele: prompturi magice, politețe, date reale" },
        { t: 737 , title: "Ce rămâne și ce urmează" }
      ]
    },
    {
      id: "1PcKYx9DqvLVxQQ2fvkLXq", slug: "jurnal-s1", ep: "E02", group: "Sezonul 3 · AI Journal",
      date: "2026-10-01",
      title: "„Firma de test” pentru asistentul AI",
      audioUrl: RSS + "126602237" + CF + "2026-9-1%2Fe2e1aced-06e0-4eb5-e88e-48ce2bdde96c.m4a",
      /* TIMPI ESTIMAȚI — proporțional cu lungimea replicilor din script, raportat
         la durata reală (16:19). De corectat după ascultare. */
      chapters: [
        { t: 0   , title: "Intro: testul nedrept și firma de test" },
        { t: 192 , title: "Pasul 1: un singur tool, gratuit sau plătit" },
        { t: 365 , title: "Pasul 2: setările, istoricul și tipul de cont" },
        { t: 509 , title: "Pasul 3: trei conversații fără miză" },
        { t: 669 , title: "Pasul 4: aceeași întrebare în trei formate" },
        { t: 824 , title: "Obiecții și cele trei capcane" },
        { t: 883 , title: "Ce rămâne după prima săptămână" }
      ]
    },
    {
      id: "0Vk1a5yXg4HkY7vtV192HD", slug: "ai-journal", ep: "E01", group: "Sezonul 3 · AI Journal",
      date: "2026-08-11",
      title: "Zece minute cu „AI Journal” lângă cafea",
      audioUrl: RSS + "124089334" + CF + "2026-7-11%2F9166f48d-487e-972e-5c71-e47ccdba2f8e.m4a",
      /* TIMPI ESTIMAȚI — media dintre marcajele din script și repartiția
         proporțională cu lungimea capitolelor, raportată la durata reală
         (16:06). De corectat după ascultare. */
      chapters: [
        { t: 0,   title: "Intro: cele patru direcții ale episodului" },
        { t: 67,  title: "Unde suntem: 5,2% față de 20% media UE" },
        { t: 191, title: "Obiceiul: ancora, stratul subțire, cele 66 de zile" },
        { t: 378, title: "AI Journal pe dinăuntru: două casete, pauza, datele locale" },
        { t: 590, title: "E sigur un fișier HTML descărcat? Trei verificări" },
        { t: 850, title: "Închidere: zece minute la prima cafea" }
      ]
    },
    /* ---------- Sezonul 2 ---------- */
    {
      id: "3HBHI4h8yRlAIdZUkf3pnI", slug: "comunitate", ep: "E08", group: "Sezonul 2",
      date: "2026-08-08",
      title: "Despre resurse libere, aplicații și ziduri inutile",
      audioUrl: RSS + "123953848" + CF + "2026-7-8%2Fa5f3a889-f4cc-7f8e-697d-694f7936587e.m4a",
      /* TIMPI ESTIMAȚI — media dintre marcajele din script și repartiția
         proporțională cu lungimea capitolelor, raportată la durata reală
         (21:52). De corectat după ascultare. */
      chapters: [
        { t: 0,    title: "Cold open & intro: zidul și filosofia hub-ului" },
        { t: 348,  title: "Marea dilemă și autoironia numelui în engleză" },
        { t: 600,  title: "Soluția: aplicația instalabilă și timpul câștigat" },
        { t: 858,  title: "Fair-play pentru cabinete mici și liber profesioniști" },
        { t: 1124, title: "Închidere & concluzii" }
      ]
    },
    {
      id: "4Xv8QaB6LpmZ6YHeNxgHdh", slug: "prompt-2", ep: "E07", group: "Sezonul 2",
      date: "2026-08-08",
      title: "Promptul perfect 2.0: de la trucuri de vocabular la arhitectură",
      audioUrl: RSS + "123953761" + CF + "2026-7-8%2Fd21d6b8c-8f49-7aff-f5ee-5e4084d9488a.m4a",
      /* TIMPI ESTIMAȚI — media dintre marcajele din script și repartiția
         proporțională cu lungimea capitolelor, raportată la durata reală
         (34:51). De corectat după ascultare. */
      chapters: [
        { t: 0,    title: "Cold open & intro: de ce revizuim promptul după 3 luni" },
        { t: 250,  title: "Ce nu mai funcționează în 2026: vrăjitoriile au murit" },
        { t: 605,  title: "Tag-urile XML: limba știută deja din SAF-T și e-Factura" },
        { t: 939,  title: "Ordinea contează: fenomenul „Lost in the middle”" },
        { t: 1245, title: "Guardrails și „canarul din mină”" },
        { t: 1495, title: "Economia de tokeni și contractul de ieșire" },
        { t: 1732, title: "Mega-promptul 2.0: cum așezăm totul în practică" },
        { t: 1950, title: "Închidere & concluzii" }
      ]
    },
    {
      id: "51MZOf3ZfOXxZYBYD86kAz", slug: "adoptare", ep: "E06", group: "Sezonul 2",
      date: "2026-07-30",
      title: "Adoptarea vs adaptarea AI în contabilitate",
      audioUrl: RSS + "123548230" + CF + "2026-6-30%2F0ff8eeda-5f93-0f7c-9baa-65c4e5f0811e.m4a",
      /* TIMPI ESTIMAȚI — proporțional cu lungimea capitolelor din script, raportat
         la durata reală (20:23). De corectat după ascultare. */
      chapters: [
        { t: 0,    title: "Cold open & intro: adoptare sau adaptare" },
        { t: 65,   title: "Cheia și casa: ce spune raportul Deloitte" },
        { t: 170,  title: "Spații sigure de experimentare — și de ce lipsesc" },
        { t: 285,  title: "Cadrul „strat cu strat”: cele cinci niveluri" },
        { t: 430,  title: "Judecata: clasificări, provizioane, închidere de lună" },
        { t: 695,  title: "Experimentarea: reconcilieri și unelte proprii" },
        { t: 890,  title: "Gândirea independentă: raportări și reîncadrare" },
        { t: 1060, title: "Confidențialitate și responsabilitatea semnăturii" },
        { t: 1140, title: "Închidere & teaser" }
      ]
    },
    {
      id: "1Ib5lY2Avj6UYIOt50IQKl", slug: "short-friday", ep: "E05", group: "Sezonul 2",
      date: "2026-07-30",
      title: "Analiza modificărilor legislative cu agenți AI",
      audioUrl: RSS + "123548147" + CF + "2026-6-30%2F505dc918-b3f9-991a-0ead-6873a4579e98.m4a",
      /* TIMPI ESTIMAȚI — proporțional cu lungimea capitolelor din script, raportat
         la durata reală (21:49). De corectat după ascultare. */
      chapters: [
        { t: 0,    title: "Cold open & intro: weekendul salvat" },
        { t: 165,  title: "LinkedIn și draftul de vineri dimineață" },
        { t: 300,  title: "Discuția de la prânz: lista care tot crește" },
        { t: 485,  title: "Ce aduce OPANAF 828/2026, pe scurt" },
        { t: 595,  title: "Cursa contra cronometru cu modelul nou" },
        { t: 725,  title: "Arhitectura pas cu pas: orchestrator și subagenți" },
        { t: 890,  title: "De ce comunică agenții prin fișiere pe disc" },
        { t: 1020, title: "Luni dimineață: filtrul uman obligatoriu" },
        { t: 1175, title: "Închidere & concluzii" }
      ]
    },
    {
      id: "4ag71LYvnsQLYcyg4w6XYl", slug: "prezentari", ep: "E04", group: "Sezonul 2",
      date: "2026-07-21",
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
      id: "3cOJcviFFf8FxRjqSSHGnb", slug: "vibe-coding", ep: "E03", group: "Sezonul 2",
      date: "2026-06-16",
      title: "Vibe Coding aplicat în contabilitate",
      audioUrl: RSS + "121575301" + CF + "2026-5-16%2Fd01b3e97-8247-743b-3823-b6b937e3c578.m4a",
      /* timpi din marcajele scriptului */
      chapters: [
        { t: 0,    title: "Cold open & intro" },
        { t: 90,   title: "Ce este vibe coding și de unde vine" },
        { t: 300,  title: "De ce a devenit relevant pentru noi, în 2026" },
        { t: 480,  title: "Primul tool: verificare CIF-uri la ANAF" },
        { t: 630,  title: "Ce poți construi: aplicații, dashboard-uri, VBA" },
        { t: 840,  title: "Python vs. macro — când contează diferența" },
        { t: 930,  title: "Riscurile: codul pe care nu-l vezi" },
        { t: 1140, title: "Închidere & teaser" }
      ]
    },
    {
      id: "0hZnb2nnOPdCrLTqVicq80", slug: "secret", ep: "E02", group: "Sezonul 2",
      date: "2026-05-10",
      title: "Agentul AI nu știe să țină un secret",
      audioUrl: RSS + "119754164" + CF + "2026-4-10%2Fc116ecb9-d9eb-adbf-8f6a-a1a5dce5aa3f.m4a",
      /* timpi din marcajele scriptului */
      chapters: [
        { t: 0,    title: "Cold open" },
        { t: 90,   title: "Cafeaua și elefantul din încăpere" },
        { t: 210,  title: "Regula de aur pe care am uitat-o brusc" },
        { t: 360,  title: "Călătoria datelor: ce se întâmplă după Enter?" },
        { t: 630,  title: "Cele cinci mituri care sparg cabinete" },
        { t: 810,  title: "Incidente reale, nu povești de groază" },
        { t: 960,  title: "Patru scenarii din viața reală a unui contabil" },
        { t: 1260, title: "Cadrul legal, pe scurt" },
        { t: 1440, title: "Anonimizarea și regula verde / galben / roșu" },
        { t: 1620, title: "Concluzie & teaser" }
      ]
    },
    {
      id: "5enoAz2nrHLOOLg80JDcsW", slug: "e-factura", ep: "E01", group: "Sezonul 2",
      date: "2026-05-02",
      title: "RO e-Factura: când ANAF vede viitorul prin AI, iar tu ești blocat în UI-ul anului 2007",
      audioUrl: RSS + "119380489" + CF + "2026-4-2%2F74712743-eb03-984a-569e-56daa6a3da7a.m4a",
      /* timpi din marcajele scriptului */
      chapters: [
        { t: 0,    title: "Cold open & intro" },
        { t: 150,  title: "Ce legătură are e-Factura cu AI?" },
        { t: 390,  title: "Primul proiect de digitalizare dus până la capăt" },
        { t: 600,  title: "Ce funcționează: standardizare, API, termenele 2026" },
        { t: 870,  title: "ANAF folosește AI și acționează pe datele tale" },
        { t: 1170, title: "Reflexul contabilului: două surse, mereu" },
        { t: 1350, title: "Realitatea reconcilierii și apelul către autorități" },
        { t: 1650, title: "Închidere & cifre" }
      ]
    },

    /* ---------- Seria fondatoare ---------- */
    {
      id: "4k0YbxKWkKNWGpKFJ3JklL", slug: "revolutia-ai", ep: "M01", group: "Seria fondatoare",
      date: "2026-05-01",
      title: "Contextul Revoluției AI: de la ChatGPT la AI Agents",
      audioUrl: RSS + "119306240" + CF + "2026-3-30%2F9eddcc6f-4138-6756-d06b-c5e8b8d4cbe2.m4a",
      /* TIMPI ESTIMAȚI — de corectat după ascultare */
      chapters: [
        { t: 0,    title: "Intro și structura seriei" },
        { t: 150,  title: "30 noiembrie 2022: ChatGPT și explozia" },
        { t: 330,  title: "GPT-4: de la jucărie la instrument real" },
        { t: 540,  title: "Era agenților AI autonomi" },
        { t: 750,  title: "Exemple concrete: Cowork în contabilitate" },
        { t: 930,  title: "Viteza evoluției și adopția" },
        { t: 1020, title: "Concluzie" }
      ]
    },
    {
      id: "0hb9PUgaN6QNCN37qLwzPt", slug: "evolutia", ep: "M02", group: "Seria fondatoare",
      date: "2026-05-01",
      title: "Evoluția Contabilității: de la registre pe hârtie la era AI",
      audioUrl: RSS + "119306450" + CF + "2026-3-30%2F685d5fcd-cd02-61fa-3ac9-5b7ac61472bf.m4a",
      /* TIMPI ESTIMAȚI — de corectat după ascultare */
      chapters: [
        { t: 0,    title: "Intro: de ce o paralelă istorică" },
        { t: 90,   title: "Faza 1: Era pre-digitală" },
        { t: 300,  title: "Faza 2: Era Microsoft Office și Excel" },
        { t: 660,  title: "Faza 3: Era digitalizării (cloud, RPA, e-Factura)" },
        { t: 960,  title: "Faza 4: Era AI" },
        { t: 1260, title: "Lecția: pattern-ul care se repetă" }
      ]
    },
    {
      id: "3FfSF66urjapVHvrPlOi6T", slug: "skilluri", ep: "M03", group: "Seria fondatoare",
      date: "2026-05-01",
      title: "Skilluri pentru Profesioniști: de la tabele Pivot la Prompt Engineering",
      audioUrl: RSS + "119306737" + CF + "2026-3-30%2Fac0e066b-ac6e-208c-f4da-1ffee615722f.m4a",
      /* TIMPI ESTIMAȚI — de corectat după ascultare */
      chapters: [
        { t: 0,    title: "Intro" },
        { t: 120,  title: "Era Excel: skill-urile de ieri" },
        { t: 480,  title: "Era AI: LLM, tokeni, prompt engineering" },
        { t: 960,  title: "Cele cinci skill-uri critice pentru era AI" },
        { t: 1560, title: "Excel vs. AI: comparație directă" },
        { t: 1860, title: "Skill-urile devin baseline" }
      ]
    },
    {
      id: "1OFGHOtAYGsBjZJHUsRHgD", slug: "viitorul", ep: "M04", group: "Seria fondatoare",
      date: "2026-05-01",
      title: "Viitorul Profesiei: cum va arăta contabilitatea în 5–10 ani",
      audioUrl: RSS + "119307001" + CF + "2026-3-30%2Fec292201-576a-483f-33d7-68a65d309847.m4a",
      /* TIMPI ESTIMAȚI — de corectat după ascultare */
      chapters: [
        { t: 0,    title: "Intro și orizonturi de timp" },
        { t: 120,  title: "Scurt, mediu, lung: cum intră AI" },
        { t: 300,  title: "Ce se automatizează, ce rămâne al omului" },
        { t: 450,  title: "Impactul pe roluri: de la junior la CFO" },
        { t: 600,  title: "Workflow-uri: factura și month-end close" },
        { t: 750,  title: "Roluri noi: AI Accounting Analyst" },
        { t: 870,  title: "Riscuri și provocări" },
        { t: 1050, title: "Roadmap personal" }
      ]
    },
    {
      id: "7IsybDIfyJawn5Hv3PZG97", slug: "misiunea", ep: "M05", group: "Seria fondatoare",
      date: "2026-05-01",
      title: "Misiunea AI Accounting Hub",
      audioUrl: RSS + "119307119" + CF + "2026-3-30%2F30224b68-9b7a-b19e-3f63-14d750d6c0a3.m4a",
      /* TIMPI ESTIMAȚI — de corectat după ascultare */
      chapters: [
        { t: 0,    title: "Intro" },
        { t: 90,   title: "Problema: gap-ul dintre entuziasm și acțiune" },
        { t: 270,  title: "Misiunea și cei patru piloni" },
        { t: 600,  title: "Principiile proiectului" },
        { t: 780,  title: "De ce contabilitatea e profesia perfectă pentru AI" },
        { t: 900,  title: "Întrebări de reflecție" },
        { t: 1020, title: "Apelul la acțiune" },
        { t: 1200, title: "Mesajul final" }
      ]
    }
  ];
})();

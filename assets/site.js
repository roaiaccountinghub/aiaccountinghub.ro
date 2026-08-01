/* ========== MOBILE NAV (injected hamburger + drawer) ========== */
(function () {
  const headerInner = document.querySelector('.header-inner');
  if (!headerInner) return;
  const nav = headerInner.querySelector('nav.primary');
  const actions = headerInner.querySelector('.header-actions');
  if (!nav || !actions) return;

  const btn = document.createElement('button');
  btn.className = 'nav-toggle';
  btn.setAttribute('aria-label', 'Deschide meniul');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = `
    <svg class="icon-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    <svg class="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
  `;
  actions.insertBefore(btn, actions.firstChild);

  const drawer = document.createElement('div');
  drawer.className = 'nav-drawer';
  drawer.innerHTML = '<div class="nav-drawer-inner">' + nav.innerHTML + '</div>';
  document.body.appendChild(drawer);

  const close = () => {
    drawer.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  };
  btn.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
  });
  drawer.addEventListener('click', e => {
    if (e.target.tagName === 'A') close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 960) close(); });
})();

/* ========== THEME TOGGLE (persisted, dark implicit) ========== */
(function () {
  const saved = localStorage.getItem('aiah-theme');
  if (saved) {
    /* Utilizatorul a ales manual (butonul de temă) — respectăm alegerea lui */
    document.documentElement.setAttribute('data-theme', saved);
  }
  /* Fără preferință salvată: rămâne dark-ul hardcodat în <html> — default-ul
     site-ului la ORICE primă vizită sau link primit, indiferent de tema
     OS/browser (decizie de brand: nu urmărim prefers-color-scheme). */
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('aiah-theme', next);
    });
  }
})();

/* ========== FADE-IN ON SCROLL ========== */
/* Threshold is `0` (fires the moment any pixel is visible) instead of 0.15 —
   on a small mobile viewport, a tall element like a full article body never
   reaches a 15% visibility ratio (480px viewport / 3000px article ≈ 14%) and
   the observer would never fire, leaving .fade-in stuck at opacity 0. */
(function () {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.fade-in').forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-in').forEach(el => io.observe(el));
})();

/* ========== ARTICLE SHARE BUTTONS ========== */
(function () {
  const buttons = document.querySelectorAll('.share-btn');
  if (!buttons.length) return;

  const pageUrl = window.location.href;
  const pageTitle = document.title.replace(' — AI Accounting Hub', '');

  buttons.forEach(btn => {
    const label = btn.getAttribute('aria-label') || '';

    if (label.includes('Copiază')) {
      btn.addEventListener('click', async () => {
        const shareData = {
          title: document.title.replace(' — AI Accounting Hub', ''),
          text: 'Îți recomand acest articol de pe AI Accounting Hub:',
          url: window.location.href
        };

        if (navigator.share) {
          try {
            await navigator.share(shareData);
            return;
          } catch (err) {
            // utilizatorul a închis meniul de share
            return;
          }
        }

        try {
          await navigator.clipboard.writeText(window.location.href);
          btn.setAttribute('aria-label', 'Link copiat');
          setTimeout(() => btn.setAttribute('aria-label', 'Copiază link'), 1400);
        } catch {
          window.prompt('Copiază linkul:', window.location.href);
        }
      });
    }

    if (label.includes('LinkedIn')) {
      btn.addEventListener('click', () => {
        const shareUrl =
          'https://www.linkedin.com/sharing/share-offsite/?url=' +
          encodeURIComponent(pageUrl);

        window.open(shareUrl, '_blank', 'noopener,noreferrer,width=720,height=640');
      });
    }

    if (label.includes('Printează')) {
      btn.addEventListener('click', () => {
        window.print();
      });
    }
  });
})();

/* ========== CUPRINS MOBIL (paginile de articol) ==========
   Acordeonul <details class="toc-mobile"> se închide singur după ce
   cititorul alege o secțiune, ca să nu acopere conținutul. */
(function () {
  const det = document.querySelector('details.toc-mobile');
  if (!det) return;
  det.addEventListener('click', (e) => {
    if (e.target.closest('a')) det.open = false;
  });
})();

/* ========== CUPRINS LATERAL: evidențiere secțiune curentă (scroll-spy) ==========
   Rulează doar pe paginile care au un cuprins (.toc) — pe restul iese imediat. */
(function () {
  const links = document.querySelectorAll('.toc a');
  if (!links.length) return;
  const ids = Array.from(links).map(a => a.getAttribute('href').slice(1));
  const targets = ids.map(id => document.getElementById(id)).filter(Boolean);
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  targets.forEach(t => io.observe(t));
})();

/* ========== Event tracking (Cloudflare Worker + D1) ==========
   Contoare agregate pentru interacțiuni pe care Cloudflare Web Analytics nu le
   vede (modale, termeni buzzword, episoade). Fire-and-forget, fără date personale. */
window.aiahTrack = function (name) {
  if (!name) return;
  try {
    fetch("https://aiah-backend.aiaccountinghub.workers.dev/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name }),
      keepalive: true
    }).catch(function () {});
  } catch (e) {}
};
/* Declanșator simplu prin atribut: <element data-track="nume"> */
document.addEventListener("click", function (e) {
  var el = e.target && e.target.closest ? e.target.closest("[data-track]") : null;
  if (el) window.aiahTrack(el.getAttribute("data-track"));
});


/* ============================================================
   APLICAȚIA INSTALABILĂ (PWA) — buton, marcaje „NOU", bulină
   ------------------------------------------------------------
   Totul se petrece în browserul cititorului. Nu se trimite nimic
   nicăieri, nu există cont, email sau listă de abonați. Ce a citit
   și ce îl interesează stau în localStorage, pe dispozitivul lui.

   Paginile de joc arcade-*.html nu încarcă acest fișier, deci nimic
   din codul de mai jos nu ajunge la ele. În plus, verificăm explicit
   dacă pagina are deja alt manifest și ne oprim.
   ============================================================ */
(function () {
  'use strict';

  var UPDATES_URL = '/updates.json';
  var K_SEEN      = 'aiah.seen';
  var K_INTERESTS = 'aiah.interests';
  var K_BASELINE  = 'aiah.baseline';

  /* ---------- pagina are alt manifest (arcade)? nu ne atingem de ea ---------- */
  var manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    var mhref = manifestLink.getAttribute('href') || '';
    if (mhref.indexOf('manifest-arcade') > -1 || mhref.indexOf('manifest.json') === -1) return;
  }

  /* ---------- depozit local, tolerant la modul privat ---------- */
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function getSeen()      { var v = read(K_SEEN, []); return Array.isArray(v) ? v : []; }
  /* null = încă nu a ales nimic (îl considerăm interesat de tot)
     []   = a debifat tot, deliberat (nu i se semnalează nimic) */
  function getInterests() { var v = read(K_INTERESTS, null); return Array.isArray(v) ? v : null; }

  function markSeen(ids) {
    if (!ids || !ids.length) return;
    var seen = getSeen(), changed = false;
    for (var i = 0; i < ids.length; i++) {
      if (seen.indexOf(ids[i]) === -1) { seen.push(ids[i]); changed = true; }
    }
    if (changed) { write(K_SEEN, seen.slice(-300)); pushStateToSW(); }
  }

  function pushStateToSW() {
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'aiah-state',
        state: { seen: getSeen(), interests: getInterests(), notified: [] }
      });
    } catch (e) {}
  }

  /* ---------- bulina de pe iconiță ---------- */
  function setBadge(n) {
    try {
      if (n > 0 && navigator.setAppBadge) navigator.setAppBadge(n);
      else if (navigator.clearAppBadge) navigator.clearAppBadge();
    } catch (e) {}
  }

  /* ---------- service worker ---------- */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;
    navigator.serviceWorker.register('/sw.js').then(function (reg) {
      pushStateToSW();
      if (!reg.periodicSync || !navigator.permissions) return;
      navigator.permissions.query({ name: 'periodic-background-sync' }).then(function (status) {
        if (status.state !== 'granted') return;
        reg.periodicSync.register('aiah-check-updates', {
          minInterval: 12 * 60 * 60 * 1000
        }).catch(function () {});
      }).catch(function () {});
    }).catch(function () {});
  }

  /* ---------- stare aplicație ---------- */
  function isInstalled() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
           window.navigator.standalone === true;
  }
  function isIOS() {
    var ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  /* ---------- fereastra de instalare, păstrată pentru mai târziu ---------- */
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    document.documentElement.classList.add('aiah-can-install');
  });
  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    document.documentElement.classList.add('aiah-installed');
    var btn = document.getElementById('install-btn');
    if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
    /* Un singur contor agregat, o singură dată în viața unui dispozitiv.
       Se trimite doar numele evenimentului — niciun identificator, nimic
       care să lege două instalări între ele. */
    if (window.aiahTrack) window.aiahTrack('pwa:install');
  });

  window.aiahInstall = function () {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () { deferredPrompt = null; }).catch(function () {});
      return 'prompt';
    }
    return isIOS() ? 'ios' : 'manual';
  };

  /* ---------- butonul din header (varianta V5: „Aplicație") ---------- */
  function injectButton() {
    if (isInstalled()) return;
    var actions = document.querySelector('.header-inner .header-actions');
    if (!actions || actions.querySelector('.install-btn')) return;

    var onIndex = !!document.getElementById('install');
    var a = document.createElement('a');
    a.className = 'install-btn';
    a.id = 'install-btn';
    a.href = onIndex ? '#install' : 'index.html#install';
    a.setAttribute('aria-label', 'Despre aplicație');
    a.title = 'Despre aplicație — o salvezi pe ecran și afli când apare ceva nou';
    a.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="6" y="2" width="12" height="20" rx="2.5"></rect>' +
      '<path d="M12 6v6"></path><path d="M9 9h6"></path>' +
      '</svg><span class="lbl">Aplicație</span>';

    var themeToggle = actions.querySelector('#theme-toggle');
    if (themeToggle) actions.insertBefore(a, themeToggle);
    else actions.appendChild(a);
  }

  /* ---------- cardul de pe pagina principală ---------- */
  function wireCard() {
    var btn = document.getElementById('install-card-btn');
    if (!btn) return;
    if (isInstalled()) {
      var band = document.getElementById('install');
      if (band) band.hidden = true;
      return;
    }
    btn.addEventListener('click', function () {
      var result = window.aiahInstall();
      if (result === 'prompt') return;
      var helps = document.querySelectorAll('.install-help');
      for (var i = 0; i < helps.length; i++) helps[i].hidden = true;
      var help = document.getElementById('install-help-' + (result === 'ios' ? 'ios' : 'manual'));
      if (help) help.hidden = false;
    });
  }

  /* ---------- marcajele „NOU" pe cardurile existente ---------- */
  var CARD_SELECTOR = '.article-item, .episode-item, .term-item, .featured, .resource-card, .res-card, article, li';

  function cardFor(el) {
    var card = el.closest ? el.closest(CARD_SELECTOR) : null;
    return card || el;
  }

  /* linkurile din meniu și din footer duc spre secțiuni, nu spre un material
     anume — nu au ce căuta cu o etichetă „NOU" pe ele */
  function isChrome(el) {
    return !!(el.closest && el.closest('header, footer, nav, .footer-nav-grid, .nav-drawer'));
  }

  function targetFor(item) {
    /* dacă materialul are un reper explicit, el e singurul valabil:
       fără reperul lui pe pagina curentă, nu marcăm nimic */
    if (item.mark) {
      try {
        var byMark = document.querySelector(item.mark);
        return byMark && !isChrome(byMark) ? cardFor(byMark) : null;
      } catch (e) { return null; }
    }
    var path = String(item.url || '').split('#')[0];
    if (!path) return null;
    var links = document.querySelectorAll('a[href="' + path + '"], a[href="/' + path + '"]');
    for (var i = 0; i < links.length; i++) {
      if (!isChrome(links[i])) return cardFor(links[i]);
    }
    return null;
  }

  function paintFlags(unseen) {
    for (var i = 0; i < unseen.length; i++) {
      var item = unseen[i];
      var card = targetFor(item);
      if (!card || card.classList.contains('is-new')) continue;
      card.classList.add('is-new');
      if (!card.querySelector('.nou-flag')) {
        var flag = document.createElement('span');
        flag.className = 'nou-flag';
        flag.textContent = 'NOU';
        card.appendChild(flag);
      }
      (function (id, node) {
        node.addEventListener('click', function () { markSeen([id]); }, { once: true });
      })(item.id, card);
    }
  }

  /* ---------- pornire ---------- */
  function boot(data) {
    var items = (data && Array.isArray(data.items)) ? data.items : [];
    if (!items.length) return;

    var ids = items.map(function (it) { return it.id; });

    /* Prima vizită: tot ce există deja se consideră „văzut", ca nimeni să nu
       fie întâmpinat de zece etichete NOU. Se semnalează doar ce apare de acum. */
    if (!read(K_BASELINE, false)) {
      write(K_BASELINE, true);
      write(K_SEEN, ids);
      pushStateToSW();
      return;
    }

    var seen = getSeen();
    var interests = getInterests();
    var wanted = items.filter(function (it) {
      return !interests || interests.indexOf(it.type) > -1;
    });
    var unseen = wanted.filter(function (it) { return seen.indexOf(it.id) === -1; });

    setBadge(unseen.length);

    var btn = document.getElementById('install-btn');
    if (btn && unseen.length) btn.setAttribute('data-new', String(unseen.length));

    /* Dacă exact acum citește un material nesemnalat, îl marcăm citit.
       Doar materialele cu pagină proprie (articolele): un episod sau un termen
       trăiește într-o listă, iar simpla deschidere a listei nu înseamnă că
       l-a parcurs — acelea se marchează la clic pe card. */
    var here = location.pathname.replace(/^\//, '');
    var current = items.filter(function (it) {
      return !it.mark && String(it.url || '').split('#')[0] === here;
    }).map(function (it) { return it.id; });
    if (current.length) markSeen(current);

    if (document.body.classList.contains('page-noutati')) return;

    paintFlags(unseen);

    /* listele de pe arhivă/podcast/buzzword se randează din JS, după noi:
       reaplicăm marcajele câteva secunde, apoi ne oprim */
    if (window.MutationObserver) {
      var observer = new MutationObserver(function () { paintFlags(unseen); });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { observer.disconnect(); }, 8000);
    }
  }

  function start() {
    registerSW();
    injectButton();
    wireCard();
    fetch(UPDATES_URL, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) boot(d); })
      .catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

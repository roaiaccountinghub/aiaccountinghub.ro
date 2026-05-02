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

/* ========== THEME TOGGLE (persisted + OS preference) ========== */
(function () {
  const saved = localStorage.getItem('aiah-theme');
  if (saved) {
    /* Utilizatorul a ales manual — respectăm alegerea lui */
    document.documentElement.setAttribute('data-theme', saved);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    /* Prima vizită, fără preferință salvată — urmăm setarea OS/browser */
    document.documentElement.setAttribute('data-theme', 'light');
  }
  /* Altfel: rămâne dark-ul hardcodat în HTML — default-ul site-ului */
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

/* ========== CONTACT MODAL ========== */
(function () {
  const backdrop = document.getElementById('modal-backdrop');
  if (!backdrop) return;
  const open = () => backdrop.classList.add('open');
  const close = () => backdrop.classList.remove('open');
  document.querySelectorAll('[data-open-contact]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); open(); });
  });
  const closeBtn = document.getElementById('modal-close');
  const cancelBtn = document.getElementById('modal-cancel');
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (cancelBtn) cancelBtn.addEventListener('click', close);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const ok = document.getElementById('form-success');
      if (ok) ok.classList.add('show');
      setTimeout(() => { close(); if (ok) ok.classList.remove('show'); e.target.reset(); }, 1600);
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

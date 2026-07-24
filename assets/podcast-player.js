/* ============================================================
   PODCAST PLAYER PROPRIU — motor
   ------------------------------------------------------------
   Se leagă de orice element .sp-trigger[data-spotify] din pagină
   (aceleași triggere folosite până acum de modalul Spotify).
   Citește datele din window.PODCAST_EPISODES (assets/podcast-data.js).

   Funcții: redare M4A direct, bară de derulare, skip ±10s,
   viteză, capitole (opțional), undă animată, resume (localStorage),
   selector de episod, Media Session (controale pe lock screen),
   deep-link ?play=SPOTIFY_ID, link „Ascultă pe Spotify".
   ============================================================ */
(function () {
  "use strict";

  var EPISODES = window.PODCAST_EPISODES || [];
  if (!EPISODES.length) return;

  var byId = {};
  EPISODES.forEach(function (e) { byId[e.id] = e; });

  var SPEEDS = [1, 1.25, 1.5, 1.75, 2];
  var WAVE_BARS = 72;
  var DEFAULT_IMG = 'assets/hero-video-poster.jpg';  // imagine implicită (poți pune ep.image per episod)
  var LS_PREFIX = "ppl-pos-";      // localStorage: poziția de redare per episod
  var SAVE_EVERY = 5;              // salvează poziția la fiecare N secunde

  /* ---------- Injectează CSS-ul (o singură dată) ---------- */
  (function injectCss() {
    if (document.querySelector('link[data-ppl-css]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'assets/podcast-player.css';
    l.setAttribute('data-ppl-css', '');
    document.head.appendChild(l);
  })();

  /* ---------- Helpers ---------- */
  function fmt(s) {
    if (!isFinite(s) || s < 0) s = 0;
    s = Math.floor(s);
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    var mm = (h ? String(m).padStart(2, '0') : String(m));
    var ss = String(sec).padStart(2, '0');
    return (h ? h + ':' : '') + mm + ':' + ss;
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // RNG determinist pe id, ca unda să arate constant pentru același episod
  function seeded(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return function () { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  }

  /* ---------- Construiește modalul (o singură dată) ---------- */
  var els = {};
  var state = { ep: null, speedIdx: 0, lastOn: -1, saveT: 0, seeking: false };

  function build() {
    var back = document.createElement('div');
    back.className = 'ppl-backdrop';
    back.id = 'ppl-backdrop';
    back.setAttribute('role', 'dialog');
    back.setAttribute('aria-modal', 'true');
    back.setAttribute('aria-label', 'Player podcast');
    back.hidden = true;
    back.innerHTML =
      '<div class="ppl-card" role="document">' +
        '<button class="ppl-close" type="button" aria-label="Închide player-ul"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>' +
        '<div class="ppl-head">' +
          '<span class="ppl-tag">// Episod</span>' +
          '<div class="ppl-picker"><select class="ppl-select" aria-label="Alege episodul"></select>' +
          '<svg class="ppl-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg></div>' +
        '</div>' +
        '<div class="ppl-sub"></div>' +
        '<div class="ppl-split">' +
          '<div class="ppl-stage">' +
            '<div class="ppl-artwork"><img class="ppl-art-img" alt="Gazdele podcastului AI Accounting Hub"></div>' +
            '<div class="ppl-wave ppl-wave-thin" role="slider" tabindex="0" aria-label="Undă — apasă pentru a derula"></div>' +
            '<div class="ppl-transport">' +
              '<button class="ppl-tbtn ppl-back" type="button" aria-label="Înapoi 10 secunde"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6V3L8 7l4 4V8a5 5 0 1 1-5 5"/></svg><span class="ppl-n">10</span></button>' +
              '<button class="ppl-tbtn ppl-play" type="button" aria-label="Redă"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>' +
              '<button class="ppl-tbtn ppl-fwd" type="button" aria-label="Înainte 10 secunde"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6V3l4 4-4 4V8a5 5 0 1 0 5 5"/></svg><span class="ppl-n">10</span></button>' +
              '<button class="ppl-speed" type="button" aria-label="Viteză de redare">1&times;</button>' +
            '</div>' +
          '</div>' +
          '<div class="ppl-chaps">' +
            '<div class="ppl-chapters-head">Capitole <b class="ppl-ch-count"></b></div>' +
            '<ul class="ppl-chapters"></ul>' +
          '</div>' +
        '</div>' +
        '<div class="ppl-scrubber"><div class="ppl-scrub-row">' +
          '<span class="ppl-t ppl-cur">0:00</span>' +
          '<div class="ppl-track"><div class="ppl-fill"></div><div class="ppl-knob"></div></div>' +
          '<span class="ppl-t r ppl-dur">0:00</span>' +
        '</div></div>' +
        '<div class="ppl-foot"><span class="ppl-credit">Powered by NotebookLM</span><span class="ppl-dot">·</span><a class="ppl-spotify" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.6 14.4a.62.62 0 01-.86.21c-2.35-1.44-5.3-1.76-8.79-.96a.62.62 0 11-.28-1.22c3.81-.87 7.08-.5 9.72 1.11a.62.62 0 01.21.86zm1.23-2.74a.78.78 0 01-1.07.26c-2.69-1.66-6.79-2.14-9.98-1.17a.78.78 0 11-.45-1.49c3.64-1.1 8.16-.57 11.24 1.33a.78.78 0 01.26 1.07zm.11-2.85C14.42 8.9 9.1 8.73 6.03 9.66a.93.93 0 11-.54-1.79c3.52-1.07 9.4-.86 13.11 1.34a.93.93 0 11-.95 1.6z"/></svg><span class="ppl-splabel">Ascultă pe Spotify</span></a></div>' +
        '<audio class="ppl-audio" preload="metadata"></audio>' +
      '</div>';
    document.body.appendChild(back);

    els.back = back;
    els.card = back.querySelector('.ppl-card');
    els.close = back.querySelector('.ppl-close');
    els.select = back.querySelector('.ppl-select');
    els.sub = back.querySelector('.ppl-sub');
    els.wave = back.querySelector('.ppl-wave');
    els.artImg = back.querySelector('.ppl-art-img');
    els.play = back.querySelector('.ppl-play');
    els.playIcon = els.play.querySelector('svg');
    els.backBtn = back.querySelector('.ppl-back');
    els.fwdBtn = back.querySelector('.ppl-fwd');
    els.speed = back.querySelector('.ppl-speed');
    els.chaps = back.querySelector('.ppl-chapters');
    els.chCount = back.querySelector('.ppl-ch-count');
    els.cur = back.querySelector('.ppl-cur');
    els.dur = back.querySelector('.ppl-dur');
    els.track = back.querySelector('.ppl-track');
    els.fill = back.querySelector('.ppl-fill');
    els.knob = back.querySelector('.ppl-knob');
    els.spotify = back.querySelector('.ppl-spotify');
    els.audio = back.querySelector('.ppl-audio');

    buildDropdown();
    wire();
  }

  function buildDropdown() {
    var groups = {}, order = [];
    EPISODES.forEach(function (e) {
      var g = e.group || 'Episoade';
      if (!groups[g]) { groups[g] = []; order.push(g); }
      groups[g].push(e);
    });
    var html = '';
    order.forEach(function (g) {
      html += '<optgroup label="' + esc(g) + '">';
      groups[g].forEach(function (e) {
        html += '<option value="' + esc(e.id) + '">' + esc(e.ep + ' — ' + e.title) + '</option>';
      });
      html += '</optgroup>';
    });
    els.select.innerHTML = html;
  }

  /* ---------- Undă ---------- */
  function buildWave(id) {
    var rnd = seeded(id);
    var html = '';
    for (var i = 0; i < WAVE_BARS; i++) {
      var mix = 0.5 * Math.abs(Math.sin(i * 0.35 + rnd() * 2)) + 0.3 * Math.abs(Math.sin(i * 0.9 + 1.3)) + 0.2 * rnd();
      var taper = Math.pow(Math.sin(Math.PI * i / (WAVE_BARS - 1)), 0.55);
      var h = Math.max(8, Math.round((0.30 + 0.70 * mix) * taper * 100));
      html += '<i style="height:' + h + '%"></i>';
    }
    els.wave.innerHTML = html;
    state.lastOn = -1;
  }
  function paintWave(frac) {
    var bars = els.wave.children, n = bars.length;
    var on = Math.round(frac * n);
    if (on === state.lastOn) return;
    state.lastOn = on;
    for (var i = 0; i < n; i++) {
      var b = bars[i];
      var isOn = i < on;
      var isCur = i >= on - 3 && i <= on + 1;
      b.className = (isOn ? 'on' : '') + (isCur ? ' cur' : '');
    }
  }

  /* ---------- Capitole ---------- */
  function buildChapters(ep) {
    var ch = ep.chapters || [];
    if (!ch.length) {
      els.card.classList.remove('ppl-has-chapters');
      els.chaps.innerHTML = '';
      return;
    }
    els.card.classList.add('ppl-has-chapters');
    els.chCount.textContent = ch.length;
    els.chaps.innerHTML = ch.map(function (c, i) {
      return '<li data-t="' + c.t + '">' +
        '<span class="ppl-ch-time">' + fmt(c.t) + '</span>' +
        '<span class="ppl-ch-name">' + esc(c.title) + '</span>' +
        '<span class="ppl-ch-eq"><b></b><b></b><b></b></span></li>';
    }).join('');
  }
  function paintChapters(t) {
    var ep = state.ep; if (!ep || !ep.chapters || !ep.chapters.length) return;
    var idx = -1, ch = ep.chapters;
    for (var i = 0; i < ch.length; i++) { if (t >= ch[i].t) idx = i; else break; }
    var lis = els.chaps.children;
    for (var j = 0; j < lis.length; j++) lis[j].classList.toggle('active', j === idx);
  }

  /* ---------- Media Session ---------- */
  function setupMediaSession(ep) {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: ep.ep + ' — ' + ep.title,
        artist: 'AI Accounting Hub',
        album: ep.group || 'Podcast',
        artwork: [{ src: location.origin + '/assets/og-image.png', sizes: '512x512', type: 'image/png' }]
      });
      var A = els.audio;
      navigator.mediaSession.setActionHandler('play', function () { A.play(); });
      navigator.mediaSession.setActionHandler('pause', function () { A.pause(); });
      navigator.mediaSession.setActionHandler('seekbackward', function () { A.currentTime = Math.max(0, A.currentTime - 10); });
      navigator.mediaSession.setActionHandler('seekforward', function () { A.currentTime = Math.min(A.duration || 1e9, A.currentTime + 10); });
      navigator.mediaSession.setActionHandler('seekto', function (d) { if (d.seekTime != null) A.currentTime = d.seekTime; });
      navigator.mediaSession.setActionHandler('previoustrack', function () { step(-1); });
      navigator.mediaSession.setActionHandler('nexttrack', function () { step(1); });
    } catch (e) { /* unele browsere nu suportă toate acțiunile */ }
  }
  function updatePositionState() {
    if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
    var A = els.audio;
    if (!isFinite(A.duration)) return;
    try { navigator.mediaSession.setPositionState({ duration: A.duration, playbackRate: A.playbackRate, position: Math.min(A.currentTime, A.duration) }); } catch (e) {}
  }

  /* ---------- Încarcă un episod ---------- */
  function load(id, autoplay) {
    var ep = byId[id];
    if (!ep) return;
    state.ep = ep;
    els.select.value = id;
    els.sub.textContent = ep.group || '';
    els.spotify.href = 'https://open.spotify.com/episode/' + id;
    els.artImg.src = ep.image || DEFAULT_IMG;
    buildWave(id);
    buildChapters(ep);
    paintWave(0);
    els.cur.textContent = '0:00';
    els.dur.textContent = '…';
    setFill(0);
    els.audio.src = ep.audioUrl;
    els.audio.playbackRate = SPEEDS[state.speedIdx];
    els.audio.load();
    setupMediaSession(ep);
    // resume + autoplay se fac în 'loadedmetadata'
    state.pendingPlay = !!autoplay;
  }

  function step(dir) {
    var idx = EPISODES.indexOf(state.ep);
    if (idx < 0) return;
    var next = EPISODES[(idx + dir + EPISODES.length) % EPISODES.length];
    if (next) load(next.id, true);
  }

  /* ---------- Redare / poziție ---------- */
  function setFill(frac) {
    var pct = Math.max(0, Math.min(1, frac)) * 100;
    els.fill.style.width = pct + '%';
    els.knob.style.left = pct + '%';
  }
  function savePos() {
    var A = els.audio; if (!state.ep || !isFinite(A.duration)) return;
    try {
      if (A.currentTime > 5 && A.currentTime < A.duration - 5) localStorage.setItem(LS_PREFIX + state.ep.id, String(Math.floor(A.currentTime)));
      else localStorage.removeItem(LS_PREFIX + state.ep.id);
    } catch (e) {}
  }
  function restorePos() {
    var A = els.audio; if (!state.ep) return;
    try {
      var v = parseFloat(localStorage.getItem(LS_PREFIX + state.ep.id));
      if (v && v > 5 && isFinite(A.duration) && v < A.duration - 5) A.currentTime = v;
    } catch (e) {}
  }
  function setPlayIcon(playing) {
    els.playIcon.innerHTML = playing
      ? '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>'
      : '<path d="M8 5v14l11-7z"/>';
    els.play.setAttribute('aria-label', playing ? 'Pauză' : 'Redă');
  }

  /* ---------- Deschide / închide ---------- */
  function open(id, autoplay) {
    if (!els.back) build();
    if (!byId[id]) id = EPISODES[0].id;
    load(id, autoplay !== false);
    els.back.hidden = false;
    requestAnimationFrame(function () { els.back.classList.add('open'); });
    document.body.style.overflow = 'hidden';
    if (window.aiahTrack) window.aiahTrack('podcast:' + id);
  }
  function close() {
    if (!els.back) return;
    savePos();
    els.audio.pause();
    els.back.classList.remove('open');
    setTimeout(function () { els.back.hidden = true; document.body.style.overflow = ''; }, 320);
  }

  /* ---------- Legături de evenimente ---------- */
  function seekFromClientX(clientX) {
    var r = els.track.getBoundingClientRect();
    var frac = (clientX - r.left) / r.width;
    var A = els.audio;
    if (isFinite(A.duration)) A.currentTime = Math.max(0, Math.min(1, frac)) * A.duration;
  }
  function seekFromWave(clientX) {
    var r = els.wave.getBoundingClientRect();
    var frac = (clientX - r.left) / r.width;
    var A = els.audio;
    if (isFinite(A.duration)) A.currentTime = Math.max(0, Math.min(1, frac)) * A.duration;
  }

  function wire() {
    var A = els.audio;

    els.close.addEventListener('click', close);
    els.back.addEventListener('click', function (e) { if (e.target === els.back) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && els.back && !els.back.hidden) close(); });

    els.play.addEventListener('click', function () { if (A.paused) A.play(); else A.pause(); });
    els.backBtn.addEventListener('click', function () { A.currentTime = Math.max(0, A.currentTime - 10); });
    els.fwdBtn.addEventListener('click', function () { A.currentTime = Math.min(A.duration || 1e9, A.currentTime + 10); });
    els.speed.addEventListener('click', function () {
      state.speedIdx = (state.speedIdx + 1) % SPEEDS.length;
      A.playbackRate = SPEEDS[state.speedIdx];
      els.speed.innerHTML = SPEEDS[state.speedIdx] + '&times;';
      updatePositionState();
    });

    els.select.addEventListener('change', function () { load(els.select.value, true); });

    // scrubber
    els.track.addEventListener('click', function (e) { seekFromClientX(e.clientX); });
    els.track.addEventListener('pointerdown', function (e) {
      state.seeking = true; els.track.setPointerCapture(e.pointerId); seekFromClientX(e.clientX);
    });
    els.track.addEventListener('pointermove', function (e) { if (state.seeking) seekFromClientX(e.clientX); });
    els.track.addEventListener('pointerup', function () { state.seeking = false; });

    // undă = derulare
    els.wave.addEventListener('click', function (e) { seekFromWave(e.clientX); });

    // capitole = sari la timp
    els.chaps.addEventListener('click', function (e) {
      var li = e.target.closest('li[data-t]'); if (!li) return;
      A.currentTime = parseFloat(li.getAttribute('data-t')) || 0;
      if (A.paused) A.play();
    });

    // audio events
    A.addEventListener('loadedmetadata', function () {
      els.dur.textContent = fmt(A.duration);
      restorePos();
      updatePositionState();
      if (state.pendingPlay) { state.pendingPlay = false; A.play().catch(function () {}); }
    });
    A.addEventListener('timeupdate', function () {
      var d = A.duration || 0, t = A.currentTime;
      var frac = d ? t / d : 0;
      setFill(frac); paintWave(frac); paintChapters(t);
      els.cur.textContent = fmt(t);
      if (t - state.saveT >= SAVE_EVERY) { state.saveT = t; savePos(); }
    });
    A.addEventListener('play', function () { setPlayIcon(true); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'; updatePositionState(); });
    A.addEventListener('pause', function () { setPlayIcon(false); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'; savePos(); });
    A.addEventListener('ended', function () { setPlayIcon(false); try { localStorage.removeItem(LS_PREFIX + state.ep.id); } catch (e) {} });
    A.addEventListener('ratechange', updatePositionState);

    window.addEventListener('beforeunload', savePos);
  }

  /* ---------- Legare la triggere (.sp-trigger[data-spotify]) ---------- */
  document.addEventListener('click', function (e) {
    if (e.target.closest('.ep-read-link')) return; // excepție: link „Citește articolul"
    var trig = e.target.closest('.sp-trigger[data-spotify]');
    if (!trig) return;
    e.preventDefault(); e.stopPropagation();
    open(trig.getAttribute('data-spotify'), true);
  });
  // suport tastatură pentru triggere cu role=button
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var trig = e.target.closest && e.target.closest('.sp-trigger[data-spotify]');
    if (!trig || e.target.closest('.ep-read-link')) return;
    e.preventDefault();
    open(trig.getAttribute('data-spotify'), true);
  });

  /* ---------- API public + deep-link ?play=SPOTIFY_ID ---------- */
  window.openPodcastPlayer = open;
  window.openSpotifyModal = open; // compat cu apeluri vechi

  (function deepLink() {
    var id = new URLSearchParams(location.search).get('play');
    if (!id) return;
    window.addEventListener('load', function () { setTimeout(function () { open(id, false); }, 250); });
  })();
})();

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
  var DEFAULT_IMG = 'assets/imagine_podcast.webp';   // imagine implicită (poți pune ep.image per episod)
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
  var state = { ep: null, speedIdx: 0, lastOn: -1, saveT: 0, seeking: false, pickerOpen: false, speedOpen: false, shareT: 0 };

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
          '<div class="ppl-picker">' +
            '<select class="ppl-select" aria-label="Alege episodul"></select>' +
            '<svg class="ppl-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>' +
            /* Selector propriu, vizibil doar pe mobil — vezi podcast-player.css */
            '<button class="ppl-cbtn" type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="ppl-clist" aria-label="Alege episodul">' +
              '<span class="ppl-cbtn-label"></span>' +
              '<svg class="ppl-cbtn-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>' +
            '</button>' +
            '<div class="ppl-clist" id="ppl-clist" role="listbox" aria-label="Lista episoadelor"></div>' +
          '</div>' +
        '</div>' +
        '<div class="ppl-sub"></div>' +
        '<div class="ppl-split">' +
          '<div class="ppl-stage">' +
            '<div class="ppl-artwork"><img class="ppl-art-img" alt="Gazdele podcastului AI Accounting Hub"></div>' +
            '<div class="ppl-wave ppl-wave-thin" role="slider" tabindex="0" aria-label="Undă — apasă pentru a derula"></div>' +
            '<div class="ppl-transport">' +
              '<button class="ppl-tbtn ppl-back" type="button" aria-label="Înapoi 10 secunde"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a7 7 0 1 1-6.9 5.8"/><path d="M12 2 8.4 5 12 8"/></svg><span class="ppl-n">10</span></button>' +
              '<button class="ppl-tbtn ppl-play" type="button" aria-label="Redă"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>' +
              '<button class="ppl-tbtn ppl-fwd" type="button" aria-label="Înainte 10 secunde"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a7 7 0 1 0 6.9 5.8"/><path d="M12 2 15.6 5 12 8"/></svg><span class="ppl-n">10</span></button>' +
              '<div class="ppl-speed-wrap">' +
                '<select class="ppl-speed" aria-label="Viteză de redare"><option value="0.75">0.75&times;</option><option value="1" selected>1&times;</option><option value="1.25">1.25&times;</option><option value="1.5">1.5&times;</option><option value="1.75">1.75&times;</option><option value="2">2&times;</option></select>' +
                '<svg class="ppl-speed-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>' +
                /* Selector propriu de viteză, vizibil doar pe mobil — vezi podcast-player.css */
                '<button class="ppl-sbtn" type="button" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="ppl-slist" aria-label="Viteză de redare">' +
                  '<span class="ppl-sbtn-label">1&times;</span>' +
                  '<svg class="ppl-sbtn-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>' +
                '</button>' +
                '<div class="ppl-slist" id="ppl-slist" role="listbox" aria-label="Viteze de redare"></div>' +
              '</div>' +
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
        '<div class="ppl-sharewrap">' +
          '<button class="ppl-share" type="button" aria-label="Distribuie episodul">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>' +
            '<span class="ppl-share-label">Distribuie episodul</span>' +
          '</button>' +
        '</div>' +
        '<div class="ppl-foot"><span class="ppl-credit">Powered by NotebookLM</span><span class="ppl-dot">·</span><a class="ppl-spotify" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.6 14.4a.62.62 0 01-.86.21c-2.35-1.44-5.3-1.76-8.79-.96a.62.62 0 11-.28-1.22c3.81-.87 7.08-.5 9.72 1.11a.62.62 0 01.21.86zm1.23-2.74a.78.78 0 01-1.07.26c-2.69-1.66-6.79-2.14-9.98-1.17a.78.78 0 11-.45-1.49c3.64-1.1 8.16-.57 11.24 1.33a.78.78 0 01.26 1.07zm.11-2.85C14.42 8.9 9.1 8.73 6.03 9.66a.93.93 0 11-.54-1.79c3.52-1.07 9.4-.86 13.11 1.34a.93.93 0 11-.95 1.6z"/></svg><span class="ppl-splabel">Ascultă pe Spotify</span></a></div>' +
        '<audio class="ppl-audio" preload="metadata"></audio>' +
      '</div>';
    document.body.appendChild(back);

    els.back = back;
    els.card = back.querySelector('.ppl-card');
    els.close = back.querySelector('.ppl-close');
    els.select = back.querySelector('.ppl-select');
    els.picker = back.querySelector('.ppl-picker');
    els.cbtn = back.querySelector('.ppl-cbtn');
    els.cbtnLabel = back.querySelector('.ppl-cbtn-label');
    els.clist = back.querySelector('.ppl-clist');
    els.sub = back.querySelector('.ppl-sub');
    els.wave = back.querySelector('.ppl-wave');
    els.artImg = back.querySelector('.ppl-art-img');
    els.play = back.querySelector('.ppl-play');
    els.playIcon = els.play.querySelector('svg');
    els.backBtn = back.querySelector('.ppl-back');
    els.fwdBtn = back.querySelector('.ppl-fwd');
    els.speed = back.querySelector('.ppl-speed');
    els.speedWrap = back.querySelector('.ppl-speed-wrap');
    els.sbtn = back.querySelector('.ppl-sbtn');
    els.sbtnLabel = back.querySelector('.ppl-sbtn-label');
    els.slist = back.querySelector('.ppl-slist');
    els.chaps = back.querySelector('.ppl-chapters');
    els.chCount = back.querySelector('.ppl-ch-count');
    els.cur = back.querySelector('.ppl-cur');
    els.dur = back.querySelector('.ppl-dur');
    els.track = back.querySelector('.ppl-track');
    els.fill = back.querySelector('.ppl-fill');
    els.knob = back.querySelector('.ppl-knob');
    els.spotify = back.querySelector('.ppl-spotify');
    els.share = back.querySelector('.ppl-share');
    els.shareLabel = back.querySelector('.ppl-share-label');
    els.audio = back.querySelector('.ppl-audio');

    buildDropdown();
    buildSpeedList();
    syncSpeedPicker();
    wire();
  }

  function buildDropdown() {
    var groups = {}, order = [];
    EPISODES.forEach(function (e) {
      var g = e.group || 'Episoade';
      if (!groups[g]) { groups[g] = []; order.push(g); }
      groups[g].push(e);
    });
    /* Două randări din aceeași grupare: <select>-ul nativ (folosit pe desktop)
       și lista proprie (folosită pe mobil). */
    var opts = '', list = '';
    order.forEach(function (g) {
      opts += '<optgroup label="' + esc(g) + '">';
      list += '<div class="ppl-cgroup" role="presentation">' + esc(g) + '</div>';
      groups[g].forEach(function (e) {
        var label = esc(e.ep + ' — ' + e.title);
        opts += '<option value="' + esc(e.id) + '">' + label + '</option>';
        list += '<div class="ppl-copt" role="option" tabindex="-1" aria-selected="false"' +
                ' data-id="' + esc(e.id) + '" title="' + label + '">' + label + '</div>';
      });
      opts += '</optgroup>';
    });
    els.select.innerHTML = opts;
    els.clist.innerHTML = list;
  }

  /* ---------- Selector propriu de episod (activ doar pe mobil) ----------
     Pe Android lista unui <select> nativ e desenată de sistem: font mare și
     titlurile rupte pe 2–3 rânduri, iar CSS-ul pe <option> (font-size,
     text-overflow: ellipsis) e ignorat. Pe desktop lista nativă arată bine, așa
     că acolo rămâne ea — comutarea se face pe lățime, din CSS.
     <select>-ul rămâne în DOM în ambele cazuri și rămâne sursa de adevăr pentru
     valoare; lista proprie doar apelează load(), exact ca handlerul de 'change'. */
  function openPicker() {
    if (state.pickerOpen) return;
    state.pickerOpen = true;
    els.picker.classList.add('ppl-picker-open');
    els.cbtn.setAttribute('aria-expanded', 'true');
    var sel = els.clist.querySelector('.ppl-copt[aria-selected="true"]') || els.clist.querySelector('.ppl-copt');
    if (sel) { sel.focus(); sel.scrollIntoView({ block: 'nearest' }); }
    layerPush();
  }
  function closePicker(refocus, fromHist) {
    if (!state.pickerOpen) return;
    state.pickerOpen = false;
    els.picker.classList.remove('ppl-picker-open');
    els.cbtn.setAttribute('aria-expanded', 'false');
    if (refocus) els.cbtn.focus();
    if (!fromHist) layerPop(1);
  }
  function pickEpisode(id) {
    closePicker(true);
    load(id, true);
  }
  /* Ține eticheta butonului și rândul marcat în sincron cu <select>. */
  function syncPicker(id) {
    var ep = byId[id];
    els.cbtnLabel.textContent = ep ? ep.ep + ' — ' + ep.title : '';
    var opts = els.clist.querySelectorAll('.ppl-copt');
    for (var i = 0; i < opts.length; i++) {
      opts[i].setAttribute('aria-selected', opts[i].getAttribute('data-id') === id ? 'true' : 'false');
    }
  }
  function moveOpt(from, dir) {
    var opts = [].slice.call(els.clist.querySelectorAll('.ppl-copt'));
    var i = opts.indexOf(from);
    var next = opts[Math.max(0, Math.min(opts.length - 1, (i < 0 ? 0 : i) + dir))];
    if (next) { next.focus(); next.scrollIntoView({ block: 'nearest' }); }
  }

  /* ---------- Selector propriu de viteză (activ doar pe mobil) ----------
     Aceeași problemă și aceeași soluție ca la episoade: pe Android lista unui
     <select> nativ e desenată de sistem, cu fontul lui și fără culorile noastre.
     Opțiunile se citesc din <select>, ca să nu existe două liste de viteze; la
     alegere setăm valoarea în select și lansăm 'change', deci calculul lui
     playbackRate rămâne într-un singur loc (handlerul din wire()). */
  function buildSpeedList() {
    var html = '';
    for (var i = 0; i < els.speed.options.length; i++) {
      var o = els.speed.options[i];
      html += '<div class="ppl-sopt" role="option" tabindex="-1" aria-selected="false"' +
              ' data-val="' + esc(o.value) + '">' + esc(o.textContent) + '</div>';
    }
    els.slist.innerHTML = html;
  }
  function openSpeedPicker() {
    if (state.speedOpen) return;
    state.speedOpen = true;
    els.speedWrap.classList.add('ppl-speed-open');
    els.sbtn.setAttribute('aria-expanded', 'true');
    var sel = els.slist.querySelector('.ppl-sopt[aria-selected="true"]') || els.slist.querySelector('.ppl-sopt');
    if (sel) { sel.focus(); sel.scrollIntoView({ block: 'nearest' }); }
    layerPush();
  }
  function closeSpeedPicker(refocus, fromHist) {
    if (!state.speedOpen) return;
    state.speedOpen = false;
    els.speedWrap.classList.remove('ppl-speed-open');
    els.sbtn.setAttribute('aria-expanded', 'false');
    if (refocus) els.sbtn.focus();
    if (!fromHist) layerPop(1);
  }
  function pickSpeed(val) {
    closeSpeedPicker(true);
    els.speed.value = val;
    els.speed.dispatchEvent(new Event('change'));
  }
  /* Ține eticheta și rândul marcat în sincron cu <select> — inclusiv când viteza
     e schimbată din select-ul nativ, pe desktop. */
  function syncSpeedPicker() {
    var v = els.speed.value;
    var opts = els.slist.querySelectorAll('.ppl-sopt');
    for (var i = 0; i < opts.length; i++) {
      var activ = opts[i].getAttribute('data-val') === v;
      opts[i].setAttribute('aria-selected', activ ? 'true' : 'false');
      if (activ) els.sbtnLabel.textContent = opts[i].textContent;
    }
  }
  function moveSopt(from, dir) {
    var opts = [].slice.call(els.slist.querySelectorAll('.ppl-sopt'));
    var i = opts.indexOf(from);
    var next = opts[Math.max(0, Math.min(opts.length - 1, (i < 0 ? 0 : i) + dir))];
    if (next) { next.focus(); next.scrollIntoView({ block: 'nearest' }); }
  }

  /* ---------- Undă ---------- */
  function buildWave(id) {
    var rnd = seeded(id);
    var html = '';
    for (var i = 0; i < WAVE_BARS; i++) {
      var mix = 0.5 * Math.abs(Math.sin(i * 0.35 + rnd() * 2)) + 0.3 * Math.abs(Math.sin(i * 0.9 + 1.3)) + 0.2 * rnd();
      var taper = Math.pow(Math.sin(Math.PI * i / (WAVE_BARS - 1)), 0.55);
      var h = Math.max(8, Math.round((0.30 + 0.70 * mix) * taper * 100));
      var del = (-rnd() * 1.4).toFixed(2);          // fază proprie
      var dur = (0.65 + rnd() * 0.9).toFixed(2);     // ritm propriu
      html += '<i style="height:' + h + '%;--d:' + del + 's;--t:' + dur + 's"></i>';
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
  /* Liniuțe pe bara de derulare = începuturi de capitol */
  function renderTicks() {
    var old = els.track.querySelectorAll('.ppl-tick');
    for (var i = 0; i < old.length; i++) old[i].remove();
    var ep = state.ep, d = els.audio.duration;
    if (!ep || !ep.chapters || !ep.chapters.length || !isFinite(d) || !d) return;
    ep.chapters.forEach(function (c) {
      if (c.t <= 0) return;
      var tick = document.createElement('span');
      tick.className = 'ppl-tick';
      tick.style.left = (c.t / d * 100) + '%';
      els.track.insertBefore(tick, els.knob);
    });
  }

  /* ---------- Media Session ---------- */
  function setupMediaSession(ep) {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: ep.ep + ' — ' + ep.title,
        artist: 'AI Accounting Hub',
        album: ep.group || 'Podcast',
        artwork: [{ src: location.origin + '/assets/podcast-artwork.jpg', sizes: '1080x1080', type: 'image/jpeg' }]
      });
      var A = els.audio;
      navigator.mediaSession.setActionHandler('play', function () { A.play(); });
      navigator.mediaSession.setActionHandler('pause', function () { A.pause(); });
      navigator.mediaSession.setActionHandler('seekbackward', function (d) { seekTo(A.currentTime - (d && d.seekOffset ? d.seekOffset : 10)); });
      navigator.mediaSession.setActionHandler('seekforward', function (d) { seekTo(A.currentTime + (d && d.seekOffset ? d.seekOffset : 10)); });
      navigator.mediaSession.setActionHandler('seekto', function (d) { if (d.seekTime != null) seekTo(d.seekTime); });
      // Fără previoustrack/nexttrack: eliberăm sloturile ca sistemul să afișeze butoanele de skip ±10s
      try { navigator.mediaSession.setActionHandler('previoustrack', null); } catch (e) {}
      try { navigator.mediaSession.setActionHandler('nexttrack', null); } catch (e) {}
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
    syncPicker(id);
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
    els.audio.playbackRate = parseFloat(els.speed.value) || 1;
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
  /* Seek robust pentru fMP4: dacă săritura aterizează prea devreme (fragmentul
     nu e încă încărcat), reîncearcă automat până nimerește poziția cerută. */
  function seekTo(t) {
    var A = els.audio;
    if (!isFinite(A.duration)) { A.currentTime = t; return; }
    t = Math.max(0, Math.min(t, A.duration - 0.3));
    A.currentTime = t;
    var tries = 0;
    (function verify() {
      if (tries++ > 24) return;
      if (A.currentTime < t - 1.2) { A.currentTime = t; setTimeout(verify, 220); }
    })();
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
      if (v && v > 5 && isFinite(A.duration) && v < A.duration - 5) seekTo(v);
    } catch (e) {}
  }
  function setPlayIcon(playing) {
    els.playIcon.innerHTML = playing
      ? '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>'
      : '<path d="M8 5v14l11-7z"/>';
    els.play.setAttribute('aria-label', playing ? 'Pauză' : 'Redă');
  }

  /* ---------- Distribuire ----------
     Linkul partajat e cel scurt, /p/<slug> — arată curat într-o conversație și
     are metadate OG proprii. Dacă un episod n-are încă slug, cădem pe deep-link.
     Foaia nativă de partajare doar pe ecrane cu atingere: pe desktop, Windows
     deschide un panou greoi, aşa că acolo copiem linkul, care e ce vrea omul. */
  function shareUrl(id) {
    var ep = byId[id];
    if (ep && ep.slug) return 'https://aiaccountinghub.ro/p/' + ep.slug;
    return location.origin + '/podcast.html?play=' + id;
  }
  function flashShare(msg) {
    if (!els.shareLabel) return;
    var old = els.shareLabel.getAttribute('data-old') || els.shareLabel.textContent;
    els.shareLabel.setAttribute('data-old', old);
    els.shareLabel.textContent = msg;
    els.share.classList.add('ppl-share-ok');
    clearTimeout(state.shareT);
    state.shareT = setTimeout(function () {
      els.shareLabel.textContent = old;
      els.share.classList.remove('ppl-share-ok');
    }, 1800);
  }
  function copyLink(url) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () { flashShare('Link copiat ✓'); },
                                              function () { flashShare('Copiază: ' + url); });
      return;
    }
    var ta = document.createElement('textarea');
    ta.value = url; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    flashShare(ok ? 'Link copiat ✓' : 'Copiază: ' + url);
  }
  function doShare() {
    var id = state.ep;
    if (!id) return;
    var ep = byId[id] || {};
    var url = shareUrl(id);
    var title = (ep.ep ? ep.ep + ' — ' : '') + (ep.title || 'Podcast AI Accounting Hub');
    var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (navigator.share && touch) {
      navigator.share({ title: title, text: title, url: url })["catch"](function () {});
    } else {
      copyLink(url);
    }
    if (window.aiahTrack) window.aiahTrack('podcast:share:' + id);
  }

  /* ---------- Tasta „înapoi" pe mobil ----------
     Fiecare strat vizual (player, listă episoade, listă viteze) primeşte propria
     intrare în istoric. Astfel „back" închide doar stratul de deasupra în loc să
     scoată utilizatorul de pe site — iar episodul rămâne în redare când închizi
     doar lista. `skip` marchează salturile pe care le facem noi din interfaţă,
     ca popstate-ul rezultat să nu mai închidă încă un strat. */
  var hist = { depth: 0, skip: false, skipT: 0 };

  function layerPush() {
    try { hist.depth++; history.pushState({ ppl: hist.depth }, ''); }
    catch (e) { hist.depth--; }   // istoric indisponibil — degradare tăcută
  }
  function layerPop(n) {
    var k = Math.min(n || 1, hist.depth);
    if (k <= 0) return;
    hist.depth -= k;
    hist.skip = true;
    clearTimeout(hist.skipT);
    hist.skipT = setTimeout(function () { hist.skip = false; }, 500);
    history.go(-k);
  }
  function openLayers() {
    return (state.speedOpen ? 1 : 0) + (state.pickerOpen ? 1 : 0) +
           (els.back && !els.back.hidden ? 1 : 0);
  }
  window.addEventListener('popstate', function () {
    if (hist.skip) { hist.skip = false; clearTimeout(hist.skipT); return; }
    if (hist.depth > 0) hist.depth--;
    if (state.speedOpen) { closeSpeedPicker(true, true); return; }
    if (state.pickerOpen) { closePicker(true, true); return; }
    if (els.back && !els.back.hidden) close(true);
  });

  /* ---------- Deschide / închide ---------- */
  function open(id, autoplay) {
    if (!els.back) build();
    if (!byId[id]) id = EPISODES[0].id;
    var wasOpen = !els.back.hidden;
    load(id, autoplay !== false);
    els.back.hidden = false;
    requestAnimationFrame(function () { els.back.classList.add('open'); });
    document.body.style.overflow = 'hidden';
    if (!wasOpen) layerPush();
    if (window.aiahTrack) window.aiahTrack('podcast:' + id);
  }
  function close(fromHist) {
    if (!els.back) return;
    var n = fromHist ? 0 : openLayers();
    closePicker(false, true);
    closeSpeedPicker(false, true);
    savePos();
    els.audio.pause();
    els.back.classList.remove('open');
    setTimeout(function () { els.back.hidden = true; document.body.style.overflow = ''; }, 320);
    if (n > 0) layerPop(n);
  }

  /* ---------- Legături de evenimente ---------- */
  function seekFromClientX(clientX) {
    var r = els.track.getBoundingClientRect();
    var frac = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    var A = els.audio;
    // feedback vizual instant (nu așteptăm timeupdate) → derulare fluidă pe mobil
    setFill(frac);
    if (isFinite(A.duration)) { state.seekReq = frac * A.duration; els.cur.textContent = fmt(state.seekReq); A.currentTime = state.seekReq; }
  }

  function wire() {
    var A = els.audio;

    // fără wrapper, obiectul Event ar ajunge pe parametrul `fromHist` al lui close()
    els.close.addEventListener('click', function () { close(); });
    els.back.addEventListener('click', function (e) { if (e.target === els.back) close(); });
    els.share.addEventListener('click', doShare);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && els.back && !els.back.hidden) close(); });

    els.play.addEventListener('click', function () { if (A.paused) A.play(); else A.pause(); });
    els.backBtn.addEventListener('click', function () { seekTo(A.currentTime - 10); });
    els.fwdBtn.addEventListener('click', function () { seekTo(A.currentTime + 10); });
    els.speed.addEventListener('change', function () {
      A.playbackRate = parseFloat(els.speed.value) || 1;
      syncSpeedPicker();
      updatePositionState();
    });

    els.select.addEventListener('change', function () { load(els.select.value, true); });

    /* Selectorul propriu (mobil) — vezi openPicker() */
    els.cbtn.addEventListener('click', function () {
      if (state.pickerOpen) closePicker(true); else openPicker();
    });
    els.cbtn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openPicker(); }
    });
    els.clist.addEventListener('click', function (e) {
      var o = e.target.closest('.ppl-copt');
      if (o) pickEpisode(o.getAttribute('data-id'));
    });
    els.clist.addEventListener('keydown', function (e) {
      // Escape închide doar lista, nu tot player-ul (handlerul din document, mai jos)
      if (e.key === 'Escape') { e.stopPropagation(); closePicker(true); return; }
      var o = e.target.closest('.ppl-copt');
      if (!o) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); moveOpt(o, 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveOpt(o, -1); }
      else if (e.key === 'Home') { e.preventDefault(); moveOpt(o, -999); }
      else if (e.key === 'End') { e.preventDefault(); moveOpt(o, 999); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickEpisode(o.getAttribute('data-id')); }
      else if (e.key === 'Tab') closePicker(false);
    });

    /* Selectorul propriu de viteză (mobil) — vezi openSpeedPicker() */
    els.sbtn.addEventListener('click', function () {
      if (state.speedOpen) closeSpeedPicker(true); else openSpeedPicker();
    });
    els.sbtn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openSpeedPicker(); }
    });
    els.slist.addEventListener('click', function (e) {
      var o = e.target.closest('.ppl-sopt');
      if (o) pickSpeed(o.getAttribute('data-val'));
    });
    els.slist.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); closeSpeedPicker(true); return; }
      var o = e.target.closest('.ppl-sopt');
      if (!o) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); moveSopt(o, 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveSopt(o, -1); }
      else if (e.key === 'Home') { e.preventDefault(); moveSopt(o, -999); }
      else if (e.key === 'End') { e.preventDefault(); moveSopt(o, 999); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickSpeed(o.getAttribute('data-val')); }
      else if (e.key === 'Tab') closeSpeedPicker(false);
    });

    // tap oriunde altundeva în card închide listele deschise
    els.card.addEventListener('click', function (e) {
      if (state.pickerOpen && !e.target.closest('.ppl-picker')) closePicker(false);
      if (state.speedOpen && !e.target.closest('.ppl-speed-wrap')) closeSpeedPicker(false);
    });

    // scrubber
    els.track.addEventListener('pointerdown', function (e) {
      state.seeking = true; els.track.setPointerCapture(e.pointerId); seekFromClientX(e.clientX);
    });
    els.track.addEventListener('pointermove', function (e) { if (state.seeking) seekFromClientX(e.clientX); });
    function endSeek() { if (!state.seeking) return; state.seeking = false; if (state.seekReq != null) seekTo(state.seekReq); }
    els.track.addEventListener('pointerup', endSeek);
    els.track.addEventListener('pointercancel', endSeek);

    // undă = derulare
    els.wave.addEventListener('click', function (e) {
      var r = els.wave.getBoundingClientRect();
      if (isFinite(A.duration)) seekTo(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * A.duration);
    });

    // capitole = sari la timp
    els.chaps.addEventListener('click', function (e) {
      var li = e.target.closest('li[data-t]'); if (!li) return;
      seekTo(parseFloat(li.getAttribute('data-t')) || 0);
      if (A.paused) A.play();
    });

    // audio events
    A.addEventListener('loadedmetadata', function () {
      els.dur.textContent = fmt(A.duration);
      renderTicks();
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
    A.addEventListener('play', function () { setPlayIcon(true); els.wave.classList.add('playing'); els.card.classList.add('playing'); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing'; updatePositionState(); });
    A.addEventListener('pause', function () { setPlayIcon(false); els.wave.classList.remove('playing'); els.card.classList.remove('playing'); if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'; savePos(); });
    A.addEventListener('ended', function () { setPlayIcon(false); els.wave.classList.remove('playing'); els.card.classList.remove('playing'); try { localStorage.removeItem(LS_PREFIX + state.ep.id); } catch (e) {} });
    A.addEventListener('ratechange', updatePositionState);

    window.addEventListener('beforeunload', savePos);
  }

  /* ---------- Legare la triggere (.sp-trigger[data-spotify]) ---------- */
  /* Excepţii în interiorul unui card-trigger. stopPropagation() din handlerul
     butonului nu ar fi suficient: ambele ascultă pe `document`, iar acolo el nu
     opreşte celelalte handlere de pe acelaşi nod. */
  function insideException(t) {
    return !!(t.closest('.ep-read-link') || t.closest('.episode-share'));
  }
  document.addEventListener('click', function (e) {
    if (insideException(e.target)) return; // „Citește articolul" / „Distribuie"
    var trig = e.target.closest('.sp-trigger[data-spotify]');
    if (!trig) return;
    e.preventDefault(); e.stopPropagation();
    open(trig.getAttribute('data-spotify'), true);
  });
  // suport tastatură pentru triggere cu role=button
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var trig = e.target.closest && e.target.closest('.sp-trigger[data-spotify]');
    if (!trig || insideException(e.target)) return;
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

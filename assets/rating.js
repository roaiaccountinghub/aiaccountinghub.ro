/* Rating articole 1-5 stele — AI Accounting Hub
   Backend: Cloudflare Worker + D1. Fără date personale (doar agregat pe server;
   votul propriu e reținut local, per dispozitiv, în localStorage).
   Montare: un element <div id="article-rating" data-article="<slug>"></div>
   la finalul articolului + <script src="assets/rating.js" defer></script>. */
(function () {
  var API = "https://aiah-backend.aiaccountinghub.workers.dev";

  var mount = document.getElementById("article-rating");
  if (!mount) return;

  var articleId = mount.getAttribute("data-article") ||
    (location.pathname.split("/").pop() || "").replace(/\.html?$/i, "");
  if (!articleId) return;

  var LS_KEY = "aiah-vote:" + articleId;
  var myVote = parseInt(localStorage.getItem(LS_KEY), 10);
  if (!(myVote >= 1 && myVote <= 5)) myVote = null;

  var curAvg = 0, curVotes = 0, hoverVal = null, busy = false;

  injectCSS();
  mount.className = "aiah-rate";
  mount.innerHTML =
    '<div class="aiah-rate-title">Ți-a fost util acest articol?</div>' +
    '<div class="aiah-rate-sub">Evaluează-l de la 1 la 5 stele.</div>' +
    '<div class="aiah-rate-row">' +
      '<div class="aiah-stars" role="group" aria-label="Evaluare articol">' +
        '<div class="aiah-stars-bg">★★★★★</div>' +
        '<div class="aiah-stars-fg"></div>' +
        '<div class="aiah-stars-hit"></div>' +
      '</div>' +
      '<div class="aiah-avg" aria-hidden="true">—</div>' +
    '</div>' +
    '<div class="aiah-rate-status"></div>';

  var fg = mount.querySelector(".aiah-stars-fg");
  var hit = mount.querySelector(".aiah-stars-hit");
  var avgEl = mount.querySelector(".aiah-avg");
  var statusEl = mount.querySelector(".aiah-rate-status");

  fg.textContent = "★★★★★";
  for (var i = 1; i <= 5; i++) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("data-v", i);
    b.setAttribute("aria-label", i + (i === 1 ? " stea" : " stele"));
    b.addEventListener("mouseenter", onEnter);
    b.addEventListener("mouseleave", onLeave);
    b.addEventListener("click", onClick);
    hit.appendChild(b);
  }

  function onEnter(e) { hoverVal = parseInt(e.currentTarget.getAttribute("data-v"), 10); render(); }
  function onLeave() { hoverVal = null; render(); }
  function onClick(e) {
    if (busy) return;
    var v = parseInt(e.currentTarget.getAttribute("data-v"), 10);
    if (v === myVote) return;
    submit(v);
  }

  function render() {
    var pct;
    if (hoverVal !== null) pct = hoverVal * 20;
    else pct = curVotes > 0 ? (curAvg / 5) * 100 : 0;
    fg.style.width = pct + "%";
    avgEl.textContent = curVotes > 0 ? curAvg.toFixed(1) : "—";

    if (hoverVal !== null) {
      statusEl.textContent = (myVote ? "Schimbă în " : "Votează ") + hoverVal + (hoverVal === 1 ? " stea" : " stele");
    } else if (myVote !== null) {
      statusEl.innerHTML = "Votul tău: " + myVote + "★ · apasă altă stea ca să-l schimbi.";
    } else {
      statusEl.textContent = curVotes > 0 ? "Apasă pe stele pentru a-ți lăsa votul." : "Fii primul care evaluează articolul.";
    }
  }

  function submit(v) {
    busy = true;
    var payload = { article: articleId, stars: v };
    if (myVote !== null) payload.prev = myVote;
    fetch(API + "/rating", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && typeof d.average === "number") {
          curAvg = d.average; curVotes = d.votes || 0;
          myVote = v; localStorage.setItem(LS_KEY, String(v));
          hoverVal = null; render();
        }
      })
      .catch(function () {
        statusEl.textContent = "Nu s-a putut înregistra votul. Încearcă din nou.";
      })
      .then(function () { busy = false; });
  }

  fetch(API + "/rating?article=" + encodeURIComponent(articleId))
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d && typeof d.average === "number") { curAvg = d.average; curVotes = d.votes || 0; }
      render();
    })
    .catch(function () { render(); });

  function injectCSS() {
    if (document.getElementById("aiah-rate-css")) return;
    var s = document.createElement("style");
    s.id = "aiah-rate-css";
    s.textContent =
      ".aiah-rate{margin:40px 0 8px;padding:24px 26px;background:var(--bg-card);border:1px solid var(--border);border-radius:16px;text-align:center;}" +
      ".aiah-rate-title{font-family:'Space Grotesk',sans-serif;font-size:18px;font-weight:600;color:var(--fg);margin-bottom:4px;}" +
      ".aiah-rate-sub{font-size:13px;color:var(--fg-muted);margin-bottom:16px;}" +
      ".aiah-rate-row{display:inline-flex;align-items:center;gap:14px;}" +
      ".aiah-stars{position:relative;display:inline-block;font-size:34px;line-height:1;letter-spacing:5px;}" +
      ".aiah-stars-bg{color:var(--fg-dim);}" +
      ".aiah-stars-fg{position:absolute;top:0;left:0;width:0;overflow:hidden;white-space:nowrap;color:var(--accent-warm);}" +
      ".aiah-stars-hit{position:absolute;inset:0;display:flex;}" +
      ".aiah-stars-hit button{flex:1;background:transparent;border:0;padding:0;margin:0;cursor:pointer;}" +
      ".aiah-avg{font-family:'JetBrains Mono',monospace;font-size:20px;color:var(--fg);min-width:38px;text-align:left;}" +
      ".aiah-rate-status{font-size:13px;color:var(--fg-muted);margin-top:14px;min-height:18px;}";
    document.head.appendChild(s);
  }
})();

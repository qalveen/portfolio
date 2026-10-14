/* main.js — Calvin Magsie portfolio interactions */
(function () {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* Footer year */
  $$(".year").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Theme ---------- */
  var themeBtn = $("#themeToggle");
  function syncTheme() {
    var dark = root.getAttribute("data-theme") === "dark";
    themeBtn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    var m = $('meta[name="theme-color"]'); if (m) m.content = dark ? "#140c0f" : "#ffffff";
    if (window.__drawCourt) window.__drawCourt();
  }
  themeBtn.addEventListener("click", function () {
    var dark = root.getAttribute("data-theme") !== "dark";
    if (dark) root.setAttribute("data-theme", "dark"); else root.removeAttribute("data-theme");
    store("theme", dark ? "dark" : "light");
    syncTheme();
  });

  /* ---------- Nav: scrolled state, progress bar, mobile menu, active link ---------- */
  var nav = $("#nav"), bar = $("#progress"), menuBtn = $("#menuBtn");
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle("is-scrolled", y > 8);
    bar.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  menuBtn.addEventListener("click", function () {
    var open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  $$("#navLinks a").forEach(function (a) {
    a.addEventListener("click", function () { nav.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false"); });
  });

  var links = $$("#navLinks a");
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["work", "about", "fun", "experience", "skills", "contact"].forEach(function (id) {
      var el = document.getElementById(id); if (el) spy.observe(el);
    });
  }

  /* ---------- Ask me ---------- */
  var ANSWERS = {
    what:  "I'm a business and data analyst. I dig into messy data, find what's really driving the numbers, and turn it into dashboards and recommendations people can act on.",
    roles: "Business analyst and data analyst roles, especially where analytics meets strategy and stakeholders. I'm most excited about finance, automotive and autonomous vehicles, AI, and sports.",
    tools: "SQL and Excel every day, Tableau and Power BI for reporting, and Python (Pandas, scikit-learn, Streamlit) when a question needs a model or an app.",
    why:   "Because the best part of any project is the moment a clear chart changes someone's decision. I like being the person who translates between the data and the business.",
    fun:   "Padel, soccer, basketball, cars and movies. Scroll down to Off the clock and see how long you can keep a padel rally going."
  };
  var ansEl = $("#askAnswer"), liveEl = $("#askLive"), typeTimer;
  function ask(key) {
    var text = ANSWERS[key]; clearInterval(typeTimer);
    liveEl.textContent = text;
    if (reduce) { ansEl.textContent = text; return; }
    var i = 0; ansEl.innerHTML = '<span></span><span class="caret"></span>';
    var out = ansEl.firstChild;
    typeTimer = setInterval(function () {
      i += 2; out.textContent = text.slice(0, i);
      if (i >= text.length) clearInterval(typeTimer);
    }, 16);
  }
  $$("#askQs .chip").forEach(function (b) {
    b.addEventListener("click", function () {
      $$("#askQs .chip").forEach(function (o) { o.setAttribute("aria-pressed", o === b); });
      ask(b.dataset.q);
    });
  });
  setTimeout(function () { ask("what"); }, reduce ? 0 : 900);

  /* ---------- Project filters ---------- */
  var works = $$(".work");
  $$("[data-filter]").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.dataset.filter;
      $$("[data-filter]").forEach(function (o) { o.setAttribute("aria-pressed", o === b); });
      works.forEach(function (w, i) {
        var show = f === "all" || w.dataset.cat.split(" ").indexOf(f) > -1;
        w.classList.toggle("is-hidden", !show);
        w.classList.remove("is-entering");
        if (show && !reduce) { void w.offsetWidth; w.style.animationDelay = (i * 50) + "ms"; w.classList.add("is-entering"); }
      });
    });
  });

  /* ---------- Case study dialog ---------- */
  var dlg = $("#case"), dlgBody = $("#caseContent"), lastTrigger = null;
  works.forEach(function (w) {
    w.addEventListener("click", function () {
      var tpl = document.getElementById("case-" + w.dataset.case);
      if (!tpl || !dlg.showModal) { return; }
      lastTrigger = w;
      dlgBody.innerHTML = ""; dlgBody.appendChild(tpl.content.cloneNode(true));
      $$("video", dlgBody).forEach(function (v) { v.muted = true; if (reduce) { v.removeAttribute("autoplay"); v.controls = true; } });
      dlg.showModal(); dlg.scrollTop = 0;
    });
  });
  $("#caseClose").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { dlgBody.innerHTML = ""; if (lastTrigger) lastTrigger.focus(); });

  /* ---------- Videos play only on screen ---------- */
  var vids = $$("video[data-autoplay]");
  vids.forEach(function (v) { v.muted = true; });
  if (!reduce && "IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.preload = "auto"; var p = e.target.play(); if (p && p.catch) p.catch(function () {}); }
        else e.target.pause();
      });
    }, { threshold: 0.3 });
    vids.forEach(function (v) { vio.observe(v); });
  }

  /* ---------- Hobbies accordion ---------- */
  $$(".hobby__btn").forEach(function (b) {
    b.addEventListener("click", function () {
      b.setAttribute("aria-expanded", b.getAttribute("aria-expanded") !== "true");
    });
  });

  /* ---------- Copy email ---------- */
  $$("[data-copy]").forEach(function (b) {
    var label = $("span", b);
    b.addEventListener("click", function () {
      if (!navigator.clipboard) { label.textContent = "Select to copy"; return; }
      navigator.clipboard.writeText(b.dataset.copy).then(function () {
        b.classList.add("is-done"); label.textContent = "Copied";
        setTimeout(function () { b.classList.remove("is-done"); label.textContent = "Copy"; }, 1800);
      }, function () { label.textContent = "Select to copy"; });
    });
  });

  /* ---------- Contact ball follows the pointer a little ---------- */
  var ball = $("#ball"), contact = $(".contact");
  if (ball && !reduce && window.matchMedia("(pointer: fine)").matches) {
    contact.addEventListener("pointermove", function (e) {
      var r = contact.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      ball.style.transform = "translate(" + (x * 40) + "px," + (y * 30) + "px) rotate(" + (x * 90) + "deg)";
    });
    contact.addEventListener("pointerleave", function () { ball.style.transform = ""; });
  }

  /* =========================================================
     Padel rally mini-game
     ========================================================= */
  var cv = $("#padel"); if (!cv) return;
  var ctx = cv.getContext("2d"), court = $("#court"), overlay = $("#overlay");
  var W = 640, H = 480, dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  var rallyEl = $("#rally"), bestEl = $("#best");
  var best = parseInt(store("padelBest") || "0", 10) || 0; bestEl.textContent = best;
  var racket = { x: W / 2, w: 104, h: 16, y: H - 46 }, targetX = W / 2;
  var ball2 = { x: W / 2, y: 140, vx: 0, vy: 0, r: 9 }, trail = [];
  var playing = false, rally = 0, raf = null, keys = { l: false, r: false }, flash = 0, shake = 0;

  function colors() {
    var dark = root.getAttribute("data-theme") === "dark";
    return dark
      ? { court: "#3a1520", court2: "#43192a", line: "rgba(255,255,255,.55)", glass: "rgba(255,255,255,.18)", racket: "#f3eced", grip: "#e57a93" }
      : { court: "#7b1e34", court2: "#86243c", line: "rgba(255,255,255,.75)", glass: "rgba(255,255,255,.28)", racket: "#ffffff", grip: "#1d1417" };
  }

  function draw() {
    var c = colors();
    ctx.save();
    if (shake > 0) { ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake); }
    // court
    ctx.fillStyle = c.court; ctx.fillRect(-10, -10, W + 20, H + 20);
    ctx.fillStyle = c.court2; ctx.fillRect(0, H / 2, W, H / 2);
    // glass walls (back + sides)
    ctx.strokeStyle = c.glass; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(5, H); ctx.lineTo(5, 5); ctx.lineTo(W - 5, 5); ctx.lineTo(W - 5, H); ctx.stroke();
    // lines
    ctx.strokeStyle = c.line; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2, 70); ctx.lineTo(W / 2, H / 2 - 4);           // centre service line (far)
    ctx.moveTo(W / 2, H / 2 + 4); ctx.lineTo(W / 2, H - 70);        // centre service line (near)
    ctx.moveTo(20, 70); ctx.lineTo(W - 20, 70);                      // far service line
    ctx.moveTo(20, H - 70); ctx.lineTo(W - 20, H - 70);              // near service line
    ctx.stroke();
    // net
    ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(10, H / 2); ctx.lineTo(W - 10, H / 2); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1;
    for (var nx = 16; nx < W - 10; nx += 12) { ctx.beginPath(); ctx.moveTo(nx, H / 2 - 5); ctx.lineTo(nx, H / 2 + 5); ctx.stroke(); }
    // flash on hit
    if (flash > 0) { ctx.fillStyle = "rgba(255,255,255," + (flash * .12) + ")"; ctx.fillRect(0, 0, W, H); }
    // trail
    for (var i = 0; i < trail.length; i++) {
      var t = trail[i], a = (i + 1) / trail.length;
      ctx.fillStyle = "rgba(225,240,90," + (a * .25) + ")";
      ctx.beginPath(); ctx.arc(t.x, t.y, ball2.r * a, 0, Math.PI * 2); ctx.fill();
    }
    // ball shadow + ball
    ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(ball2.x + 4, ball2.y + 7, ball2.r, ball2.r * .5, 0, 0, Math.PI * 2); ctx.fill();
    var g = ctx.createRadialGradient(ball2.x - 3, ball2.y - 3, 1, ball2.x, ball2.y, ball2.r);
    g.addColorStop(0, "#f4ff8a"); g.addColorStop(1, "#c3d63a");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ball2.x, ball2.y, ball2.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(ball2.x - ball2.r * 1.1, ball2.y, ball2.r * .8, -0.9, 0.9); ctx.stroke();
    // racket: perforated head + grip
    var rx = racket.x, ry = racket.y;
    ctx.fillStyle = c.grip; roundRect(rx - 7, ry + racket.h - 2, 14, 22, 5); ctx.fill();
    ctx.fillStyle = c.racket; roundRect(rx - racket.w / 2, ry, racket.w, racket.h, racket.h / 2); ctx.fill();
    ctx.fillStyle = c.court;
    for (var hx = -racket.w / 2 + 14; hx <= racket.w / 2 - 14; hx += 11) { ctx.beginPath(); ctx.arc(rx + hx, ry + racket.h / 2, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  window.__drawCourt = function () { if (!playing) draw(); };

  function serve() {
    rally = 0; rallyEl.textContent = 0; trail = [];
    ball2.x = W / 2; ball2.y = 120;
    var ang = (Math.random() * .6 - .3);
    ball2.vx = Math.sin(ang) * 4.2; ball2.vy = 4.2;
    racket.w = 104;
  }

  var last = 0;
  function step(ts) {
    var dt = Math.min(2, (ts - (last || ts)) / 16.67); last = ts;
    // racket movement
    if (keys.l) targetX -= 9 * dt; if (keys.r) targetX += 9 * dt;
    targetX = Math.max(racket.w / 2 + 10, Math.min(W - racket.w / 2 - 10, targetX));
    racket.x += (targetX - racket.x) * Math.min(1, .35 * dt);
    // ball
    ball2.x += ball2.vx * dt; ball2.y += ball2.vy * dt;
    trail.push({ x: ball2.x, y: ball2.y }); if (trail.length > 8) trail.shift();
    if (ball2.x < ball2.r + 10) { ball2.x = ball2.r + 10; ball2.vx = Math.abs(ball2.vx); }
    if (ball2.x > W - ball2.r - 10) { ball2.x = W - ball2.r - 10; ball2.vx = -Math.abs(ball2.vx); }
    if (ball2.y < ball2.r + 10) { ball2.y = ball2.r + 10; ball2.vy = Math.abs(ball2.vy); }
    // racket hit
    if (ball2.vy > 0 && ball2.y + ball2.r >= racket.y && ball2.y + ball2.r <= racket.y + racket.h + 12 &&
        ball2.x > racket.x - racket.w / 2 - ball2.r && ball2.x < racket.x + racket.w / 2 + ball2.r) {
      var off = (ball2.x - racket.x) / (racket.w / 2);           // -1..1
      var speed = Math.min(13, Math.hypot(ball2.vx, ball2.vy) * 1.05);
      var ang = off * 1.05;                                      // up to ~60°
      ball2.vx = Math.sin(ang) * speed; ball2.vy = -Math.cos(ang) * speed;
      ball2.y = racket.y - ball2.r;
      rally++; rallyEl.textContent = rally; flash = 1;
      if (rally % 5 === 0) racket.w = Math.max(70, racket.w - 6);  // a little harder every 5 hits
    }
    if (flash > 0) flash = Math.max(0, flash - .08 * dt);
    if (shake > 0) shake = Math.max(0, shake - .6 * dt);
    draw();
    if (ball2.y - ball2.r > H) return end();
    raf = requestAnimationFrame(step);
  }

  function start() {
    serve(); playing = true; overlay.hidden = true; last = 0;
    court.focus({ preventScroll: true });
    raf = requestAnimationFrame(step);
  }
  function end() {
    playing = false; cancelAnimationFrame(raf);
    var isBest = rally > best;
    if (isBest) { best = rally; bestEl.textContent = best; store("padelBest", best); }
    var msgs = rally === 0 ? "Even the pros miss the serve sometimes." :
               rally < 5 ? "Warm-up rally. Go again." :
               rally < 12 ? "Solid hands. Club level." :
               rally < 25 ? "That's a real rally. Impressive." : "Pro-tour reflexes. Want to play doubles?";
    $("#overlayTitle").textContent = (isBest && rally > 0 ? "New best: " : "Rally of ") + rally;
    $("#overlayText").textContent = msgs;
    $("#playBtn").textContent = "Play again";
    overlay.hidden = false; $("#playBtn").focus({ preventScroll: true });
  }

  $("#playBtn").addEventListener("click", start);
  function pointerX(e) { var r = cv.getBoundingClientRect(); targetX = (e.clientX - r.left) / r.width * W; }
  court.addEventListener("pointermove", pointerX);
  court.addEventListener("pointerdown", pointerX);
  court.tabIndex = -1;
  document.addEventListener("keydown", function (e) {
    if (!playing) return;
    if (e.key === "ArrowLeft") { keys.l = true; e.preventDefault(); }
    if (e.key === "ArrowRight") { keys.r = true; e.preventDefault(); }
  });
  document.addEventListener("keyup", function (e) {
    if (e.key === "ArrowLeft") keys.l = false;
    if (e.key === "ArrowRight") keys.r = false;
  });
  // pause if the game scrolls off screen
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting && playing) end(); }); }, { threshold: 0.2 }).observe(court);
  }

  syncTheme();
  draw();
})();

/* Player card: click to flip, pointer tilt + shine */
(function () {
  var card = document.getElementById("fut");
  if (!card) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  card.addEventListener("click", function () {
    var on = !card.classList.contains("is-flipped");
    card.classList.toggle("is-flipped", on);
    card.setAttribute("aria-pressed", on);
  });
  if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
  card.addEventListener("pointermove", function (e) {
    var r = card.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    card.classList.add("is-tilting");
    card.style.setProperty("--rx", ((0.5 - y) * 16).toFixed(2) + "deg");
    card.style.setProperty("--ry", ((x - 0.5) * 20).toFixed(2) + "deg");
    card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
    card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
  });
  card.addEventListener("pointerleave", function () {
    card.classList.remove("is-tilting");
    card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg");
  });
})();

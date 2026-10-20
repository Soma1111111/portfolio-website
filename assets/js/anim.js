/* ============================================================
   anime.js showcase layer
   Loaded before main.js. If the CDN is blocked the site still
   works — every effect here is purely additive.
   ============================================================ */
(function () {
  "use strict";

  var A = window.anime;
  if (!A) return; // graceful: no anime.js -> static site, nothing hidden

  var animate = A.animate;
  var stagger = A.stagger;
  var createTimeline = A.createTimeline;
  var utils = A.utils;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- text splitting ---------------- */
  function splitChars(el) {
    var text = el.textContent;
    el.textContent = "";
    var chars = [];
    text.split("").forEach(function (ch) {
      var s = document.createElement("span");
      s.className = "split-char";
      s.textContent = ch === " " ? "\u00a0" : ch;
      el.appendChild(s);
      chars.push(s);
    });
    return chars;
  }

  $$("[data-split]").forEach(function (el) {
    el.__chars = splitChars(el);
  });

  /* ---------------- scroll observer ---------------- */
  // A tiny manual visibility check — deterministic, and works even when the
  // IntersectionObserver callbacks are delayed (headless, throttled tabs).
  var pending = [];

  function inView(el) {
    var r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.92 && r.bottom > 0;
  }

  function checkPending() {
    if (!pending.length) return;
    pending = pending.filter(function (item) {
      if (!inView(item.el)) return true;
      item.run();
      return false;
    });
  }

  function onScrollIn(el, fn) {
    pending.push({ el: el, run: fn });
    checkPending();
  }

  window.addEventListener("scroll", checkPending, { passive: true });
  window.addEventListener("resize", checkPending);
  setInterval(checkPending, 400);

  /* ---------------- hero intro ---------------- */
  function heroIntro() {
    // hide everything the intro touches BEFORE the timeline starts, otherwise
    // late timeline entries would flash visible and then jump.
    utils.set(
      "[data-hero=eyebrow], .hero-line, #typed, [data-hero=lede], .hero-actions .btn, .stat-row li, .orbit-wrap, .code-window, .code-window .cl, .scroll-cue, .grad-text",
      { opacity: 0 }
    );

    var tl = createTimeline({ defaults: { ease: "outExpo", duration: 900 } });

    tl.add("[data-hero=eyebrow]", { opacity: [0, 1], y: [26, 0], scale: [0.92, 1] }, 0);
    tl.add(".hero-line", { opacity: [0, 1], y: [28, 0] }, 90);
    tl.add(".grad-text", {
      opacity: [0, 1],
      y: ["110%", "0%"],
      duration: 1300,
      ease: "outExpo",
    }, 150);
    tl.add("#typed", { opacity: [0, 1], x: [-24, 0] }, 620);
    tl.add("[data-hero=lede]", { opacity: [0, 1], y: [26, 0] }, 700);
    tl.add(".hero-actions .btn", {
      opacity: [0, 1], y: [26, 0], scale: [0.94, 1], delay: stagger(110),
    }, 820);
    tl.add(".stat-row li", { opacity: [0, 1], y: [26, 0], delay: stagger(90) }, 950);
    tl.add(".orbit-wrap", { opacity: [0, 1], scale: [0.55, 1], rotate: [-30, 0], duration: 1300 }, 780);
    tl.add(".code-window", { opacity: [0, 1], y: [46, 0], scale: [0.94, 1], duration: 1100 }, 1000);
    tl.add(".code-window .cl", { opacity: [0, 1], x: [-16, 0], duration: 520, delay: stagger(65) }, 1150);
    tl.add(".scroll-cue", { opacity: [0, 1], y: [18, 0] }, 1600);
  }

  /* ---------------- scroll reveals ---------------- */
  function reveals() {
    $$("[data-reveal]").forEach(function (group) {
      var kids = Array.prototype.slice.call(group.children);
      if (!kids.length) return;
      utils.set(kids, { opacity: 0, y: 38 });
      onScrollIn(group, function () {
        animate(kids, {
          opacity: [0, 1],
          y: [38, 0],
          duration: 950,
          ease: "outExpo",
          delay: stagger(85),
        });
      });
    });

    $$(".section-title [data-split], .contact-card [data-split]").forEach(function (el) {
      var chars = el.__chars || [];
      if (!chars.length) return;
      utils.set(chars, { opacity: 0, y: 34, rotateX: -60 });
      onScrollIn(el, function () {
        animate(chars, {
          opacity: [0, 1],
          y: [34, 0],
          rotateX: [-60, 0],
          duration: 900,
          ease: "outExpo",
          delay: stagger(26),
        });
      });
    });
  }

  /* ---------------- counters ---------------- */
  function counters() {
    var nodes = $$("[data-count]");
    if (!nodes.length) return;
    var started = false;

    function run(node) {
      var target = parseFloat(node.getAttribute("data-count")) || 0;
      var state = { v: 0 };
      animate(state, {
        v: target,
        duration: 1700,
        ease: "outExpo",
        onUpdate: function () { node.textContent = Math.round(state.v); },
      });
    }

    function begin() {
      if (started) return;
      started = true;
      nodes.forEach(function (n, i) {
        setTimeout(function () { run(n); }, i * 110);
      });
    }

    // wait for the GitHub numbers, but never hang if the API is down
    document.addEventListener("portfolio:data", begin);
    setTimeout(begin, 1500);
  }

  /* ---------------- background ---------------- */
  function aurora() {
    $$(".aurora").forEach(function (el, i) {
      animate(el, {
        x: utils.random(-110, 110),
        y: utils.random(-90, 90),
        scale: utils.random(0.85, 1.3),
        duration: utils.random(9000, 16000),
        ease: "inOutSine",
        loop: true,
        alternate: true,
        delay: i * 500,
      });
    });

    // shimmering gradient on the name (0 -> 100 keeps the gradient covering the text)
    var grad = $(".grad-text");
    if (grad) {
      var pos = { p: 0 };
      animate(pos, {
        p: 100,
        duration: 7000,
        ease: "inOutSine",
        loop: true,
        onUpdate: function () { grad.style.backgroundPosition = pos.p + "% 50%"; },
      });
    }
  }

  /* ---------------- ascii rain ---------------- */
  function asciiRain() {
    var canvas = $("#stars");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var size = 14;
    var cols = 0;
    var drops = [];
    var glyphs = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789ABCDEFXYZ<>[]{}/\\+=*#$%&";
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function word() {
      var s = "";
      var n = 6 + Math.floor(Math.random() * 8);
      for (var i = 0; i < n; i++) s += glyphs[Math.floor(Math.random() * glyphs.length)];
      return s;
    }

    function resize() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = size + "px " + "'JetBrains Mono', monospace";
      cols = Math.ceil(window.innerWidth / size);
      drops = [];
      for (var i = 0; i < cols; i++) {
        drops.push({ y: utils.random(-30, 0), s: word(), v: utils.random(0.35, 0.9) });
      }
    }

    function frame() {
      // fade the previous frame out (works on both themes)
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "source-over";

      for (var i = 0; i < cols; i++) {
        var d = drops[i];
        var x = i * size;
        var y = d.y * size;
        for (var k = 0; k < d.s.length; k++) {
          ctx.fillStyle = k === 0
            ? "rgba(214,244,255,0.95)"
            : "rgba(125,211,252," + Math.max(0.12, 0.55 - k * 0.07).toFixed(2) + ")";
          ctx.fillText(d.s[k], x, y + k * size);
        }
        d.y += d.v;
        if (y > window.innerHeight + d.s.length * size) {
          d.y = utils.random(-30, -5);
          d.s = word();
        }
      }
      requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(frame);
  }

  /* ---------------- cursor ---------------- */
  function cursor() {
    var box = $("#cursor");
    if (!box || !window.matchMedia || !window.matchMedia("(hover: hover)").matches) return;
    var dot = $(".cursor-dot", box);
    var ring = $(".cursor-ring", box);
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;

    window.addEventListener("pointermove", function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + "px";
      dot.style.top = my + "px";
      box.classList.add("on");
    }, { passive: true });

    (function loop() {
      rx = utils.lerp(rx, mx, 0.13);
      ry = utils.lerp(ry, my, 0.13);
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    })();

    var hot = "a, button, .project, .skill-card, .mini-card, .gh-card, .chip, .filter-btn";
    document.addEventListener("pointerover", function (e) {
      if (e.target.closest && e.target.closest(hot)) box.classList.add("hot");
    });
    document.addEventListener("pointerout", function (e) {
      if (e.target.closest && e.target.closest(hot)) box.classList.remove("hot");
    });
    document.addEventListener("mouseleave", function () { box.classList.add("hidden"); });
    document.addEventListener("mouseenter", function () { box.classList.remove("hidden"); });
  }

  /* ---------------- scroll progress ---------------- */
  function scrollProgress() {
    var bar = $("#progressBar");
    if (!bar) return;
    var nav = $("#nav");
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = pct.toFixed(2) + "%";
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 16);
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------------- marquee ---------------- */
  function marquee() {
    var track = $("#marquee");
    if (!track) return;
    animate(track, {
      x: ["0%", "-50%"],
      duration: 30000,
      ease: "linear",
      loop: true,
    });
  }

  /* ---------------- tilt + spotlight ---------------- */
  function tilt(el) {
    if (!el || el.__tilt) return;
    el.__tilt = true;

    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      animate(el, { rotateY: px * 8, rotateX: -py * 8, duration: 420, ease: "outQuad" });
      var spot = $(".spot", el);
      if (spot) {
        spot.style.setProperty("--mx", e.clientX - r.left + "px");
        spot.style.setProperty("--my", e.clientY - r.top + "px");
      }
    });

    el.addEventListener("pointerleave", function () {
      animate(el, { rotateY: 0, rotateX: 0, duration: 800, ease: "outElastic(1, .6)" });
    });
  }

  /* ---------------- magnetic buttons + shine ---------------- */
  function magnetic(btn) {
    if (!btn || btn.__mag) return;
    btn.__mag = true;

    var shine = document.createElement("span");
    shine.className = "btn-shine";
    btn.appendChild(shine);

    btn.addEventListener("pointerenter", function () {
      animate(shine, { x: ["-120%", "120%"], duration: 950, ease: "inOutSine" });
    });

    btn.addEventListener("pointermove", function (e) {
      var r = btn.getBoundingClientRect();
      var x = (e.clientX - (r.left + r.width / 2)) * 0.25;
      var y = (e.clientY - (r.top + r.height / 2)) * 0.3;
      animate(btn, { x: x, y: y, duration: 550, ease: "outElastic(1, .55)" });
    });

    btn.addEventListener("pointerleave", function () {
      animate(btn, { x: 0, y: 0, duration: 900, ease: "outElastic(1, .55)" });
    });
  }

  /* ---------------- project cards (dynamic) ---------------- */
  function decorateCard(card) {
    if (!card || card.__deco) return;
    card.__deco = true;

    var shine = document.createElement("span");
    shine.className = "card-shine";
    card.insertBefore(shine, card.firstChild);

    card.addEventListener("pointerenter", function () {
      animate(shine, { x: ["-110%", "110%"], duration: 1100, ease: "inOutSine" });
    });

    tilt(card);

    if (reduced) { card.style.opacity = 1; return; }

    // entrance: main.js renders the card hidden when anime.js is present
    var index = parseInt(card.getAttribute("data-index"), 10) || 0;
    animate(card, {
      opacity: [0, 1],
      y: [28, 0],
      duration: 800,
      delay: (index % 3) * 80,
      ease: "outExpo",
    });
  }

  function watchProjects() {
    var grid = $("#projectGrid");
    if (!grid || !("MutationObserver" in window)) return;
    $$(".project", grid).forEach(decorateCard);
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.classList && n.classList.contains("project")) decorateCard(n);
        });
      });
    }).observe(grid, { childList: true });
  }

  /* ---------------- parallax ---------------- */
  function parallax() {
    var visual = $(".hero-visual");
    var code = $(".code-window");
    if (!visual || !code) return;
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight * 1.2) {
          animate(code, { y: y * 0.08, duration: 700, ease: "outQuad" });
          animate(visual, { y: y * 0.03, duration: 900, ease: "outQuad" });
        }
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------------- boot ---------------- */
  function start() {
    if (reduced) {
      // keep it calm: no intro timeline, no loops
      return;
    }
    heroIntro();
    reveals();
    counters();
    aurora();
    marquee();
    parallax();

    $$(".tilt").forEach(tilt);
    $$(".magnetic").forEach(magnetic);
  }

  scrollProgress();
  asciiRain();
  cursor();
  watchProjects();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

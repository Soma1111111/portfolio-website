/* ============================================================
   anime.js showcase layer
   Loaded before main.js. If the CDN is blocked the site still
   works — every effect here is purely additive.
   ============================================================ */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The ASCII hero field, the slippy words strip and the streaming code
  // window do not need anime.js — start them before the guard so they still
  // render when the CDN is blocked.
  asciiHero();
  slippyWords();
  streamIDE();

  var A = window.anime;
  if (!A) return; // graceful: no anime.js -> static site, nothing hidden

  var animate = A.animate;
  var stagger = A.stagger;
  var createTimeline = A.createTimeline;
  var utils = A.utils;

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
      "[data-hero=eyebrow], .hero-line, #typed, [data-hero=lede], .hero-actions .btn, .stat-row li, .dial, .term-chip, .scroll-cue, .grad-text",
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
    tl.add(".term-chip", { opacity: [0, 1], y: [22, 0] }, 960);
    tl.add(".stat-row li", { opacity: [0, 1], y: [26, 0], delay: stagger(90) }, 1040);
    tl.add(".dial", { opacity: [0, 1], scale: [0.82, 1], rotate: [-18, 0], duration: 1400 }, 760);
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

  /* ---------------- ascii hero ---------------- */
  // Vanilla port of performative-ui's AsciiHero (useAsciiField): a procedural
  // ASCII field with a cursor spotlight. No React, no build step.
  function asciiHero() {
    var canvas = $("#asciiField");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var host = canvas.parentNode;
    if (!host) return;

    var SIZE = 12;
    var RAMP = " .`'\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";
    var PALETTE = ["#a78bfa", "#ec4899", "#67e8f9", "#fbbf24"];
    var BASE = 0.16;    // dim enough to sit behind body copy
    var SPOT = 0.95;    // brightness under the cursor
    var SPOT_R = 11;    // spotlight radius, in cells
    var RIPPLE = 1.4;   // ripple amplitude
    var RIPPLE_R = 6;   // ripple radius, in cells
    var FRAME_MS = 60;

    var cols = 0, rows = 0, cellW = 0, cellH = 0;
    var field = new Float32Array(0);
    var mouse = { x: -9999, y: -9999 };
    var last = 0, colorIdx = -1;

    function seed() {
      field = new Float32Array(cols * rows);
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var nx = (x / cols) * 2 - 1;
          var ny = (y / rows) * 2 - 1;
          var r = Math.sqrt(nx * nx + ny * ny);
          var stripes = 0.5 + 0.5 * Math.sin(nx * 6 + ny * 2);
          var radial = 1 - Math.min(1, r * 1.2);
          field[y * cols + x] = 0.25 * stripes + 0.55 * radial;
        }
      }
    }

    function resize() {
      var rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = SIZE + "px 'JetBrains Mono', ui-monospace, monospace";
      ctx.textBaseline = "top";
      cellW = ctx.measureText("M").width || SIZE * 0.6;
      cellH = SIZE * 1.15;
      cols = Math.max(1, Math.floor(rect.width / cellW));
      rows = Math.max(1, Math.floor(rect.height / cellH));
      colorIdx = -1;
      seed();
    }

    function draw(t) {
      var time = t * 0.001;
      var rect = canvas.getBoundingClientRect();
      var cx = (mouse.x - rect.left) / cellW;
      var cy = (mouse.y - rect.top) / cellH;
      // 24px of grace so the spotlight does not snap off at the edges
      var inside = mouse.x >= rect.left - 24 && mouse.x <= rect.right + 24 &&
                   mouse.y >= rect.top - 24 && mouse.y <= rect.bottom + 24;

      ctx.clearRect(0, 0, rect.width, rect.height);
      var rampMax = RAMP.length - 1;
      var spotR2 = SPOT_R * SPOT_R * 2;

      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var base = field[y * cols + x];
          var wave = 0.15 * Math.sin(x * 0.18 + time * 1.4) * Math.cos(y * 0.22 - time * 1.1);

          var dx = x - cx;
          var dy = (y - cy) * 1.8;
          var d2 = dx * dx + dy * dy;
          var d = Math.sqrt(d2);

          var ripple = 0;
          if (inside) {
            ripple = RIPPLE * Math.exp(-d2 / 80) -
              0.6 * Math.exp(-((d - RIPPLE_R) * (d - RIPPLE_R)) / 30);
          }

          var v = Math.max(0, Math.min(1, base + wave + ripple));
          var ch = RAMP[Math.floor(v * rampMax)];
          if (ch === " ") continue;

          var alpha = BASE;
          if (inside) {
            alpha = BASE + (SPOT - BASE) * Math.exp(-d2 / spotR2);
            if (alpha < 0) alpha = 0;
            if (alpha > 1) alpha = 1;
          }
          if (alpha <= 0.01) continue;

          var idx = Math.floor(Math.abs((x * 0.1 + y * 0.07 + time * 0.12) % PALETTE.length)) % PALETTE.length;
          if (idx !== colorIdx) {
            ctx.fillStyle = PALETTE[idx];
            colorIdx = idx;
          }
          ctx.globalAlpha = alpha;
          ctx.fillText(ch, x * cellW, y * cellH);
        }
      }
      ctx.globalAlpha = 1;
    }

    function loop(t) {
      requestAnimationFrame(loop);
      if (t - last < FRAME_MS) return;
      last = t;
      if (!cols || !rows) { resize(); return; }
      draw(t);
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    resize();
    if (reduced) {
      draw(0); // one static frame — no motion for reduced-motion users
    } else {
      requestAnimationFrame(loop);
    }
  }

  /* ---------------- slippy words ---------------- */
  // Port of performative-ui's SlippyWords: rows of badges that slide in
  // opposite directions, driven by scroll position.
  function slippyWords() {
    var host = $("#slippy");
    if (!host || reduced) return;
    var raf = 0;
    var maxTravel = 0;

    // The badge rows overflow the strip on each side. The slide has to stay
    // inside that, otherwise a row would empty out at one edge.
    function measure() {
      var narrowest = Infinity;
      for (var i = 0; i < host.children.length; i++) {
        var row = host.children[i];
        var w = 0;
        for (var j = 0; j < row.children.length; j++) w += row.children[j].offsetWidth;
        w += (parseFloat(getComputedStyle(row).columnGap) || 0) * Math.max(0, row.children.length - 1);
        narrowest = Math.min(narrowest, (w - host.clientWidth) / 2);
      }
      maxTravel = Math.max(0, narrowest);
      update();
    }

    function update() {
      raf = 0;
      var rect = host.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      // 0 as the strip enters from the bottom, 1 as it leaves the top
      var p = (vh - rect.top) / (vh + rect.height);
      var intensity = Math.min(window.innerWidth < 760 ? 120 : 220, maxTravel);
      var offset = (Math.min(1, Math.max(0, p)) - 0.5) * intensity;
      host.style.setProperty("--slip", offset.toFixed(1) + "px");
    }

    function onScroll() { if (!raf) raf = requestAnimationFrame(update); }

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () { measure(); onScroll(); }, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  }

  /* ---------------- streaming mock IDE ---------------- */
  // Types the code window out character by character with a trailing caret,
  // then loops. Without JS the full snippet is already in the markup.
  function streamIDE() {
    var code = $("#ideCode");
    if (!code || reduced) return;

    // Split every text node into one span per character, so the reveal can
    // walk the code in order and keep the syntax colours.
    var chars = [];
    (function split(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (kid) {
        if (kid.nodeType === 3) {
          var frag = document.createDocumentFragment();
          kid.textContent.split("").forEach(function (c) {
            var s = document.createElement("span");
            s.className = "ide-ch";
            s.textContent = c;
            frag.appendChild(s);
            chars.push(s);
          });
          node.replaceChild(frag, kid);
        } else if (kid.nodeType === 1) {
          split(kid);
        }
      });
    })(code);
    if (!chars.length) return;

    var caret = document.createElement("i");
    caret.className = "ide-caret";
    code.appendChild(caret);

    var i = 0;

    function tick() {
      if (i >= chars.length) {
        setTimeout(function () {
          chars.forEach(function (c) { c.classList.remove("on"); });
          i = 0;
          tick();
        }, 3500);
        return;
      }
      var ch = chars[i++];
      ch.classList.add("on");
      var ms = 6 + Math.random() * 12;
      if (ch.textContent === "\n") ms += 90;
      setTimeout(tick, ms);
    }

    tick();
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

  /* ---------------- the dial ---------------- */
  function dial() {
    var box = $("#dial");
    if (!box) return;

    var arcsGroup = $("#dialArcs");
    var ticksGroup = $("#dialTicks");
    var R = 168;
    var C = 2 * Math.PI * R;
    var MIX = [
      { color: "#3776ab", share: 0.30 },
      { color: "#f89820", share: 0.20 },
      { color: "#DA5B0B", share: 0.16 },
      { color: "#dea584", share: 0.13 },
      { color: "#8b949e", share: 0.11 },
      { color: "#22d3ee", share: 0.10 }
    ];

    // arcs
    var offset = 0;
    var arcs = [];
    MIX.forEach(function (m) {
      var len = Math.max(18, m.share * C - 14);
      var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", "200");
      c.setAttribute("cy", "200");
      c.setAttribute("r", String(R));
      c.setAttribute("fill", "none");
      c.setAttribute("stroke", m.color);
      c.setAttribute("stroke-width", "3.5");
      c.setAttribute("stroke-linecap", "round");
      c.setAttribute("stroke-dasharray", len + " " + C);
      c.style.strokeDashoffset = String(-(offset + len));
      arcsGroup.appendChild(c);
      arcs.push({ el: c, from: -(offset + len), to: -offset });
      offset += len + 14;
    });

    // ticks
    var TICKS = 72;
    for (var i = 0; i < TICKS; i++) {
      var a = (i / TICKS) * Math.PI * 2 - Math.PI / 2;
      var inner = i % 6 === 0 ? 178 : 181;
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", (200 + Math.cos(a) * inner).toFixed(2));
      line.setAttribute("y1", (200 + Math.sin(a) * inner).toFixed(2));
      line.setAttribute("x2", (200 + Math.cos(a) * 186).toFixed(2));
      line.setAttribute("y2", (200 + Math.sin(a) * 186).toFixed(2));
      ticksGroup.appendChild(line);
    }
    var ticks = Array.prototype.slice.call(ticksGroup.children);

    // animate in
    utils.set(ticks, { opacity: 0 });

    animate(arcs.map(function (a) { return a.el; }), {
      strokeDashoffset: function (el, i) { return arcs[i].to; },
      duration: 1500,
      ease: "inOutQuart",
      delay: stagger(120),
    });
    animate(ticks, { opacity: [0, 0.55], duration: 700, delay: stagger(14) });

    box.addEventListener("pointerenter", function () {
      animate(box.querySelector(".dial-core"), { scale: 1.06, duration: 500, ease: "outElastic(1, .6)" });
    });
    box.addEventListener("pointerleave", function () {
      animate(box.querySelector(".dial-core"), { scale: 1, duration: 600, ease: "outElastic(1, .6)" });
    });
  }

  /* ---------------- copy-to-clipboard ---------------- */
  function copyChip() {
    var btn = $("#copyBtn");
    var code = $("#cloneCmd");
    if (!btn || !code) return;

    btn.addEventListener("click", function () {
      var text = code.textContent;
      var done = function () {
        btn.classList.add("done");
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>';
        setTimeout(function () {
          btn.classList.remove("done");
          btn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
        }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        done();
      }
    });
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
  watchProjects();
  dial();
  copyChip();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

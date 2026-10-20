/* ============================================================
   Portfolio behaviour — vanilla JS, no dependencies.
   Repos are pulled live from the GitHub API and fall back to
   assets/data/repos.json when the API is unreachable or rate-limited.
   ============================================================ */
(function () {
  "use strict";

  var USERNAME = "Soma1111111";
  var API = "https://api.github.com/users/" + USERNAME;
  var LOCAL = "assets/data/repos.json";

  // Repos that are not "projects" (profile README, this site, forks of tutorials).
  var EXCLUDE = ["soma1111111", "soma1111111.github.io", "first-contributions", "Pong_in_Pygame"];

  // Secondary technologies per repo, so the filters actually match.
  var EXTRA_LANGS = {
    "uno-rep": ["HTML"],
    "Brain_Age_FMRI": ["Python", "PyTorch"],
    "cloud-project-new-kube": ["Python", "Docker", "Kubernetes"],
    "triterosync": ["PostgreSQL", "MongoDB", "Hive"],
    "Face-and-object-detection": ["Python"],
    "french-translation-char-level-seq2seq-": ["Python", "PyTorch"],
    "Gamified-Language-Learning-App": ["JavaScript", "HTML", "CSS"],
    "PygameHacknite": ["Python"],
    "OS-lab": ["Shell"],
    "selabjenkins": ["Shell"],
    "Image_editor": ["C++", "TypeScript"],
    "diabetes-prediction-diabetes-dataset": ["Python"],
    "StudentInnovation": ["Java"]
  };

  var LANG_COLORS = {
    Python: "#3776ab", Java: "#f89820", Rust: "#dea584", C: "#8b949e", "C++": "#f34b7d",
    JavaScript: "#f1e05a", TypeScript: "#3178c6", HTML: "#e34c26", CSS: "#563d7c",
    "Jupyter Notebook": "#DA5B0B", Dart: "#00B4AB", Shell: "#89e051", Docker: "#2496ed",
    Kubernetes: "#326ce5", PyTorch: "#ee4c2c", PostgreSQL: "#4169e1", MongoDB: "#47a248",
    Hive: "#f7a41d", Other: "#8b949e"
  };

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------------- theme ---------------- */
  var root = document.documentElement;
  var themeBtn = $("#themeToggle");

  function setTheme(mode) {
    root.setAttribute("data-theme", mode);
    if (themeBtn) themeBtn.querySelector(".t-icon").textContent = mode === "dark" ? "☾" : "☀";
    try { localStorage.setItem("theme", mode); } catch (e) {}
  }

  var saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  setTheme(saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));

  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
  }

  /* ---------------- nav ---------------- */
  var nav = $("#nav");
  var navToggle = $("#navToggle");
  var navLinks = $("#navLinks");

  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$("#navLinks a").forEach(function (a) {
      a.addEventListener("click", function () {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------- reveal on scroll ---------------- */
  var revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            revealObserver.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" })
    : null;

  function observeReveals(root) {
    $$(".reveal", root).forEach(function (n) {
      if (revealObserver) revealObserver.observe(n); else n.classList.add("in");
    });
  }

  /* ---------------- typewriter ---------------- */
  var typed = $("#typed");
  var PHRASES = [
    "AI / ML engineer in training",
    "backend & cloud builder",
    "Rust and Python tinkerer",
    "game dev after hours",
    "always shipping ✨"
  ];

  if (typed) {
    var pi = 0, ci = 0, deleting = false;
    function tick() {
      var p = PHRASES[pi];
      typed.textContent = p.slice(0, ci);
      if (!deleting && ci < p.length) { ci++; setTimeout(tick, 65); }
      else if (!deleting && ci === p.length) { deleting = true; setTimeout(tick, 1600); }
      else if (deleting && ci > 0) { ci--; setTimeout(tick, 32); }
      else { deleting = false; pi = (pi + 1) % PHRASES.length; setTimeout(tick, 320); }
    }
    tick();
  }

  /* ---------------- skill card spotlight ---------------- */
  $$(".skill-card").forEach(function (card) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--x", (e.clientX - r.left) + "px");
      card.style.setProperty("--y", (e.clientY - r.top) + "px");
    });
  });

  /* ---------------- data ---------------- */
  function getJSON(url) {
    return fetch(url, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }

  function normaliseLang(lang) {
    if (!lang) return "Other";
    if (lang === "Jupyter Notebook") return "Jupyter";
    return lang;
  }

  function buildRepos(live, baked) {
    var bakedMap = {};
    (baked || []).forEach(function (r) { bakedMap[r.name] = r; });

    var source = (live && live.length ? live : baked) || [];
    var out = [];

    source.forEach(function (r) {
      if (EXCLUDE.indexOf(r.name) !== -1) return;
      var b = bakedMap[r.name] || {};
      var desc = r.description && r.description.trim() ? r.description : b.description;
      var lang = normaliseLang(r.language || b.language);
      out.push({
        name: r.name,
        description: desc || "Project repository on GitHub.",
        language: lang,
        extras: EXTRA_LANGS[r.name] || [],
        url: r.html_url || b.url,
        stars: r.stargazers_count != null ? r.stargazers_count : (b.stars || 0),
        forks: r.forks_count != null ? r.forks_count : (b.forks || 0),
        updated: r.pushed_at || b.updated
      });
    });

    // Curated repos that the API did not return (rate limited or deleted).
    if (live && live.length) {
      (baked || []).forEach(function (r) {
        if (EXCLUDE.indexOf(r.name) !== -1) return;
        if (out.some(function (o) { return o.name === r.name; })) return;
        out.push({
          name: r.name,
          description: r.description,
          language: normaliseLang(r.language),
          extras: EXTRA_LANGS[r.name] || [],
          url: r.url,
          stars: r.stars || 0,
          forks: r.forks || 0,
          updated: r.updated
        });
      });
    }

    out.sort(function (a, b) { return new Date(b.updated) - new Date(a.updated); });
    return out;
  }

  /* ---------------- render projects ---------------- */
  var grid = $("#projectGrid");
  var filtersBox = $("#filters");
  var repoMeta = $("#repoMeta");
  var activeLang = "All";

  function renderFilters(repos) {
    var counts = {};
    repos.forEach(function (r) {
      [r.language].concat(r.extras).forEach(function (l) {
        if (!l || l === "Other") return;
        counts[l] = (counts[l] || 0) + 1;
      });
    });
    var langs = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 8);

    filtersBox.innerHTML = "";
    [["All", repos.length]].concat(langs.map(function (l) { return [l, counts[l]]; })).forEach(function (pair) {
      var btn = el("button", activeLang === pair[0] ? "active" : "");
      btn.type = "button";
      btn.setAttribute("role", "tab");
      btn.appendChild(document.createTextNode(pair[0]));
      btn.appendChild(el("span", "count", pair[1]));
      btn.addEventListener("click", function () {
        activeLang = pair[0];
        $$("button", filtersBox).forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        renderProjects(repos);
      });
      filtersBox.appendChild(btn);
    });
  }

  function renderProjects(repos) {
    grid.innerHTML = "";
    var list = repos.filter(function (r) {
      if (activeLang === "All") return true;
      return r.language === activeLang || r.extras.indexOf(activeLang) !== -1;
    });

    if (!list.length) {
      grid.appendChild(el("p", "empty", "No projects in this stack yet."));
      return;
    }

    list.forEach(function (r, i) {
      var card = el("article", "project reveal");
      card.style.transitionDelay = (i % 3) * 70 + "ms";

      var h = el("h3");
      var a = el("a", null, r.name);
      a.href = r.url;
      a.target = "_blank";
      a.rel = "noopener";
      h.appendChild(a);
      card.appendChild(h);

      card.appendChild(el("p", "desc", r.description));

      var foot = el("div", "project-foot");
      var badge = el("span", "lang-badge");
      var dot = el("span", "lang-dot");
      dot.style.background = LANG_COLORS[r.language] || LANG_COLORS.Other;
      badge.appendChild(dot);
      badge.appendChild(document.createTextNode(r.language));
      foot.appendChild(badge);

      var meta = el("div", "project-meta");
      meta.appendChild(el("span", null, "★ " + r.stars));
      meta.appendChild(el("span", null, "⑂ " + r.forks));
      if (r.updated) {
        var d = new Date(r.updated);
        if (!isNaN(d)) meta.appendChild(el("span", null, "⤴ " + d.toLocaleDateString("en-US", { month: "short", year: "numeric" })));
      }
      foot.appendChild(meta);
      card.appendChild(foot);

      grid.appendChild(card);
      if (revealObserver) revealObserver.observe(card);
    });
  }

  /* ---------------- stats ---------------- */
  function setStat(name, value) {
    var node = $('[data-stat="' + name + '"]');
    if (node) node.textContent = value;
  }

  function updateProfile(user) {
    if (!user) return;
    setStat("followers", user.followers);
    setStat("repos", user.public_repos);
    if (user.created_at) {
      var years = Math.max(1, Math.floor((Date.now() - new Date(user.created_at)) / (365.25 * 24 * 3600 * 1000)));
      setStat("years", years);
    }
  }

  /* ---------------- boot ---------------- */
  Promise.all([
    getJSON(API + "/repos?per_page=100&sort=updated").catch(function () { return null; }),
    getJSON(API).catch(function () { return null; }),
    getJSON(LOCAL).catch(function () { return null; })
  ]).then(function (res) {
    var liveRepos = res[0];
    var profile = res[1];
    var local = res[2] || { repos: [] };

    var repos = buildRepos(liveRepos, local.repos);
    renderFilters(repos);
    renderProjects(repos);

    updateProfile(profile || local.user);

    var live = liveRepos && liveRepos.length ? "live" : "cached";
    if (repoMeta) {
      repoMeta.textContent = repos.length + " projects (" + live + " data) · last synced " + new Date().toLocaleString();
    }
  });

  /* ---------------- misc ---------------- */
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  observeReveals(document);
})();

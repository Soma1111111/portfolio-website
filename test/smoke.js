/*
 * Smoke test for the portfolio's project loader.
 * Run: node test/smoke.js
 *
 * Boots assets/js/main.js inside a tiny DOM stub and checks that:
 *  - projects render from the API, with curated descriptions preserved
 *  - the site still renders when the GitHub API is down (local fallback)
 *  - language filters narrow the grid correctly
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ROOT = path.join(__dirname, "..");
const LOCAL = JSON.parse(fs.readFileSync(path.join(ROOT, "assets/data/repos.json"), "utf8"));

/* ---------------- minimal DOM ---------------- */
class El {
  constructor(tag) {
    this.tagName = (tag || "div").toUpperCase();
    this.children = [];
    this.classList = {
      _s: new Set(),
      add: (...c) => c.forEach((x) => this.classList._s.add(x)),
      remove: (...c) => c.forEach((x) => this.classList._s.delete(x)),
      toggle: (c) => (this.classList._s.has(c) ? this.classList._s.delete(c) : this.classList._s.add(c)),
      contains: (c) => this.classList._s.has(c),
    };
    this.style = { setProperty() {} };
    this.attrs = {};
    this._text = "";
    this.listeners = {};
  }
  set className(v) { this.classList._s = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return [...this.classList._s].join(" "); }
  set textContent(v) { this._text = String(v); this.children = []; }
  get textContent() { return this._text || this.children.map((c) => c.textContent).join(""); }
  set innerHTML(v) { if (v === "") this.children = []; }
  get innerHTML() { return ""; }
  appendChild(n) { this.children.push(n); if (n.__setText) this._text = ""; return n; }
  setAttribute(k, v) { this.attrs[k] = v; }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); }
  querySelector(sel) { return find(this, sel); }
  querySelectorAll(sel) { return findAll(this, sel); }
  click() { (this.listeners.click || []).forEach((f) => f()); }
}
function match(node, sel) {
  if (sel.startsWith(".")) return node.classList.contains(sel.slice(1));
  if (sel.startsWith("[data-stat=")) return node.attrs["data-stat"] === sel.slice(12, -2);
  return node.tagName === sel.toUpperCase();
}
function find(root, sel) { return findAll(root, sel)[0] || null; }
function findAll(root, sel) {
  const out = [];
  (function walk(n) {
    for (const c of n.children) {
      if (match(c, sel)) out.push(c);
      walk(c);
    }
  })(root);
  return out;
}

function makeDom() {
  const doc = new El("document");
  doc.documentElement = new El("html");
  const ids = ["themeToggle", "nav", "navToggle", "navLinks", "typed", "year", "projectGrid", "filters", "repoMeta"];
  const byId = {};
  ids.forEach((id) => {
    const e = new El("div");
    e.attrs.id = id;
    byId[id] = e;
  });
  const tIcon = new El("span");
  tIcon.className = "t-icon";
  byId.themeToggle.appendChild(tIcon);
  const stats = {};
  ["repos", "followers", "years", "projects"].forEach((s) => {
    const e = new El("strong");
    e.attrs["data-stat"] = s;
    stats[s] = e;
  });
  doc.querySelector = (sel) => {
    if (sel.startsWith("#")) return byId[sel.slice(1)] || null;
    if (sel.startsWith("[data-stat=")) return stats[sel.slice(12, -2)] || null;
    return find(doc, sel);
  };
  doc.querySelectorAll = (sel) => {
    if (sel === "#navLinks a") return [];
    if (sel.startsWith("[data-stat=")) return [stats[sel.slice(12, -2)]].filter(Boolean);
    return findAll(doc, sel);
  };
  doc.createElement = (tag) => new El(tag);
  doc.createTextNode = (t) => { const e = new El("text"); e.textContent = t; return e; };
  return { doc, byId, stats };
}

function run({ apiFails }) {
  const { doc, byId, stats } = makeDom();
  const sandbox = {
    document: doc,
    console,
    Promise,
    Date,
    Math,
    JSON,
    Object,
    Array,
    Set,
    String,
    Number,
    isNaN,
    localStorage: { getItem: () => null, setItem() {} },
    matchMedia: () => ({ matches: false }),
    IntersectionObserver: class { observe() {} unobserve() {} },
    fetch: (url) => {
      if (url.includes("api.github.com")) {
        if (apiFails) return Promise.reject(new Error("offline"));
        if (url.includes("/repos")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([
              { name: "uno-rep", description: null, language: "Rust", html_url: "https://github.com/Soma1111111/uno-rep", stargazers_count: 3, forks_count: 1, pushed_at: "2026-10-20T18:55:05Z" },
              { name: "soma1111111", language: null, html_url: "x", stargazers_count: 0, forks_count: 0, pushed_at: "2026-01-01T00:00:00Z" },
            ]),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ login: "Soma1111111", followers: 7, public_repos: 21, created_at: "2023-01-10T15:18:15Z" }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(LOCAL) });
    },
    setTimeout: () => 0, // no-op: the typewriter self-reschedules forever
    setInterval: () => 0,
  };
  sandbox.window = sandbox;
  sandbox.addEventListener = () => {};
  sandbox.scrollY = 0;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "assets/js/main.js"), "utf8"), sandbox);
  return new Promise((r) => setTimeout(r, 50)).then(() => ({ doc, byId, stats }));
}

/* ---------------- tests ---------------- */
(async () => {
  // 1. API live: curated description survives, excluded repo dropped.
  const live = await run({ apiFails: false });
  const cards = live.byId.projectGrid.children;
  assert.ok(cards.length >= 16, "expected all curated + live repos, got " + cards.length);
  assert.ok(!cards.some((c) => c.textContent.includes("soma1111111\n")), "profile repo should be excluded");
  const uno = cards.find((c) => c.textContent.includes("uno-rep"));
  assert.ok(uno, "uno-rep card missing");
  assert.ok(uno.textContent.includes("Uno card game"), "curated description lost: " + uno.textContent);
  assert.ok(uno.textContent.includes("★ 3"), "live star count not applied");
  assert.strictEqual(live.stats.followers.textContent, "7", "live profile stats not applied");
  assert.strictEqual(live.stats.repos.textContent, "21", "live repo count not applied");

  // 2. API down: local fallback still renders the whole grid.
  const down = await run({ apiFails: true });
  assert.strictEqual(down.byId.projectGrid.children.length, LOCAL.repos.length, "fallback grid size wrong");

  // 3. Filters narrow the grid.
  const grid = down.byId.projectGrid;
  const filterButtons = down.byId.filters.children;
  assert.ok(filterButtons.length > 1, "no filters rendered");
  const pythonBtn = filterButtons.find((b) => b.textContent.startsWith("Python"));
  assert.ok(pythonBtn, "Python filter missing");
  const before = grid.children.length;
  pythonBtn.click();
  assert.ok(grid.children.length < before, "filter did not narrow the grid");
  const names = grid.children.map((c) => c.children[0].textContent);
  const expected = ["NLD", "triterosync", "Brain_Age_FMRI", "Face-and-object-detection",
    "french-translation-char-level-seq2seq-", "diabetes-prediction-diabetes-dataset",
    "PygameHacknite", "cloud-project-new-kube"];
  assert.deepStrictEqual(names.sort(), expected.sort(), "wrong projects under the Python filter");

  console.log("✔ smoke tests passed");
})().catch((e) => {
  console.error("✘ " + e.message);
  process.exit(1);
});

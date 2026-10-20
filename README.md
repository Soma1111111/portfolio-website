# Portfolio — T Soma Datta

A zero-dependency, single-page portfolio built from the public GitHub profile
[`Soma1111111`](https://github.com/Soma1111111). Static HTML/CSS/JS — no build
step, no bundler, nothing to install. It is designed to be pushed straight to
GitHub Pages.

## What is here

```
index.html              the whole site
assets/css/style.css    styles (dark + light theme, responsive)
assets/js/main.js       theme, nav, typewriter, filters, live repo loading
assets/data/repos.json  curated project list + profile fallback
test/smoke.js           boots main.js in a DOM stub and checks the loader
deploy.sh               one-command deploy to the Pages repo
.github/workflows/      optional Actions-based Pages deploy
```

## Deploy

### Option A — script (fastest)

```bash
./deploy.sh
```

It clones `Soma1111111/soma1111111.github.io`, copies the site in, commits and
pushes to `main`. Add `--dry-run` to preview the commit first.

If the Pages site has never been enabled, open
**repo → Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**
once. After that every push goes live automatically.

### Option B — GitHub Actions

The repo already contains `.github/workflows/pages.yml`. Push this folder to any
repository and enable **Settings → Pages → Source: GitHub Actions**.

### Option C — manual

```bash
git clone https://github.com/Soma1111111/soma1111111.github.io.git
cd soma1111111.github.io
# copy index.html, assets/ and .nojekyll from this folder over the repo root
git add -A && git commit -m "Deploy portfolio" && git push
```

## Live GitHub data

`main.js` fetches `https://api.github.com/users/Soma1111111/repos` at runtime
so stars, forks and activity are always current. If the API is rate-limited or
offline it falls back to `assets/data/repos.json`, so the page is never empty.

The public API allows 60 requests/hour per IP — plenty for a portfolio, but if
you expect more traffic, proxy the call through a tiny serverless function and
cache it.

## Before you publish

- `assets/data/repos.json` → edit descriptions/topics if you want different copy.
- `assets/css/style.css` → `--brand` / `--brand-2` at the top control the accent
  colours for both themes.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

A server is required because the page fetches `assets/data/repos.json` (file://
blocks that request).

## Tests

```bash
node test/smoke.js
```

Runs the real `main.js` against a stubbed DOM and asserts that projects render
from the API, fall back to the local JSON when the API is unreachable, and that
the language filters narrow the grid to the right repos.

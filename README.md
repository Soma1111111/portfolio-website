# Portfolio — T Soma Datta

A zero-dependency, single-page portfolio built from the public GitHub profile
[`Soma1111111`](https://github.com/Soma1111111). Static HTML/CSS/JS — no build
step, no bundler, nothing to install. Motion is driven by
[anime.js](https://animejs.com/) (loaded from a CDN).

## What is here

```
index.html              the whole site
assets/css/style.css    styles (dark + light theme, responsive)
assets/js/anim.js       anime.js layer: intro timeline, reveals, tilt, cursor, ASCII rain
assets/js/main.js       theme, nav, typewriter, project filters, live repo loading
assets/data/repos.json  curated project list + profile fallback
test/smoke.js           boots main.js in a DOM stub and checks the loader
deploy.sh               one-command deploy to both Pages repos
.github/workflows/      Actions-based Pages deploy
```

## Live sites

| URL | repo |
|---|---|
| https://soma1111111.github.io/ | `Soma1111111/soma1111111.github.io` (canonical) |
| https://soma1111111.github.io/portfolio-website/ | `Soma1111111/portfolio-website` (Actions) |

Both are kept in sync by `deploy.sh`.

## Deploy

```bash
./deploy.sh --dry-run   # preview the commits
./deploy.sh             # pushes to both repos
```

`portfolio-website` deploys through `.github/workflows/pages.yml` (Actions);
`soma1111111.github.io` uses the plain branch build. If Pages has never been
enabled on a repo, open **Settings → Pages → Source** once.

### Previewing a branch

The workflow also runs on the `feat/animated-v2` branch, so a branch can be
pushed and viewed at the project-page URL before it is merged:

```bash
git push origin feat/animated-v2
# -> https://soma1111111.github.io/portfolio-website/
```

## Live GitHub data

`main.js` fetches `https://api.github.com/users/Soma1111111/repos` at runtime
so stars, forks and activity are always current. If the API is rate-limited or
offline it falls back to `assets/data/repos.json`, so the page is never empty.

The public API allows 60 requests/hour per IP — plenty for a portfolio, but if
you expect more traffic, proxy the call through a tiny serverless function and
cache it.

## If anime.js does not load

Every animation is additive: without the CDN the site still renders, reads and
navigates — it just does not move.

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

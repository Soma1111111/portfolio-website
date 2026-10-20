#!/usr/bin/env bash
# Deploy this portfolio to GitHub Pages.
#
#   ./deploy.sh            # copy site files into the Pages repos and push
#   ./deploy.sh --dry-run  # show what would happen, push nothing
#
# Requires: git, and push access to the target repos.
#
# Two repos are kept in sync so both URLs serve the same site:
#   Soma1111111/soma1111111.github.io  -> https://soma1111111.github.io/   (canonical)
#   Soma1111111/portfolio-website       -> https://soma1111111.github.io/portfolio-website/

set -euo pipefail

REPOS=(
  "${REPO:-https://github.com/Soma1111111/soma1111111.github.io.git}"
  "https://github.com/Soma1111111/portfolio-website.git"
)
BRANCH="${BRANCH:-main}"
SRC="$(cd "$(dirname "$0")" && pwd)"
DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

FILES=(index.html assets .nojekyll .github)

command -v git >/dev/null || { echo "git is required"; exit 1; }

for REPO in "${REPOS[@]}"; do
  TMP="$(mktemp -d)"
  echo "==> $REPO"

  git clone --depth 1 --branch "$BRANCH" "$REPO" "$TMP/site" 2>/dev/null || {
    echo "    branch '$BRANCH' not found, using the default branch"
    git clone --depth 1 "$REPO" "$TMP/site"
  }

  cd "$TMP/site"

  # Replace the deployed site with the local build.
  rm -rf index.html assets .nojekyll .github
  for f in "${FILES[@]}"; do
    [ -e "$SRC/$f" ] && cp -r "$SRC/$f" .
  done

  # Anything else already in the repo is kept (e.g. CNAME, custom domain).

  # Windows-mounted files come in as 755; normalise so the diff is clean.
  find . -path ./.git -prune -o -type f -exec chmod 644 {} + 2>/dev/null || true

  git add -A
  if git diff --cached --quiet; then
    echo "    nothing to deploy, already up to date"
    cd / && rm -rf "$TMP"
    continue
  fi

  git -c user.name="Soma Datta" -c user.email="soma@users.noreply.github.com" commit -q -m "Deploy portfolio site"

  if [ "$DRY_RUN" = "1" ]; then
    git show --stat --oneline HEAD | sed 's/^/    /'
  else
    git push origin HEAD:"$BRANCH" && echo "    pushed"
  fi

  cd / && rm -rf "$TMP"
done

echo
if [ "$DRY_RUN" = "1" ]; then
  echo "Dry run — nothing was pushed."
else
  echo "✔ Deployed. Sites go live within a minute:"
  echo "  https://soma1111111.github.io/"
  echo "  https://soma1111111.github.io/portfolio-website/"
fi

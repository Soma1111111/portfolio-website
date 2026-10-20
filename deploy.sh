#!/usr/bin/env bash
# Deploy this portfolio to GitHub Pages.
#
#   ./deploy.sh            # copy site files into the Pages repo and push
#   ./deploy.sh --dry-run  # show what would happen, push nothing
#
# Requires: git, and push access to the target repo.

set -euo pipefail

REPO="${REPO:-https://github.com/Soma1111111/soma1111111.github.io.git}"
BRANCH="${BRANCH:-main}"
SRC="$(cd "$(dirname "$0")" && pwd)"
DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

FILES=(index.html assets .nojekyll .github)

command -v git >/dev/null || { echo "git is required"; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "==> cloning $REPO"
git clone --depth 1 --branch "$BRANCH" "$REPO" "$TMP/site" 2>/dev/null || {
  echo "==> branch '$BRANCH' not found, trying default branch"
  git clone --depth 1 "$REPO" "$TMP/site"
}

cd "$TMP/site"

# Replace the deployed site with the local build.
rm -rf index.html assets .nojekyll .github
for f in "${FILES[@]}"; do
  [ -e "$SRC/$f" ] && cp -r "$SRC/$f" .
done

# Anything else already in the Pages repo is kept (e.g. CNAME, custom domain).

# Windows-mounted files come in as 755; normalise so the diff is clean.
find . -path ./.git -prune -o -type f -exec chmod 644 {} + 2>/dev/null || true

git add -A
if git diff --cached --quiet; then
  echo "==> nothing to deploy, site is already up to date"
  exit 0
fi

git -c user.name="Soma Datta" -c user.email="soma@users.noreply.github.com" commit -m "Deploy portfolio site"

if [ "$DRY_RUN" = "1" ]; then
  echo "==> dry run, would push:"
  git show --stat --oneline HEAD
  exit 0
fi

echo "==> pushing to $BRANCH"
git push origin "$BRANCH"

echo
echo "✔ Deployed. Site should be live at https://Soma1111111.github.io/ within a minute."
echo "  (First deploy? Repo Settings → Pages → Source: Deploy from a branch → main / (root))"

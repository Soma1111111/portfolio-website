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

# On WSL there is usually no credential helper in the Linux shell, but the
# Windows Git Credential Manager is right there. Use it so `git push` works.
GCM="/mnt/c/Program Files/Git/mingw64/bin/git-credential-manager.exe"
if [ -x "$GCM" ] && [ -z "${GIT_CREDENTIAL_HELPER:-}" ]; then
  HELPER="$(mktemp)"
  printf '#!/bin/sh\nexec "%s" "$@"\n' "$GCM" > "$HELPER"
  chmod +x "$HELPER"
  export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=credential.helper GIT_CONFIG_VALUE_0="$HELPER"
  trap 'rm -f "$HELPER"' EXIT
  echo "==> using Windows Git Credential Manager for auth"
fi

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

  # The email must be the one linked to the GitHub account, or the commits
  # show up under a different user in the repo's contributor list.
  git -c user.name="T Soma Datta" -c user.email="tsomadatta2004@gmail.com" commit -q -m "Deploy portfolio site"

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

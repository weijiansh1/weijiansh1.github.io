#!/usr/bin/env bash
# Run from a terminal with GitHub access and an authenticated GitHub CLI.
set -euo pipefail

profile_root="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
profile_repository="weijiansh1/weijianshi.github.io"

for dependency in git gh python3; do
  if ! command -v "$dependency" >/dev/null 2>&1; then
    printf 'Required command is missing: %s\n' "$dependency" >&2
    exit 1
  fi
done

python3 "$profile_root/scripts/build.py"

if ! profile_branch="$(gh api "repos/$profile_repository" --jq '.default_branch')"; then
  printf 'Cannot access %s. Nothing was pushed. Check network access and gh authentication.\n' "$profile_repository" >&2
  exit 1
fi

profile_checkout="$(mktemp -d "${TMPDIR:-/tmp}/weijian-homepage-push.XXXXXX")"
printf 'Preparing a fresh checkout in %s\n' "$profile_checkout"
profile_git_protocol="$(gh config get git_protocol --host github.com)"
if [[ "$profile_git_protocol" == ssh ]]; then
  profile_remote="git@github.com:$profile_repository.git"
  profile_git=(git)
else
  profile_remote="https://github.com/$profile_repository.git"
  profile_git=(git -c credential.helper= -c 'credential.helper=!gh auth git-credential')
fi
"${profile_git[@]}" clone --single-branch "$profile_remote" "$profile_checkout"

if git -C "$profile_checkout" rev-parse --verify HEAD >/dev/null 2>&1; then
  git -C "$profile_checkout" checkout "$profile_branch"
else
  git -C "$profile_checkout" symbolic-ref HEAD "refs/heads/$profile_branch"
fi

profile_files=(
  index.html resume.html site.json README.md .nojekyll .gitignore
  assets/favicon.svg assets/main.js assets/preferences.js assets/style.css
  assets/avatar.jpg assets/nar-overview.svg assets/resume.css assets/redirect.js
  templates/index.html templates/resume.html scripts/build.py scripts/push-to-github.sh
  .github/workflows/pages.yml
)

python3 - "$profile_root" "$profile_checkout" "${profile_files[@]}" <<'PY'
import shutil
import sys
from pathlib import Path

source, checkout = (Path(value).resolve() for value in sys.argv[1:3])
for name in sys.argv[3:]:
    destination = checkout / name
    if not destination.resolve().is_relative_to(checkout):
        raise SystemExit(f"Destination escapes the checkout: {name}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    if name == '.gitignore' and destination.exists():
        existing = destination.read_text(encoding='utf-8')
        additions = [line for line in (source / name).read_text().splitlines()
                     if line and line not in existing.splitlines()]
        if additions:
            destination.write_text(existing.rstrip('\n') + '\n' + '\n'.join(additions) + '\n')
    else:
        shutil.copy2(source / name, destination)
PY

git -C "$profile_checkout" add -- "${profile_files[@]}"
if git -C "$profile_checkout" diff --cached --quiet; then
  printf 'The remote repository already contains this homepage.\n'
  exit 0
fi

if ! git -C "$profile_checkout" config user.name >/dev/null; then
  git -C "$profile_checkout" config user.name 'Weijian Shi'
fi
if ! git -C "$profile_checkout" config user.email >/dev/null; then
  profile_author_email="$(gh api user --jq '(.id | tostring) + "+" + .login + "@users.noreply.github.com"')"
  git -C "$profile_checkout" config user.email "$profile_author_email"
fi

git -C "$profile_checkout" diff --cached --stat
git -C "$profile_checkout" commit -m 'Build bilingual academic homepage for Weijian Shi'
"${profile_git[@]}" -C "$profile_checkout" push origin "HEAD:$profile_branch"

profile_commit="$(git -C "$profile_checkout" rev-parse HEAD)"
printf 'Pushed successfully: https://github.com/%s/commit/%s\n' "$profile_repository" "$profile_commit"
printf 'GitHub Pages deployment status: https://github.com/%s/actions\n' "$profile_repository"

#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

bash -n scripts/*.sh
npm run build
test -f dist/agent-remote-icon.svg
test -f dist/apple-touch-icon.png
npm test
git diff --check

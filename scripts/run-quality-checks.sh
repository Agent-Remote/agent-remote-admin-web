#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

bash -n scripts/*.sh
ruby tests/release_workflow_contract_test.rb
npm run build
test -f dist/agent-remote-icon.svg
test -f dist/apple-touch-icon.png
npm test -- --coverage
git diff --check

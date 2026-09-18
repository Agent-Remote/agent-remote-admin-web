#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <version>" >&2
}

if [[ $# -ne 1 ]]; then
  usage
  exit 2
fi

VERSION="${1#v}"
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([-.+][0-9A-Za-z.-]+)?$ ]]; then
  echo "Invalid semantic version: $1" >&2
  exit 2
fi

npm version "$VERSION" --no-git-tag-version --allow-same-version

scripts/update-changelog.sh "$VERSION"

echo "Prepared agent-remote-admin-web v${VERSION}"

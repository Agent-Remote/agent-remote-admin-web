#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <version>" >&2
  echo "Example: $0 0.0.2" >&2
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

python3 - "$VERSION" <<'PY'
from __future__ import annotations

import re
import sys
from pathlib import Path

version = sys.argv[1]

dockerfile = Path("Dockerfile")
text = dockerfile.read_text()
text = re.sub(
    r"ARG AGENT_REMOTE_VERSION=[0-9A-Za-z.+-]+",
    f"ARG AGENT_REMOTE_VERSION={version}",
    text,
    count=1,
)
dockerfile.write_text(text)
PY

scripts/update-changelog.sh "$VERSION"

echo "Prepared agent-remote-admin-web v${VERSION}"

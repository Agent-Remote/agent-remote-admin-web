#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <version>" >&2
  echo "Example: $0 0.1.3" >&2
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
import stat
import sys
import tempfile
from pathlib import Path

version = sys.argv[1]

script = Path("scripts/prepare-release.sh")
text = script.read_text()
text = re.sub(r"Example: \$0 [0-9A-Za-z.+-]+", f"Example: $0 {version}", text)
script_mode = stat.S_IMODE(script.stat().st_mode)
with tempfile.NamedTemporaryFile(
    mode="w", dir=script.parent, prefix=f".{script.name}.", delete=False
) as output:
    output.write(text)
    replacement = Path(output.name)
replacement.chmod(script_mode)
replacement.replace(script)

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

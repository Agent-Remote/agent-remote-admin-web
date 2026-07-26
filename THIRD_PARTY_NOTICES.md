# Third-Party Notices

This repository is licensed under GPL-3.0-only. See `LICENSE`.

## Web Application Dependencies

| Component | Use | License |
| --- | --- | --- |
| React / React DOM | UI runtime | MIT. Source: https://github.com/facebook/react/blob/main/LICENSE |
| TanStack Query | Server-state management | MIT. Source: https://github.com/TanStack/query/blob/main/LICENSE |
| React Router | Client-side routing | MIT. Source: https://github.com/remix-run/react-router/blob/main/LICENSE.md |
| Lucide | UI icons | ISC. Source: https://github.com/lucide-icons/lucide/blob/main/LICENSE |
| Vite / React plugin | Production build | MIT. Source: https://github.com/vitejs/vite/blob/main/LICENSE |
| TypeScript | Type checking and build tooling | Apache-2.0. Source: https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt |

The production container is based on `nginx:1.27-alpine`. Nginx uses the
2-clause BSD license; Alpine packages retain their individual licenses. Derived
images must retain the notices from the exact base-image digest.

The exact npm dependency graph is recorded in `package-lock.json`. Test-only
packages are not included in the production static bundle.

## Distribution Requirements

When a release artifact redistributes third-party software, it must include:

- the exact component name and version;
- the source URL and checksum;
- the applicable license and notice text;
- any required source code, source offer, or relinking instructions.

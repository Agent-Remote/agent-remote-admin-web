# AGENTS.md

This document is the primary instruction set for AI agents and automated coding tools working in this repository. Repository-local rules take precedence over general assumptions.

## Task-To-Documentation Mapping

Before making changes, identify the task domain and read the matching rule document.

| Task Domain | Primary Reference |
| --- | --- |
| Project purpose and repository boundary | `docs/rules/01-project-overview.md` |
| React architecture and module boundaries | `docs/rules/02-architecture.md` |
| TypeScript, React, and build dependencies | `docs/rules/03-tech-stack.md` |
| TypeScript and React code style | `docs/rules/04-code-style.md` |
| UI, accessibility, localization, and copy | `docs/rules/05-ui-i18n.md` |
| Local commands and developer workflow | `docs/rules/06-commands.md` |
| Quality and security gates | `docs/rules/07-quality-security.md` |
| Git, commits, hooks, and pull requests | `docs/rules/08-collaboration.md` |
| API, authentication, and console data | `docs/rules/09-api-auth.md` |

## Mandatory Gates

- TypeScript production build, Vitest, shell syntax checks, and `git diff --check` must pass before commit.
- User-facing text must use locale message files and remain available in English and Simplified Chinese.
- Interactive changes must preserve keyboard access, focus behavior, loading, empty, error, and confirmation states.
- API contract changes must remain compatible with the server or update affected repositories together.
- Commit messages must follow Conventional Commits.
- Tokens, cookies, passwords, private keys, and browser login state must never be committed, rendered unnecessarily, or logged.

## Implementation Rules

- Keep server communication in `src/api` and resource loading in `src/hooks`.
- Keep console feature pages in `src/pages/console` and shared primitives in `src/components` or `src/app`.
- Use TanStack Query for server state and React state only for local UI state.
- Preserve route-addressable console pages and browser back, forward, and refresh behavior.
- Use Lucide icons through the installed library and follow existing responsive shell conventions.
- Prefer strict, explicit types and focused components over broad casts or speculative abstractions.

## Hook Setup

Install repository hooks after cloning:

```sh
scripts/install-githooks.sh
```

Run the full local quality gate:

```sh
scripts/run-quality-checks.sh
```

## Conflict Resolution

If existing code conflicts with these rules:

1. Stop before editing the conflicting area.
2. Identify the file and rule that disagree.
3. Ask for the intended current standard.

# 07 Quality And Security

## Required Gates

- Shell scripts parse successfully.
- The strict TypeScript production build succeeds.
- All Vitest tests pass.
- Git reports no whitespace errors.

Add focused tests for navigation, authorization-dependent rendering, mutations, confirmations, localization, and regressions. CI, pre-commit, and pre-push all run the same gate.

## Security

- Treat browser storage, URL parameters, API responses, and server error messages as untrusted input.
- Never render secrets or place tokens in URLs, logs, analytics, or persisted query caches.
- `VITE_AGENT_REMOTE_DEV_TOKEN` is development-only and must remain unavailable to production builds.
- Frontend role checks improve UX but never replace server authorization.
- Avoid raw HTML injection. Any future exception requires sanitization, a security rationale, and tests.

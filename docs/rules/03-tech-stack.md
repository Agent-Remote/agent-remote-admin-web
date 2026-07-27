# 03 Tech Stack

## Runtime And Build

- Node.js 22 is the development and CI runtime.
- TypeScript strict mode is required.
- React 19 renders the UI and React Router owns navigation.
- TanStack Query owns server state.
- Vite owns development and production builds.
- Vitest and Testing Library own automated UI tests.
- Lucide React is the icon source.

## Dependency Policy

- Use `npm` and commit `package-lock.json` changes with `package.json` changes.
- Add dependencies only when existing libraries and browser APIs cannot solve the problem clearly.
- Runtime packages belong in `dependencies`; test-only packages belong in `devDependencies`.
- Do not introduce a second router, server-state cache, icon system, or localization framework without an approved migration.

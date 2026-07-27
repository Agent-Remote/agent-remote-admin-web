# 02 Architecture

## Module Layout

```text
src/api/             HTTP client and transport behavior
src/app/             Shared application providers and navigation
src/components/      Reusable UI primitives
src/hooks/           Server-state loading and orchestration
src/i18n/            Locale runtime and message catalogs
src/pages/           Route-level pages
src/pages/console/   Console feature pages
src/test/            Shared test setup
src/types.ts         Control-plane resource types
```

## Dependency Direction

- Route pages compose hooks and shared components.
- Hooks may call `src/api`; components must not issue ad hoc API requests.
- Shared UI primitives must not depend on feature pages.
- Locale catalogs must not import React or feature modules.
- `App.tsx` and `main.tsx` wire providers and routing; business workflows belong in feature modules.

TanStack Query owns remote state, cache invalidation, polling, and refetching. React state owns transient presentation state only.

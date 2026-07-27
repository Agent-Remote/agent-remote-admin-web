# 09 API And Authentication

- `ApiClient` owns base URL normalization, headers, JSON decoding, and public error conversion.
- Requests use the versioned `/api/v1` contract and typed response shapes.
- TanStack Query owns fetching, polling, cache invalidation, reconnect behavior, and active-page loading.
- Mutations must prevent duplicate submission and refresh every affected resource after success.
- Authentication expiry must produce a predictable sign-in recovery path.

Never expose administrator controls solely based on page location. Render them from authenticated role state and rely on server enforcement. Approval codes and route parameters are untrusted; normalize and validate them before use. Do not show raw server internals, credential values, or sensitive audit payloads.

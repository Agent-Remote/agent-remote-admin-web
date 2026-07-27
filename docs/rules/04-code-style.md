# 04 Code Style

## TypeScript

- Keep strict typing and explicit domain types at API and component boundaries.
- Avoid `any`, unchecked non-null assertions, and broad type casts.
- Use `import type` for type-only imports.
- Prefer discriminated unions and small helpers over boolean combinations with unclear states.
- Keep API resource types synchronized with server response schemas.

## React

- Use function components and hooks.
- Keep effects for synchronization with external systems, not derived render state.
- Preserve stable query keys and invalidate the narrowest affected resource.
- Keep components focused; extract shared behavior only after real reuse appears.
- Test observable behavior rather than implementation details.

Follow the existing formatting in touched files and let the TypeScript build reject unused or invalid code.

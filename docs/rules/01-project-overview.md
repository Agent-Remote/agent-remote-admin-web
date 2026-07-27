# 01 Project Overview

`agent-remote-admin-web` is the operator and user console for agent-remote. It presents control-plane resources and actions; it does not own business authorization, scheduling, or node execution policy.

## Repository Boundary

- Render authentication, approval, console, settings, and resource-management workflows.
- Call versioned APIs exposed by `agent-remote-server`.
- Keep browser preferences such as locale locally; keep authoritative resource state on the server.
- Do not reproduce server authorization or node scheduling rules as frontend-only security controls.

API payload changes require coordinated server schemas, frontend types, UI states, and tests. Never silently accept a new contract through broad casts.

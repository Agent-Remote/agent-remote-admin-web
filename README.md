# agent-remote-admin-web

Administrative web frontend for agent-remote.

The current frontend provides the remote temporary browser workspace for creating, listing, connecting, and stopping browser sessions.

The frontend stack uses TypeScript, React, Vite, and lucide-react. Later management pages can add TanStack Query/Table and a component system when the broader admin console is implemented.

## Commands

```sh
npm install
```

```sh
npm run dev
```

```sh
npm run build
```

Set `VITE_AGENT_REMOTE_API_BASE` to point the UI at a non-local control plane.

## License

agent-remote-admin-web is licensed under GPL-3.0-only. See `LICENSE`.

Third-party dependency notices are listed in `THIRD_PARTY_NOTICES.md`.

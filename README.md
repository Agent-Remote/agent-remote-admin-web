# agent-remote-admin-web

English | [中文](README.zh-CN.md)

Administrative web frontend for agent-remote.

The frontend stack uses TypeScript, React, Vite, and lucide-react. It provides the management console for users, devices, tool accounts, nodes, sessions, sync, remote browser sessions, audit logs, and local console settings.

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

## Container

Build the static admin web image:

```sh
docker build -t agent-remote-admin-web .
```

By default the production build uses a relative API base, so the reverse proxy should route `/api/*` to `agent-remote-server` and all other paths to the admin web container.

GitHub Actions builds and pushes the production image to GHCR for `v*` tags and creates a GitHub Release record with generated release notes.

## License

agent-remote-admin-web is licensed under GPL-3.0-only. See `LICENSE`.

Third-party dependency notices are listed in `THIRD_PARTY_NOTICES.md`.

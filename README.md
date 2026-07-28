# agent-remote-admin-web

<p align="center"><img src="public/agent-remote-icon.svg" alt="Agent Remote icon" width="80" height="80"></p>

<p align="center">
  <a href="https://github.com/Agent-Remote/agent-remote-admin-web/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/Agent-Remote/agent-remote-admin-web/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://codecov.io/gh/Agent-Remote/agent-remote-admin-web"><img alt="Codecov" src="https://codecov.io/gh/Agent-Remote/agent-remote-admin-web/graph/badge.svg"></a>
  <a href="https://github.com/Agent-Remote/agent-remote-admin-web/stargazers"><img alt="GitHub Stars" src="https://img.shields.io/github/stars/Agent-Remote/agent-remote-admin-web?style=flat&logo=github"></a>
  <img alt="TypeScript 5.7" src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white">
  <a href="LICENSE"><img alt="License: GPL-3.0" src="https://img.shields.io/github/license/Agent-Remote/agent-remote-admin-web"></a>
</p>

English | [中文](README.zh-CN.md)

Administrative web frontend for agent-remote.

The frontend stack uses TypeScript, React, Vite, and lucide-react. It provides the management console for users, devices, tool accounts, nodes, sessions, sync, remote browser sessions, audit logs, and local console settings.

Runtime controls include node backend allowlists/defaults/policy and capability inspection, account backend pinning and explicit migration, plus session backend/resource/replacement visibility. Interrupted sessions are shown as non-attachable so operators can distinguish them from recoverable active sessions.

## Architecture

- React Router keeps the active console page in `/app/:page`, including refresh, back, and forward navigation.
- TanStack Query loads only the resources required by the active page, refreshes live resources automatically, and revalidates after reconnect or window focus.
- Console features live in `src/pages/console`, while shared application infrastructure lives in `src/app`, `src/hooks`, and `src/components`.
- Locale messages are stored in `src/i18n/locales/*.json`. The initial locale follows the browser unless the user has saved a preference.
- The desktop shell uses a persistent sidebar. Narrow screens and short landscape phones use a fixed header, bottom navigation, a complete feature drawer, and full-screen creation forms with safe-area padding.

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

```sh
npm test
```

Set `VITE_AGENT_REMOTE_API_BASE` to point the UI at a non-local control plane.

For local UI development with a mock control plane, `VITE_AGENT_REMOTE_DEV_TOKEN`
can provide a development-only access token. Vite production builds ignore this value.

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

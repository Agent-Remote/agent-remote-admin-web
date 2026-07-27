# agent-remote-admin-web

<p align="center"><img src="public/agent-remote-icon.svg" alt="Agent Remote 图标" width="80" height="80"></p>

[English](README.md) | 中文

agent-remote 的管理 Web 前端。

前端技术栈使用 TypeScript、React、Vite 和 lucide-react。它提供管理控制台，用于用户、设备、工具账户、节点、session、同步、远端浏览器会话、审计日志和本地控制台设置。

Runtime 控制包括节点 backend 允许列表、默认值、策略和能力检查，账户 backend 固定与显式迁移，以及 session backend/resource/replacement 展示。中断的 session 会显示为不可 attach，便于运维人员将其与可恢复的 active session 区分。

## 架构

- React Router 将当前控制台页面保存在 `/app/:page`，支持刷新、前进和后退。
- TanStack Query 只加载当前页面需要的资源，自动刷新活跃资源，并在网络恢复或窗口重新聚焦时重新校验。
- 控制台功能页面位于 `src/pages/console`，共享应用基础设施位于 `src/app`、`src/hooks` 和 `src/components`。
- 翻译文本存放在 `src/i18n/locales/*.json`；用户未保存偏好时，默认跟随浏览器语言。
- 桌面端使用固定侧栏；窄屏和短视口横屏手机使用固定顶栏、底部导航、完整功能抽屉及带安全区适配的全屏创建表单。

## 命令

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

设置 `VITE_AGENT_REMOTE_API_BASE` 可让 UI 指向非本地控制平面。

本地使用模拟控制平面进行界面开发时，可通过 `VITE_AGENT_REMOTE_DEV_TOKEN`
提供仅开发模式生效的访问令牌；Vite 生产构建会忽略该值。

## 容器

构建静态 admin web 镜像：

```sh
docker build -t agent-remote-admin-web .
```

默认情况下，生产构建使用相对 API base，因此反向代理应把 `/api/*` 路由到 `agent-remote-server`，并把其他路径路由到 admin web 容器。

GitHub Actions 会在 `v*` tag 上构建生产镜像并推送到 GHCR，同时创建带生成 release notes 的 GitHub Release 记录。

## 许可证

agent-remote-admin-web 使用 GPL-3.0-only 许可证。详见 `LICENSE`。

第三方依赖声明见 `THIRD_PARTY_NOTICES.md`。

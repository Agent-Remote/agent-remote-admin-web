# agent-remote-admin-web

[English](README.md) | 中文

agent-remote-admin-web 是 agent-remote 的管理端前端。技术栈为 TypeScript、React、Vite 和 lucide-react。

## 功能范围

管理端提供以下视图和操作：

- 用户和设备管理。
- Claude tool account 管理。
- 节点注册、状态和任务查看。
- workspace、同步会话和 tool session 查看。
- 临时远程浏览器会话管理。
- 审计日志。
- 本地控制台设置。

## 本地开发

```sh
npm install
npm run dev
npm run build
```

设置 `VITE_AGENT_REMOTE_API_BASE` 可让前端连接非本地控制平面。

## 容器

```sh
docker build -t agent-remote-admin-web .
```

生产构建默认使用相对 API base。反向代理应把 `/api/*` 转发到 `agent-remote-server`，其他路径转发到 admin web 容器。

GitHub Actions 会为 release tag 构建并推送 GHCR 镜像，同时创建 GitHub Release 记录和 release notes。

## 许可证

agent-remote-admin-web 使用 GPL-3.0-only 许可证。详见 `LICENSE`。

第三方依赖声明见 `THIRD_PARTY_NOTICES.md`。

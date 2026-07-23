import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Circle,
  Database,
  FileClock,
  FolderSync,
  KeyRound,
  Laptop,
  Link,
  LogOut,
  MonitorUp,
  Play,
  RefreshCw,
  RotateCcw,
  Save,
  Server,
  Settings,
  Shield,
  Square,
  TerminalSquare,
  UserPlus,
  Users,
  Wrench
} from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  Badge,
  CheckLine,
  DetailRow,
  EmptyBlock,
  Field,
  NoticeBar,
  PanelTitle,
  ResourceRow,
  SelectField,
  StatusPill,
  TextAreaField,
  copyToClipboard
} from "../components/ui";
import { useI18n } from "../i18n/I18nProvider";
import {
  type ApiResponse,
  type AppRequest,
  type AuditLog,
  type BrowserSession,
  type Device,
  type NodeItem,
  type NodeTask,
  type Notice,
  type Page,
  type RunAction,
  type SyncSession,
  type ToolAccount,
  type ToolSession,
  type User,
  type Workspace
} from "../types";
import { formatDate, shortId, splitList, tagsText } from "../utils/format";

type DashboardProps = {
  accounts: ToolAccount[];
  apiBase: string;
  auditLogs: AuditLog[];
  browserSessions: BrowserSession[];
  busy: boolean;
  devices: Device[];
  loadAll: () => Promise<void>;
  logout: () => void;
  me: User;
  nodes: NodeItem[];
  nodeTasks: NodeTask[];
  notice: Notice | null;
  page: Page;
  request: AppRequest;
  runAction: RunAction;
  setApiBase: React.Dispatch<React.SetStateAction<string>>;
  setNotice: React.Dispatch<React.SetStateAction<Notice | null>>;
  setPage: React.Dispatch<React.SetStateAction<Page>>;
  syncSessions: SyncSession[];
  toolSessions: ToolSession[];
  users: User[];
  workspaces: Workspace[];
};

const navItems: { id: Page; key: Parameters<ReturnType<typeof useI18n>["t"]>[0]; icon: React.ElementType }[] = [
  { id: "overview", key: "nav.overview", icon: Activity },
  { id: "users", key: "nav.users", icon: Users },
  { id: "devices", key: "nav.devices", icon: Laptop },
  { id: "accounts", key: "nav.accounts", icon: KeyRound },
  { id: "nodes", key: "nav.nodes", icon: Server },
  { id: "sessions", key: "nav.sessions", icon: TerminalSquare },
  { id: "sync", key: "nav.sync", icon: FolderSync },
  { id: "browser", key: "nav.browser", icon: MonitorUp },
  { id: "audit", key: "nav.audit", icon: FileClock },
  { id: "settings", key: "nav.settings", icon: Settings }
];

export function Dashboard(props: DashboardProps) {
  const { locale, setLocale, t } = useI18n();
  const isAdmin = props.me.role === "admin";
  const title = navItems.find((item) => item.id === props.page)?.key ?? "nav.overview";
  const failedTasks = props.nodeTasks.filter((task) => task.status === "failed");

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <Shield size={22} />
          <h1>{t("app.name")}</h1>
        </div>
        <div className="user-chip">
          <strong>{props.me.display_name}</strong>
          <span>{props.me.role}</span>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={props.page === item.id ? "active" : ""}
                onClick={() => props.setPage(item.id)}
                type="button"
              >
                <Icon size={17} />
                {t(item.key)}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-actions">
          <select
            aria-label={t("settings.language")}
            className="compact-select"
            value={locale}
            onChange={(event) => setLocale(event.target.value === "zh" ? "zh" : "en")}
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
          <button className="ghost" onClick={props.logout} type="button">
            <LogOut size={16} />
            {t("common.logout")}
          </button>
        </div>
      </aside>
      <section className="workspace">
        <header className="toolbar">
          <div>
            <strong>{t(title)}</strong>
            <span>{props.apiBase}</span>
          </div>
          <button onClick={props.loadAll} disabled={props.busy} type="button">
            <RefreshCw size={16} />
            {t("common.refresh")}
          </button>
        </header>
        {props.notice ? <NoticeBar notice={props.notice} /> : null}
        {props.page === "overview" ? <OverviewPage {...props} failedTasks={failedTasks} isAdmin={isAdmin} /> : null}
        {props.page === "users" ? <UsersPage {...props} isAdmin={isAdmin} /> : null}
        {props.page === "devices" ? <DevicesPage {...props} /> : null}
        {props.page === "accounts" ? <AccountsPage {...props} /> : null}
        {props.page === "nodes" ? <NodesPage {...props} isAdmin={isAdmin} /> : null}
        {props.page === "sessions" ? <SessionsPage {...props} /> : null}
        {props.page === "sync" ? <SyncPage {...props} /> : null}
        {props.page === "browser" ? <BrowserPage {...props} /> : null}
        {props.page === "audit" ? <AuditPage auditLogs={props.auditLogs} /> : null}
        {props.page === "settings" ? <SettingsPage {...props} /> : null}
      </section>
    </main>
  );
}

function OverviewPage({
  users,
  devices,
  accounts,
  nodes,
  workspaces,
  syncSessions,
  toolSessions,
  browserSessions,
  failedTasks,
  auditLogs,
  isAdmin
}: DashboardProps & { failedTasks: NodeTask[]; isAdmin: boolean }) {
  const { t } = useI18n();
  const cards = [
    [t("nav.users"), users.length, Users],
    [t("nav.devices"), devices.length, Laptop],
    [t("nav.accounts"), accounts.length, KeyRound],
    [t("nav.nodes"), nodes.length, Server],
    [t("sync.workspaces"), workspaces.length, Database],
    [t("nav.sync"), syncSessions.length, FolderSync],
    [t("nav.sessions"), toolSessions.length, TerminalSquare],
    [t("nav.browser"), browserSessions.length, MonitorUp]
  ] as const;
  return (
    <div className="content-grid">
      <section className="metric-grid">
        {cards.map(([label, count, Icon]) => (
          <div className="metric" key={label}>
            <Icon size={20} />
            <strong>{count}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>
      {isAdmin ? (
        <section className="panel danger-panel">
          <PanelTitle icon={AlertTriangle} title={t("overview.failedTasks")} />
          {failedTasks.length === 0 ? (
            <EmptyBlock label={t("common.empty")} />
          ) : (
            failedTasks.slice(0, 6).map((task) => <TaskRow key={task.id} task={task} />)
          )}
        </section>
      ) : null}
      <section className="panel">
        <PanelTitle icon={FileClock} title={t("overview.recentAudit")} />
        {auditLogs.length === 0 ? (
          <EmptyBlock label={t("common.empty")} />
        ) : (
          auditLogs.slice(0, 8).map((item) => <AuditRow key={item.id} item={item} />)
        )}
      </section>
    </div>
  );
}

function UsersPage({ users, isAdmin, busy, request, runAction }: DashboardProps & { isAdmin: boolean }) {
  const { t } = useI18n();
  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction(
      () =>
        request("/users", {
          method: "POST",
          body: JSON.stringify({
            username: String(form.get("username") ?? ""),
            password: String(form.get("password") ?? ""),
            role: String(form.get("role") ?? "user"),
            display_name: String(form.get("display_name") ?? "") || null
          })
        }).then(() => undefined),
      t("users.created")
    );
    event.currentTarget.reset();
  }

  return (
    <div className="two-column">
      <section className="panel">
        <PanelTitle icon={Users} title={t("users.title")} />
        {!isAdmin ? <EmptyBlock label={t("users.adminRequired")} /> : null}
        {isAdmin && users.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
        {isAdmin
          ? users.map((user) => (
              <ResourceRow
                key={user.id}
                title={user.display_name}
                meta={`${user.username} · ${shortId(user.id)}`}
                actions={
                  <>
                    <StatusPill status={user.status} />
                    <Badge>{user.role}</Badge>
                    <button
                      disabled={busy || user.status !== "active"}
                      onClick={() => {
                        if (confirm(t("common.confirmDisable", { name: user.username }))) {
                          void runAction(
                            () => request(`/users/${user.id}/disable`, { method: "POST" }).then(() => undefined),
                            t("users.disabled")
                          );
                        }
                      }}
                      type="button"
                    >
                      <Ban size={15} />
                      {t("common.disable")}
                    </button>
                  </>
                }
              />
            ))
          : null}
      </section>
      {isAdmin ? (
        <form className="panel form-panel" onSubmit={createUser}>
          <PanelTitle icon={UserPlus} title={t("users.create")} />
          <Field name="username" label={t("auth.username")} required />
          <Field name="display_name" label={t("auth.displayName")} />
          <SelectField name="role" label={t("users.role")}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </SelectField>
          <Field name="password" label={t("auth.password")} type="password" required />
          <button className="primary" disabled={busy}>
            <UserPlus size={16} />
            {t("common.create")}
          </button>
        </form>
      ) : null}
    </div>
  );
}

function DevicesPage({ devices, busy, request, runAction, setNotice }: DashboardProps) {
  const { t } = useI18n();
  async function registerDevice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction(async () => {
      const response = await request<ApiResponse<{ device_token: { access_token: string } }>>("/devices/register", {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          platform: String(form.get("platform") ?? ""),
          ssh_public_key: String(form.get("ssh_public_key") ?? ""),
          wireguard_public_key: String(form.get("wireguard_public_key") ?? "") || null
        })
      });
      setNotice({ kind: "info", message: t("devices.token", { token: response.data.device_token.access_token }) });
    });
    event.currentTarget.reset();
  }

  return (
    <div className="two-column">
      <section className="panel">
        <PanelTitle icon={Laptop} title={t("devices.title")} />
        {devices.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
        {devices.map((device) => (
          <ResourceRow
            key={device.id}
            title={device.name}
            meta={`${device.platform} · ${t("devices.lastSeen", { time: formatDate(device.last_seen_at) })}`}
            actions={
              <>
                <StatusPill status={device.status} />
                <button
                  disabled={busy || device.status !== "active"}
                  onClick={() => {
                    if (confirm(t("common.confirmRevoke", { name: device.name }))) {
                      void runAction(
                        () => request(`/devices/${device.id}/disable`, { method: "POST" }).then(() => undefined),
                        t("devices.revoked")
                      );
                    }
                  }}
                  type="button"
                >
                  <Ban size={15} />
                  {t("common.revoke")}
                </button>
                <button
                  disabled={busy || device.status !== "active"}
                  onClick={() => {
                    void runAction(async () => {
                      const response = await request<ApiResponse<{ access_token: string }>>(
                        `/devices/${device.id}/rotate-token`,
                        { method: "POST" }
                      );
                      setNotice({ kind: "info", message: t("devices.token", { token: response.data.access_token }) });
                    });
                  }}
                  type="button"
                >
                  <RotateCcw size={15} />
                  {t("common.rotate")}
                </button>
              </>
            }
          />
        ))}
      </section>
      <form className="panel form-panel" onSubmit={registerDevice}>
        <PanelTitle icon={Laptop} title={t("devices.register")} />
        <Field name="name" label={t("devices.name")} required />
        <SelectField name="platform" label={t("devices.platform")}>
          <option value="macos">macOS</option>
          <option value="linux">Linux</option>
        </SelectField>
        <TextAreaField name="ssh_public_key" label={t("devices.sshKey")} required />
        <TextAreaField name="wireguard_public_key" label={t("devices.wgKey")} />
        <button className="primary" disabled={busy}>
          <Laptop size={16} />
          {t("devices.register")}
        </button>
      </form>
    </div>
  );
}

function AccountsPage({ accounts, busy, request, runAction, setNotice, me }: DashboardProps) {
  const { t } = useI18n();
  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction(
      () =>
        request("/tool-accounts", {
          method: "POST",
          body: JSON.stringify({
            tool_type: String(form.get("tool_type") ?? "claude"),
            display_name: String(form.get("display_name") ?? ""),
            region_code: String(form.get("region_code") ?? "US"),
            timezone: String(form.get("timezone") ?? "America/Los_Angeles"),
            locale: String(form.get("locale") ?? "en_US.UTF-8"),
            preferred_node_tags: splitList(String(form.get("preferred_node_tags") ?? ""))
          })
        }).then(() => undefined),
      t("accounts.created")
    );
    event.currentTarget.reset();
  }

  return (
    <div className="two-column">
      <section className="panel">
        <PanelTitle icon={KeyRound} title={t("accounts.title")} />
        {accounts.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
        {accounts.map((account) => (
          <ResourceRow
            key={account.id}
            title={account.display_name}
            meta={`${account.tool_type} · ${account.region_code} · ${account.timezone} · ${account.runtime_backend ?? "not pinned"}`}
            actions={
              <>
                <StatusPill status={account.status} />
                {me.role === "admin" && account.runtime_backend ? (
                  <button
                    disabled={busy || account.status === "migrating"}
                    onClick={() => {
                      const target = account.runtime_backend === "native" ? "docker_sandbox" : "native";
                      if (confirm(t("accounts.confirmMigration", { runtime: target }))) {
                        void runAction(
                          () => request(`/tool-accounts/${account.id}/runtime-migration`, {
                            method: "POST",
                            body: JSON.stringify({ target_runtime_backend: target })
                          }).then(() => undefined),
                          t("accounts.migrationStarted")
                        );
                      }
                    }}
                    type="button"
                  >
                    <RotateCcw size={15} />
                    {t("accounts.migrate")}
                  </button>
                ) : null}
                <button
                  disabled={busy}
                  onClick={() => {
                    void runAction(async () => {
                      const response = await request<ApiResponse<{ status: string; connect_command: string | null }>>(
                        `/tool-accounts/${account.id}/bind/start`,
                        { method: "POST" }
                      );
                      setNotice({ kind: "info", message: response.data.connect_command ?? response.data.status });
                    });
                  }}
                  type="button"
                >
                  <Play size={15} />
                  {t("accounts.bind")}
                </button>
                <button
                  disabled={busy}
                  onClick={() => {
                    void runAction(async () => {
                      const response = await request<ApiResponse<{ status: string; error: string | null }>>(
                        `/tool-accounts/${account.id}/bind/verify`,
                        { method: "POST" }
                      );
                      setNotice({
                        kind: response.data.error ? "error" : "info",
                        message: response.data.error ?? response.data.status
                      });
                    });
                  }}
                  type="button"
                >
                  <CheckCircle2 size={15} />
                  {t("accounts.verify")}
                </button>
                <button
                  disabled={busy || account.status === "disabled"}
                  onClick={() => {
                    if (confirm(t("common.confirmDisable", { name: account.display_name }))) {
                      void runAction(
                        () => request(`/tool-accounts/${account.id}/disable`, { method: "POST" }).then(() => undefined),
                        t("accounts.disabled")
                      );
                    }
                  }}
                  type="button"
                >
                  <Ban size={15} />
                  {t("common.disable")}
                </button>
              </>
            }
          />
        ))}
      </section>
      <form className="panel form-panel" onSubmit={createAccount}>
        <PanelTitle icon={KeyRound} title={t("accounts.create")} />
        <SelectField name="tool_type" label={t("accounts.tool")}>
          <option value="claude">claude</option>
        </SelectField>
        <Field name="display_name" label={t("auth.displayName")} required />
        <Field name="region_code" label={t("accounts.region")} defaultValue="US" required />
        <Field name="timezone" label={t("accounts.timezone")} defaultValue="America/Los_Angeles" required />
        <Field name="locale" label={t("accounts.locale")} defaultValue="en_US.UTF-8" required />
        <Field name="preferred_node_tags" label={t("accounts.nodeTags")} />
        <button className="primary" disabled={busy}>
          <KeyRound size={16} />
          {t("common.create")}
        </button>
      </form>
    </div>
  );
}

function NodesPage({ nodes, nodeTasks, isAdmin, busy, request, runAction, setNotice }: DashboardProps & { isAdmin: boolean }) {
  const { t } = useI18n();
  async function createNode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const allowedRuntimeBackends = [
      form.get("allow_docker") === "on" ? "docker_sandbox" : null,
      form.get("allow_native") === "on" ? "native" : null
    ].filter((value): value is string => value !== null);
    await runAction(async () => {
      const response = await request<ApiResponse<{ registration_token: string }>>("/nodes", {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          region_code: String(form.get("region_code") ?? ""),
          tags: splitList(String(form.get("tags") ?? "")),
          weight: Number(form.get("weight") ?? 100),
          supported_tool_types: splitList(String(form.get("supported_tool_types") ?? "claude")),
          allowed_runtime_backends: allowedRuntimeBackends,
          default_runtime_backend: String(form.get("default_runtime_backend") ?? "docker_sandbox"),
          runtime_policy: {
            memory_high_bytes: Number(form.get("memory_high_bytes") ?? 3221225472),
            memory_max_bytes: Number(form.get("memory_max_bytes") ?? 4294967296),
            cpu_quota_percent: Number(form.get("cpu_quota_percent") ?? 200),
            tasks_max: Number(form.get("tasks_max") ?? 512),
            limit_nofile: Number(form.get("limit_nofile") ?? 8192),
            tmpfs_size_bytes: Number(form.get("tmpfs_size_bytes") ?? 1073741824),
            network_allowlist: splitList(String(form.get("network_allowlist") ?? ""))
          },
          wireguard_ip: String(form.get("wireguard_ip") ?? "") || null,
          wireguard_endpoint: String(form.get("wireguard_endpoint") ?? "") || null,
          ssh_host: String(form.get("ssh_host") ?? "") || null,
          ssh_port: Number(form.get("ssh_port") ?? 22),
          ssh_user: String(form.get("ssh_user") ?? "") || null
        })
      });
      setNotice({ kind: "info", message: t("nodes.registrationToken", { token: response.data.registration_token }) });
    });
    event.currentTarget.reset();
  }

  async function updateRuntimePolicy(event: React.FormEvent<HTMLFormElement>, node: NodeItem) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const allowed = [
      form.get("allow_docker") === "on" ? "docker_sandbox" : null,
      form.get("allow_native") === "on" ? "native" : null
    ].filter((value): value is string => value !== null);
    await runAction(
      () => request(`/nodes/${node.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          allowed_runtime_backends: allowed,
          default_runtime_backend: String(form.get("default_runtime_backend") ?? node.default_runtime_backend),
          runtime_policy: {
            memory_high_bytes: Number(form.get("memory_high_bytes")),
            memory_max_bytes: Number(form.get("memory_max_bytes")),
            cpu_quota_percent: Number(form.get("cpu_quota_percent")),
            tasks_max: Number(form.get("tasks_max")),
            limit_nofile: Number(form.get("limit_nofile")),
            tmpfs_size_bytes: Number(form.get("tmpfs_size_bytes")),
            network_allowlist: splitList(String(form.get("network_allowlist") ?? ""))
          }
        })
      }).then(() => undefined),
      t("nodes.runtimeSaved")
    );
  }

  if (!isAdmin) {
    return (
      <section className="panel">
        <EmptyBlock label={t("users.adminRequired")} />
      </section>
    );
  }

  return (
    <div className="content-grid">
      <div className="two-column">
        <section className="panel">
          <PanelTitle icon={Server} title={t("nodes.title")} />
          {nodes.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
          {nodes.map((node) => (
            <React.Fragment key={node.id}>
              <ResourceRow
              key={node.id}
              title={node.name}
              meta={`${node.region_code} · ${tagsText(node.tags)} · default ${node.default_runtime_backend} · allowed ${node.allowed_runtime_backends.join(", ")} · available ${runtimeBackends(node).join(", ") || "none"} · ${formatDate(node.last_heartbeat_at)}`}
              actions={
                <>
                  <StatusPill status={node.status} />
                  <button
                    disabled={busy}
                    onClick={() =>
                      void runAction(
                        () => request(`/nodes/${node.id}/maintenance`, { method: "POST" }).then(() => undefined),
                        t("nodes.maintained")
                      )
                    }
                    type="button"
                  >
                    <Wrench size={15} />
                    {t("nodes.maintenance")}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (confirm(t("common.confirmDisable", { name: node.name }))) {
                        void runAction(
                          () => request(`/nodes/${node.id}/disable`, { method: "POST" }).then(() => undefined),
                          t("nodes.disabled")
                        );
                      }
                    }}
                    type="button"
                  >
                    <Ban size={15} />
                    {t("common.disable")}
                  </button>
                </>
              }
              />
              <details className="detail-row">
                <summary>{t("nodes.editRuntime")}</summary>
                <form className="form-panel" onSubmit={(event) => void updateRuntimePolicy(event, node)}>
                  <CheckLine name="allow_docker" label={t("nodes.allowDocker")} defaultChecked={node.allowed_runtime_backends.includes("docker_sandbox")} />
                  <CheckLine name="allow_native" label={t("nodes.allowNative")} defaultChecked={node.allowed_runtime_backends.includes("native")} />
                  <label className="field">
                    <span>{t("nodes.defaultRuntime")}</span>
                    <select name="default_runtime_backend" defaultValue={node.default_runtime_backend}>
                      <option value="docker_sandbox">docker_sandbox</option>
                      <option value="native">native</option>
                    </select>
                  </label>
                  <Field name="memory_high_bytes" label={t("nodes.memoryHigh")} type="number" defaultValue={policyNumber(node, "memory_high_bytes", 3221225472)} />
                  <Field name="memory_max_bytes" label={t("nodes.memoryMax")} type="number" defaultValue={policyNumber(node, "memory_max_bytes", 4294967296)} />
                  <Field name="cpu_quota_percent" label={t("nodes.cpuQuota")} type="number" defaultValue={policyNumber(node, "cpu_quota_percent", 200)} />
                  <Field name="tasks_max" label={t("nodes.tasksMax")} type="number" defaultValue={policyNumber(node, "tasks_max", 512)} />
                  <Field name="limit_nofile" label={t("nodes.nofile")} type="number" defaultValue={policyNumber(node, "limit_nofile", 8192)} />
                  <Field name="tmpfs_size_bytes" label={t("nodes.tmpSize")} type="number" defaultValue={policyNumber(node, "tmpfs_size_bytes", 1073741824)} />
                  <Field name="network_allowlist" label={t("nodes.networkAllowlist")} defaultValue={policyList(node, "network_allowlist")} />
                  <button className="primary" disabled={busy}>
                    <Save size={15} />
                    {t("common.save")}
                  </button>
                </form>
              </details>
            </React.Fragment>
          ))}
        </section>
        <form className="panel form-panel" onSubmit={createNode}>
          <PanelTitle icon={Server} title={t("nodes.create")} />
          <Field name="name" label={t("devices.name")} required />
          <Field name="region_code" label={t("accounts.region")} defaultValue="US" required />
          <Field name="tags" label={t("nodes.tags")} defaultValue="us" />
          <Field name="weight" label={t("nodes.weight")} type="number" defaultValue={100} />
          <Field name="supported_tool_types" label={t("nodes.tools")} defaultValue="claude" />
          <CheckLine name="allow_docker" label={t("nodes.allowDocker")} defaultChecked />
          <CheckLine name="allow_native" label={t("nodes.allowNative")} />
          <SelectField name="default_runtime_backend" label={t("nodes.defaultRuntime") }>
            <option value="docker_sandbox">docker_sandbox</option>
            <option value="native">native</option>
          </SelectField>
          <Field name="memory_high_bytes" label={t("nodes.memoryHigh")} type="number" defaultValue={3221225472} />
          <Field name="memory_max_bytes" label={t("nodes.memoryMax")} type="number" defaultValue={4294967296} />
          <Field name="cpu_quota_percent" label={t("nodes.cpuQuota")} type="number" defaultValue={200} />
          <Field name="tasks_max" label={t("nodes.tasksMax")} type="number" defaultValue={512} />
          <Field name="limit_nofile" label={t("nodes.nofile")} type="number" defaultValue={8192} />
          <Field name="tmpfs_size_bytes" label={t("nodes.tmpSize")} type="number" defaultValue={1073741824} />
          <Field name="network_allowlist" label={t("nodes.networkAllowlist")} />
          <Field name="wireguard_ip" label={t("nodes.wgIp")} />
          <Field name="wireguard_endpoint" label={t("nodes.wgEndpoint")} />
          <Field name="ssh_host" label={t("nodes.sshHost")} />
          <Field name="ssh_port" label={t("nodes.sshPort")} type="number" defaultValue={22} />
          <Field name="ssh_user" label={t("nodes.sshUser")} defaultValue="agent-remote" />
          <button className="primary" disabled={busy}>
            <Server size={16} />
            {t("common.create")}
          </button>
        </form>
      </div>
      <section className="panel">
        <PanelTitle icon={AlertTriangle} title={t("nodes.tasks")} />
        {nodeTasks.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
        {nodeTasks.map((task) => <TaskRow key={task.id} task={task} />)}
      </section>
    </div>
  );
}

function runtimeBackends(node: NodeItem): string[] {
  const backends = node.runtime_capabilities.backends;
  return Array.isArray(backends) ? backends.filter((value): value is string => typeof value === "string") : [];
}

function policyNumber(node: NodeItem, key: string, fallback: number): number {
  const value = node.runtime_policy[key];
  return typeof value === "number" ? value : fallback;
}

function policyList(node: NodeItem, key: string): string {
  const value = node.runtime_policy[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").join(",") : "";
}

function SessionsPage({ toolSessions, accounts, workspaces, busy, request, runAction, setNotice }: DashboardProps) {
  const { t } = useI18n();
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id ?? "");
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === workspaceId);

  async function createSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction(
      () =>
        request("/sessions", {
          method: "POST",
          body: JSON.stringify({
            tool_type: String(form.get("tool_type") ?? "claude"),
            tool_account_id: String(form.get("tool_account_id") ?? ""),
            workspace_id: String(form.get("workspace_id") ?? ""),
            project_key: String(form.get("project_key") ?? selectedWorkspace?.project_key ?? ""),
            argv: splitList(String(form.get("argv") ?? ""))
          })
        }).then(() => undefined),
      t("sessions.created")
    );
    event.currentTarget.reset();
  }

  return (
    <div className="two-column">
      <section className="panel">
        <PanelTitle icon={TerminalSquare} title={t("sessions.title")} />
        {toolSessions.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
        {toolSessions.map((session) => (
          <ResourceRow
            key={session.id}
            title={`${session.tool_type} · ${session.project_key}`}
            meta={`${shortId(session.id)} · ${session.runtime_backend} · ${session.runtime_resource_id ?? "pending"} · tmux ${session.tmux_session_name ?? "-"}`}
            actions={
              <>
                <StatusPill status={session.status} />
                <button
                  disabled={busy || session.status === "interrupted"}
                  onClick={() => {
                    void runAction(async () => {
                      const response = await request<ApiResponse<{ ssh_command: string }>>(`/sessions/${session.id}/attach`, {
                        method: "POST"
                      });
                      copyToClipboard(response.data.ssh_command, () =>
                        setNotice({ kind: "info", message: response.data.ssh_command })
                      );
                    });
                  }}
                  type="button"
                >
                  <Link size={15} />
                  {t("sessions.attach")}
                </button>
                <button
                  disabled={busy || ["stopped", "stopping"].includes(session.status)}
                  onClick={() => {
                    if (confirm(t("common.confirmStop", { name: session.project_key }))) {
                      void runAction(
                        () => request(`/sessions/${session.id}/stop`, { method: "POST" }).then(() => undefined),
                        t("sessions.stopping")
                      );
                    }
                  }}
                  type="button"
                >
                  <Square size={15} />
                  {t("sessions.stop")}
                </button>
              </>
            }
          />
        ))}
      </section>
      <form className="panel form-panel" onSubmit={createSession}>
        <PanelTitle icon={Play} title={t("sessions.create")} />
        <SelectField name="tool_type" label={t("accounts.tool")}>
          <option value="claude">claude</option>
        </SelectField>
        <SelectField name="tool_account_id" label={t("sessions.account")} required>
          <option value="">{t("common.select")}</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.display_name}
            </option>
          ))}
        </SelectField>
        <SelectField
          name="workspace_id"
          label={t("sessions.workspace")}
          required
          value={workspaceId}
          onChange={(event) => setWorkspaceId(event.target.value)}
        >
          <option value="">{t("common.select")}</option>
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.display_name}
            </option>
          ))}
        </SelectField>
        <Field name="project_key" label={t("sessions.projectKey")} defaultValue={selectedWorkspace?.project_key ?? ""} required />
        <Field name="argv" label={t("sessions.args")} />
        <button className="primary" disabled={busy}>
          <Play size={16} />
          {t("common.create")}
        </button>
      </form>
    </div>
  );
}

function SyncPage({ workspaces, syncSessions, devices, nodes, busy, request, runAction }: DashboardProps) {
  const { t } = useI18n();
  const [syncWorkspaceId, setSyncWorkspaceId] = useState(workspaces[0]?.id ?? "");
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === syncWorkspaceId);

  async function createWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction(
      () =>
        request("/workspaces", {
          method: "POST",
          body: JSON.stringify({
            device_id: String(form.get("device_id") ?? ""),
            project_key: String(form.get("project_key") ?? ""),
            local_start_path: String(form.get("local_start_path") ?? ""),
            display_name: String(form.get("display_name") ?? ""),
            sync_git: form.get("sync_git") === "on",
            git_sync_policy: {
              exclude_hooks: true,
              exclude_locks: true,
              require_clean_git_lock: true,
              warn_concurrent_git: true
            }
          })
        }).then(() => undefined),
      t("sync.workspaceCreated")
    );
    event.currentTarget.reset();
  }

  async function createSync(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction(
      () =>
        request("/sync-sessions", {
          method: "POST",
          body: JSON.stringify({
            workspace_id: String(form.get("workspace_id") ?? ""),
            node_id: String(form.get("node_id") ?? "") || null,
            local_path: String(form.get("local_path") ?? selectedWorkspace?.local_start_path ?? "") || null,
            sync_mode: String(form.get("sync_mode") ?? "two_way"),
            sync_git: form.get("sync_git") === "on",
            exclude: [
              ".git/**/*.lock",
              ".git/hooks",
              ".git/worktrees",
              "node_modules",
              "target",
              "dist",
              ".venv",
              "__pycache__"
            ]
          })
        }).then(() => undefined),
      t("sync.created")
    );
    event.currentTarget.reset();
  }

  return (
    <div className="content-grid">
      <div className="two-column">
        <section className="panel">
          <PanelTitle icon={Database} title={t("sync.workspaces")} />
          {workspaces.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
          {workspaces.map((workspace) => (
            <ResourceRow
              key={workspace.id}
              title={workspace.display_name}
              meta={`${workspace.project_key} · ${workspace.local_start_path}`}
              actions={
                <>
                  <Badge>{workspace.sync_git ? t("common.gitSync") : t("common.filesOnly")}</Badge>
                  <Badge>{shortId(workspace.device_id)}</Badge>
                </>
              }
            />
          ))}
        </section>
        <form className="panel form-panel" onSubmit={createWorkspace}>
          <PanelTitle icon={Database} title={t("sync.createWorkspace")} />
          <SelectField name="device_id" label={t("nav.devices")} required>
            <option value="">{t("common.select")}</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
              </option>
            ))}
          </SelectField>
          <Field name="display_name" label={t("auth.displayName")} required />
          <Field name="project_key" label={t("sessions.projectKey")} required />
          <Field name="local_start_path" label={t("sync.localPath")} required />
          <CheckLine name="sync_git" label={t("common.gitSync")} defaultChecked />
          <button className="primary" disabled={busy}>
            <Database size={16} />
            {t("common.create")}
          </button>
        </form>
      </div>
      <div className="two-column">
        <section className="panel">
          <PanelTitle icon={FolderSync} title={t("sync.sessions")} />
          {syncSessions.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
          {syncSessions.map((sync) => (
            <ResourceRow
              key={sync.id}
              title={sync.local_path}
              meta={`${sync.remote_path} · ${sync.sync_mode} · ${sync.sync_git ? t("common.gitSync") : t("common.filesOnly")}`}
              actions={
                <>
                  <StatusPill status={sync.status} />
                  <Badge tone={sync.conflict_status !== "clean" ? "warning" : "neutral"}>{sync.conflict_status}</Badge>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void runAction(
                        () =>
                          request(`/sync-sessions/${sync.id}/pause`, {
                            method: "POST",
                            body: JSON.stringify({ note: "admin-web" })
                          }).then(() => undefined),
                        t("sync.paused")
                      )
                    }
                    type="button"
                  >
                    <Circle size={15} />
                    {t("sync.pause")}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void runAction(
                        () =>
                          request(`/sync-sessions/${sync.id}/resume`, {
                            method: "POST",
                            body: JSON.stringify({ note: "admin-web" })
                          }).then(() => undefined),
                        t("sync.resumed")
                      )
                    }
                    type="button"
                  >
                    <Play size={15} />
                    {t("sync.resume")}
                  </button>
                </>
              }
            />
          ))}
        </section>
        <form className="panel form-panel" onSubmit={createSync}>
          <PanelTitle icon={FolderSync} title={t("sync.create")} />
          <SelectField
            name="workspace_id"
            label={t("sessions.workspace")}
            required
            value={syncWorkspaceId}
            onChange={(event) => setSyncWorkspaceId(event.target.value)}
          >
            <option value="">{t("common.select")}</option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.display_name}
              </option>
            ))}
          </SelectField>
          <SelectField name="node_id" label={t("nav.nodes")}>
            <option value="">{t("common.auto")}</option>
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </SelectField>
          <Field name="local_path" label={t("sync.localPath")} defaultValue={selectedWorkspace?.local_start_path ?? ""} />
          <SelectField name="sync_mode" label={t("sync.mode")}>
            <option value="two_way">two_way</option>
          </SelectField>
          <CheckLine name="sync_git" label={t("common.gitSync")} defaultChecked />
          <button className="primary" disabled={busy}>
            <FolderSync size={16} />
            {t("common.create")}
          </button>
        </form>
      </div>
    </div>
  );
}

function BrowserPage({ browserSessions, accounts, busy, apiBase, request, runAction, setNotice }: DashboardProps) {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState("");
  const selected = useMemo(
    () => browserSessions.find((item) => item.id === selectedId) ?? browserSessions[0],
    [browserSessions, selectedId]
  );
  const selectedAccount = accounts.find((account) => account.id === accountId);

  async function createBrowser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction(
      () =>
        request("/browser-sessions", {
          method: "POST",
          body: JSON.stringify({
            tool_account_id: accountId || null,
            target_url: String(form.get("target_url") ?? "") || null,
            region_code: accountId ? null : String(form.get("region_code") ?? ""),
            timezone: accountId ? null : String(form.get("timezone") ?? ""),
            locale: accountId ? null : String(form.get("locale") ?? ""),
            ttl_seconds: Number(form.get("ttl_seconds") ?? 1800)
          })
        }).then(() => undefined),
      t("browser.created")
    );
    event.currentTarget.reset();
  }

  return (
    <div className="two-column">
      <section className="panel">
        <PanelTitle icon={MonitorUp} title={t("browser.title")} />
        {browserSessions.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
        {browserSessions.map((session) => (
          <button
            key={session.id}
            className={`list-row ${selected?.id === session.id ? "selected" : ""}`}
            onClick={() => setSelectedId(session.id)}
            type="button"
          >
            <span>{session.target_url ?? "blank"}</span>
            <small>
              {session.region_code} · {session.status} · {formatDate(session.expires_at)}
            </small>
          </button>
        ))}
        {selected ? (
          <div className="button-row">
            <button
              disabled={busy || selected.status !== "ready"}
              onClick={() => {
                void runAction(async () => {
                  const response = await request<ApiResponse<{ embed_url: string }>>(
                    `/browser-sessions/${selected.id}/connect-info`,
                    { method: "POST" }
                  );
                  const url = response.data.embed_url.startsWith("http")
                    ? response.data.embed_url
                    : `${apiBase.replace(/\/$/, "")}${response.data.embed_url}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                  setNotice({ kind: "info", message: url });
                });
              }}
              type="button"
            >
              <MonitorUp size={15} />
              {t("browser.connect")}
            </button>
            <button
              disabled={busy}
              onClick={() => {
                if (confirm(t("common.confirmStop", { name: selected.target_url ?? selected.id }))) {
                  void runAction(
                    () => request(`/browser-sessions/${selected.id}/stop`, { method: "POST" }).then(() => undefined),
                    t("browser.stopping")
                  );
                }
              }}
              type="button"
            >
              <Square size={15} />
              {t("sessions.stop")}
            </button>
          </div>
        ) : null}
      </section>
      <form className="panel form-panel" onSubmit={createBrowser}>
        <PanelTitle icon={Play} title={t("browser.start")} />
        <SelectField name="tool_account_id" label={t("sessions.account")} value={accountId} onChange={(event) => setAccountId(event.target.value)}>
          <option value="">{t("browser.manualRegion")}</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.display_name}
            </option>
          ))}
        </SelectField>
        <Field name="target_url" label={t("browser.url")} defaultValue="https://claude.ai/" />
        <Field name="region_code" label={t("accounts.region")} defaultValue={selectedAccount?.region_code ?? "US"} />
        <Field name="timezone" label={t("accounts.timezone")} defaultValue={selectedAccount?.timezone ?? "America/Los_Angeles"} />
        <Field name="locale" label={t("accounts.locale")} defaultValue={selectedAccount?.locale ?? "en_US.UTF-8"} />
        <Field name="ttl_seconds" label={t("browser.ttl")} type="number" defaultValue={1800} />
        <button className="primary" disabled={busy}>
          <Play size={16} />
          {t("browser.start")}
        </button>
      </form>
    </div>
  );
}

function AuditPage({ auditLogs }: { auditLogs: AuditLog[] }) {
  const { t } = useI18n();
  return (
    <section className="panel">
      <PanelTitle icon={FileClock} title={t("audit.title")} />
      {auditLogs.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
      {auditLogs.map((item) => (
        <AuditRow key={item.id} item={item} />
      ))}
    </section>
  );
}

function SettingsPage({ apiBase, setApiBase, me, busy, request, runAction, setNotice }: DashboardProps) {
  const { locale, setLocale, t } = useI18n();
  async function updateMe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction(
      () =>
        request("/users/me", {
          method: "PATCH",
          body: JSON.stringify({ display_name: String(form.get("display_name") ?? "") })
        }).then(() => undefined),
      t("common.savedLocal")
    );
  }

  return (
    <div className="two-column">
      <section className="panel form-panel">
        <PanelTitle icon={Settings} title={t("common.api")} />
        <Field label={t("settings.baseUrl")} value={apiBase} onChange={(event) => setApiBase(event.target.value)} />
        <label className="field">
          <span>{t("settings.language")}</span>
          <select value={locale} onChange={(event) => setLocale(event.target.value === "zh" ? "zh" : "en")}>
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </label>
        <button onClick={() => setNotice({ kind: "info", message: t("common.savedLocal") })} type="button">
          <CheckCircle2 size={15} />
          {t("common.save")}
        </button>
      </section>
      <form className="panel form-panel" onSubmit={updateMe}>
        <PanelTitle icon={Users} title={t("settings.profile")} />
        <Field name="display_name" label={t("auth.displayName")} defaultValue={me.display_name} required />
        <div className="kv-grid">
          <span>{t("settings.username")}</span>
          <strong>{me.username}</strong>
          <span>{t("users.role")}</span>
          <strong>{me.role}</strong>
          <span>{t("auth.totp")}</span>
          <strong>{me.totp_enabled ? t("common.enabled") : t("common.disabled")}</strong>
        </div>
        <button className="primary" disabled={busy}>
          <CheckCircle2 size={16} />
          {t("common.update")}
        </button>
      </form>
    </div>
  );
}

function TaskRow({ task }: { task: NodeTask }) {
  return (
    <DetailRow
      title={task.task_type}
      status={task.status}
      meta={task.task_id}
      value={{ payload: task.payload, result: task.result }}
    />
  );
}

function AuditRow({ item }: { item: AuditLog }) {
  return (
    <DetailRow
      title={item.action}
      meta={`${item.target_type ?? "-"} · ${item.target_id ?? "-"} · ${formatDate(item.created_at)}`}
      value={item.details}
    />
  );
}

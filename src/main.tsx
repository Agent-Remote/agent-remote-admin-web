import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Circle,
  Clock,
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
  Server,
  Settings,
  Shield,
  Square,
  TerminalSquare,
  UserPlus,
  Users,
  Wrench
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

type UUID = string;

type ApiResponse<T> = {
  data: T;
  request_id?: string;
};

type ListData<T> = {
  items: T[];
  next_cursor?: string | null;
};

type User = {
  id: UUID;
  username: string;
  display_name: string;
  role: string;
  status: string;
  totp_enabled: boolean;
  created_at: string;
  updated_at: string;
};

type Device = {
  id: UUID;
  user_id: UUID;
  name: string;
  platform: string;
  status: string;
  last_seen_at: string | null;
  created_at: string;
};

type ToolAccount = {
  id: UUID;
  user_id: UUID;
  tool_type: string;
  display_name: string;
  status: string;
  region_code: string;
  timezone: string;
  locale: string;
  preferred_node_tags: string[];
  affinity_node_id: UUID | null;
  created_at: string;
  updated_at: string;
};

type NodeItem = {
  id: UUID;
  name: string;
  status: string;
  region_code: string;
  tags: string[];
  weight: number;
  wireguard_ip: string | null;
  wireguard_public_key: string | null;
  wireguard_endpoint: string | null;
  ssh_host: string | null;
  ssh_port: number | null;
  ssh_user: string | null;
  supported_tool_types: string[];
  last_heartbeat_at: string | null;
  version: string | null;
  created_at: string;
  updated_at: string;
};

type Workspace = {
  id: UUID;
  user_id: UUID;
  device_id: UUID;
  project_key: string;
  local_start_path: string;
  display_name: string;
  remote_path: string | null;
  created_at: string;
  updated_at: string;
};

type SyncSession = {
  id: UUID;
  user_id: UUID;
  workspace_id: UUID;
  node_id: UUID | null;
  local_path: string;
  remote_path: string;
  status: string;
  conflict_status: string;
  sync_mode: string;
  mutagen_session_id: string | null;
  remote_endpoint: string | null;
  prepare_task_id: string | null;
  created_at: string;
  updated_at: string;
};

type ToolSession = {
  id: UUID;
  tool_type: string;
  user_id: UUID;
  tool_account_id: UUID;
  workspace_id: UUID;
  node_id: UUID;
  project_key: string;
  status: string;
  tmux_session_name: string | null;
  container_id: string | null;
  create_task_id: string | null;
  stop_task_id: string | null;
  created_at: string;
  updated_at: string;
};

type BrowserSession = {
  id: UUID;
  user_id: UUID;
  tool_account_id: UUID | null;
  node_id: UUID;
  status: string;
  region_code: string;
  timezone: string;
  locale: string;
  target_url: string | null;
  container_id: string | null;
  ttl_seconds: number;
  expires_at: string;
  stopped_at: string | null;
  create_task_id: string | null;
  stop_task_id: string | null;
  created_at: string;
  updated_at: string;
};

type AuditLog = {
  id: UUID;
  actor_user_id: UUID | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

type NodeTask = {
  id: UUID;
  task_id: string;
  node_id: UUID;
  task_type: string;
  status: string;
  payload: Record<string, unknown>;
  lease_until: string | null;
  retry_count: number;
  result: {
    status: string;
    result: Record<string, unknown> | null;
    error: Record<string, unknown> | null;
    started_at: string | null;
    finished_at: string | null;
    created_at: string;
  } | null;
  created_at: string;
  updated_at: string;
};

type Page =
  | "overview"
  | "users"
  | "devices"
  | "accounts"
  | "nodes"
  | "sessions"
  | "sync"
  | "browser"
  | "audit"
  | "settings";

type Notice = {
  kind: "info" | "error";
  message: string;
};

const defaultApiBase = import.meta.env.VITE_AGENT_REMOTE_API_BASE ?? "http://127.0.0.1:8765";

const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "users", label: "Users", icon: Users },
  { id: "devices", label: "Devices", icon: Laptop },
  { id: "accounts", label: "Accounts", icon: KeyRound },
  { id: "nodes", label: "Nodes", icon: Server },
  { id: "sessions", label: "Sessions", icon: TerminalSquare },
  { id: "sync", label: "Sync", icon: FolderSync },
  { id: "browser", label: "Browser", icon: MonitorUp },
  { id: "audit", label: "Audit", icon: FileClock },
  { id: "settings", label: "Settings", icon: Settings }
];

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function shortId(value: string | null | undefined): string {
  if (!value) return "-";
  return value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function tagsText(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "-";
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function App() {
  const [apiBase, setApiBase] = useState(localStorage.getItem("agentRemoteApiBase") ?? defaultApiBase);
  const [token, setToken] = useState(localStorage.getItem("agentRemoteToken") ?? "");
  const [page, setPage] = useState<Page>("overview");
  const [me, setMe] = useState<User | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [accounts, setAccounts] = useState<ToolAccount[]>([]);
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [syncSessions, setSyncSessions] = useState<SyncSession[]>([]);
  const [toolSessions, setToolSessions] = useState<ToolSession[]>([]);
  const [browserSessions, setBrowserSessions] = useState<BrowserSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [nodeTasks, setNodeTasks] = useState<NodeTask[]>([]);

  const isAdmin = me?.role === "admin";
  const failedTasks = nodeTasks.filter((task) => task.status === "failed");

  useEffect(() => {
    localStorage.setItem("agentRemoteApiBase", apiBase);
  }, [apiBase]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("agentRemoteToken", token);
      void loadAll();
    }
  }, [token]);

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      ...(options.headers as Record<string, string> | undefined)
    };
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(`${apiBase.replace(/\/$/, "")}/api/v1${path}`, {
      ...options,
      headers
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.error?.message ?? `${response.status} ${response.statusText}`;
      throw new Error(message);
    }
    return payload as T;
  }

  async function loadOptional<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await loader();
    } catch {
      return fallback;
    }
  }

  async function loadAll() {
    if (!token) return;
    setBusy(true);
    setNotice(null);
    try {
      const currentUser = await request<ApiResponse<User>>("/users/me");
      setMe(currentUser.data);
      const [
        loadedUsers,
        loadedDevices,
        loadedAccounts,
        loadedNodes,
        loadedWorkspaces,
        loadedSyncSessions,
        loadedToolSessions,
        loadedBrowserSessions,
        loadedAuditLogs,
        loadedNodeTasks
      ] = await Promise.all([
        loadOptional(() => request<ApiResponse<ListData<User>>>("/users").then((r) => r.data.items), []),
        loadOptional(() => request<ApiResponse<ListData<Device>>>("/devices").then((r) => r.data.items), []),
        loadOptional(() => request<ApiResponse<ListData<ToolAccount>>>("/tool-accounts").then((r) => r.data.items), []),
        loadOptional(() => request<ApiResponse<ListData<NodeItem>>>("/nodes").then((r) => r.data.items), []),
        loadOptional(() => request<ApiResponse<ListData<Workspace>>>("/workspaces").then((r) => r.data.items), []),
        loadOptional(() => request<ApiResponse<ListData<SyncSession>>>("/sync-sessions").then((r) => r.data.items), []),
        loadOptional(() => request<ApiResponse<ListData<ToolSession>>>("/sessions").then((r) => r.data.items), []),
        loadOptional(() => request<ApiResponse<ListData<BrowserSession>>>("/browser-sessions").then((r) => r.data.items), []),
        loadOptional(() => request<ApiResponse<ListData<AuditLog>>>("/audit-logs").then((r) => r.data.items), []),
        loadOptional(() => request<ApiResponse<ListData<NodeTask>>>("/nodes/tasks?limit=100").then((r) => r.data.items), [])
      ]);
      setUsers(loadedUsers);
      setDevices(loadedDevices);
      setAccounts(loadedAccounts);
      setNodes(loadedNodes);
      setWorkspaces(loadedWorkspaces);
      setSyncSessions(loadedSyncSessions);
      setToolSessions(loadedToolSessions);
      setBrowserSessions(loadedBrowserSessions);
      setAuditLogs(loadedAuditLogs);
      setNodeTasks(loadedNodeTasks);
    } catch (error) {
      setNotice({ kind: "error", message: errorText(error, "Failed to load console data.") });
    } finally {
      setBusy(false);
    }
  }

  async function runAction(action: () => Promise<void>, success: string) {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      if (success) {
        setNotice({ kind: "info", message: success });
      }
      await loadAll();
    } catch (error) {
      setNotice({ kind: "error", message: errorText(error, "Request failed.") });
    } finally {
      setBusy(false);
    }
  }

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setNotice(null);
    try {
      const response = await request<ApiResponse<{ access_token: string }>>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: String(form.get("username") ?? ""),
          password: String(form.get("password") ?? ""),
          totp_code: String(form.get("totp_code") ?? "") || null
        })
      });
      setToken(response.data.access_token);
    } catch (error) {
      setNotice({ kind: "error", message: errorText(error, "Login failed.") });
    } finally {
      setBusy(false);
    }
  }

  async function bootstrap(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setNotice(null);
    try {
      const response = await request<ApiResponse<{ access_token: string }>>("/auth/bootstrap", {
        method: "POST",
        body: JSON.stringify({
          username: String(form.get("username") ?? ""),
          password: String(form.get("password") ?? ""),
          display_name: String(form.get("display_name") ?? "") || null
        })
      });
      setToken(response.data.access_token);
    } catch (error) {
      setNotice({ kind: "error", message: errorText(error, "Bootstrap failed.") });
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem("agentRemoteToken");
    setToken("");
    setMe(null);
  }

  if (!token || !me) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <div className="brand-row">
            <Shield size={24} />
            <h1>agent-remote</h1>
          </div>
          <label>
            API
            <input value={apiBase} onChange={(event) => setApiBase(event.target.value)} />
          </label>
          {notice ? <NoticeBar notice={notice} /> : null}
          <div className="auth-grid">
            <form className="form-panel" onSubmit={login}>
              <h2>Login</h2>
              <Field name="username" label="Username" required />
              <Field name="password" label="Password" type="password" required />
              <Field name="totp_code" label="TOTP" />
              <button className="primary" disabled={busy}>
                <KeyRound size={16} />
                Login
              </button>
            </form>
            <form className="form-panel" onSubmit={bootstrap}>
              <h2>Bootstrap</h2>
              <Field name="username" label="Username" required />
              <Field name="display_name" label="Display name" />
              <Field name="password" label="Password" type="password" required />
              <button disabled={busy}>
                <UserPlus size={16} />
                Bootstrap
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <Shield size={22} />
          <h1>agent-remote</h1>
        </div>
        <div className="user-chip">
          <strong>{me.display_name}</strong>
          <span>{me.role}</span>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={page === item.id ? "active" : ""}
                onClick={() => setPage(item.id)}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <button className="ghost" onClick={logout}>
          <LogOut size={16} />
          Logout
        </button>
      </aside>
      <section className="workspace">
        <header className="toolbar">
          <div>
            <strong>{navItems.find((item) => item.id === page)?.label}</strong>
            <span>{apiBase}</span>
          </div>
          <button onClick={loadAll} disabled={busy}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>
        {notice ? <NoticeBar notice={notice} /> : null}
        {page === "overview" ? <OverviewPage {...{ users, devices, accounts, nodes, workspaces, syncSessions, toolSessions, browserSessions, failedTasks, auditLogs, isAdmin }} /> : null}
        {page === "users" ? <UsersPage {...{ users, isAdmin, busy, request, runAction }} /> : null}
        {page === "devices" ? <DevicesPage {...{ devices, busy, request, runAction, setNotice }} /> : null}
        {page === "accounts" ? <AccountsPage {...{ accounts, busy, request, runAction, setNotice }} /> : null}
        {page === "nodes" ? <NodesPage {...{ nodes, nodeTasks, isAdmin, busy, request, runAction, setNotice }} /> : null}
        {page === "sessions" ? <SessionsPage {...{ toolSessions, accounts, workspaces, busy, request, runAction, setNotice }} /> : null}
        {page === "sync" ? <SyncPage {...{ workspaces, syncSessions, devices, nodes, busy, request, runAction }} /> : null}
        {page === "browser" ? <BrowserPage {...{ browserSessions, accounts, busy, apiBase, request, runAction, setNotice }} /> : null}
        {page === "audit" ? <AuditPage {...{ auditLogs }} /> : null}
        {page === "settings" ? <SettingsPage {...{ apiBase, setApiBase, me, busy, request, runAction, setNotice }} /> : null}
      </section>
    </main>
  );
}

function NoticeBar({ notice }: { notice: Notice }) {
  const Icon = notice.kind === "error" ? AlertTriangle : CheckCircle2;
  return (
    <div className={`notice ${notice.kind}`}>
      <Icon size={16} />
      {notice.message}
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  defaultValue = "",
  placeholder
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
}) {
  return (
    <label>
      {label}
      <input name={name} type={type} required={required} defaultValue={defaultValue} placeholder={placeholder} />
    </label>
  );
}

function SelectField({
  name,
  label,
  required = false,
  children
}: {
  name: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label>
      {label}
      <select name={name} required={required}>
        {children}
      </select>
    </label>
  );
}

function StatusPill({ status }: { status: string }) {
  return <span className={`status-pill ${status}`}>{status}</span>;
}

function EmptyBlock({ label }: { label: string }) {
  return <div className="empty-state">{label}</div>;
}

function JsonBlock({ value }: { value: unknown }) {
  return <pre className="json-block">{JSON.stringify(value, null, 2)}</pre>;
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
}: {
  users: User[];
  devices: Device[];
  accounts: ToolAccount[];
  nodes: NodeItem[];
  workspaces: Workspace[];
  syncSessions: SyncSession[];
  toolSessions: ToolSession[];
  browserSessions: BrowserSession[];
  failedTasks: NodeTask[];
  auditLogs: AuditLog[];
  isAdmin: boolean;
}) {
  const cards = [
    ["Users", users.length, Users],
    ["Devices", devices.length, Laptop],
    ["Accounts", accounts.length, KeyRound],
    ["Nodes", nodes.length, Server],
    ["Workspaces", workspaces.length, Database],
    ["Sync", syncSessions.length, FolderSync],
    ["Sessions", toolSessions.length, TerminalSquare],
    ["Browsers", browserSessions.length, MonitorUp]
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
          <PanelTitle icon={AlertTriangle} title="Failed tasks" />
          {failedTasks.length === 0 ? <EmptyBlock label="No failed tasks." /> : failedTasks.slice(0, 6).map((task) => <TaskRow key={task.id} task={task} />)}
        </section>
      ) : null}
      <section className="panel">
        <PanelTitle icon={FileClock} title="Recent audit" />
        {auditLogs.length === 0 ? <EmptyBlock label="No audit logs." /> : auditLogs.slice(0, 8).map((item) => <AuditRow key={item.id} item={item} />)}
      </section>
    </div>
  );
}

function PanelTitle({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="panel-title">
      <Icon size={18} />
      <h2>{title}</h2>
    </div>
  );
}

function UsersPage({
  users,
  isAdmin,
  busy,
  request,
  runAction
}: {
  users: User[];
  isAdmin: boolean;
  busy: boolean;
  request: AppRequest;
  runAction: RunAction;
}) {
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
      "User created."
    );
    event.currentTarget.reset();
  }

  return (
    <div className="two-column">
      <section className="panel">
        <PanelTitle icon={Users} title="Users" />
        {!isAdmin ? <EmptyBlock label="Admin permission required." /> : users.map((user) => (
          <div className="resource-row" key={user.id}>
            <div>
              <strong>{user.display_name}</strong>
              <span>{user.username} · {shortId(user.id)}</span>
            </div>
            <div className="row-actions">
              <StatusPill status={user.status} />
              <span className="badge">{user.role}</span>
              <button disabled={busy || user.status !== "active"} onClick={() => {
                if (confirm(`Disable user ${user.username}?`)) {
                  void runAction(() => request(`/users/${user.id}/disable`, { method: "POST" }).then(() => undefined), "User disabled.");
                }
              }}>
                <Ban size={15} />
                Disable
              </button>
            </div>
          </div>
        ))}
      </section>
      {isAdmin ? (
        <form className="panel form-panel" onSubmit={createUser}>
          <PanelTitle icon={UserPlus} title="Create user" />
          <Field name="username" label="Username" required />
          <Field name="display_name" label="Display name" />
          <SelectField name="role" label="Role">
            <option value="user">user</option>
            <option value="admin">admin</option>
          </SelectField>
          <Field name="password" label="Password" type="password" required />
          <button className="primary" disabled={busy}>
            <UserPlus size={16} />
            Create
          </button>
        </form>
      ) : null}
    </div>
  );
}

type AppRequest = <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
type RunAction = (action: () => Promise<void>, success: string) => Promise<void>;

function DevicesPage({
  devices,
  busy,
  request,
  runAction,
  setNotice
}: {
  devices: Device[];
  busy: boolean;
  request: AppRequest;
  runAction: RunAction;
  setNotice: React.Dispatch<React.SetStateAction<Notice | null>>;
}) {
  async function registerDevice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction(
      async () => {
        const response = await request<ApiResponse<{ device_token: { access_token: string } }>>("/devices/register", {
          method: "POST",
          body: JSON.stringify({
            name: String(form.get("name") ?? ""),
            platform: String(form.get("platform") ?? ""),
            ssh_public_key: String(form.get("ssh_public_key") ?? ""),
            wireguard_public_key: String(form.get("wireguard_public_key") ?? "") || null
          })
        });
        setNotice({ kind: "info", message: `Device token: ${response.data.device_token.access_token}` });
      },
      ""
    );
    event.currentTarget.reset();
  }

  return (
    <div className="two-column">
      <section className="panel">
        <PanelTitle icon={Laptop} title="Devices" />
        {devices.length === 0 ? <EmptyBlock label="No devices." /> : devices.map((device) => (
          <div className="resource-row" key={device.id}>
            <div>
              <strong>{device.name}</strong>
              <span>{device.platform} · last seen {formatDate(device.last_seen_at)}</span>
            </div>
            <div className="row-actions">
              <StatusPill status={device.status} />
              <button disabled={busy || device.status !== "active"} onClick={() => {
                if (confirm(`Revoke device ${device.name}?`)) {
                  void runAction(() => request(`/devices/${device.id}/disable`, { method: "POST" }).then(() => undefined), "Device revoked.");
                }
              }}>
                <Ban size={15} />
                Revoke
              </button>
              <button disabled={busy || device.status !== "active"} onClick={() => {
                void runAction(async () => {
                  const response = await request<ApiResponse<{ access_token: string }>>(`/devices/${device.id}/rotate-token`, { method: "POST" });
                  setNotice({ kind: "info", message: `Device token: ${response.data.access_token}` });
                    }, "");
              }}>
                <RotateCcw size={15} />
                Rotate
              </button>
            </div>
          </div>
        ))}
      </section>
      <form className="panel form-panel" onSubmit={registerDevice}>
        <PanelTitle icon={Laptop} title="Register device" />
        <Field name="name" label="Name" required />
        <SelectField name="platform" label="Platform">
          <option value="macos">macOS</option>
          <option value="linux">Linux</option>
        </SelectField>
        <label>
          SSH public key
          <textarea name="ssh_public_key" required />
        </label>
        <label>
          WireGuard public key
          <textarea name="wireguard_public_key" />
        </label>
        <button className="primary" disabled={busy}>
          <Laptop size={16} />
          Register
        </button>
      </form>
    </div>
  );
}

function AccountsPage({
  accounts,
  busy,
  request,
  runAction,
  setNotice
}: {
  accounts: ToolAccount[];
  busy: boolean;
  request: AppRequest;
  runAction: RunAction;
  setNotice: React.Dispatch<React.SetStateAction<Notice | null>>;
}) {
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
      "Tool account created."
    );
    event.currentTarget.reset();
  }

  return (
    <div className="two-column">
      <section className="panel">
        <PanelTitle icon={KeyRound} title="Tool accounts" />
        {accounts.length === 0 ? <EmptyBlock label="No accounts." /> : accounts.map((account) => (
          <div className="resource-row" key={account.id}>
            <div>
              <strong>{account.display_name}</strong>
              <span>{account.tool_type} · {account.region_code} · {account.timezone}</span>
            </div>
            <div className="row-actions">
              <StatusPill status={account.status} />
              <button disabled={busy} onClick={() => {
                void runAction(async () => {
                  const response = await request<ApiResponse<{ status: string; connect_command: string | null }>>(`/tool-accounts/${account.id}/bind/start`, { method: "POST" });
                  setNotice({ kind: "info", message: response.data.connect_command ?? response.data.status });
                }, "");
              }}>
                <Play size={15} />
                Bind
              </button>
              <button disabled={busy} onClick={() => {
                void runAction(async () => {
                  const response = await request<ApiResponse<{ status: string; error: string | null }>>(`/tool-accounts/${account.id}/bind/verify`, { method: "POST" });
                  setNotice({ kind: response.data.error ? "error" : "info", message: response.data.error ?? response.data.status });
                }, "");
              }}>
                <CheckCircle2 size={15} />
                Verify
              </button>
              <button disabled={busy || account.status === "disabled"} onClick={() => {
                if (confirm(`Disable account ${account.display_name}?`)) {
                  void runAction(() => request(`/tool-accounts/${account.id}/disable`, { method: "POST" }).then(() => undefined), "Account disabled.");
                }
              }}>
                <Ban size={15} />
                Disable
              </button>
            </div>
          </div>
        ))}
      </section>
      <form className="panel form-panel" onSubmit={createAccount}>
        <PanelTitle icon={KeyRound} title="Create account" />
        <SelectField name="tool_type" label="Tool">
          <option value="claude">claude</option>
        </SelectField>
        <Field name="display_name" label="Display name" required />
        <Field name="region_code" label="Region" defaultValue="US" required />
        <Field name="timezone" label="Timezone" defaultValue="America/Los_Angeles" required />
        <Field name="locale" label="Locale" defaultValue="en_US.UTF-8" required />
        <Field name="preferred_node_tags" label="Node tags" />
        <button className="primary" disabled={busy}>
          <KeyRound size={16} />
          Create
        </button>
      </form>
    </div>
  );
}

function NodesPage({
  nodes,
  nodeTasks,
  isAdmin,
  busy,
  request,
  runAction,
  setNotice
}: {
  nodes: NodeItem[];
  nodeTasks: NodeTask[];
  isAdmin: boolean;
  busy: boolean;
  request: AppRequest;
  runAction: RunAction;
  setNotice: React.Dispatch<React.SetStateAction<Notice | null>>;
}) {
  async function createNode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction(
      async () => {
        const response = await request<ApiResponse<{ registration_token: string }>>("/nodes", {
          method: "POST",
          body: JSON.stringify({
            name: String(form.get("name") ?? ""),
            region_code: String(form.get("region_code") ?? ""),
            tags: splitList(String(form.get("tags") ?? "")),
            weight: Number(form.get("weight") ?? 100),
            supported_tool_types: splitList(String(form.get("supported_tool_types") ?? "claude")),
            wireguard_ip: String(form.get("wireguard_ip") ?? "") || null,
            wireguard_endpoint: String(form.get("wireguard_endpoint") ?? "") || null,
            ssh_host: String(form.get("ssh_host") ?? "") || null,
            ssh_port: Number(form.get("ssh_port") ?? 22),
            ssh_user: String(form.get("ssh_user") ?? "") || null
          })
        });
        setNotice({ kind: "info", message: `Registration token: ${response.data.registration_token}` });
      },
      ""
    );
    event.currentTarget.reset();
  }

  return (
    <div className="content-grid">
      {!isAdmin ? <section className="panel"><EmptyBlock label="Admin permission required." /></section> : null}
      {isAdmin ? (
        <div className="two-column">
          <section className="panel">
            <PanelTitle icon={Server} title="Nodes" />
            {nodes.map((node) => (
              <div className="resource-row" key={node.id}>
                <div>
                  <strong>{node.name}</strong>
                  <span>{node.region_code} · {tagsText(node.tags)} · heartbeat {formatDate(node.last_heartbeat_at)}</span>
                </div>
                <div className="row-actions">
                  <StatusPill status={node.status} />
                  <button disabled={busy} onClick={() => void runAction(() => request(`/nodes/${node.id}/maintenance`, { method: "POST" }).then(() => undefined), "Node set to maintenance.")}>
                    <Wrench size={15} />
                    Maintain
                  </button>
                  <button disabled={busy} onClick={() => {
                    if (confirm(`Disable node ${node.name}?`)) {
                      void runAction(() => request(`/nodes/${node.id}/disable`, { method: "POST" }).then(() => undefined), "Node disabled.");
                    }
                  }}>
                    <Ban size={15} />
                    Disable
                  </button>
                  <button disabled={busy} onClick={() => {
                    void runAction(async () => {
                      const response = await request<ApiResponse<{ registration_token: string }>>(`/nodes/${node.id}/registration-token`, { method: "POST" });
                      setNotice({ kind: "info", message: `Registration token: ${response.data.registration_token}` });
                    }, "");
                  }}>
                    <RotateCcw size={15} />
                    Rotate
                  </button>
                </div>
              </div>
            ))}
          </section>
          <form className="panel form-panel" onSubmit={createNode}>
            <PanelTitle icon={Server} title="Create node" />
            <Field name="name" label="Name" required />
            <Field name="region_code" label="Region" defaultValue="US" required />
            <Field name="tags" label="Tags" defaultValue="us" />
            <Field name="weight" label="Weight" type="number" defaultValue={100} />
            <Field name="supported_tool_types" label="Tools" defaultValue="claude" />
            <Field name="wireguard_ip" label="WireGuard IP" />
            <Field name="wireguard_endpoint" label="WireGuard endpoint" />
            <Field name="ssh_host" label="SSH host" />
            <Field name="ssh_port" label="SSH port" type="number" defaultValue={22} />
            <Field name="ssh_user" label="SSH user" defaultValue="agent-remote" />
            <button className="primary" disabled={busy}>
              <Server size={16} />
              Create
            </button>
          </form>
        </div>
      ) : null}
      {isAdmin ? (
        <section className="panel">
          <PanelTitle icon={AlertTriangle} title="Node tasks" />
          {nodeTasks.length === 0 ? <EmptyBlock label="No node tasks." /> : nodeTasks.map((task) => <TaskRow key={task.id} task={task} />)}
        </section>
      ) : null}
    </div>
  );
}

function TaskRow({ task }: { task: NodeTask }) {
  return (
    <details className="detail-row">
      <summary>
        <span>{task.task_type}</span>
        <StatusPill status={task.status} />
        <small>{task.task_id}</small>
      </summary>
      <JsonBlock value={{ payload: task.payload, result: task.result }} />
    </details>
  );
}

function SessionsPage({
  toolSessions,
  accounts,
  workspaces,
  busy,
  request,
  runAction,
  setNotice
}: {
  toolSessions: ToolSession[];
  accounts: ToolAccount[];
  workspaces: Workspace[];
  busy: boolean;
  request: AppRequest;
  runAction: RunAction;
  setNotice: React.Dispatch<React.SetStateAction<Notice | null>>;
}) {
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
            project_key: String(form.get("project_key") ?? ""),
            argv: splitList(String(form.get("argv") ?? ""))
          })
        }).then(() => undefined),
      "Session created."
    );
    event.currentTarget.reset();
  }

  return (
    <div className="two-column">
      <section className="panel">
        <PanelTitle icon={TerminalSquare} title="Sessions" />
        {toolSessions.length === 0 ? <EmptyBlock label="No sessions." /> : toolSessions.map((session) => (
          <div className="resource-row" key={session.id}>
            <div>
              <strong>{session.tool_type} · {session.project_key}</strong>
              <span>{shortId(session.id)} · tmux {session.tmux_session_name ?? "-"}</span>
            </div>
            <div className="row-actions">
              <StatusPill status={session.status} />
              <button disabled={busy} onClick={() => {
                void runAction(async () => {
                  const response = await request<ApiResponse<{ ssh_command: string }>>(`/sessions/${session.id}/attach`, { method: "POST" });
                  setNotice({ kind: "info", message: response.data.ssh_command });
                }, "");
              }}>
                <Link size={15} />
                Attach
              </button>
              <button disabled={busy || ["stopped", "stopping"].includes(session.status)} onClick={() => {
                if (confirm(`Stop session ${session.project_key}?`)) {
                  void runAction(() => request(`/sessions/${session.id}/stop`, { method: "POST" }).then(() => undefined), "Session stopping.");
                }
              }}>
                <Square size={15} />
                Stop
              </button>
            </div>
          </div>
        ))}
      </section>
      <form className="panel form-panel" onSubmit={createSession}>
        <PanelTitle icon={Play} title="Create session" />
        <SelectField name="tool_type" label="Tool">
          <option value="claude">claude</option>
        </SelectField>
        <SelectField name="tool_account_id" label="Account" required>
          <option value="">Select</option>
          {accounts.map((account) => <option key={account.id} value={account.id}>{account.display_name}</option>)}
        </SelectField>
        <SelectField name="workspace_id" label="Workspace" required>
          <option value="">Select</option>
          {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.display_name}</option>)}
        </SelectField>
        <Field name="project_key" label="Project key" required />
        <Field name="argv" label="Args" />
        <button className="primary" disabled={busy}>
          <Play size={16} />
          Create
        </button>
      </form>
    </div>
  );
}

function SyncPage({
  workspaces,
  syncSessions,
  devices,
  nodes,
  busy,
  request,
  runAction
}: {
  workspaces: Workspace[];
  syncSessions: SyncSession[];
  devices: Device[];
  nodes: NodeItem[];
  busy: boolean;
  request: AppRequest;
  runAction: RunAction;
}) {
  async function createWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction(
      () => request("/workspaces", {
        method: "POST",
        body: JSON.stringify({
          device_id: String(form.get("device_id") ?? ""),
          project_key: String(form.get("project_key") ?? ""),
          local_start_path: String(form.get("local_start_path") ?? ""),
          display_name: String(form.get("display_name") ?? "")
        })
      }).then(() => undefined),
      "Workspace created."
    );
    event.currentTarget.reset();
  }

  async function createSync(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction(
      () => request("/sync-sessions", {
        method: "POST",
        body: JSON.stringify({
          workspace_id: String(form.get("workspace_id") ?? ""),
          node_id: String(form.get("node_id") ?? "") || null,
          local_path: String(form.get("local_path") ?? "") || null,
          sync_mode: String(form.get("sync_mode") ?? "two_way")
        })
      }).then(() => undefined),
      "Sync session created."
    );
    event.currentTarget.reset();
  }

  return (
    <div className="content-grid">
      <div className="two-column">
        <section className="panel">
          <PanelTitle icon={Database} title="Workspaces" />
          {workspaces.length === 0 ? <EmptyBlock label="No workspaces." /> : workspaces.map((workspace) => (
            <div className="resource-row" key={workspace.id}>
              <div>
                <strong>{workspace.display_name}</strong>
                <span>{workspace.project_key} · {workspace.local_start_path}</span>
              </div>
              <span className="badge">{shortId(workspace.device_id)}</span>
            </div>
          ))}
        </section>
        <form className="panel form-panel" onSubmit={createWorkspace}>
          <PanelTitle icon={Database} title="Create workspace" />
          <SelectField name="device_id" label="Device" required>
            <option value="">Select</option>
            {devices.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}
          </SelectField>
          <Field name="display_name" label="Display name" required />
          <Field name="project_key" label="Project key" required />
          <Field name="local_start_path" label="Local path" required />
          <button className="primary" disabled={busy}>
            <Database size={16} />
            Create
          </button>
        </form>
      </div>
      <div className="two-column">
        <section className="panel">
          <PanelTitle icon={FolderSync} title="Sync sessions" />
          {syncSessions.length === 0 ? <EmptyBlock label="No sync sessions." /> : syncSessions.map((sync) => (
            <div className="resource-row" key={sync.id}>
              <div>
                <strong>{sync.local_path}</strong>
                <span>{sync.remote_path} · {sync.sync_mode}</span>
              </div>
              <div className="row-actions">
                <StatusPill status={sync.status} />
                <span className={`badge ${sync.conflict_status !== "clean" ? "warning" : ""}`}>{sync.conflict_status}</span>
                <button disabled={busy} onClick={() => void runAction(() => request(`/sync-sessions/${sync.id}/pause`, { method: "POST", body: JSON.stringify({ note: "admin-web" }) }).then(() => undefined), "Sync paused.")}>
                  <Circle size={15} />
                  Pause
                </button>
                <button disabled={busy} onClick={() => void runAction(() => request(`/sync-sessions/${sync.id}/resume`, { method: "POST", body: JSON.stringify({ note: "admin-web" }) }).then(() => undefined), "Sync resumed.")}>
                  <Play size={15} />
                  Resume
                </button>
                <button disabled={busy} onClick={() => void runAction(() => request(`/sync-sessions/${sync.id}/resolve`, { method: "POST", body: JSON.stringify({ note: "admin-web" }) }).then(() => undefined), "Conflict resolved.")}>
                  <CheckCircle2 size={15} />
                  Resolve
                </button>
                <button disabled={busy} onClick={() => {
                  if (confirm("Reset this sync session?")) {
                    void runAction(() => request(`/sync-sessions/${sync.id}/reset`, { method: "POST", body: JSON.stringify({ note: "admin-web" }) }).then(() => undefined), "Sync reset.");
                  }
                }}>
                  <RotateCcw size={15} />
                  Reset
                </button>
              </div>
            </div>
          ))}
        </section>
        <form className="panel form-panel" onSubmit={createSync}>
          <PanelTitle icon={FolderSync} title="Create sync" />
          <SelectField name="workspace_id" label="Workspace" required>
            <option value="">Select</option>
            {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.display_name}</option>)}
          </SelectField>
          <SelectField name="node_id" label="Node">
            <option value="">Auto</option>
            {nodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
          </SelectField>
          <Field name="local_path" label="Local path" />
          <SelectField name="sync_mode" label="Mode">
            <option value="two_way">two_way</option>
          </SelectField>
          <button className="primary" disabled={busy}>
            <FolderSync size={16} />
            Create
          </button>
        </form>
      </div>
    </div>
  );
}

function BrowserPage({
  browserSessions,
  accounts,
  busy,
  apiBase,
  request,
  runAction,
  setNotice
}: {
  browserSessions: BrowserSession[];
  accounts: ToolAccount[];
  busy: boolean;
  apiBase: string;
  request: AppRequest;
  runAction: RunAction;
  setNotice: React.Dispatch<React.SetStateAction<Notice | null>>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => browserSessions.find((item) => item.id === selectedId) ?? browserSessions[0], [browserSessions, selectedId]);

  async function createBrowser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const accountId = String(form.get("tool_account_id") ?? "");
    await runAction(
      () => request("/browser-sessions", {
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
      "Browser session created."
    );
    event.currentTarget.reset();
  }

  return (
    <div className="two-column">
      <section className="panel">
        <PanelTitle icon={MonitorUp} title="Browser sessions" />
        {browserSessions.length === 0 ? <EmptyBlock label="No browser sessions." /> : browserSessions.map((session) => (
          <button key={session.id} className={`list-row ${selected?.id === session.id ? "selected" : ""}`} onClick={() => setSelectedId(session.id)}>
            <span>{session.target_url ?? "blank"}</span>
            <small>{session.region_code} · {session.status}</small>
          </button>
        ))}
        {selected ? (
          <div className="button-row">
            <button disabled={busy || selected.status !== "ready"} onClick={() => {
              void runAction(async () => {
                const response = await request<ApiResponse<{ embed_url: string }>>(`/browser-sessions/${selected.id}/connect-info`, { method: "POST" });
                const url = response.data.embed_url.startsWith("http") ? response.data.embed_url : `${apiBase.replace(/\/$/, "")}${response.data.embed_url}`;
                window.open(url, "_blank", "noopener,noreferrer");
                setNotice({ kind: "info", message: url });
              }, "");
            }}>
              <MonitorUp size={15} />
              Connect
            </button>
            <button disabled={busy} onClick={() => {
              if (confirm("Stop this browser session?")) {
                void runAction(() => request(`/browser-sessions/${selected.id}/stop`, { method: "POST" }).then(() => undefined), "Browser session stopping.");
              }
            }}>
              <Square size={15} />
              Stop
            </button>
          </div>
        ) : null}
      </section>
      <form className="panel form-panel" onSubmit={createBrowser}>
        <PanelTitle icon={Play} title="Start browser" />
        <SelectField name="tool_account_id" label="Account">
          <option value="">Manual region</option>
          {accounts.map((account) => <option key={account.id} value={account.id}>{account.display_name}</option>)}
        </SelectField>
        <Field name="target_url" label="URL" defaultValue="https://claude.ai/" />
        <Field name="region_code" label="Region" defaultValue="US" />
        <Field name="timezone" label="Timezone" defaultValue="America/Los_Angeles" />
        <Field name="locale" label="Locale" defaultValue="en_US.UTF-8" />
        <Field name="ttl_seconds" label="TTL" type="number" defaultValue={1800} />
        <button className="primary" disabled={busy}>
          <Play size={16} />
          Start
        </button>
      </form>
    </div>
  );
}

function AuditPage({ auditLogs }: { auditLogs: AuditLog[] }) {
  return (
    <section className="panel">
      <PanelTitle icon={FileClock} title="Audit logs" />
      {auditLogs.length === 0 ? <EmptyBlock label="No audit logs." /> : auditLogs.map((item) => <AuditRow key={item.id} item={item} />)}
    </section>
  );
}

function AuditRow({ item }: { item: AuditLog }) {
  return (
    <details className="detail-row">
      <summary>
        <span>{item.action}</span>
        <small>{item.target_type ?? "-"} · {item.target_id ?? "-"} · {formatDate(item.created_at)}</small>
      </summary>
      <JsonBlock value={item.details} />
    </details>
  );
}

function SettingsPage({
  apiBase,
  setApiBase,
  me,
  busy,
  request,
  runAction,
  setNotice
}: {
  apiBase: string;
  setApiBase: React.Dispatch<React.SetStateAction<string>>;
  me: User;
  busy: boolean;
  request: AppRequest;
  runAction: RunAction;
  setNotice: React.Dispatch<React.SetStateAction<Notice | null>>;
}) {
  async function updateMe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction(
      () => request("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ display_name: String(form.get("display_name") ?? "") })
      }).then(() => undefined),
      "Profile updated."
    );
  }

  return (
    <div className="two-column">
      <section className="panel form-panel">
        <PanelTitle icon={Settings} title="API" />
        <label>
          Base URL
          <input value={apiBase} onChange={(event) => setApiBase(event.target.value)} />
        </label>
        <button onClick={() => setNotice({ kind: "info", message: "Settings saved locally." })}>
          <CheckCircle2 size={15} />
          Save
        </button>
      </section>
      <form className="panel form-panel" onSubmit={updateMe}>
        <PanelTitle icon={Users} title="Profile" />
        <Field name="display_name" label="Display name" defaultValue={me.display_name} required />
        <div className="kv-grid">
          <span>Username</span><strong>{me.username}</strong>
          <span>Role</span><strong>{me.role}</strong>
          <span>TOTP</span><strong>{me.totp_enabled ? "enabled" : "disabled"}</strong>
        </div>
        <button className="primary" disabled={busy}>
          <CheckCircle2 size={16} />
          Update
        </button>
      </form>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

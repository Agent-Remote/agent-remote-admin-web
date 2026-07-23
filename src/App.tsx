import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiClient, defaultApiBase, loadOptional } from "./api/client";
import { I18nProvider, useI18n } from "./i18n/I18nProvider";
import { AuthPage } from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";
import {
  type ApiResponse,
  type AuditLog,
  type BrowserSession,
  type Device,
  type NodeItem,
  type NodeTask,
  type Notice,
  type Page,
  type SyncSession,
  type ToolAccount,
  type ToolSession,
  type User,
  type Workspace
} from "./types";
import { errorText } from "./utils/format";

function AppInner() {
  const { t } = useI18n();
  const [apiBase, setApiBase] = useState(
    localStorage.getItem("agentRemoteApiBase") ?? defaultApiBase
  );
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

  const client = useMemo(() => new ApiClient(apiBase, token), [apiBase, token]);
  const request = useCallback(client.request.bind(client), [client]);

  const loadAll = useCallback(async () => {
    if (!token) return;
    setBusy(true);
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
        loadOptional(() => client.list<User>("/users"), []),
        loadOptional(() => client.list<Device>("/devices"), []),
        loadOptional(() => client.list<ToolAccount>("/tool-accounts"), []),
        loadOptional(() => client.list<NodeItem>("/nodes"), []),
        loadOptional(() => client.list<Workspace>("/workspaces"), []),
        loadOptional(() => client.list<SyncSession>("/sync-sessions"), []),
        loadOptional(() => client.list<ToolSession>("/sessions"), []),
        loadOptional(() => client.list<BrowserSession>("/browser-sessions"), []),
        loadOptional(() => client.list<AuditLog>("/audit-logs"), []),
        loadOptional(() => client.list<NodeTask>("/nodes/tasks?limit=100"), [])
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
      setNotice({ kind: "error", message: errorText(error, t("common.loadFailed")) });
    } finally {
      setBusy(false);
    }
  }, [client, request, t, token]);

  useEffect(() => {
    localStorage.setItem("agentRemoteApiBase", apiBase);
  }, [apiBase]);

  useEffect(() => {
    if (!token) return;
    localStorage.setItem("agentRemoteToken", token);
    void loadAll();
  }, [loadAll, token]);

  useEffect(() => {
    if (!token) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) void loadAll();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [loadAll, token]);

  async function runAction(action: () => Promise<void>, success = "") {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      if (success) setNotice({ kind: "info", message: success });
      await loadAll();
    } catch (error) {
      setNotice({ kind: "error", message: errorText(error, t("common.requestFailed")) });
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem("agentRemoteToken");
    setToken("");
    setMe(null);
    setNotice(null);
  }

  if (!token || !me) {
    return (
      <AuthPage
        apiBase={apiBase}
        busy={busy}
        notice={notice}
        request={request}
        setApiBase={setApiBase}
        setBusy={setBusy}
        setNotice={setNotice}
        setToken={setToken}
      />
    );
  }

  return (
    <Dashboard
      accounts={accounts}
      apiBase={apiBase}
      auditLogs={auditLogs}
      browserSessions={browserSessions}
      busy={busy}
      devices={devices}
      loadAll={loadAll}
      logout={logout}
      me={me}
      nodes={nodes}
      nodeTasks={nodeTasks}
      notice={notice}
      page={page}
      request={request}
      runAction={runAction}
      setApiBase={setApiBase}
      setNotice={setNotice}
      setPage={setPage}
      syncSessions={syncSessions}
      toolSessions={toolSessions}
      users={users}
      workspaces={workspaces}
    />
  );
}

export function App() {
  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  );
}

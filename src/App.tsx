import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiClient, defaultApiBase } from "./api/client";
import { ConfirmProvider } from "./app/ConfirmProvider";
import { isPage } from "./app/navigation";
import { BrandMark } from "./components/ui";
import { useConsoleData } from "./hooks/useConsoleData";
import { I18nProvider, useI18n } from "./i18n/I18nProvider";
import { AuthPage } from "./pages/AuthPage";
import { CliApprovalPage } from "./pages/CliApprovalPage";
import { Dashboard } from "./pages/Dashboard";
import type { ApiResponse, Notice, Page, User } from "./types";
import { errorText } from "./utils/format";

function AppInner() {
  const { t } = useI18n();
  const location = useLocation();
  const queryClient = useQueryClient();
  const apiBase = defaultApiBase;
  const developmentToken = import.meta.env.DEV
    ? import.meta.env.VITE_AGENT_REMOTE_DEV_TOKEN
    : undefined;
  const [token, setToken] = useState(
    localStorage.getItem("agentRemoteToken") ?? developmentToken ?? ""
  );
  const [tokenExpiresAt, setTokenExpiresAt] = useState(
    Number(localStorage.getItem("agentRemoteTokenExpiresAt") ?? "0")
  );
  const [notice, setNotice] = useState<Notice | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [bootstrapCompleted, setBootstrapCompleted] = useState(false);

  const client = useMemo(() => new ApiClient(apiBase, token), [apiBase, token]);
  const request = useCallback(client.request.bind(client), [client]);
  const meQuery = useQuery({
    queryKey: ["session", "me"],
    queryFn: async () => (await request<ApiResponse<User>>("/users/me")).data,
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000
  });
  const bootstrapQuery = useQuery({
    queryKey: ["session", "bootstrap-status"],
    queryFn: async () =>
      (await request<ApiResponse<{ required: boolean }>>("/auth/bootstrap-status")).data,
    enabled: !token,
    retry: 2,
    staleTime: 0
  });
  const pathPage = location.pathname.startsWith("/app/")
    ? location.pathname.split("/")[2]
    : undefined;
  const activePage = isPage(pathPage) ? pathPage : null;
  const data = useConsoleData(
    client,
    Boolean(token && meQuery.data),
    activePage,
    meQuery.data?.role === "admin"
  );

  useEffect(() => {
    if (!token) return;
    localStorage.setItem("agentRemoteToken", token);
  }, [token]);

  useEffect(() => {
    if (!token || !meQuery.error) return;
    logout();
    setNotice({ kind: "error", message: errorText(meQuery.error, t("common.loadFailed")) });
    // logout is deliberately tied to an invalid current-user request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meQuery.error, t, token]);

  useEffect(() => {
    if (!token) return;
    const delay = tokenExpiresAt
      ? Math.max(tokenExpiresAt - Date.now() - 300_000, 1_000)
      : 1_000;
    const timer = window.setTimeout(async () => {
      try {
        const response = await client.request<
          ApiResponse<{ access_token: string; expires_in: number }>
        >("/auth/refresh", { method: "POST" });
        authenticate(response.data.access_token, response.data.expires_in);
      } catch (error) {
        logout();
        setNotice({ kind: "error", message: errorText(error, t("auth.refreshFailed")) });
      }
    }, delay);
    return () => window.clearTimeout(timer);
    // authenticate and logout only update stable session primitives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, t, token, tokenExpiresAt]);

  async function runAction(action: () => Promise<void>, success = "") {
    setActionBusy(true);
    setNotice(null);
    try {
      await action();
      if (success) setNotice({ kind: "info", message: success });
      await data.refresh();
    } catch (error) {
      setNotice({ kind: "error", message: errorText(error, t("common.requestFailed")) });
    } finally {
      setActionBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem("agentRemoteToken");
    localStorage.removeItem("agentRemoteTokenExpiresAt");
    queryClient.clear();
    setToken("");
    setTokenExpiresAt(0);
    setNotice(null);
  }

  function authenticate(accessToken: string, expiresIn: number) {
    const expiresAt = Date.now() + expiresIn * 1000;
    queryClient.clear();
    localStorage.setItem("agentRemoteToken", accessToken);
    localStorage.setItem("agentRemoteTokenExpiresAt", String(expiresAt));
    setToken(accessToken);
    setTokenExpiresAt(expiresAt);
  }

  if (!token) {
    if (bootstrapQuery.isPending) {
      return (
        <main className="boot-screen" aria-live="polite">
          <BrandMark />
          <LoaderCircle className="spin" size={20} />
          <span>{t("common.loading")}</span>
        </main>
      );
    }
    if (bootstrapQuery.isError) {
      return (
        <main className="boot-screen boot-error" role="alert">
          <BrandMark />
          <strong>{t("auth.bootstrapStatusFailed")}</strong>
          <button
            disabled={bootstrapQuery.isFetching}
            onClick={() => void bootstrapQuery.refetch()}
            type="button"
          >
            <RefreshCw className={bootstrapQuery.isFetching ? "spin" : ""} size={16} />
            {t("common.retry")}
          </button>
        </main>
      );
    }
    return (
      <AuthPage
        mode={bootstrapQuery.data?.required && !bootstrapCompleted ? "bootstrap" : "login"}
        busy={actionBusy}
        notice={notice}
        request={request}
        setBusy={setActionBusy}
        setNotice={setNotice}
        onAuthenticated={authenticate}
        onBootstrapComplete={() => {
          setBootstrapCompleted(true);
          void queryClient.invalidateQueries({ queryKey: ["session", "bootstrap-status"] });
        }}
      />
    );
  }

  if (!meQuery.data) {
    return (
      <main className="boot-screen" aria-live="polite">
        <BrandMark />
        <LoaderCircle className="spin" size={20} />
        <span>{t("common.loading")}</span>
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/cli" element={<CliApprovalPage request={request} />} />
      <Route
        path="/app/:page"
        element={
          <ConsoleRoute
            {...data}
            apiBase={apiBase}
            busy={actionBusy}
            syncing={data.refreshing}
            syncError={data.error instanceof Error ? data.error.message : data.error ? String(data.error) : null}
            lastSyncedAt={data.lastUpdatedAt}
            logout={logout}
            me={meQuery.data}
            notice={notice}
            request={request}
            runAction={runAction}
            setNotice={setNotice}
          />
        }
      />
      <Route path="*" element={<Navigate replace to="/app/overview" />} />
    </Routes>
  );
}

type ConsoleRouteProps = Omit<React.ComponentProps<typeof Dashboard>, "page" | "setPage" | "loadAll"> & {
  refresh: () => Promise<void>;
};

function ConsoleRoute({ refresh, ...props }: ConsoleRouteProps) {
  const { page } = useParams();
  const navigate = useNavigate();

  if (!isPage(page)) {
    return <Navigate replace to="/app/overview" />;
  }

  return (
    <Dashboard
      {...props}
      loadAll={refresh}
      page={page}
      setPage={(nextPage: Page) => navigate(`/app/${nextPage}`)}
    />
  );
}

export function App() {
  return (
    <I18nProvider>
      <ConfirmProvider>
        <AppInner />
      </ConfirmProvider>
    </I18nProvider>
  );
}

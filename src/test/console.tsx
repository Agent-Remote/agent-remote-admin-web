import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { ConfirmProvider } from "../app/ConfirmProvider";
import { I18nProvider } from "../i18n/I18nProvider";
import type { AppRequest } from "../types";
import type { ConsolePageProps } from "../pages/console/types";

export function makeConsoleProps(overrides: Partial<ConsolePageProps> = {}) {
  const requestMock = vi.fn<(path: string, options?: RequestInit) => Promise<unknown>>(
    async () => undefined
  );
  const request: AppRequest = (path, options) => requestMock(path, options) as Promise<never>;
  const runAction = vi.fn(async (action: () => Promise<void>) => action());
  const props: ConsolePageProps = {
    accounts: [],
    apiBase: "http://localhost:8000",
    auditLogs: [],
    browserSessions: [],
    credentialProfiles: [],
    configImports: [],
    busy: false,
    devices: [],
    loadAll: vi.fn(async () => undefined),
    logout: vi.fn(),
    me: {
      id: "user-1",
      username: "ada",
      display_name: "Ada Lovelace",
      role: "user",
      status: "active",
      totp_enabled: false,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z"
    },
    nodes: [],
    nodeTasks: [],
    notice: null,
    page: "overview",
    request,
    runAction,
    syncing: false,
    syncError: null,
    lastSyncedAt: 0,
    setNotice: vi.fn(),
    setPage: vi.fn(),
    syncSessions: [],
    toolSessions: [],
    users: [],
    workspaces: [],
    ...overrides
  };
  return { props, requestMock, runAction };
}

export function renderConsole(element: ReactElement) {
  localStorage.setItem("agentRemoteLocale", "en");
  return render(
    <I18nProvider>
      <ConfirmProvider>{element}</ConfirmProvider>
    </I18nProvider>
  );
}

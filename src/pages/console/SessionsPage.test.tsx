import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmProvider } from "../../app/ConfirmProvider";
import { I18nProvider } from "../../i18n/I18nProvider";
import type { AppRequest, ToolSession } from "../../types";
import { SessionsPage } from "./SessionsPage";
import type { ConsolePageProps } from "./types";

function session(id: string, status: string): ToolSession {
  return {
    id,
    tool_type: "claude",
    user_id: "user-1",
    tool_account_id: "account-1",
    workspace_id: "workspace-1",
    node_id: "node-1",
    project_key: `project-${id}`,
    status,
    tmux_session_name: `tmux-${id}`,
    container_id: `container-${id}`,
    runtime_backend: "native",
    runtime_resource_id: null,
    replaces_session_id: null,
    create_task_id: null,
    stop_task_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z"
  };
}

function renderPage(
  toolSessions: ToolSession[],
  overrides: Partial<ConsolePageProps> = {},
  responseFor?: (path: string) => unknown
) {
  localStorage.setItem("agentRemoteLocale", "en");
  const requestMock = vi.fn();
  const request: AppRequest = (path, options) => {
    requestMock(path, options);
    return Promise.resolve(responseFor?.(path) as never);
  };
  const runAction = vi.fn(async (action: () => Promise<void>) => action());
  const props: ConsolePageProps = {
    accounts: [],
    apiBase: "http://localhost",
    auditLogs: [],
    browserSessions: [],
    busy: false,
    configImports: [],
    credentialProfiles: [],
    devices: [],
    deviceSessions: [],
    deviceSessionsError: false,
    deviceSessionsLoading: false,
    deviceSessionsRefreshing: false,
    deviceControlPolicy: undefined,
    deviceControlPolicyError: false,
    deviceControlPolicyLoading: false,
    loadAll: async () => undefined,
    logout: vi.fn(),
    me: {
      id: "user-1",
      username: "user",
      display_name: "User",
      role: "user",
      status: "active",
      totp_enabled: false,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z"
    },
    nodes: [],
    nodeTasks: [],
    portForwards: [],
    portForwardsError: false,
    portForwardsLoading: false,
    portForwardsRefreshing: false,
    notice: null,
    page: "sessions",
    request,
    runAction,
    setNotice: vi.fn(),
    setPage: vi.fn(),
    syncing: false,
    syncError: null,
    lastSyncedAt: 0,
    syncSessions: [],
    toolSessions,
    users: [],
    workspaces: [],
    ...overrides
  };

  render(
    <I18nProvider>
      <ConfirmProvider>
        <SessionsPage {...props} />
      </ConfirmProvider>
    </I18nProvider>
  );
  return { props, request: requestMock };
}

describe("SessionsPage", () => {
  it("deletes only stopped or interrupted sessions and supports bulk cleanup", async () => {
    const { request } = renderPage([
      session("running", "running"),
      session("stopped", "stopped"),
      session("interrupted", "interrupted")
    ]);

    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith("/sessions/stopped", { method: "DELETE" });
    });

    fireEvent.click(screen.getByRole("button", { name: "Clear ended sessions" }));
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("these 2 stopped or interrupted sessions");
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => {
      expect(request).toHaveBeenCalledWith("/sessions", { method: "DELETE" });
    });
  });

  it("creates, attaches to, and confirms stopping a running session", async () => {
    const running = session("running", "running");
    const { props, request } = renderPage(
      [running],
      {
        accounts: [{
          id: "account-1", user_id: "user-1", tool_type: "claude", display_name: "Claude", status: "active",
          region_code: "US", timezone: "UTC", locale: "en_US.UTF-8", preferred_node_tags: [],
          affinity_node_id: null, runtime_backend: "native", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z"
        }],
        workspaces: [{
          id: "workspace-1", user_id: "user-1", device_id: "device-1", project_key: "agent-remote",
          local_start_path: "/src", display_name: "Workspace", remote_path: null, sync_git: true,
          git_sync_policy: { exclude_hooks: true, exclude_locks: true, require_clean_git_lock: true, warn_concurrent_git: true },
          created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z"
        }]
      },
      (path) => path.endsWith("/attach") ? { data: { ssh_command: "ssh node-1" } } : undefined
    );

    fireEvent.change(screen.getByLabelText("Account"), { target: { value: "account-1" } });
    fireEvent.change(screen.getByLabelText("Args"), { target: { value: "--resume latest" } });
    fireEvent.submit(screen.getByLabelText("Args").closest("form")!);
    await waitFor(() => expect(request).toHaveBeenCalledWith("/sessions", expect.objectContaining({ method: "POST" })));

    fireEvent.click(screen.getByRole("button", { name: "Attach" }));
    await waitFor(() => expect(request).toHaveBeenCalledWith("/sessions/running/attach", { method: "POST" }));
    expect(props.setNotice).toHaveBeenCalledWith({ kind: "info", message: "ssh node-1" });
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(request).toHaveBeenCalledWith("/sessions/running/stop", { method: "POST" }));
  });
});

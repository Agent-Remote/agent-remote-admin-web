import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmProvider } from "../../app/ConfirmProvider";
import { I18nProvider } from "../../i18n/I18nProvider";
import type { ConsolePageProps } from "./types";
import { makeConsoleProps, renderConsole } from "../../test/console";
import { AccountsPage } from "./AccountsPage";

describe("AccountsPage", () => {
  it("shows the latest Claude import without exposing file contents", () => {
    localStorage.setItem("agentRemoteLocale", "en");
    const props = {
      accounts: [{ id: "account-1", user_id: "user-1", tool_type: "claude", display_name: "Claude US", status: "active", region_code: "US", timezone: "America/Los_Angeles", locale: "en_US.UTF-8", preferred_node_tags: [], affinity_node_id: "node-1", runtime_backend: "native", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" }],
      apiBase: "http://localhost", auditLogs: [], browserSessions: [], busy: false,
      configImports: [{ tool_account_id: "account-1", task_id: "import-1", status: "succeeded", include_resume_history: false, requested_paths: ["~/.claude/settings.json"], files_written: ["~/.claude/settings.json"], file_count: 1, error: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:01Z", finished_at: "2026-01-01T00:00:01Z" }],
      credentialProfiles: [], devices: [], deviceSessions: [], deviceSessionsError: false,
      deviceSessionsLoading: false, deviceSessionsRefreshing: false,
      deviceControlPolicy: undefined, deviceControlPolicyError: false,
      deviceControlPolicyLoading: false,
      loadAll: async () => undefined, logout: vi.fn(),
      me: { id: "user-1", username: "user", display_name: "User", role: "user", status: "active", totp_enabled: false, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
      nodes: [], nodeTasks: [], portForwards: [], portForwardsError: false,
      portForwardsLoading: false, portForwardsRefreshing: false,
      notice: null, page: "accounts", request: vi.fn(), runAction: vi.fn(),
      setNotice: vi.fn(), setPage: vi.fn(), syncing: false, syncError: null, lastSyncedAt: 0,
      syncSessions: [], toolSessions: [], users: [], workspaces: []
    } satisfies ConsolePageProps;
    render(<I18nProvider><ConfirmProvider><AccountsPage {...props} /></ConfirmProvider></I18nProvider>);

    expect(screen.getByText("Claude configuration imports")).toBeInTheDocument();
    expect(screen.getByText("succeeded")).toBeInTheDocument();
    fireEvent.click(screen.getAllByText("Claude US")[1]);
    expect(screen.getByText(/~\/.claude\/settings.json/)).toBeInTheDocument();
    expect(screen.queryByText(/content_base64/)).not.toBeInTheDocument();
  });

  it("covers account creation, binding, migration, disable, and deletion", async () => {
    const account = {
      id: "account-1", user_id: "user-1", tool_type: "claude", display_name: "Claude US", status: "active",
      region_code: "US", timezone: "America/Los_Angeles", locale: "en_US.UTF-8", preferred_node_tags: [],
      affinity_node_id: null, runtime_backend: "native", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z"
    };
    const base = makeConsoleProps();
    const props = { ...base.props, accounts: [account], me: { ...base.props.me, role: "admin" } };
    base.requestMock.mockImplementation(async (path) => path.endsWith("bind/start")
      ? { data: { status: "pending", connect_command: "claude login" } }
      : path.endsWith("bind/verify")
        ? { data: { status: "verified", error: null } }
        : undefined);
    renderConsole(<AccountsPage {...props} />);

    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Claude EU" } });
    fireEvent.submit(screen.getByLabelText("Display name").closest("form")!);
    await waitFor(() => expect(base.requestMock).toHaveBeenCalledWith("/tool-accounts", expect.objectContaining({ method: "POST" })));
    fireEvent.click(screen.getByRole("button", { name: "Bind" }));
    await waitFor(() => expect(props.setNotice).toHaveBeenCalledWith({ kind: "info", message: "claude login" }));
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    await waitFor(() => expect(props.setNotice).toHaveBeenCalledWith({ kind: "info", message: "verified" }));

    fireEvent.click(screen.getByRole("button", { name: "Migrate runtime" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(base.requestMock).toHaveBeenCalledWith("/tool-accounts/account-1/runtime-migration", {
      method: "POST", body: JSON.stringify({ target_runtime_backend: "docker_sandbox" })
    }));
    fireEvent.click(screen.getByRole("button", { name: "Disable" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(base.requestMock).toHaveBeenCalledWith("/tool-accounts/account-1/disable", { method: "POST" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(base.requestMock).toHaveBeenCalledWith("/tool-accounts/account-1", { method: "DELETE" }));
  });
});

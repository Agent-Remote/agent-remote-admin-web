import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeConsoleProps, renderConsole } from "../../test/console";
import type { BrowserSession, SyncSession, ToolAccount, Workspace } from "../../types";
import { BrowserPage } from "./BrowserPage";
import { SyncPage } from "./SyncPage";

const workspace: Workspace = {
  id: "workspace-1", user_id: "user-1", device_id: "device-1", project_key: "agent-remote",
  local_start_path: "/src/agent-remote", display_name: "Agent Remote", remote_path: null, sync_git: true,
  git_sync_policy: { exclude_hooks: true, exclude_locks: true, require_clean_git_lock: true, warn_concurrent_git: true },
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z"
};
function sync(id: string, status: string, conflict_status = "clean"): SyncSession {
  return {
    id, user_id: "user-1", workspace_id: workspace.id, node_id: null, local_path: `/src/${id}`,
    remote_path: `/remote/${id}`, status, conflict_status, sync_mode: "two_way", sync_git: true,
    exclude: [], mutagen_session_id: null, remote_endpoint: null, prepare_task_id: null,
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z"
  };
}
const account: ToolAccount = {
  id: "account-1", user_id: "user-1", tool_type: "claude", display_name: "Claude US", status: "active",
  region_code: "US", timezone: "America/Los_Angeles", locale: "en_US.UTF-8", preferred_node_tags: [],
  affinity_node_id: null, runtime_backend: "native", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z"
};
const browser: BrowserSession = {
  id: "browser-1", user_id: "user-1", tool_account_id: account.id, node_id: "node-1", status: "ready",
  region_code: "US", timezone: "America/Los_Angeles", locale: "en_US.UTF-8", target_url: "https://claude.ai/",
  container_id: "container-1", ttl_seconds: 1800, expires_at: "2026-01-01T01:00:00Z", stopped_at: null,
  create_task_id: null, stop_task_id: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z"
};

describe("sync and browser pages", () => {
  it("creates resources and exposes sync lifecycle actions", async () => {
    const { props, requestMock } = makeConsoleProps({
      workspaces: [workspace],
      devices: [{ id: "device-1", user_id: "user-1", name: "Mac", platform: "macos", cli_version: "0.0.5", status: "active", last_seen_at: null, created_at: "2026-01-01T00:00:00Z" }],
      syncSessions: [sync("active", "watching"), sync("paused", "paused"), sync("conflict", "watching", "conflict"), sync("failed", "failed")]
    });
    renderConsole(<SyncPage {...props} />);
    fireEvent.submit(screen.getByLabelText("Display name").closest("form")!);
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/workspaces", expect.objectContaining({ method: "POST" })));
    fireEvent.submit(screen.getByLabelText("Mode").closest("form")!);
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/sync-sessions", expect.objectContaining({ method: "POST" })));

    for (const [name, path] of [["Pause", "/sync-sessions/active/pause"], ["Resume", "/sync-sessions/paused/resume"], ["Resolve", "/sync-sessions/conflict/resolve"]] as const) {
      fireEvent.click(screen.getAllByRole("button", { name })[0]);
      await waitFor(() => expect(requestMock).toHaveBeenCalledWith(path, expect.objectContaining({ method: "POST" })));
    }
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/sync-sessions/failed/reset", expect.objectContaining({ method: "POST" })));

    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/workspaces/workspace-1", { method: "DELETE" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[1]);
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/sync-sessions/failed", { method: "DELETE" }));
  });

  it("connects, stops, deletes, and creates browser sessions", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    const { props, requestMock } = makeConsoleProps({ browserSessions: [browser], accounts: [account] });
    requestMock.mockImplementation(async (path) => path.endsWith("connect-info")
      ? { data: { embed_url: "/browser/embed/token" } }
      : undefined);
    renderConsole(<BrowserPage {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    await waitFor(() => expect(open).toHaveBeenCalledWith("http://localhost:8000/browser/embed/token", "_blank", "noopener,noreferrer"));

    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/browser-sessions/browser-1/stop", { method: "POST" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/browser-sessions/browser-1", { method: "DELETE" }));

    fireEvent.change(screen.getByLabelText("Account"), { target: { value: account.id } });
    fireEvent.submit(screen.getByLabelText("URL").closest("form")!);
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/browser-sessions", expect.objectContaining({ method: "POST" })));
    open.mockRestore();
  });
});

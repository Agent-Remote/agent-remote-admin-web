import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeConsoleProps, renderConsole } from "../../test/console";
import type { AuditLog } from "../../types";
import { AuditPage } from "./AuditPage";
import { OverviewPage } from "./OverviewPage";
import { SettingsPage } from "./SettingsPage";

const audit: AuditLog = {
  id: "audit-1",
  actor_user_id: "user-1",
  action: "session.created",
  target_type: "session",
  target_id: "session-1",
  details: { source: "web" },
  created_at: "2026-01-01T00:00:00Z"
};

describe("overview, audit, and settings pages", () => {
  it("shows role-appropriate overview metrics and recent activity", () => {
    const { props } = makeConsoleProps({ devices: [{
      id: "device-1", user_id: "user-1", name: "Mac", platform: "macos", cli_version: "0.0.5", status: "active",
      last_seen_at: null, created_at: "2026-01-01T00:00:00Z"
    }], auditLogs: [audit] });
    const view = renderConsole(
      <OverviewPage {...props} failedTasks={[]} isAdmin={false} />
    );
    expect(screen.getByText("Devices").previousElementSibling).toHaveTextContent("1");
    expect(screen.queryByText("Failed tasks")).not.toBeInTheDocument();
    expect(screen.getByText("session.created")).toBeInTheDocument();
    expect(screen.queryByText(/99\.98%/)).not.toBeInTheDocument();
    expect(screen.getByText("Health data unavailable")).toBeInTheDocument();
    expect(screen.getByText("1 recorded events")).toBeInTheDocument();

    view.unmount();
    renderConsole(<OverviewPage {...props} failedTasks={[]} isAdmin />);
    expect(screen.getByText("Failed tasks")).toBeInTheDocument();
    expect(screen.getAllByText("No data.")).toHaveLength(1);
  });

  it("renders audit empty and populated states", () => {
    const view = renderConsole(<AuditPage auditLogs={[]} />);
    expect(screen.getByText("No data.")).toBeInTheDocument();
    view.unmount();
    renderConsole(<AuditPage auditLogs={[audit]} />);
    expect(screen.getByText("session.created")).toBeInTheDocument();
    expect(screen.queryByText("No data.")).not.toBeInTheDocument();
  });

  it("does not claim node health from sessions and excludes terminal resources", () => {
    const { props } = makeConsoleProps({
      devices: [
        {
          id: "device-active", user_id: "user-1", name: "Mac", platform: "macos", cli_version: "0.0.5",
          status: "active", last_seen_at: null, created_at: "2026-01-01T00:00:00Z"
        },
        {
          id: "device-revoked", user_id: "user-1", name: "Old Mac", platform: "macos", cli_version: "0.0.4",
          status: "revoked", last_seen_at: null, created_at: "2025-01-01T00:00:00Z"
        }
      ],
      syncSessions: [{
        id: "sync-1", user_id: "user-1", workspace_id: "workspace-1", node_id: null,
        local_path: "/tmp/project", remote_path: "/workspace/project", status: "active",
        conflict_status: "clean", sync_mode: "two-way-resolved", sync_git: true, exclude: [],
        mutagen_session_id: null, remote_endpoint: null, prepare_task_id: null,
        created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z"
      }]
    });
    renderConsole(<OverviewPage {...props} failedTasks={[]} isAdmin={false} />);
    expect(screen.getByText("Health data unavailable")).toBeInTheDocument();
    expect(screen.queryByText(/Healthy nodes · 0\/0/)).not.toBeInTheDocument();
    expect(screen.getByText("2 active of 3 observed resources")).toBeInTheDocument();
  });

  it("updates profile and persists the selected locale", async () => {
    const { props, requestMock } = makeConsoleProps();
    renderConsole(<SettingsPage {...props} />);
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Ada Updated" } });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/users/me", {
      method: "PATCH",
      body: JSON.stringify({ display_name: "Ada Updated" })
    }));

    fireEvent.change(screen.getByLabelText("Language"), { target: { value: "zh-CN" } });
    expect(localStorage.getItem("agentRemoteLocale")).toBe("zh-CN");
    expect(screen.getByText("偏好设置")).toBeInTheDocument();
  });
});

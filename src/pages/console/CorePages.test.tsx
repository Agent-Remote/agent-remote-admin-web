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

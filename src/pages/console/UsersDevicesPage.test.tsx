import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeConsoleProps, renderConsole } from "../../test/console";
import type { ApiResponse, Device, DeviceControlPolicy, DeviceSession, User } from "../../types";
import { DevicesPage } from "./DevicesPage";
import { UsersPage } from "./UsersPage";

const user: User = {
  id: "user-2", username: "grace", display_name: "Grace", role: "user", status: "active",
  totp_enabled: false, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z"
};
const device: Device = {
  id: "device-1", user_id: "user-1", name: "Workstation", platform: "linux", cli_version: "0.0.5-fix.7", status: "active",
  last_seen_at: null, created_at: "2026-01-01T00:00:00Z"
};
const deviceSession: DeviceSession = {
  id: "control-1",
  user_id: "user-2",
  device_id: "device-1",
  tool_session_id: "tool-session-1",
  node_id: "node-1",
  platform: "macos",
  status: "active",
  generation: 3,
  lease_until: "2026-01-01T00:01:00Z",
  expires_at: "2026-01-01T01:00:00Z",
  lock_acquired_at: "2026-01-01T00:00:30Z",
  stopped_at: null,
  stop_reason: null,
  created_at: "2026-01-01T00:00:00Z"
};
const deviceControlPolicy: DeviceControlPolicy = {
  enabled: false,
  platform: "macos",
  protocol_version: 1,
  lease_seconds: 60,
  maximum_ttl_seconds: 3600,
  relay_maximum_frame_bytes: 1048576,
  relay_maximum_bytes_per_second: 8388608,
  relay_maximum_connection_seconds: 900,
  local_approval_required: true
};

describe("users and devices pages", () => {
  it("enforces user administration permission", () => {
    const { props } = makeConsoleProps({ users: [user] });
    renderConsole(<UsersPage {...props} isAdmin={false} />);
    expect(screen.getByText("Admin permission required.")).toBeInTheDocument();
    expect(screen.queryByText("Grace")).not.toBeInTheDocument();
  });

  it("creates and confirms disabling a user", async () => {
    const { props, requestMock } = makeConsoleProps({ users: [user] });
    renderConsole(<UsersPage {...props} isAdmin />);
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "new-user" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/users", expect.objectContaining({ method: "POST" })));

    fireEvent.click(screen.getByRole("button", { name: "Disable" }));
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Disable grace?");
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/users/user-2/disable", { method: "POST" }));
  });

  it("registers, rotates, revokes, and deletes a device", async () => {
    const { props, requestMock } = makeConsoleProps({ devices: [device] });
    requestMock.mockImplementation(async (path) => path === "/devices/register"
      ? { data: { device_token: { access_token: "register-token" } } } satisfies ApiResponse<{ device_token: { access_token: string } }>
      : path.endsWith("rotate-token")
        ? { data: { access_token: "rotated-token" } }
        : undefined);
    renderConsole(<DevicesPage {...props} />);
    expect(screen.getByText(/CLI 0\.0\.5-fix\.7/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Laptop" } });
    fireEvent.change(screen.getByLabelText("SSH public key"), { target: { value: "ssh-ed25519 AAA" } });
    fireEvent.submit(screen.getByLabelText("Name").closest("form")!);
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/devices/register", expect.objectContaining({ method: "POST" })));

    fireEvent.click(screen.getByRole("button", { name: "Rotate" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/devices/device-1/rotate-token", { method: "POST" }));
    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/devices/device-1/disable", { method: "POST" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/devices/device-1", { method: "DELETE" }));
  });

  it("shows session states and confirms an administrator force stop", async () => {
    const { props, requestMock } = makeConsoleProps({
      devices: [device],
      deviceSessions: [deviceSession],
      users: [user],
      me: { ...user, id: "admin-1", role: "admin", display_name: "Admin" }
    });
    renderConsole(<DevicesPage {...props} />);

    expect(screen.getByText("Device control sessions")).toBeInTheDocument();
    expect(screen.getByText(/Claude session tool-session-1/)).toBeInTheDocument();
    expect(screen.getByText(/Owner Grace/)).toBeInTheDocument();
    expect(screen.getByText(/Generation 3/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Force stop" }));
    expect(await screen.findByRole("alertdialog")).toHaveTextContent(
      "The current lease and machine lock will be revoked."
    );
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith(
      "/device-sessions/control-1/stop",
      { method: "POST", body: JSON.stringify({ reason: "user_stop" }) }
    ));
  });

  it("deletes ended device sessions and supports bulk cleanup", async () => {
    const endedSession = { ...deviceSession, status: "stopped" as const, stopped_at: "2026-01-01T00:02:00Z" };
    const { props, requestMock } = makeConsoleProps({
      devices: [device],
      deviceSessions: [endedSession],
      users: [user]
    });
    renderConsole(<DevicesPage {...props} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[1]);
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Delete the ended device control session");
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/device-sessions/control-1", { method: "DELETE" }));

    fireEvent.click(screen.getByRole("button", { name: "Clear ended sessions" }));
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("Delete these 1 ended device control sessions");
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/device-sessions", { method: "DELETE" }));
  });

  it("renders device-session loading and error states", () => {
    const { props } = makeConsoleProps({
      deviceSessionsLoading: true,
      deviceSessionsError: true
    });
    renderConsole(<DevicesPage {...props} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading device control sessions");
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load device control sessions");
  });

  it("shows the read-only deployment policy only to administrators", () => {
    const administrator = makeConsoleProps({
      deviceControlPolicy,
      me: { ...user, role: "admin" }
    });
    renderConsole(<DevicesPage {...administrator.props} />);
    expect(screen.getByText("Device control deployment policy")).toBeInTheDocument();
    expect(screen.getByText("macos / v1")).toBeInTheDocument();
    expect(screen.getByText("1048576 bytes")).toBeInTheDocument();
    expect(screen.getByText("8388608 bytes/second")).toBeInTheDocument();
    expect(screen.getByText("Maximum relay connection lifetime")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /enable/i })).not.toBeInTheDocument();

    const regularUser = makeConsoleProps({ deviceControlPolicy });
    renderConsole(<DevicesPage {...regularUser.props} />);
    expect(screen.getAllByText("Device control deployment policy")).toHaveLength(1);
  });

  it("renders deployment-policy loading and error states for administrators", () => {
    const { props } = makeConsoleProps({
      deviceControlPolicyLoading: true,
      deviceControlPolicyError: true,
      me: { ...user, role: "admin" }
    });
    renderConsole(<DevicesPage {...props} />);
    expect(screen.getByText("Loading device control policy…")).toHaveAttribute("role", "status");
    expect(screen.getByText("Unable to load device control policy.")).toHaveAttribute("role", "alert");
  });
});

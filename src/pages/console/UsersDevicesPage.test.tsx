import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeConsoleProps, renderConsole } from "../../test/console";
import type { ApiResponse, Device, User } from "../../types";
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
});

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeConsoleProps, renderConsole } from "../../test/console";
import type { PortForward } from "../../types";
import { PortForwardsPage } from "./PortForwardsPage";

const forward: PortForward = {
  id: "forward-1",
  user_id: "user-1",
  device_id: "device-1",
  session_id: "session-1234567890",
  node_id: "node-1",
  remote_port: 5173,
  requested_local_port: 4173,
  client_instance_id: "client-1",
  status: "active",
  bytes_up: 1024,
  bytes_down: 2 * 1024 * 1024,
  connection_count: 4,
  last_connected_at: "2026-07-30T00:00:00Z",
  lease_expires_at: "2026-07-30T00:01:00Z",
  expires_at: "2026-07-30T08:00:00Z",
  stopped_at: null,
  stop_reason: null,
  created_at: "2026-07-30T00:00:00Z",
  updated_at: "2026-07-30T00:00:00Z"
};

describe("PortForwardsPage", () => {
  it("renders loading, error, and empty states", async () => {
    const loading = makeConsoleProps({ portForwardsLoading: true });
    const view = renderConsole(<PortForwardsPage {...loading.props} isAdmin={false} />);
    expect(screen.getByText("Loading session port forwards…")).toBeInTheDocument();
    view.unmount();

    const loadAll = vi.fn().mockResolvedValue(undefined);
    const failed = makeConsoleProps({ loadAll, portForwardsError: true });
    const failedView = renderConsole(<PortForwardsPage {...failed.props} isAdmin={false} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load session port forwards.");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(loadAll).toHaveBeenCalled());
    failedView.unmount();

    const empty = makeConsoleProps();
    renderConsole(<PortForwardsPage {...empty.props} isAdmin={false} />);
    expect(screen.getByText("No session port forwards.")).toBeInTheDocument();
  });

  it("renders refreshing terminal metadata without a stop action", () => {
    const { props } = makeConsoleProps({
      portForwards: [{ ...forward, status: "revoked", stop_reason: "device_revoked" }],
      portForwardsRefreshing: true
    });
    renderConsole(<PortForwardsPage {...props} isAdmin />);
    expect(screen.getByRole("status")).toHaveTextContent("Syncing");
    expect(screen.getByText(/Owner user-1/)).toBeInTheDocument();
    expect(screen.getByText(/Node node-1/)).toBeInTheDocument();
    expect(screen.getByText(/Reason device_revoked/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Stop" })).not.toBeInTheDocument();
  });

  it("shows admin ownership and confirms before stopping an active forward", async () => {
    const { props, requestMock } = makeConsoleProps({
      me: { ...makeConsoleProps().props.me, role: "admin" },
      portForwards: [forward],
      users: [{ ...makeConsoleProps().props.me, display_name: "Ada", role: "admin" }]
    });
    requestMock.mockResolvedValue({ data: { ...forward, status: "stopped" } });
    renderConsole(<PortForwardsPage {...props} isAdmin />);

    expect(screen.getByText("localhost:4173 → session:5173")).toBeInTheDocument();
    expect(screen.getByText("Owner Ada")).toBeInTheDocument();
    expect(screen.getByText("↑ 1.0 KiB · ↓ 2.0 MiB")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(requestMock).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith("/port-forwards/forward-1", { method: "DELETE" })
    );
  });
});

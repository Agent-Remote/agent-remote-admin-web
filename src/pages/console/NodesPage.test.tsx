import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeConsoleProps, renderConsole } from "../../test/console";
import type { NodeItem } from "../../types";
import { NodesPage } from "./NodesPage";

const node: NodeItem = {
  id: "node-1", name: "US Node", status: "active", region_code: "US", tags: ["gpu"], weight: 100,
  wireguard_ip: "10.0.0.2", wireguard_public_key: null, wireguard_endpoint: null, ssh_host: "node.local",
  ssh_port: 22, ssh_user: "agent-remote", supported_tool_types: ["claude"],
  allowed_runtime_backends: ["docker_sandbox"], default_runtime_backend: "docker_sandbox",
  runtime_policy: { cpu_quota_percent: 200, network_allowlist: ["10.0.0.0/8"] },
  runtime_capabilities: { backends: ["docker_sandbox"] }, last_heartbeat_at: null, version: "1.0.0",
  created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z"
};

describe("NodesPage", () => {
  it("blocks non-admin users", () => {
    const { props } = makeConsoleProps({ nodes: [node] });
    renderConsole(<NodesPage {...props} isAdmin={false} />);
    expect(screen.getByText("Admin permission required.")).toBeInTheDocument();
    expect(screen.queryByText("US Node")).not.toBeInTheDocument();
  });

  it("updates runtime policy and performs node lifecycle actions", async () => {
    const { props, requestMock } = makeConsoleProps({ nodes: [node] });
    requestMock.mockImplementation(async (path) => path.endsWith("registration-token") || path === "/nodes"
      ? { data: { node, registration_token: "registration-secret" } }
      : undefined);
    renderConsole(<NodesPage {...props} isAdmin />);

    fireEvent.click(screen.getByText("Edit runtime policy"));
    fireEvent.change(screen.getAllByLabelText("CPU quota (%)")[0], { target: { value: "250" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/nodes/node-1", expect.objectContaining({ method: "PATCH" })));

    fireEvent.click(screen.getByRole("button", { name: "Maintain" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/nodes/node-1/maintenance", { method: "POST" }));
    fireEvent.click(screen.getByRole("button", { name: "New registration token" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/nodes/node-1/registration-token", { method: "POST" }));
    expect(props.setNotice).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("registration-secret") }));

    fireEvent.click(screen.getByRole("button", { name: "Disable" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/nodes/node-1/disable", { method: "POST" }));

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "EU Node" } });
    fireEvent.submit(screen.getByLabelText("Name").closest("form")!);
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/nodes", expect.objectContaining({ method: "POST" })));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/nodes/node-1", { method: "DELETE" }));
  });
});

import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeConsoleProps, renderConsole } from "../../test/console";
import type {
  EgoBrowserBinding,
  EgoBrowserDevice,
  EgoBrowserLifecycleStatus,
  EgoBrowserRequest,
  NodeItem,
  ToolSession,
  User
} from "../../types";
import { EgoBrowserPage } from "./EgoBrowserPage";

const owner: User = {
  id: "user-1",
  username: "ada",
  display_name: "Ada Lovelace",
  role: "user",
  status: "active",
  totp_enabled: false,
  created_at: "2026-09-06T00:00:00Z",
  updated_at: "2026-09-06T00:00:00Z"
};

const device: EgoBrowserDevice = {
  id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  user_id: owner.id,
  public_key: "public",
  encryption_public_key: "encryption",
  generation: 2,
  status: "active",
  platform: "macos",
  release_profile: "community-local-trust",
  signer_certificate_sha256: "sha256",
  credential_profile: "community_file",
  bridge_protocol_version: "ego-browser-bridge-v1",
  bridge_version: "0.1.0",
  local_ego_browser_runtime_version: "0.4.7.4",
  ego_lite_runtime_version: "150.0.7871.101",
  skill_version: "1.2.3",
  capabilities: ["ego_browser_script_execute_v1"],
  allowlist_revision: 7,
  allowlist_roots_digest: null,
  learning_bundle_digest: null,
  last_seen_at: "2026-09-06T00:00:00Z",
  created_at: "2026-09-06T00:00:00Z",
  updated_at: "2026-09-06T00:00:00Z"
};

const toolSession: ToolSession = {
  id: "11111111-2222-3333-4444-555555555555",
  tool_type: "claude",
  user_id: owner.id,
  tool_account_id: "account-1",
  workspace_id: "workspace-1",
  node_id: "node-1",
  project_key: "release-audit",
  status: "running",
  tmux_session_name: "session",
  container_id: null,
  runtime_backend: "native",
  runtime_resource_id: "runtime-1",
  replaces_session_id: null,
  create_task_id: null,
  stop_task_id: null,
  created_at: "2026-09-06T00:00:00Z",
  updated_at: "2026-09-06T00:00:00Z"
};

const binding: EgoBrowserBinding = {
  id: "99999999-8888-7777-6666-555555555555",
  user_id: owner.id,
  ego_browser_device_id: device.id,
  tool_session_id: toolSession.id,
  node_id: toolSession.node_id,
  status: "active",
  control_channel: "ego_browser_bridge",
  relay_binding_kind: "ego_browser",
  authorization_mode: "ego_browser_script_full_trust",
  authorization_policy_version: 1,
  authorized_at: "2026-09-06T00:00:00Z",
  release_profile: "community-local-trust",
  signer_certificate_sha256: "sha256",
  credential_profile: "community_file",
  remote_platform: "linux",
  local_platform: "macos",
  local_runtime_version: "0.4.7.4",
  ego_lite_runtime_version: "150.0.7871.101",
  skill_version: "1.2.3",
  bridge_protocol_version: "ego-browser-bridge-v1",
  task_space_label: "agent-remote:session",
  allowlist_revision: 7,
  allowlist_roots_digest: null,
  learning_bundle_digest: null,
  concurrency_mode: "task_space_tab",
  max_parallel_requests: 4,
  capabilities: ["ego_browser_script_execute_v1"],
  lease_until: "2026-09-06T00:01:00Z",
  lease_health: "healthy",
  lease_grace_until: null,
  lease_renew_interval_seconds: 20,
  lease_renew_failure_grace_seconds: 10,
  absolute_ttl_until: "2026-09-06T08:00:00Z",
  generation: 3,
  connected_at: "2026-09-06T00:00:01Z",
  stopped_at: null,
  stop_reason: null,
  revoked_at: null,
  created_at: "2026-09-06T00:00:00Z",
  updated_at: "2026-09-06T00:00:01Z"
};

const activeRequest: EgoBrowserRequest = {
  id: "22222222-3333-4444-8555-666666666666",
  binding_id: binding.id,
  generation: binding.generation,
  request_id: "request/123",
  sequence: 19,
  message_type: "execute",
  payload_bytes: 321,
  status: "accepted",
  created_at: "2026-09-06T00:00:02Z"
};

const liveBinding: EgoBrowserBinding = {
  ...binding,
  lease_until: "2099-01-01T00:00:00Z",
  absolute_ttl_until: "2099-01-02T00:00:00Z"
};

const lifecycleStatus: EgoBrowserLifecycleStatus = {
  state: {
    installed: null,
    enabled: null,
    registered: true,
    available: null,
    connected: null
  },
  scope: "current_user",
  local_observation: "unknown",
  stale: false,
  checked_at: "2026-09-06T00:00:02Z"
};

const node: NodeItem = {
  id: "node-1",
  name: "US Node",
  status: "active",
  region_code: "US",
  tags: ["gpu"],
  weight: 100,
  wireguard_ip: "10.0.0.2",
  wireguard_public_key: null,
  wireguard_endpoint: null,
  ssh_host: "node.local",
  ssh_port: 22,
  ssh_user: "agent-remote",
  supported_tool_types: ["claude"],
  allowed_runtime_backends: ["docker_sandbox"],
  default_runtime_backend: "docker_sandbox",
  runtime_policy: {},
  runtime_capabilities: {},
  ego_browser_enabled: true,
  configured_enabled: true,
  effective_enabled: true,
  node_execution_allowed: true,
  last_heartbeat_at: null,
  version: "1.0.0",
  created_at: "2026-09-06T00:00:00Z",
  updated_at: "2026-09-06T00:00:00Z"
};

describe("ego-browser page", () => {
  it("lets administrators issue and revoke Node join codes, but hides them from users", async () => {
    const admin = makeConsoleProps({ me: { ...owner, role: "admin" }, nodes: [node] });
    admin.requestMock.mockImplementation(async (path) =>
      path === "/nodes/node-1/join-code"
        ? {
            data: {
              node_id: node.id,
              code: "join-code-123",
              expires_at: "2099-01-01T00:00:00Z",
              ego_browser_enabled: true
            }
          }
        : undefined
    );
    const adminView = renderConsole(<EgoBrowserPage {...admin.props} />);

    expect(screen.getByRole("heading", { name: "Node join codes" })).toBeVisible();
    const enableIntent = screen.getByRole("checkbox", {
      name: "Enable ego-browser for this enrollment"
    });
    expect(enableIntent).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Generate join code" }));
    await waitFor(() =>
      expect(admin.requestMock).toHaveBeenCalledWith("/nodes/node-1/join-code", {
        method: "POST",
        body: JSON.stringify({ expires_in_seconds: 900, ego_browser_enabled: false })
      })
    );
    expect(screen.getByLabelText("One-time Node join code")).toHaveTextContent("join-code-123");

    fireEvent.click(enableIntent);
    fireEvent.click(screen.getByRole("button", { name: "Replace join code" }));
    await waitFor(() =>
      expect(admin.requestMock).toHaveBeenLastCalledWith("/nodes/node-1/join-code", {
        method: "POST",
        body: JSON.stringify({ expires_in_seconds: 900, ego_browser_enabled: true })
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Revoke join code" }));
    await waitFor(() =>
      expect(admin.requestMock).toHaveBeenCalledWith("/nodes/node-1/join-code/revoke", {
        method: "POST"
      })
    );
    adminView.unmount();

    const user = makeConsoleProps({ nodes: [node] });
    renderConsole(<EgoBrowserPage {...user.props} />);
    expect(screen.queryByRole("heading", { name: "Node join codes" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Generate join code" })).not.toBeInTheDocument();
  });

  it("keeps setup, connect, resume, and full-trust authorization local-only", () => {
    const { props, requestMock } = makeConsoleProps({
      egoBrowserBindings: [binding],
      egoBrowserDevices: [device],
      me: { ...owner, role: "admin" },
      nodes: [node],
      toolSessions: [toolSession],
      users: [owner]
    });
    renderConsole(<EgoBrowserPage {...props} />);

    expect(screen.getByText(/Setup and ensure, connect, resume/)).toHaveTextContent(
      "must be completed by the same macOS user in the local agent-remote CLI"
    );
    for (const name of ["Setup", "Ensure", "Connect", "Resume", "Authorize full trust"]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("separates active Server bindings from disabled execution admission", () => {
    const { props } = makeConsoleProps({
      egoBrowserBindings: [binding],
      egoBrowserDevices: [device],
      egoBrowserStatus: {
        ...lifecycleStatus,
        state: { ...lifecycleStatus.state, available: false, connected: false }
      },
      egoBrowserPolicy: {
        enabled: true,
        enrollment_enabled: true,
        execution_admission: false
      }
    });
    renderConsole(<EgoBrowserPage {...props} />);

    const summary = screen.getByRole("region", { name: "Server state" });
    expect(within(summary).getByText("Active bindings").parentElement).toHaveTextContent("1");
    expect(within(summary).getByText("Server execution: disabled")).toBeVisible();
    expect(within(summary).queryByText("Connected")).not.toBeInTheDocument();
    expect(within(summary).getByText("Not reported")).toBeVisible();
  });

  it("shows healthy Server records without claiming local readiness", () => {
    const { props } = makeConsoleProps({
      egoBrowserBindings: [liveBinding],
      egoBrowserDevices: [device, { ...device, id: "revoked-device", status: "revoked" }],
      egoBrowserPolicy: {
        enabled: true,
        enrollment_enabled: true,
        execution_admission: true
      },
      egoBrowserStatus: lifecycleStatus
    });
    renderConsole(<EgoBrowserPage {...props} />);

    const summary = screen.getByRole("region", { name: "Server state" });
    for (const label of ["Registered devices", "Active bindings", "Healthy leases"]) {
      expect(within(summary).getByText(label).parentElement).toHaveTextContent("1");
    }
    expect(within(summary).queryByText("unknown")).not.toBeInTheDocument();
    expect(within(summary).getByText("Not reported")).toBeVisible();
    expect(within(summary).getByText("agent-remote ego-browser status")).toBeVisible();
    expect(within(summary).getByText(/Your devices and bindings/)).toBeVisible();
  });

  it.each([
    { status: "paused" },
    { lease_health: "expired" },
    { lease_until: "2000-01-01T00:00:00Z" },
    { lease_until: null },
    { absolute_ttl_until: "2000-01-02T00:00:00Z" }
  ] satisfies Partial<EgoBrowserBinding>[])("excludes inactive or expired leases: %j", (overrides) => {
    const { props } = makeConsoleProps({ egoBrowserBindings: [{ ...liveBinding, ...overrides }] });
    renderConsole(<EgoBrowserPage {...props} />);
    const summary = screen.getByRole("region", { name: "Server state" });
    expect(within(summary).getByText("Healthy leases").parentElement).toHaveTextContent("0");
  });

  it.each([
    { egoBrowserLoading: true, expected: "checking" },
    { egoBrowserError: true, expected: "unavailable" }
  ])("does not render missing or failed Server data as zero: %j", ({ expected, ...state }) => {
    const { props } = makeConsoleProps(state);
    renderConsole(<EgoBrowserPage {...props} />);
    const summary = screen.getByRole("region", { name: "Server state" });
    for (const label of ["Registered devices", "Active bindings", "Healthy leases"]) {
      expect(within(summary).getByText(label).parentElement).toHaveTextContent(expected);
    }
    expect(within(summary).getByText("Server execution: unavailable")).toBeVisible();
  });

  it("localizes the Server summary and unreported local state for administrators", () => {
    const { props } = makeConsoleProps({ me: { ...owner, role: "admin" } });
    renderConsole(<EgoBrowserPage {...props} />, "zh-CN");
    const summary = screen.getByRole("region", { name: "服务器状态" });
    expect(within(summary).getByText(/全部用户/)).toBeVisible();
    expect(within(summary).getByText("有效登记设备").parentElement).toHaveTextContent("0");
    expect(within(summary).getByText("未上报")).toBeVisible();
    expect(within(summary).queryByText("unknown")).not.toBeInTheDocument();
  });

  it("shows full-trust state and confirms administrator stop and revoke controls", async () => {
    const { props, requestMock } = makeConsoleProps({
      egoBrowserBindings: [binding],
      egoBrowserDevices: [device],
      me: { ...owner, role: "admin" },
      toolSessions: [toolSession],
      users: [owner]
    });
    renderConsole(<EgoBrowserPage {...props} />);

    expect(screen.getByRole("heading", { name: "Full-trust local execution" })).toBeVisible();
    expect(screen.getByText(/The selected remote fclaude session/)).toHaveTextContent(
      "without an App Sandbox"
    );
    expect(screen.getByText(/not Apple notarized/)).toBeVisible();
    expect(screen.getByText(/Runtime 0.4.7.4/)).toBeVisible();
    expect(screen.getByText(/Protocol ego-browser-bridge-v1/)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(
        `/ego-browser/bindings/${binding.id}/stop`,
        {
          method: "POST",
          body: JSON.stringify({ binding_generation: 3, generation: 3, reason: "admin_stop" })
        }
      )
    );

    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(
        `/ego-browser/bindings/${binding.id}/revoke`,
        {
          method: "POST",
          body: JSON.stringify({ binding_generation: 3, generation: 3, reason: "admin_revoke" })
        }
      )
    );
  });

  it("renders loading, error, and empty states", () => {
    const loading = makeConsoleProps({ egoBrowserLoading: true });
    const loadingView = renderConsole(<EgoBrowserPage {...loading.props} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading local ego-browser state");
    loadingView.unmount();

    const failed = makeConsoleProps({ egoBrowserError: true });
    const failedView = renderConsole(<EgoBrowserPage {...failed.props} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to load local ego-browser state"
    );
    failedView.unmount();

    const empty = makeConsoleProps();
    renderConsole(<EgoBrowserPage {...empty.props} />);
    expect(screen.getByText("No independent ego-browser Device Client is registered.")).toBeVisible();
    expect(screen.getByText("No ego-browser bindings are visible.")).toBeVisible();
  });

  it("retries a failed load and reports background refresh without exposing content", () => {
    const loadAll = vi.fn(async () => undefined);
    const failed = makeConsoleProps({
      egoBrowserError: true,
      loadAll
    });
    const failedView = renderConsole(<EgoBrowserPage {...failed.props} />);

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(loadAll).toHaveBeenCalledOnce();
    failedView.unmount();

    const refreshing = makeConsoleProps({
      egoBrowserError: true,
      egoBrowserRefreshing: true
    });
    renderConsole(<EgoBrowserPage {...refreshing.props} />);
    const retry = screen.getByRole("button", { name: "Retry" });
    expect(retry).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Refreshing local ego-browser state"
    );
    expect(screen.queryByText(/public|encryption/)).not.toBeInTheDocument();
  });

  it("cancels destructive confirmation without submitting a mutation", async () => {
    const { props, requestMock, runAction } = makeConsoleProps({
      egoBrowserBindings: [binding],
      egoBrowserDevices: [device],
      toolSessions: [toolSession],
      users: [owner]
    });
    renderConsole(<EgoBrowserPage {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByText("Cancel"));
    expect(requestMock).not.toHaveBeenCalled();
    expect(runAction).not.toHaveBeenCalled();
  });

  it("uses user lifecycle reasons and prevents duplicate or terminal actions", async () => {
    const active = makeConsoleProps({
      egoBrowserBindings: [binding],
      egoBrowserDevices: [device],
      toolSessions: [toolSession],
      users: [owner]
    });
    const view = renderConsole(<EgoBrowserPage {...active.props} />);

    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(active.requestMock).toHaveBeenCalledWith(
        `/ego-browser/bindings/${binding.id}/stop`,
        {
          method: "POST",
          body: JSON.stringify({ binding_generation: 3, generation: 3, reason: "user_stop" })
        }
      )
    );
    view.unmount();

    const busy = makeConsoleProps({
      busy: true,
      egoBrowserBindings: [binding],
      egoBrowserDevices: [device]
    });
    const busyView = renderConsole(<EgoBrowserPage {...busy.props} />);
    expect(screen.getByRole("button", { name: "Stop" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Revoke" })).toBeDisabled();
    busyView.unmount();

    const terminal = makeConsoleProps({
      egoBrowserBindings: [{ ...binding, status: "stopped" }],
      egoBrowserDevices: [device]
    });
    renderConsole(<EgoBrowserPage {...terminal.props} />);
    expect(screen.getByRole("button", { name: "Stop" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Revoke" })).toBeEnabled();
  });

  it("confirms device revoke and terminal resource deletion", async () => {
    const revoke = makeConsoleProps({
      egoBrowserDevices: [device],
      users: [owner]
    });
    const revokeView = renderConsole(<EgoBrowserPage {...revoke.props} />);

    fireEvent.click(screen.getByRole("button", { name: "Revoke device" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(revoke.requestMock).toHaveBeenCalledWith(
        `/ego-browser/devices/${device.id}/revoke`,
        {
          method: "POST",
          body: JSON.stringify({ device_generation: 2, generation: 2, reason: "user_revoke" })
        }
      )
    );
    revokeView.unmount();

    const revokedDevice = { ...device, status: "revoked" };
    const terminalBinding = { ...binding, status: "stopped" };
    const deletion = makeConsoleProps({
      egoBrowserBindings: [terminalBinding],
      egoBrowserDevices: [revokedDevice],
      toolSessions: [toolSession],
      users: [owner]
    });
    renderConsole(<EgoBrowserPage {...deletion.props} />);

    const bindingRow = screen.getByText(/release-audit · 99999999/).closest(".resource-row");
    expect(bindingRow).not.toBeNull();
    fireEvent.click(within(bindingRow as HTMLElement).getByRole("button", { name: "Delete" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(deletion.requestMock).toHaveBeenCalledWith(
        `/ego-browser/bindings/${binding.id}`,
        { method: "DELETE" }
      )
    );
  });

  it("disables deletion until the server-side lifecycle prerequisites are met", () => {
    const active = makeConsoleProps({
      egoBrowserBindings: [binding],
      egoBrowserDevices: [device],
      toolSessions: [toolSession],
      users: [owner]
    });
    const activeView = renderConsole(<EgoBrowserPage {...active.props} />);
    const activeDeviceRow = screen.getByText(/Mac device aaaaaaaa/).closest(".resource-row");
    const activeBindingRow = screen.getByText(/release-audit · 99999999/).closest(".resource-row");
    expect(activeDeviceRow).not.toBeNull();
    expect(activeBindingRow).not.toBeNull();
    expect(within(activeDeviceRow as HTMLElement).getByRole("button", { name: "Delete" })).toBeDisabled();
    expect(within(activeBindingRow as HTMLElement).getByRole("button", { name: "Delete" })).toBeDisabled();
    activeView.unmount();

    const revokedWithHistory = makeConsoleProps({
      egoBrowserBindings: [{ ...binding, status: "stopped" }],
      egoBrowserDevices: [{ ...device, status: "revoked" }],
      toolSessions: [toolSession],
      users: [owner]
    });
    renderConsole(<EgoBrowserPage {...revokedWithHistory.props} />);
    const revokedDeviceRow = screen.getByText(/Mac device aaaaaaaa/).closest(".resource-row");
    expect(revokedDeviceRow).not.toBeNull();
    expect(within(revokedDeviceRow as HTMLElement).getByRole("button", { name: "Delete" })).toBeDisabled();
  });

  it("cancels device deletion without submitting a mutation", async () => {
    const { props, requestMock, runAction } = makeConsoleProps({
      egoBrowserDevices: [{ ...device, status: "revoked" }],
      users: [owner]
    });
    renderConsole(<EgoBrowserPage {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByText("Cancel"));
    expect(requestMock).not.toHaveBeenCalled();
    expect(runAction).not.toHaveBeenCalled();
  });

  it("confirms exact request cancellation and protects the pending action", async () => {
    let finishAction: () => void = () => undefined;
    const pendingAction = new Promise<void>((resolve) => {
      finishAction = resolve;
    });
    const runAction = vi.fn(async (action: () => Promise<void>) => {
      await action();
      await pendingAction;
    });
    const { props, requestMock } = makeConsoleProps({
      egoBrowserBindings: [binding],
      egoBrowserDevices: [device],
      egoBrowserRequestStates: {
        [binding.id]: {
          items: [activeRequest],
          loading: false,
          error: false,
          refreshing: false
        }
      },
      runAction,
      toolSessions: [toolSession],
      users: [owner]
    });
    renderConsole(<EgoBrowserPage {...props} />);

    expect(screen.getByText("Request request/123")).toBeVisible();
    expect(screen.getByText(/sequence 19/)).toHaveTextContent("321 B");
    const cancel = screen.getByRole("button", {
      name: "Cancel request request/123"
    });
    fireEvent.click(cancel);
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith(
        `/ego-browser/bindings/${binding.id}/requests/request%2F123/cancel`,
        {
          method: "POST",
          body: JSON.stringify({ binding_generation: binding.generation, generation: binding.generation, sequence: 19 })
        }
      )
    );
    expect(cancel).toBeDisabled();
    expect(runAction).toHaveBeenCalledOnce();

    finishAction();
    await waitFor(() => expect(cancel).toBeEnabled());
  });

  it("renders request loading, error, retry, and empty states per binding", () => {
    const loading = makeConsoleProps({
      egoBrowserBindings: [binding],
      egoBrowserRequestStates: {
        [binding.id]: {
          items: [],
          loading: true,
          error: false,
          refreshing: false
        }
      }
    });
    const loadingView = renderConsole(<EgoBrowserPage {...loading.props} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading active requests");
    loadingView.unmount();

    const loadAll = vi.fn(async () => undefined);
    const failed = makeConsoleProps({
      egoBrowserBindings: [binding],
      egoBrowserRequestStates: {
        [binding.id]: {
          items: [],
          loading: false,
          error: true,
          refreshing: false
        }
      },
      loadAll
    });
    const failedView = renderConsole(<EgoBrowserPage {...failed.props} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load active requests");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(loadAll).toHaveBeenCalledOnce();
    failedView.unmount();

    const empty = makeConsoleProps({
      egoBrowserBindings: [binding],
      egoBrowserRequestStates: {
        [binding.id]: {
          items: [],
          loading: false,
          error: false,
          refreshing: false
        }
      }
    });
    renderConsole(<EgoBrowserPage {...empty.props} />);
    expect(screen.getByText("No active requests.")).toBeVisible();
  });
});

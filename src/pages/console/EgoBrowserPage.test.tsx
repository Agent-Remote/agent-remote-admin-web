import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeConsoleProps, renderConsole } from "../../test/console";
import type {
  EgoBrowserBinding,
  EgoBrowserDevice,
  EgoBrowserRequest,
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

describe("ego-browser page", () => {
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
    expect(screen.getByText(/same macOS user/)).toHaveTextContent("without an App Sandbox");
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
          body: JSON.stringify({ generation: 3, reason: "admin_stop" })
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
          body: JSON.stringify({ generation: 3, reason: "admin_revoke" })
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
          body: JSON.stringify({ generation: 3, reason: "user_stop" })
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
          body: JSON.stringify({ generation: binding.generation, sequence: 19 })
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

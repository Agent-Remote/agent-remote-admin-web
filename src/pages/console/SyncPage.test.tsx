import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeConsoleProps, renderConsole } from "../../test/console";
import type { SyncSession } from "../../types";
import { SyncPage } from "./SyncPage";

const pausedSync: SyncSession = {
  id: "sync-1",
  user_id: "user-1",
  workspace_id: "workspace-1",
  node_id: "node-1",
  local_path: "/Users/rem/project",
  remote_path: "/var/lib/agent-remote/project",
  status: "paused",
  conflict_status: "none",
  sync_mode: "two_way",
  sync_git: true,
  exclude: [],
  mutagen_session_id: "mutagen-1",
  remote_endpoint: null,
  prepare_task_id: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z"
};

describe("sync page", () => {
  it("allows a paused sync session to be deleted", async () => {
    const { props, requestMock } = makeConsoleProps({ syncSessions: [pausedSync] });
    renderConsole(<SyncPage {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(requestMock).toHaveBeenCalledWith("/sync-sessions/sync-1", { method: "DELETE" })
    );
  });
});

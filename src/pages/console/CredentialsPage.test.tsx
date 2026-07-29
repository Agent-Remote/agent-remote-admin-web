import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmProvider } from "../../app/ConfirmProvider";
import { I18nProvider } from "../../i18n/I18nProvider";
import type { AppRequest, DeveloperCredentialProfile } from "../../types";
import { CredentialsPage } from "./CredentialsPage";
import type { ConsolePageProps } from "./types";

const profile: DeveloperCredentialProfile = {
  id: "profile-1",
  user_id: "user-1",
  display_name: "Work identity",
  status: "active",
  git_identity: { user_name: "Alice", user_email: "alice@example.com" },
  github_cli_mode: "remote_login",
  ssh_mode: "agent_forwarding",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z"
};

function renderPage() {
  localStorage.setItem("agentRemoteLocale", "en");
  const requestMock = vi.fn().mockResolvedValue({});
  const request: AppRequest = (path, options) => requestMock(path, options);
  const runAction = vi.fn(async (action: () => Promise<void>) => action());
  const props: ConsolePageProps = {
    accounts: [], apiBase: "http://localhost", auditLogs: [], browserSessions: [], busy: false,
    configImports: [], credentialProfiles: [profile], devices: [], loadAll: async () => undefined,
    logout: vi.fn(), me: { id: "user-1", username: "user", display_name: "User", role: "user", status: "active", totp_enabled: false, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
    nodes: [], nodeTasks: [], portForwards: [], portForwardsError: false,
    portForwardsLoading: false, portForwardsRefreshing: false,
    notice: null, page: "credentials", request, runAction,
    setNotice: vi.fn(), setPage: vi.fn(), syncing: false, syncError: null, lastSyncedAt: 0,
    syncSessions: [], toolSessions: [], users: [], workspaces: []
  };
  render(<I18nProvider><ConfirmProvider><CredentialsPage {...props} /></ConfirmProvider></I18nProvider>);
  return requestMock;
}

describe("CredentialsPage", () => {
  it("shows profiles and creates a typed developer credential profile", async () => {
    const request = renderPage();
    expect(screen.getByText("Work identity")).toBeInTheDocument();
    expect(screen.getByText(/Alice <alice@example.com>/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: "Personal" } });
    fireEvent.change(screen.getByLabelText("Git author name"), { target: { value: "Bob" } });
    fireEvent.change(screen.getByLabelText("Git author email"), { target: { value: "bob@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(request).toHaveBeenCalledWith(
      "/developer-credential-profiles",
      expect.objectContaining({ method: "POST" })
    ));
    const body = JSON.parse(request.mock.calls[0][1].body as string);
    expect(body).toMatchObject({
      display_name: "Personal",
      git_identity: { user_name: "Bob", user_email: "bob@example.com" },
      github_cli: { mode: "remote_login" },
      ssh: { mode: "agent_forwarding" }
    });
  });

  it("confirms before disabling a profile", async () => {
    const request = renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Disable" }));
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(request).toHaveBeenCalledWith(
      "/developer-credential-profiles/profile-1/disable",
      { method: "POST" }
    ));
  });
});

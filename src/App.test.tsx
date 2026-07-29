import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

vi.mock("./hooks/useConsoleData", () => ({
  useConsoleData: () => ({
    error: new Error("sync failed"),
    lastUpdatedAt: 0,
    refresh: vi.fn(async () => undefined),
    refreshing: false
  })
}));

vi.mock("./pages/CliApprovalPage", () => ({
  CliApprovalPage: () => <div>CLI approval route</div>
}));

vi.mock("./pages/Dashboard", () => ({
  Dashboard: ({ page, syncError }: { page: string; syncError: string | null }) => (
    <div>{`Dashboard ${page} ${syncError ?? ""}`}</div>
  )
}));

const user = {
  id: "user-1",
  username: "ada",
  display_name: "Ada",
  role: "admin",
  status: "active",
  totp_enabled: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z"
};

function renderApp(pathname: string) {
  window.history.replaceState({}, "", pathname);
  localStorage.setItem("agentRemoteLocale", "en");
  localStorage.setItem("agentRemoteToken", "access-token");
  vi.stubGlobal("fetch", vi.fn(async () => ({
    ok: true,
    json: async () => ({ data: user })
  })));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>
  );
}

describe("App routing", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders the dedicated CLI approval route", async () => {
    renderApp("/cli");
    expect(await screen.findByText("CLI approval route")).toBeInTheDocument();
  });

  it("normalizes an authenticated unknown route to overview", async () => {
    renderApp("/unknown");
    expect(await screen.findByText("Dashboard overview sync failed")).toBeInTheDocument();
    await waitFor(() => expect(window.location.pathname).toBe("/app/overview"));
  });
});

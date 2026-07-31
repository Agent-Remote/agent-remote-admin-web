import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "../api/client";
import type { Page } from "../types";
import { useConsoleData } from "./useConsoleData";

function setup(page: Page, isAdmin: boolean) {
  const list = vi.fn().mockResolvedValue([]);
  const request = vi.fn().mockResolvedValue({ data: {} });
  const client = { list, request } as unknown as ApiClient;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  renderHook(() => useConsoleData(client, true, page, isAdmin), { wrapper });
  return { list, request };
}

describe("useConsoleData", () => {
  it("loads only the dependencies required by the active page", async () => {
    const { list } = setup("sessions", true);
    await waitFor(() => expect(list).toHaveBeenCalledTimes(3));
    expect(list.mock.calls.map(([path]) => path).sort()).toEqual([
      "/sessions",
      "/tool-accounts",
      "/workspaces"
    ]);
  });

  it("does not request administrator resources for a regular user", async () => {
    const { list, request } = setup("overview", false);
    await waitFor(() => expect(list).toHaveBeenCalledTimes(7));
    const paths = list.mock.calls.map(([path]) => path);
    expect(paths).not.toContain("/users");
    expect(paths).not.toContain("/nodes");
    expect(paths).not.toContain("/nodes/tasks?limit=100");
    expect(request).not.toHaveBeenCalled();
  });

  it("loads credential profiles only on the credential page", async () => {
    const { list } = setup("credentials", false);
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
    expect(list).toHaveBeenCalledWith("/developer-credential-profiles");
  });

  it("loads safe import summaries with tool accounts", async () => {
    const { list } = setup("accounts", false);
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(list.mock.calls.map(([path]) => path).sort()).toEqual([
      "/tool-accounts",
      "/tool-accounts/config-imports/latest"
    ]);
  });

  it("loads personal and administrator port-forward scopes separately", async () => {
    const { list: personal } = setup("forwards", false);
    await waitFor(() => expect(personal).toHaveBeenCalledTimes(1));
    expect(personal).toHaveBeenCalledWith("/port-forwards");

    const { list: administrator } = setup("forwards", true);
    await waitFor(() => expect(administrator).toHaveBeenCalledTimes(3));
    expect(administrator.mock.calls.map(([path]) => path).sort()).toEqual([
      "/nodes",
      "/port-forwards?all_users=true",
      "/users"
    ]);
  });

  it("loads the deployment policy only for administrators on the devices page", async () => {
    const administrator = setup("devices", true);
    await waitFor(() => expect(administrator.request).toHaveBeenCalledTimes(1));
    expect(administrator.request).toHaveBeenCalledWith("/device-sessions/policy");
    expect(administrator.list.mock.calls.map(([path]) => path).sort()).toEqual([
      "/device-sessions?all_users=true",
      "/devices",
      "/users"
    ]);

    const regularUser = setup("devices", false);
    await waitFor(() => expect(regularUser.list).toHaveBeenCalledTimes(2));
    expect(regularUser.request).not.toHaveBeenCalled();
  });
});

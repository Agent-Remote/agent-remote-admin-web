import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "../api/client";
import type { Page } from "../types";
import { useConsoleData } from "./useConsoleData";

function setup(page: Page, isAdmin: boolean) {
  const list = vi.fn().mockResolvedValue([]);
  const client = { list } as unknown as ApiClient;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  renderHook(() => useConsoleData(client, true, page, isAdmin), { wrapper });
  return list;
}

describe("useConsoleData", () => {
  it("loads only the dependencies required by the active page", async () => {
    const list = setup("sessions", true);
    await waitFor(() => expect(list).toHaveBeenCalledTimes(3));
    expect(list.mock.calls.map(([path]) => path).sort()).toEqual([
      "/sessions",
      "/tool-accounts",
      "/workspaces"
    ]);
  });

  it("does not request administrator resources for a regular user", async () => {
    const list = setup("overview", false);
    await waitFor(() => expect(list).toHaveBeenCalledTimes(7));
    const paths = list.mock.calls.map(([path]) => path);
    expect(paths).not.toContain("/users");
    expect(paths).not.toContain("/nodes");
    expect(paths).not.toContain("/nodes/tasks?limit=100");
  });

  it("loads credential profiles only on the credential page", async () => {
    const list = setup("credentials", false);
    await waitFor(() => expect(list).toHaveBeenCalledTimes(1));
    expect(list).toHaveBeenCalledWith("/developer-credential-profiles");
  });

  it("loads safe import summaries with tool accounts", async () => {
    const list = setup("accounts", false);
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(list.mock.calls.map(([path]) => path).sort()).toEqual([
      "/tool-accounts",
      "/tool-accounts/config-imports/latest"
    ]);
  });
});

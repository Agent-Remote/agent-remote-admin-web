import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "../api/client";
import type { EgoBrowserBinding, Page } from "../types";
import { useConsoleData } from "./useConsoleData";

function setup(
  page: Page,
  isAdmin: boolean,
  responseFor?: (path: string) => unknown[]
) {
  const list = vi.fn(async (path: string) => responseFor?.(path) ?? []);
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
      "/sessions",
      "/users",
      "/workspaces"
    ]);

    const regularUser = setup("devices", false);
    await waitFor(() => expect(regularUser.list).toHaveBeenCalledTimes(4));
    expect(regularUser.list.mock.calls.map(([path]) => path).sort()).toEqual([
      "/device-sessions",
      "/devices",
      "/sessions",
      "/workspaces"
    ]);
    expect(regularUser.request).not.toHaveBeenCalled();
  });

  it("loads personal and administrator ego-browser scopes separately", async () => {
    const personal = setup("ego-browser", false);
    await waitFor(() => expect(personal.list).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(personal.request).toHaveBeenCalledTimes(2));
    expect(personal.list.mock.calls.map(([path]) => path).sort()).toEqual([
      "/ego-browser/bindings",
      "/ego-browser/devices",
      "/sessions"
    ]);
    expect(personal.request.mock.calls.map(([path]) => path).sort()).toEqual([
      "/ego-browser/policy",
      "/ego-browser/status"
    ]);

    const administrator = setup("ego-browser", true);
    await waitFor(() => expect(administrator.list).toHaveBeenCalledTimes(5));
    await waitFor(() => expect(administrator.request).toHaveBeenCalledTimes(2));
    expect(administrator.list.mock.calls.map(([path]) => path).sort()).toEqual([
      "/ego-browser/bindings?all_users=true",
      "/ego-browser/devices?all_users=true",
      "/nodes",
      "/sessions",
      "/users"
    ]);
    expect(administrator.request.mock.calls.map(([path]) => path).sort()).toEqual([
      "/ego-browser/policy",
      "/ego-browser/status?all_users=true"
    ]);
  });

  it("loads active requests through a binding-scoped query", async () => {
    const activeBinding = {
      id: "99999999-8888-7777-6666-555555555555",
      status: "active"
    } as EgoBrowserBinding;
    const { list } = setup("ego-browser", false, (path) =>
      path === "/ego-browser/bindings" ? [activeBinding] : []
    );

    await waitFor(() =>
      expect(list).toHaveBeenCalledWith(
        `/ego-browser/bindings/${activeBinding.id}/requests`
      )
    );
    expect(
      list.mock.calls.filter(([path]) => path.endsWith("/requests"))
    ).toHaveLength(1);
  });
});

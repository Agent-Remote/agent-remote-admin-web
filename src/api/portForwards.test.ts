import { describe, expect, it, vi } from "vitest";
import type { AppRequest, PortForward } from "../types";
import { listPortForwards, stopPortForward } from "./portForwards";

const forward = { id: "forward-1" } as PortForward;

describe("port forward API adapters", () => {
  it("selects personal and administrator list scopes", async () => {
    const request = vi.fn().mockResolvedValue({ data: { items: [forward] } }) as AppRequest;
    await expect(listPortForwards(request, false)).resolves.toEqual([forward]);
    await expect(listPortForwards(request, true)).resolves.toEqual([forward]);
    expect(request).toHaveBeenNthCalledWith(1, "/port-forwards");
    expect(request).toHaveBeenNthCalledWith(2, "/port-forwards?all_users=true");
  });

  it("stops exactly the selected forward", async () => {
    const request = vi.fn().mockResolvedValue({ data: forward }) as AppRequest;
    await expect(stopPortForward(request, "forward-1")).resolves.toBe(forward);
    expect(request).toHaveBeenCalledWith("/port-forwards/forward-1", { method: "DELETE" });
  });
});

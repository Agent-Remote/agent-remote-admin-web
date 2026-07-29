import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useBrowserPath } from "./browserPath";

describe("useBrowserPath", () => {
  beforeEach(() => window.history.replaceState({}, "", "/app/overview"));

  it("navigates with push and replace state", () => {
    const { result } = renderHook(() => useBrowserPath());

    act(() => result.current[1]("/app/nodes"));
    expect(result.current[0]).toBe("/app/nodes");
    expect(window.location.pathname).toBe("/app/nodes");

    act(() => result.current[1]("/app/sessions", true));
    expect(result.current[0]).toBe("/app/sessions");
    expect(window.location.pathname).toBe("/app/sessions");
  });

  it("tracks browser history events", () => {
    const { result } = renderHook(() => useBrowserPath());

    act(() => {
      window.history.replaceState({}, "", "/cli");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(result.current[0]).toBe("/cli");
  });
});

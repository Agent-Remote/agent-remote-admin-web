import { describe, expect, it } from "vitest";
import { getSyncSessionActions } from "./syncActions";

describe("getSyncSessionActions", () => {
  it("offers pause for an active clean session", () => {
    expect(getSyncSessionActions("active", "clean")).toEqual({
      canDelete: false,
      canPause: true,
      canReset: false,
      canResolve: false,
      canResume: false
    });
  });

  it("offers resume only while paused", () => {
    expect(getSyncSessionActions("paused", "none")).toMatchObject({
      canDelete: false,
      canPause: false,
      canResume: true
    });
  });

  it("offers recovery and deletion for a failed conflict", () => {
    expect(getSyncSessionActions("failed", "conflict")).toEqual({
      canDelete: true,
      canPause: false,
      canReset: true,
      canResolve: true,
      canResume: false
    });
  });
});

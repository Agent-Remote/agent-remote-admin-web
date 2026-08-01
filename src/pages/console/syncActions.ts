export function getSyncSessionActions(status: string, conflictStatus: string) {
  return {
    canDelete: status === "failed" || status === "paused",
    canPause: status !== "paused" && status !== "failed",
    canReset: status === "failed",
    canResolve: !["clean", "none"].includes(conflictStatus),
    canResume: status === "paused"
  };
}

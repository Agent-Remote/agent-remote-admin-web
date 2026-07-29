import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { ApiClient } from "../api/client";
import type {
  AuditLog,
  BrowserSession,
  DeveloperCredentialProfile,
  Device,
  NodeItem,
  NodeTask,
  SyncSession,
  ToolAccount,
  ToolAccountConfigImportStatus,
  ToolSession,
  User,
  Workspace,
  Page
} from "../types";

const EMPTY: never[] = [];

export function useConsoleData(
  client: ApiClient,
  enabled: boolean,
  page: Page | null,
  isAdmin: boolean
) {
  const queryClient = useQueryClient();
  const results = useQueries({
    queries: [
      resourceQuery<User>("users", () => client.list<User>("/users"), shouldLoad(enabled, page, "users", isAdmin), 60_000),
      resourceQuery<Device>("devices", () => client.list<Device>("/devices"), shouldLoad(enabled, page, "devices", isAdmin), 15_000),
      resourceQuery<ToolAccount>("accounts", () => client.list<ToolAccount>("/tool-accounts"), shouldLoad(enabled, page, "accounts", isAdmin), 30_000),
      resourceQuery<DeveloperCredentialProfile>("credential-profiles", () => client.list<DeveloperCredentialProfile>("/developer-credential-profiles"), shouldLoad(enabled, page, "credential-profiles", isAdmin), 30_000),
      resourceQuery<ToolAccountConfigImportStatus>("config-imports", () => client.list<ToolAccountConfigImportStatus>("/tool-accounts/config-imports/latest"), shouldLoad(enabled, page, "config-imports", isAdmin), 5_000),
      resourceQuery<NodeItem>("nodes", () => client.list<NodeItem>("/nodes"), shouldLoad(enabled, page, "nodes", isAdmin), 10_000),
      resourceQuery<Workspace>("workspaces", () => client.list<Workspace>("/workspaces"), shouldLoad(enabled, page, "workspaces", isAdmin), 30_000),
      resourceQuery<SyncSession>("sync-sessions", () => client.list<SyncSession>("/sync-sessions"), shouldLoad(enabled, page, "sync-sessions", isAdmin), 7_500),
      resourceQuery<ToolSession>("tool-sessions", () => client.list<ToolSession>("/sessions"), shouldLoad(enabled, page, "tool-sessions", isAdmin), 5_000),
      resourceQuery<BrowserSession>("browser-sessions", () => client.list<BrowserSession>("/browser-sessions"), shouldLoad(enabled, page, "browser-sessions", isAdmin), 5_000),
      resourceQuery<AuditLog>("audit-logs", () => client.list<AuditLog>("/audit-logs"), shouldLoad(enabled, page, "audit-logs", isAdmin), 20_000),
      resourceQuery<NodeTask>("node-tasks", () => client.list<NodeTask>("/nodes/tasks?limit=100"), shouldLoad(enabled, page, "node-tasks", isAdmin), 5_000)
    ]
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["console"], refetchType: "active" });
  }, [queryClient]);

  return {
    users: (results[0].data ?? EMPTY) as User[],
    devices: (results[1].data ?? EMPTY) as Device[],
    accounts: (results[2].data ?? EMPTY) as ToolAccount[],
    credentialProfiles: (results[3].data ?? EMPTY) as DeveloperCredentialProfile[],
    configImports: (results[4].data ?? EMPTY) as ToolAccountConfigImportStatus[],
    nodes: (results[5].data ?? EMPTY) as NodeItem[],
    workspaces: (results[6].data ?? EMPTY) as Workspace[],
    syncSessions: (results[7].data ?? EMPTY) as SyncSession[],
    toolSessions: (results[8].data ?? EMPTY) as ToolSession[],
    browserSessions: (results[9].data ?? EMPTY) as BrowserSession[],
    auditLogs: (results[10].data ?? EMPTY) as AuditLog[],
    nodeTasks: (results[11].data ?? EMPTY) as NodeTask[],
    refreshing: results.some((result) => result.isFetching),
    error: results.find((result) => result.error)?.error ?? null,
    lastUpdatedAt: Math.max(0, ...results.map((result) => result.dataUpdatedAt)),
    refresh
  };
}

type ResourceName =
  | "users"
  | "devices"
  | "accounts"
  | "credential-profiles"
  | "config-imports"
  | "nodes"
  | "workspaces"
  | "sync-sessions"
  | "tool-sessions"
  | "browser-sessions"
  | "audit-logs"
  | "node-tasks";

const pageResources: Record<Page, ResourceName[]> = {
  overview: ["users", "devices", "accounts", "nodes", "workspaces", "sync-sessions", "tool-sessions", "browser-sessions", "audit-logs", "node-tasks"],
  users: ["users"],
  devices: ["devices"],
  accounts: ["accounts", "config-imports"],
  credentials: ["credential-profiles"],
  nodes: ["nodes", "node-tasks"],
  sessions: ["tool-sessions", "accounts", "workspaces"],
  sync: ["workspaces", "sync-sessions", "devices", "nodes"],
  browser: ["browser-sessions", "accounts"],
  audit: ["audit-logs"],
  settings: []
};

function shouldLoad(
  enabled: boolean,
  page: Page | null,
  resource: ResourceName,
  isAdmin: boolean
) {
  const adminResources: ResourceName[] = ["users", "nodes", "node-tasks"];
  if (!isAdmin && adminResources.includes(resource)) return false;
  return enabled && page !== null && pageResources[page].includes(resource);
}

function resourceQuery<T>(
  name: string,
  loader: () => Promise<T[]>,
  enabled: boolean,
  refetchInterval: number
) {
  return {
    queryKey: ["console", name],
    queryFn: loader,
    enabled,
    refetchInterval,
    refetchIntervalInBackground: false,
    staleTime: Math.min(refetchInterval, 30_000)
  };
}

import type React from "react";
import type {
  AppRequest,
  AuditLog,
  BrowserSession,
  DeveloperCredentialProfile,
  Device,
  NodeItem,
  NodeTask,
  Notice,
  Page,
  PortForward,
  RunAction,
  SyncSession,
  ToolAccount,
  ToolAccountConfigImportStatus,
  ToolSession,
  User,
  Workspace
} from "../../types";

export type ConsolePageProps = {
  accounts: ToolAccount[];
  apiBase: string;
  auditLogs: AuditLog[];
  browserSessions: BrowserSession[];
  credentialProfiles: DeveloperCredentialProfile[];
  configImports: ToolAccountConfigImportStatus[];
  busy: boolean;
  devices: Device[];
  loadAll: () => Promise<void>;
  logout: () => void;
  me: User;
  nodes: NodeItem[];
  nodeTasks: NodeTask[];
  portForwards: PortForward[];
  portForwardsError: boolean;
  portForwardsLoading: boolean;
  portForwardsRefreshing: boolean;
  notice: Notice | null;
  page: Page;
  request: AppRequest;
  runAction: RunAction;
  syncing: boolean;
  syncError: string | null;
  lastSyncedAt: number;
  setNotice: React.Dispatch<React.SetStateAction<Notice | null>>;
  setPage: (page: Page) => void;
  syncSessions: SyncSession[];
  toolSessions: ToolSession[];
  users: User[];
  workspaces: Workspace[];
};

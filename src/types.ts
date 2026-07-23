export type UUID = string;

export type ApiResponse<T> = {
  data: T;
  request_id?: string;
};

export type ListData<T> = {
  items: T[];
  next_cursor?: string | null;
};

export type User = {
  id: UUID;
  username: string;
  display_name: string;
  role: string;
  status: string;
  totp_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type Device = {
  id: UUID;
  user_id: UUID;
  name: string;
  platform: string;
  status: string;
  last_seen_at: string | null;
  created_at: string;
};

export type ToolAccount = {
  id: UUID;
  user_id: UUID;
  tool_type: string;
  display_name: string;
  status: string;
  region_code: string;
  timezone: string;
  locale: string;
  preferred_node_tags: string[];
  affinity_node_id: UUID | null;
  runtime_backend: string | null;
  created_at: string;
  updated_at: string;
};

export type NodeItem = {
  id: UUID;
  name: string;
  status: string;
  region_code: string;
  tags: string[];
  weight: number;
  wireguard_ip: string | null;
  wireguard_public_key: string | null;
  wireguard_endpoint: string | null;
  ssh_host: string | null;
  ssh_port: number | null;
  ssh_user: string | null;
  supported_tool_types: string[];
  allowed_runtime_backends: string[];
  default_runtime_backend: string;
  runtime_policy: Record<string, unknown>;
  runtime_capabilities: Record<string, unknown>;
  last_heartbeat_at: string | null;
  version: string | null;
  created_at: string;
  updated_at: string;
};

export type Workspace = {
  id: UUID;
  user_id: UUID;
  device_id: UUID;
  project_key: string;
  local_start_path: string;
  display_name: string;
  remote_path: string | null;
  sync_git: boolean;
  git_sync_policy: {
    exclude_hooks: boolean;
    exclude_locks: boolean;
    require_clean_git_lock: boolean;
    warn_concurrent_git: boolean;
  };
  created_at: string;
  updated_at: string;
};

export type SyncSession = {
  id: UUID;
  user_id: UUID;
  workspace_id: UUID;
  node_id: UUID | null;
  local_path: string;
  remote_path: string;
  status: string;
  conflict_status: string;
  sync_mode: string;
  sync_git: boolean;
  exclude: string[];
  mutagen_session_id: string | null;
  remote_endpoint: string | null;
  prepare_task_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ToolSession = {
  id: UUID;
  tool_type: string;
  user_id: UUID;
  tool_account_id: UUID;
  workspace_id: UUID;
  node_id: UUID;
  project_key: string;
  status: string;
  tmux_session_name: string | null;
  container_id: string | null;
  runtime_backend: string;
  runtime_resource_id: string | null;
  replaces_session_id: UUID | null;
  create_task_id: string | null;
  stop_task_id: string | null;
  created_at: string;
  updated_at: string;
};

export type BrowserSession = {
  id: UUID;
  user_id: UUID;
  tool_account_id: UUID | null;
  node_id: UUID;
  status: string;
  region_code: string;
  timezone: string;
  locale: string;
  target_url: string | null;
  container_id: string | null;
  ttl_seconds: number;
  expires_at: string;
  stopped_at: string | null;
  create_task_id: string | null;
  stop_task_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: UUID;
  actor_user_id: UUID | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export type NodeTask = {
  id: UUID;
  task_id: string;
  node_id: UUID;
  task_type: string;
  status: string;
  payload: Record<string, unknown>;
  lease_until: string | null;
  retry_count: number;
  result: {
    status: string;
    result: Record<string, unknown> | null;
    error: Record<string, unknown> | null;
    started_at: string | null;
    finished_at: string | null;
    created_at: string;
  } | null;
  created_at: string;
  updated_at: string;
};

export type Page =
  | "overview"
  | "users"
  | "devices"
  | "accounts"
  | "nodes"
  | "sessions"
  | "sync"
  | "browser"
  | "audit"
  | "settings";

export type Notice = {
  kind: "info" | "error";
  message: string;
};

export type AppRequest = <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
export type RunAction = (action: () => Promise<void>, success?: string) => Promise<void>;

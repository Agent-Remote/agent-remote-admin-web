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
  cli_version: string | null;
  status: string;
  last_seen_at: string | null;
  created_at: string;
};

export type DeviceSession = {
  id: UUID;
  user_id: UUID;
  device_id: UUID;
  tool_session_id: UUID;
  node_id: UUID;
  platform: "macos";
  status: string;
  generation: number;
  authorization_mode: "per_application_approval" | "session_full_trust";
  authorization_policy_version: number;
  authorized_at: string | null;
  lease_until: string | null;
  expires_at: string;
  lock_acquired_at: string | null;
  stopped_at: string | null;
  stop_reason: string | null;
  created_at: string;
};

export type DeviceControlPolicy = {
  enabled: boolean;
  platform: "macos";
  protocol_version: number;
  lease_seconds: number;
  maximum_ttl_seconds: number;
  relay_maximum_frame_bytes: number;
  relay_maximum_bytes_per_second: number;
  relay_maximum_connection_seconds: number;
  authorization_mode: "per_application_approval" | "session_full_trust";
  authorization_policy_version: number;
  application_scope: "approved_applications" | "all_user_gui_applications";
  control_level: "approved_level" | "full_control";
  clipboard_scope: "per_application_approval" | "global_plain_text";
  application_launch: boolean;
};

export type EgoBrowserDevice = {
  id: UUID;
  user_id: UUID;
  public_key: string;
  encryption_public_key: string | null;
  generation: number;
  /** Explicit Device identity generation; generation is a wire-compat alias. */
  device_generation?: number;
  status: string;
  platform: "macos";
  release_profile:
    | "community-local-trust"
    | "development-local"
    | "developer-id"
    | "logic-test";
  signer_certificate_sha256: string;
  credential_profile: "community_file" | "keychain_access_group";
  bridge_protocol_version: string;
  bridge_version: string | null;
  local_ego_browser_runtime_version: string | null;
  ego_lite_runtime_version: string | null;
  skill_version: string | null;
  capabilities: string[];
  allowlist_revision: number;
  allowlist_roots_digest: string | null;
  learning_bundle_digest: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EgoBrowserBinding = {
  id: UUID;
  user_id: UUID;
  ego_browser_device_id: UUID;
  tool_session_id: UUID;
  node_id: UUID;
  status: string;
  control_channel: "ego_browser_bridge";
  relay_binding_kind: "ego_browser";
  authorization_mode: "ego_browser_script_full_trust";
  authorization_policy_version: number;
  authorized_at: string;
  release_profile:
    | "community-local-trust"
    | "development-local"
    | "developer-id"
    | "logic-test";
  signer_certificate_sha256: string;
  credential_profile: "community_file" | "keychain_access_group";
  remote_platform: "linux";
  local_platform: "macos";
  local_runtime_version: string | null;
  ego_lite_runtime_version: string | null;
  skill_version: string | null;
  bridge_protocol_version: string;
  task_space_label: string | null;
  allowlist_revision: number;
  allowlist_roots_digest: string | null;
  learning_bundle_digest: string | null;
  concurrency_mode: "task_space_tab" | "task_space" | "binding";
  max_parallel_requests: number;
  capabilities: string[];
  lease_until: string | null;
  lease_health: "healthy" | "renewal_grace" | "expired";
  lease_grace_until: string | null;
  lease_renew_interval_seconds: number;
  lease_renew_failure_grace_seconds: number;
  absolute_ttl_until: string;
  generation: number;
  /** Explicit binding lifecycle generation; generation is a wire-compat alias. */
  binding_generation?: number;
  connected_at: string | null;
  stopped_at: string | null;
  stop_reason: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EgoBrowserRequest = {
  id: UUID;
  binding_id: UUID;
  generation: number;
  binding_generation?: number;
  request_id: string;
  sequence: number;
  message_type: "execute";
  payload_bytes: number;
  status: "accepted" | "cancel_requested";
  created_at: string;
};

export type EgoBrowserRequestState = {
  items: EgoBrowserRequest[];
  loading: boolean;
  error: boolean;
  refreshing: boolean;
};

export type EgoBrowserPolicy = {
  enabled: boolean;
  enrollment_enabled: boolean;
  execution_admission: boolean;
  protocol?: string;
  authorization_mode?: string;
  authorization_policy_version?: number;
};

export type EgoBrowserMachineState = {
  installed: boolean | null;
  enabled: boolean | null;
  registered: boolean;
  available: boolean | null;
  connected: boolean | null;
};

export type EgoBrowserLifecycleStatus = {
  state: EgoBrowserMachineState;
  scope: "current_user" | "all_users";
  local_observation: "unknown";
  stale: boolean;
  checked_at: string;
};

export type NodeJoinCode = {
  node_id: UUID;
  code: string;
  expires_at: string;
  ego_browser_enabled: boolean | null;
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

export type DeveloperCredentialProfile = {
  id: UUID;
  user_id: UUID;
  display_name: string;
  status: string;
  git_identity: {
    user_name?: string;
    user_email?: string;
  };
  github_cli_mode: string;
  ssh_mode: string;
  created_at: string;
  updated_at: string;
};

export type ToolAccountConfigImportStatus = {
  tool_account_id: UUID;
  task_id: string;
  status: string;
  include_resume_history: boolean;
  requested_paths: string[];
  files_written: string[];
  file_count: number;
  error: string | null;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
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
  ego_browser_enabled?: boolean;
  configured_enabled?: boolean;
  effective_enabled?: boolean;
  node_execution_allowed?: boolean;
  enrollment_admission?: boolean;
  execution_admission?: boolean;
  last_heartbeat_at: string | null;
  version: string | null;
  created_at: string;
  updated_at: string;
};

export type PortForward = {
  id: UUID;
  user_id: UUID;
  device_id: UUID;
  session_id: UUID;
  node_id: UUID;
  remote_port: number;
  requested_local_port: number;
  client_instance_id: string;
  status: string;
  bytes_up: number;
  bytes_down: number;
  connection_count: number;
  last_connected_at: string | null;
  lease_expires_at: string | null;
  expires_at: string;
  stopped_at: string | null;
  stop_reason: string | null;
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
  | "credentials"
  | "nodes"
  | "forwards"
  | "sessions"
  | "sync"
  | "browser"
  | "ego-browser"
  | "audit"
  | "settings";

export type Notice = {
  kind: "info" | "error";
  message: string;
};

export type AppRequest = <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
export type RunAction = (action: () => Promise<void>, success?: string) => Promise<void>;

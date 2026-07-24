import {
  AlertTriangle,
  Ban,
  RotateCcw,
  Save,
  Server,
  Trash2,
  Wrench
} from "lucide-react";
import React from "react";
import {
  CheckLine,
  EmptyBlock,
  Field,
  PanelTitle,
  ResponsiveForm,
  ResourceRow,
  SelectField,
  StatusPill
} from "../../components/ui";
import { useConfirm } from "../../app/ConfirmProvider";
import { useI18n } from "../../i18n/I18nProvider";
import type {
  ApiResponse,
  NodeItem
} from "../../types";
import {
  formatDate,
  splitList,
  tagsText
} from "../../utils/format";
import { TaskRow } from "./ResourceDetails";
import type { ConsolePageProps } from "./types";
export function NodesPage({ nodes, nodeTasks, isAdmin, busy, request, runAction, setNotice }: ConsolePageProps & { isAdmin: boolean }) {
  const { t } = useI18n();
  const confirmAction = useConfirm();

  function showRegistrationCredentials(data: { node: NodeItem; registration_token: string }) {
    setNotice({
      kind: "info",
      message: t("nodes.registrationCredentials", {
        nodeId: data.node.id,
        token: data.registration_token
      })
    });
  }

  async function createNode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const allowedRuntimeBackends = [
      form.get("allow_docker") === "on" ? "docker_sandbox" : null,
      form.get("allow_native") === "on" ? "native" : null
    ].filter((value): value is string => value !== null);
    await runAction(async () => {
      const response = await request<ApiResponse<{ node: NodeItem; registration_token: string }>>("/nodes", {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          region_code: String(form.get("region_code") ?? ""),
          tags: splitList(String(form.get("tags") ?? "")),
          weight: Number(form.get("weight") ?? 100),
          supported_tool_types: splitList(String(form.get("supported_tool_types") ?? "claude")),
          allowed_runtime_backends: allowedRuntimeBackends,
          default_runtime_backend: String(form.get("default_runtime_backend") ?? "docker_sandbox"),
          runtime_policy: {
            memory_high_bytes: Number(form.get("memory_high_bytes") ?? 3221225472),
            memory_max_bytes: Number(form.get("memory_max_bytes") ?? 4294967296),
            cpu_quota_percent: Number(form.get("cpu_quota_percent") ?? 200),
            tasks_max: Number(form.get("tasks_max") ?? 512),
            limit_nofile: Number(form.get("limit_nofile") ?? 8192),
            tmpfs_size_bytes: Number(form.get("tmpfs_size_bytes") ?? 1073741824),
            network_allowlist: splitList(String(form.get("network_allowlist") ?? ""))
          },
          wireguard_ip: String(form.get("wireguard_ip") ?? "") || null,
          wireguard_endpoint: String(form.get("wireguard_endpoint") ?? "") || null,
          ssh_host: String(form.get("ssh_host") ?? "") || null,
          ssh_port: Number(form.get("ssh_port") ?? 22),
          ssh_user: String(form.get("ssh_user") ?? "") || null
        })
      });
      showRegistrationCredentials(response.data);
    });
    event.currentTarget.reset();
  }

  async function updateRuntimePolicy(event: React.FormEvent<HTMLFormElement>, node: NodeItem) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const allowed = [
      form.get("allow_docker") === "on" ? "docker_sandbox" : null,
      form.get("allow_native") === "on" ? "native" : null
    ].filter((value): value is string => value !== null);
    await runAction(
      () => request(`/nodes/${node.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          allowed_runtime_backends: allowed,
          default_runtime_backend: String(form.get("default_runtime_backend") ?? node.default_runtime_backend),
          runtime_policy: {
            memory_high_bytes: Number(form.get("memory_high_bytes")),
            memory_max_bytes: Number(form.get("memory_max_bytes")),
            cpu_quota_percent: Number(form.get("cpu_quota_percent")),
            tasks_max: Number(form.get("tasks_max")),
            limit_nofile: Number(form.get("limit_nofile")),
            tmpfs_size_bytes: Number(form.get("tmpfs_size_bytes")),
            network_allowlist: splitList(String(form.get("network_allowlist") ?? ""))
          }
        })
      }).then(() => undefined),
      t("nodes.runtimeSaved")
    );
  }

  if (!isAdmin) {
    return (
      <section className="panel">
        <EmptyBlock label={t("users.adminRequired")} />
      </section>
    );
  }

  return (
    <div className="content-grid">
      <div className="two-column">
        <section className="panel">
          <PanelTitle icon={Server} title={t("nodes.title")} />
          {nodes.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
          {nodes.map((node) => (
            <React.Fragment key={node.id}>
              <ResourceRow
              key={node.id}
              title={node.name}
              meta={`${node.region_code} · ${tagsText(node.tags)} · default ${node.default_runtime_backend} · allowed ${node.allowed_runtime_backends.join(", ")} · available ${runtimeBackends(node).join(", ") || "none"} · ${formatDate(node.last_heartbeat_at)}`}
              actions={
                <>
                  <StatusPill status={node.status} />
                  <button
                    disabled={busy}
                    onClick={async () => {
                      if (await confirmAction(t("nodes.confirmRotateRegistration", { name: node.name }))) {
                        void runAction(async () => {
                          const response = await request<ApiResponse<{ node: NodeItem; registration_token: string }>>(
                            `/nodes/${node.id}/registration-token`,
                            { method: "POST" }
                          );
                          showRegistrationCredentials(response.data);
                        });
                      }
                    }}
                    type="button"
                  >
                    <RotateCcw size={15} />
                    {t("nodes.rotateRegistration")}
                  </button>
                  <button
                    disabled={busy}
                    onClick={async () =>
                      void runAction(
                        () => request(`/nodes/${node.id}/maintenance`, { method: "POST" }).then(() => undefined),
                        t("nodes.maintained")
                      )
                    }
                    type="button"
                  >
                    <Wrench size={15} />
                    {t("nodes.maintenance")}
                  </button>
                  <button
                    disabled={busy}
                    onClick={async () => {
                      if (await confirmAction(t("common.confirmDisable", { name: node.name }))) {
                        void runAction(
                          () => request(`/nodes/${node.id}/disable`, { method: "POST" }).then(() => undefined),
                          t("nodes.disabled")
                        );
                      }
                    }}
                    type="button"
                  >
                    <Ban size={15} />
                    {t("common.disable")}
                  </button>
                  <button
                    disabled={busy}
                    onClick={async () => {
                      if (await confirmAction(t("common.confirmDelete", { name: node.name }))) {
                        void runAction(
                          () => request(`/nodes/${node.id}`, { method: "DELETE" }).then(() => undefined),
                          t("nodes.deleted")
                        );
                      }
                    }}
                    type="button"
                  >
                    <Trash2 size={15} />
                    {t("common.delete")}
                  </button>
                </>
              }
              />
              <details className="detail-row">
                <summary>{t("nodes.editRuntime")}</summary>
                <form className="form-panel" onSubmit={(event) => void updateRuntimePolicy(event, node)}>
                  <CheckLine name="allow_docker" label={t("nodes.allowDocker")} defaultChecked={node.allowed_runtime_backends.includes("docker_sandbox")} />
                  <CheckLine name="allow_native" label={t("nodes.allowNative")} defaultChecked={node.allowed_runtime_backends.includes("native")} />
                  <label className="field">
                    <span>{t("nodes.defaultRuntime")}</span>
                    <select name="default_runtime_backend" defaultValue={node.default_runtime_backend}>
                      <option value="docker_sandbox">docker_sandbox</option>
                      <option value="native">native</option>
                    </select>
                  </label>
                  <Field name="memory_high_bytes" label={t("nodes.memoryHigh")} type="number" defaultValue={policyNumber(node, "memory_high_bytes", 3221225472)} />
                  <Field name="memory_max_bytes" label={t("nodes.memoryMax")} type="number" defaultValue={policyNumber(node, "memory_max_bytes", 4294967296)} />
                  <Field name="cpu_quota_percent" label={t("nodes.cpuQuota")} type="number" defaultValue={policyNumber(node, "cpu_quota_percent", 200)} />
                  <Field name="tasks_max" label={t("nodes.tasksMax")} type="number" defaultValue={policyNumber(node, "tasks_max", 512)} />
                  <Field name="limit_nofile" label={t("nodes.nofile")} type="number" defaultValue={policyNumber(node, "limit_nofile", 8192)} />
                  <Field name="tmpfs_size_bytes" label={t("nodes.tmpSize")} type="number" defaultValue={policyNumber(node, "tmpfs_size_bytes", 1073741824)} />
                  <Field name="network_allowlist" label={t("nodes.networkAllowlist")} defaultValue={policyList(node, "network_allowlist")} />
                  <button className="primary" disabled={busy}>
                    <Save size={15} />
                    {t("common.save")}
                  </button>
                </form>
              </details>
            </React.Fragment>
          ))}
        </section>
        <ResponsiveForm
          closeLabel={t("common.dismiss")}
          icon={Server}
          onSubmit={createNode}
          triggerLabel={t("nodes.create")}
        >
          <PanelTitle icon={Server} title={t("nodes.create")} />
          <Field name="name" label={t("devices.name")} required />
          <Field name="region_code" label={t("accounts.region")} defaultValue="US" required />
          <Field name="tags" label={t("nodes.tags")} defaultValue="us" />
          <Field name="weight" label={t("nodes.weight")} type="number" defaultValue={100} />
          <Field name="supported_tool_types" label={t("nodes.tools")} defaultValue="claude" />
          <CheckLine name="allow_docker" label={t("nodes.allowDocker")} defaultChecked />
          <CheckLine name="allow_native" label={t("nodes.allowNative")} />
          <SelectField name="default_runtime_backend" label={t("nodes.defaultRuntime") }>
            <option value="docker_sandbox">docker_sandbox</option>
            <option value="native">native</option>
          </SelectField>
          <Field name="memory_high_bytes" label={t("nodes.memoryHigh")} type="number" defaultValue={3221225472} />
          <Field name="memory_max_bytes" label={t("nodes.memoryMax")} type="number" defaultValue={4294967296} />
          <Field name="cpu_quota_percent" label={t("nodes.cpuQuota")} type="number" defaultValue={200} />
          <Field name="tasks_max" label={t("nodes.tasksMax")} type="number" defaultValue={512} />
          <Field name="limit_nofile" label={t("nodes.nofile")} type="number" defaultValue={8192} />
          <Field name="tmpfs_size_bytes" label={t("nodes.tmpSize")} type="number" defaultValue={1073741824} />
          <Field name="network_allowlist" label={t("nodes.networkAllowlist")} />
          <Field name="wireguard_ip" label={t("nodes.wgIp")} />
          <Field name="wireguard_endpoint" label={t("nodes.wgEndpoint")} />
          <Field name="ssh_host" label={t("nodes.sshHost")} />
          <Field name="ssh_port" label={t("nodes.sshPort")} type="number" defaultValue={22} />
          <Field name="ssh_user" label={t("nodes.sshUser")} defaultValue="agent-remote" />
          <button className="primary" disabled={busy}>
            <Server size={16} />
            {t("common.create")}
          </button>
        </ResponsiveForm>
      </div>
      <section className="panel">
        <PanelTitle icon={AlertTriangle} title={t("nodes.tasks")} />
        {nodeTasks.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
        {nodeTasks.map((task) => <TaskRow key={task.id} task={task} />)}
      </section>
    </div>
  );
}

function runtimeBackends(node: NodeItem): string[] {
  const backends = node.runtime_capabilities.backends;
  return Array.isArray(backends) ? backends.filter((value): value is string => typeof value === "string") : [];
}

function policyNumber(node: NodeItem, key: string, fallback: number): number {
  const value = node.runtime_policy[key];
  return typeof value === "number" ? value : fallback;
}

function policyList(node: NodeItem, key: string): string {
  const value = node.runtime_policy[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").join(",") : "";
}

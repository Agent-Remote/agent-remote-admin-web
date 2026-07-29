import {
  CheckCircle2,
  Circle,
  Database,
  FolderSync,
  Play,
  RotateCcw,
  Trash2
} from "lucide-react";
import React, { useState } from "react";
import {
  Badge,
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
import { shortId } from "../../utils/format";
import { getSyncSessionActions } from "./syncActions";
import type { ConsolePageProps } from "./types";
export function SyncPage({ workspaces, syncSessions, devices, nodes, busy, request, runAction }: ConsolePageProps) {
  const { t } = useI18n();
  const confirmAction = useConfirm();
  const [syncWorkspaceId, setSyncWorkspaceId] = useState(workspaces[0]?.id ?? "");
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === syncWorkspaceId);

  async function createWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await runAction(
      () =>
        request("/workspaces", {
          method: "POST",
          body: JSON.stringify({
            device_id: String(form.get("device_id") ?? ""),
            project_key: String(form.get("project_key") ?? ""),
            local_start_path: String(form.get("local_start_path") ?? ""),
            display_name: String(form.get("display_name") ?? ""),
            sync_git: form.get("sync_git") === "on",
            git_sync_policy: {
              exclude_hooks: true,
              exclude_locks: true,
              require_clean_git_lock: true,
              warn_concurrent_git: true
            }
          })
        }).then(() => undefined),
      t("sync.workspaceCreated")
    );
    formElement.reset();
  }

  async function createSync(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await runAction(
      () =>
        request("/sync-sessions", {
          method: "POST",
          body: JSON.stringify({
            workspace_id: String(form.get("workspace_id") ?? ""),
            node_id: String(form.get("node_id") ?? "") || null,
            local_path: String(form.get("local_path") ?? selectedWorkspace?.local_start_path ?? "") || null,
            sync_mode: String(form.get("sync_mode") ?? "two_way"),
            sync_git: form.get("sync_git") === "on",
            exclude: [
              ".git/**/*.lock",
              ".git/hooks",
              ".git/worktrees",
              "node_modules",
              "target",
              "dist",
              ".venv",
              "__pycache__"
            ]
          })
        }).then(() => undefined),
      t("sync.created")
    );
    formElement.reset();
  }

  return (
    <div className="content-grid">
      <div className="two-column">
        <section className="panel">
          <PanelTitle icon={Database} title={t("sync.workspaces")} />
          {workspaces.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
          {workspaces.map((workspace) => (
            <ResourceRow
              key={workspace.id}
              title={workspace.display_name}
              meta={`${workspace.project_key} · ${workspace.local_start_path}`}
              actions={
                <>
                  <Badge>{workspace.sync_git ? t("common.gitSync") : t("common.filesOnly")}</Badge>
                  <Badge>{shortId(workspace.device_id)}</Badge>
                  <button
                    disabled={busy}
                    onClick={async () => {
                      if (await confirmAction(t("common.confirmDelete", { name: workspace.display_name }))) {
                        void runAction(
                          () => request(`/workspaces/${workspace.id}`, { method: "DELETE" }).then(() => undefined),
                          t("sync.workspaceDeleted")
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
          ))}
        </section>
        <ResponsiveForm
          closeLabel={t("common.dismiss")}
          icon={Database}
          onSubmit={createWorkspace}
          triggerLabel={t("sync.createWorkspace")}
        >
          <PanelTitle icon={Database} title={t("sync.createWorkspace")} />
          <SelectField name="device_id" label={t("nav.devices")} required>
            <option value="">{t("common.select")}</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
              </option>
            ))}
          </SelectField>
          <Field name="display_name" label={t("auth.displayName")} required />
          <Field name="project_key" label={t("sessions.projectKey")} required />
          <Field name="local_start_path" label={t("sync.localPath")} required />
          <CheckLine name="sync_git" label={t("common.gitSync")} defaultChecked />
          <button className="primary" disabled={busy}>
            <Database size={16} />
            {t("common.create")}
          </button>
        </ResponsiveForm>
      </div>
      <div className="two-column">
        <section className="panel">
          <PanelTitle icon={FolderSync} title={t("sync.sessions")} />
          {syncSessions.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
          {syncSessions.map((sync) => (
            <ResourceRow
              key={sync.id}
              title={sync.local_path}
              meta={`${sync.remote_path} · ${sync.sync_mode} · ${sync.sync_git ? t("common.gitSync") : t("common.filesOnly")}`}
              actions={
                <>
                  <StatusPill status={sync.status} />
                  <Badge tone={sync.conflict_status !== "clean" ? "warning" : "neutral"}>{sync.conflict_status}</Badge>
                  {getSyncSessionActions(sync.status, sync.conflict_status).canPause ? (
                    <button
                      disabled={busy}
                      onClick={() =>
                        void runAction(
                          () =>
                            request(`/sync-sessions/${sync.id}/pause`, {
                              method: "POST",
                              body: JSON.stringify({ note: "admin-web" })
                            }).then(() => undefined),
                          t("sync.paused")
                        )
                      }
                      type="button"
                    >
                      <Circle size={15} />
                      {t("sync.pause")}
                    </button>
                  ) : null}
                  {getSyncSessionActions(sync.status, sync.conflict_status).canResume ? (
                    <button
                      disabled={busy}
                      onClick={() =>
                        void runAction(
                          () =>
                            request(`/sync-sessions/${sync.id}/resume`, {
                              method: "POST",
                              body: JSON.stringify({ note: "admin-web" })
                            }).then(() => undefined),
                          t("sync.resumed")
                        )
                      }
                      type="button"
                    >
                      <Play size={15} />
                      {t("sync.resume")}
                    </button>
                  ) : null}
                  {getSyncSessionActions(sync.status, sync.conflict_status).canResolve ? (
                    <button
                      disabled={busy}
                      onClick={() =>
                        void runAction(
                          () =>
                            request(`/sync-sessions/${sync.id}/resolve`, {
                              method: "POST",
                              body: JSON.stringify({ note: "admin-web" })
                            }).then(() => undefined),
                          t("sync.resolved")
                        )
                      }
                      type="button"
                    >
                      <CheckCircle2 size={15} />
                      {t("sync.resolve")}
                    </button>
                  ) : null}
                  {getSyncSessionActions(sync.status, sync.conflict_status).canReset ? (
                    <>
                      <button
                        disabled={busy}
                        onClick={async () => {
                          if (await confirmAction(t("common.confirmReset"))) {
                            void runAction(
                              () =>
                                request(`/sync-sessions/${sync.id}/reset`, {
                                  method: "POST",
                                  body: JSON.stringify({ note: "admin-web" })
                                }).then(() => undefined),
                              t("sync.reset")
                            );
                          }
                        }}
                        type="button"
                      >
                        <RotateCcw size={15} />
                        {t("sync.resetAction")}
                      </button>
                      <button
                        disabled={busy}
                        onClick={async () => {
                          if (await confirmAction(t("common.confirmDelete", { name: sync.local_path }))) {
                            void runAction(
                              () => request(`/sync-sessions/${sync.id}`, { method: "DELETE" }).then(() => undefined),
                              t("sync.deleted")
                            );
                          }
                        }}
                        type="button"
                      >
                        <Trash2 size={15} />
                        {t("common.delete")}
                      </button>
                    </>
                  ) : null}
                </>
              }
            />
          ))}
        </section>
        <ResponsiveForm
          closeLabel={t("common.dismiss")}
          icon={FolderSync}
          onSubmit={createSync}
          triggerLabel={t("sync.create")}
        >
          <PanelTitle icon={FolderSync} title={t("sync.create")} />
          <SelectField
            name="workspace_id"
            label={t("sessions.workspace")}
            required
            value={syncWorkspaceId}
            onChange={(event) => setSyncWorkspaceId(event.target.value)}
          >
            <option value="">{t("common.select")}</option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.display_name}
              </option>
            ))}
          </SelectField>
          <SelectField name="node_id" label={t("nav.nodes")}>
            <option value="">{t("common.auto")}</option>
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </SelectField>
          <Field name="local_path" label={t("sync.localPath")} defaultValue={selectedWorkspace?.local_start_path ?? ""} />
          <SelectField name="sync_mode" label={t("sync.mode")}>
            <option value="two_way">two_way</option>
          </SelectField>
          <CheckLine name="sync_git" label={t("common.gitSync")} defaultChecked />
          <button className="primary" disabled={busy}>
            <FolderSync size={16} />
            {t("common.create")}
          </button>
        </ResponsiveForm>
      </div>
    </div>
  );
}

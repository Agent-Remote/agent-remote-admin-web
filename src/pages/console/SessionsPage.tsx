import {
  Link,
  Play,
  Square,
  TerminalSquare
} from "lucide-react";
import React, { useState } from "react";
import {
  EmptyBlock,
  Field,
  PanelTitle,
  ResponsiveForm,
  ResourceRow,
  SelectField,
  StatusPill,
  copyToClipboard
} from "../../components/ui";
import { useConfirm } from "../../app/ConfirmProvider";
import { useI18n } from "../../i18n/I18nProvider";
import type { ApiResponse } from "../../types";
import {
  shortId,
  splitList
} from "../../utils/format";
import type { ConsolePageProps } from "./types";
export function SessionsPage({ toolSessions, accounts, workspaces, busy, request, runAction, setNotice }: ConsolePageProps) {
  const { t } = useI18n();
  const confirmAction = useConfirm();
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id ?? "");
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === workspaceId);

  async function createSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction(
      () =>
        request("/sessions", {
          method: "POST",
          body: JSON.stringify({
            tool_type: String(form.get("tool_type") ?? "claude"),
            tool_account_id: String(form.get("tool_account_id") ?? ""),
            workspace_id: String(form.get("workspace_id") ?? ""),
            project_key: String(form.get("project_key") ?? selectedWorkspace?.project_key ?? ""),
            argv: splitList(String(form.get("argv") ?? ""))
          })
        }).then(() => undefined),
      t("sessions.created")
    );
    event.currentTarget.reset();
  }

  return (
    <div className="two-column">
      <section className="panel">
        <PanelTitle icon={TerminalSquare} title={t("sessions.title")} />
        {toolSessions.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
        {toolSessions.map((session) => (
          <ResourceRow
            key={session.id}
            title={`${session.tool_type} · ${session.project_key}`}
            meta={`${shortId(session.id)} · ${session.runtime_backend} · ${session.runtime_resource_id ?? "pending"} · tmux ${session.tmux_session_name ?? "-"}`}
            actions={
              <>
                <StatusPill status={session.status} />
                <button
                  disabled={busy || session.status === "interrupted"}
                  onClick={async () => {
                    void runAction(async () => {
                      const response = await request<ApiResponse<{ ssh_command: string }>>(`/sessions/${session.id}/attach`, {
                        method: "POST"
                      });
                      copyToClipboard(response.data.ssh_command, () =>
                        setNotice({ kind: "info", message: response.data.ssh_command })
                      );
                    });
                  }}
                  type="button"
                >
                  <Link size={15} />
                  {t("sessions.attach")}
                </button>
                <button
                  disabled={busy || ["stopped", "stopping"].includes(session.status)}
                  onClick={async () => {
                    if (await confirmAction(t("common.confirmStop", { name: session.project_key }))) {
                      void runAction(
                        () => request(`/sessions/${session.id}/stop`, { method: "POST" }).then(() => undefined),
                        t("sessions.stopping")
                      );
                    }
                  }}
                  type="button"
                >
                  <Square size={15} />
                  {t("sessions.stop")}
                </button>
              </>
            }
          />
        ))}
      </section>
      <ResponsiveForm
        closeLabel={t("common.dismiss")}
        icon={Play}
        onSubmit={createSession}
        triggerLabel={t("sessions.create")}
      >
        <PanelTitle icon={Play} title={t("sessions.create")} />
        <SelectField name="tool_type" label={t("accounts.tool")}>
          <option value="claude">claude</option>
        </SelectField>
        <SelectField name="tool_account_id" label={t("sessions.account")} required>
          <option value="">{t("common.select")}</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.display_name}
            </option>
          ))}
        </SelectField>
        <SelectField
          name="workspace_id"
          label={t("sessions.workspace")}
          required
          value={workspaceId}
          onChange={(event) => setWorkspaceId(event.target.value)}
        >
          <option value="">{t("common.select")}</option>
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.display_name}
            </option>
          ))}
        </SelectField>
        <Field name="project_key" label={t("sessions.projectKey")} defaultValue={selectedWorkspace?.project_key ?? ""} required />
        <Field name="argv" label={t("sessions.args")} />
        <button className="primary" disabled={busy}>
          <Play size={16} />
          {t("common.create")}
        </button>
      </ResponsiveForm>
    </div>
  );
}

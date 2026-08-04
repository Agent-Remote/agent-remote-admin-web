import {
  Ban,
  Laptop,
  RotateCcw,
  ShieldCheck,
  Square,
  Trash2
} from "lucide-react";
import React from "react";
import {
  EmptyBlock,
  Field,
  PanelTitle,
  ResponsiveForm,
  ResourceRow,
  SelectField,
  StatusPill,
  TextAreaField
} from "../../components/ui";
import { useConfirm } from "../../app/ConfirmProvider";
import { useI18n } from "../../i18n/I18nProvider";
import type { ApiResponse } from "../../types";
import { formatDate } from "../../utils/format";
import type { ConsolePageProps } from "./types";
const terminalSessionStatuses = new Set(["stopped", "denied", "expired", "failed"]);

export function DevicesPage({
  devices,
  deviceSessions,
  deviceSessionsError,
  deviceSessionsLoading,
  deviceSessionsRefreshing,
  deviceControlPolicy,
  deviceControlPolicyError,
  deviceControlPolicyLoading,
  toolSessions,
  workspaces,
  users,
  me,
  busy,
  request,
  runAction,
  setNotice
}: ConsolePageProps) {
  const { t } = useI18n();
  const confirmAction = useConfirm();
  const deletableSessionCount = deviceSessions.filter((session) => terminalSessionStatuses.has(session.status)).length;
  async function registerDevice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await runAction(async () => {
      const response = await request<ApiResponse<{ device_token: { access_token: string } }>>("/devices/register", {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          platform: String(form.get("platform") ?? ""),
          ssh_public_key: String(form.get("ssh_public_key") ?? ""),
          wireguard_public_key: String(form.get("wireguard_public_key") ?? "") || null
        })
      });
      setNotice({ kind: "info", message: t("devices.token", { token: response.data.device_token.access_token }) });
    });
    formElement.reset();
  }

  return (
    <>
      <div className="two-column">
      <section className="panel">
        <PanelTitle icon={Laptop} title={t("devices.title")} />
        {devices.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
        {devices.map((device) => (
          <ResourceRow
            key={device.id}
            title={device.name}
            meta={`${device.platform} · ${t("devices.cliVersion", { version: device.cli_version ?? t("common.unknown") })} · ${t("devices.lastSeen", { time: formatDate(device.last_seen_at) })}`}
            actions={
              <>
                <StatusPill status={device.status} />
                <button
                  disabled={busy || device.status !== "active"}
                  onClick={async () => {
                    if (await confirmAction(t("common.confirmRevoke", { name: device.name }))) {
                      void runAction(
                        () => request(`/devices/${device.id}/disable`, { method: "POST" }).then(() => undefined),
                        t("devices.revoked")
                      );
                    }
                  }}
                  type="button"
                >
                  <Ban size={15} />
                  {t("common.revoke")}
                </button>
                <button
                  disabled={busy || device.status !== "active"}
                  onClick={async () => {
                    void runAction(async () => {
                      const response = await request<ApiResponse<{ access_token: string }>>(
                        `/devices/${device.id}/rotate-token`,
                        { method: "POST" }
                      );
                      setNotice({ kind: "info", message: t("devices.token", { token: response.data.access_token }) });
                    });
                  }}
                  type="button"
                >
                  <RotateCcw size={15} />
                  {t("common.rotate")}
                </button>
                <button
                  disabled={busy}
                  onClick={async () => {
                    if (await confirmAction(t("common.confirmDelete", { name: device.name }))) {
                      void runAction(
                        () => request(`/devices/${device.id}`, { method: "DELETE" }).then(() => undefined),
                        t("devices.deleted")
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
        icon={Laptop}
        onSubmit={registerDevice}
        triggerLabel={t("devices.register")}
      >
        <PanelTitle icon={Laptop} title={t("devices.register")} />
        <Field name="name" label={t("devices.name")} required />
        <SelectField name="platform" label={t("devices.platform")}>
          <option value="macos">macOS</option>
          <option value="linux">Linux</option>
          <option value="windows">Windows</option>
        </SelectField>
        <TextAreaField name="ssh_public_key" label={t("devices.sshKey")} required />
        <TextAreaField name="wireguard_public_key" label={t("devices.wgKey")} />
        <button className="primary" disabled={busy}>
          <Laptop size={16} />
          {t("devices.register")}
        </button>
      </ResponsiveForm>
      </div>
      {me.role === "admin" ? (
        <section className="panel">
          <PanelTitle icon={ShieldCheck} title={t("devices.controlPolicy")} />
          {deviceControlPolicyLoading ? (
            <div role="status">{t("devices.policyLoading")}</div>
          ) : null}
          {deviceControlPolicyError ? (
            <div role="alert">{t("devices.policyLoadFailed")}</div>
          ) : null}
          {deviceControlPolicy ? (
            <div className="metric-grid">
              <div className="metric">
                <strong>{t(deviceControlPolicy.enabled ? "common.enabled" : "common.disabled")}</strong>
                <span>{t("devices.policyStatus")}</span>
              </div>
              <div className="metric">
                <strong>{deviceControlPolicy.platform} / v{deviceControlPolicy.protocol_version}</strong>
                <span>{t("devices.policyProtocol")}</span>
              </div>
              <div className="metric">
                <strong>{t("devices.policySeconds", { value: deviceControlPolicy.lease_seconds })}</strong>
                <span>{t("devices.policyLease")}</span>
              </div>
              <div className="metric">
                <strong>{t("devices.policySeconds", { value: deviceControlPolicy.maximum_ttl_seconds })}</strong>
                <span>{t("devices.policyMaximumTtl")}</span>
              </div>
              <div className="metric">
                <strong>{t("devices.policyBytes", { value: deviceControlPolicy.relay_maximum_frame_bytes })}</strong>
                <span>{t("devices.policyFrameLimit")}</span>
              </div>
              <div className="metric">
                <strong>{t("devices.policyBytesPerSecond", { value: deviceControlPolicy.relay_maximum_bytes_per_second })}</strong>
                <span>{t("devices.policyRateLimit")}</span>
              </div>
              <div className="metric">
                <strong>{t("devices.policySeconds", { value: deviceControlPolicy.relay_maximum_connection_seconds })}</strong>
                <span>{t("devices.policyConnectionLimit")}</span>
              </div>
              <div className="metric">
                <strong>{t(deviceControlPolicy.local_approval_required ? "common.yes" : "common.no")}</strong>
                <span>{t("devices.policyLocalApproval")}</span>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
      <section className="panel">
        <PanelTitle
          action={
            deletableSessionCount > 0 ? (
              <button
                className="danger-ghost"
                disabled={busy}
                onClick={async () => {
                  if (await confirmAction(t("devices.confirmDeleteAllSessions", { count: deletableSessionCount }))) {
                    void runAction(
                      () => request("/device-sessions", { method: "DELETE" }).then(() => undefined),
                      t("devices.sessionsDeletedAll")
                    );
                  }
                }}
                type="button"
              >
                <Trash2 size={15} />
                {t("devices.deleteAllSessions")}
              </button>
            ) : undefined
          }
          icon={Laptop}
          title={t("devices.controlSessions")}
        />
        {deviceSessionsLoading ? <div role="status">{t("devices.sessionsLoading")}</div> : null}
        {deviceSessionsError ? <div role="alert">{t("devices.sessionsLoadFailed")}</div> : null}
        {deviceSessionsRefreshing ? <div role="status">{t("devices.sessionsRefreshing")}</div> : null}
        {!deviceSessionsLoading && !deviceSessionsError && deviceSessions.length === 0 ? (
          <EmptyBlock label={t("devices.noControlSessions")} />
        ) : null}
        {deviceSessions.map((session) => {
          const device = devices.find((item) => item.id === session.device_id);
          const owner = users.find((item) => item.id === session.user_id);
          const ownerLabel = owner?.display_name ?? session.user_id;
          const deviceLabel = device?.name ?? session.device_id;
          const toolSession = toolSessions.find((item) => item.id === session.tool_session_id);
          const workspace = workspaces.find((item) => item.id === toolSession?.workspace_id);
          const claudeLabel = workspace?.display_name ?? session.tool_session_id;
          const stopMetadata = session.stop_reason
            ? ` · ${t("devices.sessionStopReason", { reason: session.stop_reason })}`
            : "";
          return (
            <ResourceRow
              key={session.id}
              title={deviceLabel}
              meta={`${t("devices.sessionClaude", { session: claudeLabel })} · ${t("devices.sessionOwner", { owner: ownerLabel })} · ${t("devices.sessionGeneration", { generation: session.generation })} · ${t("devices.sessionExpires", { time: formatDate(session.expires_at) })}${stopMetadata}`}
              actions={
                <>
                  <StatusPill status={session.status} />
                  <button
                    disabled={busy || terminalSessionStatuses.has(session.status)}
                    onClick={async () => {
                      if (await confirmAction(t("devices.confirmStopSession", { name: deviceLabel }))) {
                        void runAction(
                          () => request(`/device-sessions/${session.id}/stop`, {
                            method: "POST",
                            body: JSON.stringify({ reason: "user_stop" })
                          }).then(() => undefined),
                          t("devices.sessionStopped")
                        );
                      }
                    }}
                    type="button"
                  >
                    <Square size={14} />
                    {me.role === "admin" ? t("devices.forceStop") : t("sessions.stop")}
                  </button>
                  {terminalSessionStatuses.has(session.status) ? (
                    <button
                      disabled={busy}
                      onClick={async () => {
                        if (await confirmAction(t("devices.confirmDeleteSession", { name: deviceLabel }))) {
                          void runAction(
                            () => request(`/device-sessions/${session.id}`, { method: "DELETE" }).then(() => undefined),
                            t("devices.sessionDeleted")
                          );
                        }
                      }}
                      type="button"
                    >
                      <Trash2 size={14} />
                      {t("common.delete")}
                    </button>
                  ) : null}
                </>
              }
            />
          );
        })}
      </section>
    </>
  );
}

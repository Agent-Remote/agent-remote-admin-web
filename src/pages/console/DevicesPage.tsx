import {
  Ban,
  Laptop,
  RotateCcw,
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
export function DevicesPage({ devices, busy, request, runAction, setNotice }: ConsolePageProps) {
  const { t } = useI18n();
  const confirmAction = useConfirm();
  async function registerDevice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
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
    event.currentTarget.reset();
  }

  return (
    <div className="two-column">
      <section className="panel">
        <PanelTitle icon={Laptop} title={t("devices.title")} />
        {devices.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
        {devices.map((device) => (
          <ResourceRow
            key={device.id}
            title={device.name}
            meta={`${device.platform} · ${t("devices.lastSeen", { time: formatDate(device.last_seen_at) })}`}
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
  );
}

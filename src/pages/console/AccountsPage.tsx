import {
  Ban,
  CheckCircle2,
  KeyRound,
  Play,
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
  StatusPill
} from "../../components/ui";
import { useConfirm } from "../../app/ConfirmProvider";
import { useI18n } from "../../i18n/I18nProvider";
import type { ApiResponse } from "../../types";
import { splitList } from "../../utils/format";
import type { ConsolePageProps } from "./types";
export function AccountsPage({ accounts, busy, request, runAction, setNotice, me }: ConsolePageProps) {
  const { t } = useI18n();
  const confirmAction = useConfirm();
  async function createAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction(
      () =>
        request("/tool-accounts", {
          method: "POST",
          body: JSON.stringify({
            tool_type: String(form.get("tool_type") ?? "claude"),
            display_name: String(form.get("display_name") ?? ""),
            region_code: String(form.get("region_code") ?? "US"),
            timezone: String(form.get("timezone") ?? "America/Los_Angeles"),
            locale: String(form.get("locale") ?? "en_US.UTF-8"),
            preferred_node_tags: splitList(String(form.get("preferred_node_tags") ?? ""))
          })
        }).then(() => undefined),
      t("accounts.created")
    );
    event.currentTarget.reset();
  }

  return (
    <div className="two-column">
      <section className="panel">
        <PanelTitle icon={KeyRound} title={t("accounts.title")} />
        {accounts.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
        {accounts.map((account) => (
          <ResourceRow
            key={account.id}
            title={account.display_name}
            meta={`${account.tool_type} · ${account.region_code} · ${account.timezone} · ${account.runtime_backend ?? "not pinned"}`}
            actions={
              <>
                <StatusPill status={account.status} />
                {me.role === "admin" && account.runtime_backend ? (
                  <button
                    disabled={busy || account.status === "migrating"}
                    onClick={async () => {
                      const target = account.runtime_backend === "native" ? "docker_sandbox" : "native";
                      if (await confirmAction(t("accounts.confirmMigration", { runtime: target }))) {
                        void runAction(
                          () => request(`/tool-accounts/${account.id}/runtime-migration`, {
                            method: "POST",
                            body: JSON.stringify({ target_runtime_backend: target })
                          }).then(() => undefined),
                          t("accounts.migrationStarted")
                        );
                      }
                    }}
                    type="button"
                  >
                    <RotateCcw size={15} />
                    {t("accounts.migrate")}
                  </button>
                ) : null}
                <button
                  disabled={busy}
                  onClick={async () => {
                    void runAction(async () => {
                      const response = await request<ApiResponse<{ status: string; connect_command: string | null }>>(
                        `/tool-accounts/${account.id}/bind/start`,
                        { method: "POST" }
                      );
                      setNotice({ kind: "info", message: response.data.connect_command ?? response.data.status });
                    });
                  }}
                  type="button"
                >
                  <Play size={15} />
                  {t("accounts.bind")}
                </button>
                <button
                  disabled={busy}
                  onClick={async () => {
                    void runAction(async () => {
                      const response = await request<ApiResponse<{ status: string; error: string | null }>>(
                        `/tool-accounts/${account.id}/bind/verify`,
                        { method: "POST" }
                      );
                      setNotice({
                        kind: response.data.error ? "error" : "info",
                        message: response.data.error ?? response.data.status
                      });
                    });
                  }}
                  type="button"
                >
                  <CheckCircle2 size={15} />
                  {t("accounts.verify")}
                </button>
                <button
                  disabled={busy || account.status === "disabled"}
                  onClick={async () => {
                    if (await confirmAction(t("common.confirmDisable", { name: account.display_name }))) {
                      void runAction(
                        () => request(`/tool-accounts/${account.id}/disable`, { method: "POST" }).then(() => undefined),
                        t("accounts.disabled")
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
                    if (await confirmAction(t("common.confirmDelete", { name: account.display_name }))) {
                      void runAction(
                        () => request(`/tool-accounts/${account.id}`, { method: "DELETE" }).then(() => undefined),
                        t("accounts.deleted")
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
        icon={KeyRound}
        onSubmit={createAccount}
        triggerLabel={t("accounts.create")}
      >
        <PanelTitle icon={KeyRound} title={t("accounts.create")} />
        <SelectField name="tool_type" label={t("accounts.tool")}>
          <option value="claude">claude</option>
        </SelectField>
        <Field name="display_name" label={t("auth.displayName")} required />
        <Field name="region_code" label={t("accounts.region")} defaultValue="US" required />
        <Field name="timezone" label={t("accounts.timezone")} defaultValue="America/Los_Angeles" required />
        <Field name="locale" label={t("accounts.locale")} defaultValue="en_US.UTF-8" required />
        <Field name="preferred_node_tags" label={t("accounts.nodeTags")} />
        <button className="primary" disabled={busy}>
          <KeyRound size={16} />
          {t("common.create")}
        </button>
      </ResponsiveForm>
    </div>
  );
}

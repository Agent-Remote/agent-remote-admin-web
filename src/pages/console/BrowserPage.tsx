import {
  MonitorUp,
  Play,
  Square,
  Trash2
} from "lucide-react";
import React, {
  useMemo,
  useState
} from "react";
import {
  EmptyBlock,
  Field,
  PanelTitle,
  ResponsiveForm,
  SelectField
} from "../../components/ui";
import { useConfirm } from "../../app/ConfirmProvider";
import { useI18n } from "../../i18n/I18nProvider";
import type { ApiResponse } from "../../types";
import { formatDate } from "../../utils/format";
import type { ConsolePageProps } from "./types";
export function BrowserPage({ browserSessions, accounts, busy, apiBase, request, runAction, setNotice }: ConsolePageProps) {
  const { t } = useI18n();
  const confirmAction = useConfirm();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState("");
  const selected = useMemo(
    () => browserSessions.find((item) => item.id === selectedId) ?? browserSessions[0],
    [browserSessions, selectedId]
  );
  const selectedAccount = accounts.find((account) => account.id === accountId);

  async function createBrowser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await runAction(
      () =>
        request("/browser-sessions", {
          method: "POST",
          body: JSON.stringify({
            tool_account_id: accountId || null,
            target_url: String(form.get("target_url") ?? "") || null,
            region_code: accountId ? null : String(form.get("region_code") ?? ""),
            timezone: accountId ? null : String(form.get("timezone") ?? ""),
            locale: accountId ? null : String(form.get("locale") ?? ""),
            ttl_seconds: Number(form.get("ttl_seconds") ?? 1800)
          })
        }).then(() => undefined),
      t("browser.created")
    );
    formElement.reset();
  }

  return (
    <div className="two-column">
      <section className="panel">
        <PanelTitle icon={MonitorUp} title={t("browser.title")} />
        {browserSessions.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
        {browserSessions.map((session) => (
          <button
            key={session.id}
            className={`list-row ${selected?.id === session.id ? "selected" : ""}`}
            onClick={async () => setSelectedId(session.id)}
            type="button"
          >
            <span>{session.target_url ?? "blank"}</span>
            <small>
              {session.region_code} · {session.status} · {formatDate(session.expires_at)}
            </small>
          </button>
        ))}
        {selected ? (
          <div className="button-row">
            <button
              disabled={busy || selected.status !== "ready"}
              onClick={async () => {
                void runAction(async () => {
                  const response = await request<ApiResponse<{ embed_url: string }>>(
                    `/browser-sessions/${selected.id}/connect-info`,
                    { method: "POST" }
                  );
                  const url = response.data.embed_url.startsWith("http")
                    ? response.data.embed_url
                    : `${apiBase.replace(/\/$/, "")}${response.data.embed_url}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                  setNotice({ kind: "info", message: url });
                });
              }}
              type="button"
            >
              <MonitorUp size={15} />
              {t("browser.connect")}
            </button>
            <button
              disabled={busy}
              onClick={async () => {
                if (await confirmAction(t("common.confirmStop", { name: selected.target_url ?? selected.id }))) {
                  void runAction(
                    () => request(`/browser-sessions/${selected.id}/stop`, { method: "POST" }).then(() => undefined),
                    t("browser.stopping")
                  );
                }
              }}
              type="button"
            >
              <Square size={15} />
              {t("sessions.stop")}
            </button>
            <button
              disabled={busy}
              onClick={async () => {
                if (await confirmAction(t("common.confirmDelete", { name: selected.target_url ?? selected.id }))) {
                  void runAction(
                    () => request(`/browser-sessions/${selected.id}`, { method: "DELETE" }).then(() => undefined),
                    t("browser.deleted")
                  );
                }
              }}
              type="button"
            >
              <Trash2 size={15} />
              {t("common.delete")}
            </button>
          </div>
        ) : null}
      </section>
      <ResponsiveForm
        closeLabel={t("common.dismiss")}
        icon={Play}
        onSubmit={createBrowser}
        triggerLabel={t("browser.start")}
      >
        <PanelTitle icon={Play} title={t("browser.start")} />
        <SelectField name="tool_account_id" label={t("sessions.account")} value={accountId} onChange={(event) => setAccountId(event.target.value)}>
          <option value="">{t("browser.manualRegion")}</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.display_name}
            </option>
          ))}
        </SelectField>
        <Field name="target_url" label={t("browser.url")} defaultValue="https://claude.ai/" />
        <Field name="region_code" label={t("accounts.region")} defaultValue={selectedAccount?.region_code ?? "US"} />
        <Field name="timezone" label={t("accounts.timezone")} defaultValue={selectedAccount?.timezone ?? "America/Los_Angeles"} />
        <Field name="locale" label={t("accounts.locale")} defaultValue={selectedAccount?.locale ?? "en_US.UTF-8"} />
        <Field name="ttl_seconds" label={t("browser.ttl")} type="number" defaultValue={1800} />
        <button className="primary" disabled={busy}>
          <Play size={16} />
          {t("browser.start")}
        </button>
      </ResponsiveForm>
    </div>
  );
}

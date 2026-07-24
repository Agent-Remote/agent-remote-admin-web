import {
  CheckCircle2,
  Settings,
  Users
} from "lucide-react";
import React from "react";
import {
  Field,
  PanelTitle
} from "../../components/ui";
import { useI18n } from "../../i18n/I18nProvider";
import type { ConsolePageProps } from "./types";
export function SettingsPage({ me, busy, request, runAction }: ConsolePageProps) {
  const { locale, setLocale, t } = useI18n();
  async function updateMe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await runAction(
      () =>
        request("/users/me", {
          method: "PATCH",
          body: JSON.stringify({ display_name: String(form.get("display_name") ?? "") })
        }).then(() => undefined),
      t("common.savedLocal")
    );
  }

  return (
    <div className="two-column">
      <section className="panel form-panel">
        <PanelTitle icon={Settings} title={t("settings.preferences")} />
        <label className="field">
          <span>{t("settings.language")}</span>
          <select value={locale} onChange={(event) => setLocale(event.target.value === "zh-CN" ? "zh-CN" : "en")}>
            <option value="en">English</option>
            <option value="zh-CN">简体中文</option>
          </select>
        </label>
      </section>
      <form className="panel form-panel" onSubmit={updateMe}>
        <PanelTitle icon={Users} title={t("settings.profile")} />
        <Field name="display_name" label={t("auth.displayName")} defaultValue={me.display_name} required />
        <div className="kv-grid">
          <span>{t("settings.username")}</span>
          <strong>{me.username}</strong>
          <span>{t("users.role")}</span>
          <strong>{me.role}</strong>
          <span>{t("auth.totp")}</span>
          <strong>{me.totp_enabled ? t("common.enabled") : t("common.disabled")}</strong>
        </div>
        <button className="primary" disabled={busy}>
          <CheckCircle2 size={16} />
          {t("common.update")}
        </button>
      </form>
    </div>
  );
}

import { KeyRound, Shield, UserPlus } from "lucide-react";
import type React from "react";
import { NoticeBar, Field } from "../components/ui";
import { useI18n } from "../i18n/I18nProvider";
import type { ApiResponse, AppRequest, Notice } from "../types";
import { errorText } from "../utils/format";

export function AuthPage({
  apiBase,
  busy,
  notice,
  request,
  setApiBase,
  setBusy,
  setNotice,
  setToken
}: {
  apiBase: string;
  busy: boolean;
  notice: Notice | null;
  request: AppRequest;
  setApiBase: React.Dispatch<React.SetStateAction<string>>;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setNotice: React.Dispatch<React.SetStateAction<Notice | null>>;
  setToken: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { locale, setLocale, t } = useI18n();

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setNotice(null);
    try {
      const response = await request<ApiResponse<{ access_token: string }>>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: String(form.get("username") ?? ""),
          password: String(form.get("password") ?? ""),
          totp_code: String(form.get("totp_code") ?? "") || null
        })
      });
      setToken(response.data.access_token);
    } catch (error) {
      setNotice({ kind: "error", message: errorText(error, t("auth.loginFailed")) });
    } finally {
      setBusy(false);
    }
  }

  async function bootstrap(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setNotice(null);
    try {
      const response = await request<ApiResponse<{ access_token: string }>>("/auth/bootstrap", {
        method: "POST",
        body: JSON.stringify({
          username: String(form.get("username") ?? ""),
          password: String(form.get("password") ?? ""),
          display_name: String(form.get("display_name") ?? "") || null
        })
      });
      setToken(response.data.access_token);
    } catch (error) {
      setNotice({ kind: "error", message: errorText(error, t("auth.bootstrapFailed")) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-head">
          <div className="brand-row">
            <Shield size={24} />
            <h1>{t("app.name")}</h1>
          </div>
          <select
            aria-label={t("settings.language")}
            className="compact-select"
            value={locale}
            onChange={(event) => setLocale(event.target.value === "zh" ? "zh" : "en")}
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </div>
        <Field label={t("common.api")} value={apiBase} onChange={(event) => setApiBase(event.target.value)} />
        {notice ? (
          <NoticeBar
            dismissLabel={t("common.dismiss")}
            notice={notice}
            onDismiss={() => setNotice(null)}
          />
        ) : null}
        <div className="auth-grid">
          <form className="panel form-panel" onSubmit={login}>
            <PanelHead icon={KeyRound} title={t("auth.login")} />
            <Field name="username" label={t("auth.username")} required />
            <Field name="password" label={t("auth.password")} type="password" required />
            <Field name="totp_code" label={t("auth.totp")} />
            <button className="primary" disabled={busy}>
              <KeyRound size={16} />
              {t("auth.login")}
            </button>
          </form>
          <form className="panel form-panel" onSubmit={bootstrap}>
            <PanelHead icon={UserPlus} title={t("auth.bootstrap")} />
            <Field name="username" label={t("auth.username")} required />
            <Field name="display_name" label={t("auth.displayName")} />
            <Field name="password" label={t("auth.password")} type="password" required />
            <button disabled={busy}>
              <UserPlus size={16} />
              {t("auth.bootstrap")}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function PanelHead({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="panel-title">
      <Icon size={18} />
      <h2>{title}</h2>
    </div>
  );
}

import { KeyRound, Shield, UserPlus } from "lucide-react";
import type React from "react";
import { NoticeBar, Field } from "../components/ui";
import { useI18n } from "../i18n/I18nProvider";
import type { ApiResponse, AppRequest, Notice } from "../types";
import { errorText } from "../utils/format";

export function AuthPage({
  mode,
  busy,
  notice,
  request,
  setBusy,
  setNotice,
  onAuthenticated,
  onBootstrapComplete
}: {
  mode: "bootstrap" | "login";
  busy: boolean;
  notice: Notice | null;
  request: AppRequest;
  setBusy: React.Dispatch<React.SetStateAction<boolean>>;
  setNotice: React.Dispatch<React.SetStateAction<Notice | null>>;
  onAuthenticated: (token: string, expiresIn: number) => void;
  onBootstrapComplete: () => void | Promise<void>;
}) {
  const { locale, setLocale, t } = useI18n();

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setNotice(null);
    try {
      const response = await request<ApiResponse<{ access_token: string; expires_in: number }>>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: String(form.get("username") ?? ""),
          password: String(form.get("password") ?? ""),
          totp_code: String(form.get("totp_code") ?? "") || null
        })
      });
      onAuthenticated(response.data.access_token, response.data.expires_in);
    } catch (error) {
      setNotice({ kind: "error", message: errorText(error, t("auth.loginFailed")) });
    } finally {
      setBusy(false);
    }
  }

  async function bootstrap(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("password_confirm")) {
      setNotice({ kind: "error", message: t("auth.passwordMismatch") });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await request<ApiResponse<{ access_token: string; expires_in: number }>>("/auth/bootstrap", {
        method: "POST",
        body: JSON.stringify({
          username: String(form.get("username") ?? ""),
          password: String(form.get("password") ?? ""),
          display_name: String(form.get("display_name") ?? "") || null
        })
      });
      await onBootstrapComplete();
      setNotice({ kind: "info", message: t("auth.bootstrapComplete") });
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
            <span className="brand-mark"><Shield size={18} /></span>
            <h1>{t("app.name")}</h1>
          </div>
          <select
            aria-label={t("settings.language")}
            className="compact-select"
            value={locale}
            onChange={(event) => setLocale(event.target.value === "zh-CN" ? "zh-CN" : "en")}
          >
            <option value="en">English</option>
            <option value="zh-CN">简体中文</option>
          </select>
        </div>
        {notice ? (
          <NoticeBar
            dismissLabel={t("common.dismiss")}
            notice={notice}
            onDismiss={() => setNotice(null)}
          />
        ) : null}
        <div className="auth-grid">
          {mode === "login" ? (
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
          ) : (
          <form className="panel form-panel" onSubmit={bootstrap}>
            <PanelHead icon={UserPlus} title={t("auth.initialSetup")} />
            <Field name="username" label={t("auth.username")} required />
            <Field name="display_name" label={t("auth.displayName")} />
            <Field name="password" label={t("auth.password")} type="password" required />
            <Field name="password_confirm" label={t("auth.confirmPassword")} type="password" required />
            <button className="primary" disabled={busy}>
              <UserPlus size={16} />
              {t("auth.createAdmin")}
            </button>
          </form>
          )}
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

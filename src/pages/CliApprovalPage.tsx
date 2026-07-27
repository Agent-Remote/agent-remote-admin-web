import { Check } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { BrandMark, Field, NoticeBar } from "../components/ui";
import { useI18n } from "../i18n/I18nProvider";
import type { ApiResponse, AppRequest, Notice } from "../types";
import { errorText } from "../utils/format";

export function CliApprovalPage({ request }: { request: AppRequest }) {
  const { t } = useI18n();
  const initialCode = new URLSearchParams(window.location.search).get("code") ?? "";
  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function approve(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      await request<ApiResponse<Record<string, never>>>("/auth/cli/approve", {
        method: "POST",
        body: JSON.stringify({ user_code: code.trim().toUpperCase() })
      });
      setApproved(true);
      setNotice({ kind: "info", message: t("cli.approved") });
    } catch (error) {
      setNotice({ kind: "error", message: errorText(error, t("cli.approveFailed")) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel cli-approval-panel">
        <div className="brand-row">
          <BrandMark />
          <h1>{t("cli.title")}</h1>
        </div>
        {notice ? (
          <NoticeBar
            dismissLabel={t("common.dismiss")}
            notice={notice}
            onDismiss={() => setNotice(null)}
          />
        ) : null}
        <form className="panel form-panel" onSubmit={approve}>
          <Field
            name="user_code"
            label={t("cli.code")}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
          />
          <button className="primary" disabled={busy || approved || !code.trim()}>
            <Check size={16} />
            {approved ? t("cli.approvedAction") : t("cli.approve")}
          </button>
        </form>
      </section>
    </main>
  );
}

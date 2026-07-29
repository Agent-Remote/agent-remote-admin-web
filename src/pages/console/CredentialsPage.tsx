import { Ban, BriefcaseBusiness } from "lucide-react";
import React from "react";
import { useConfirm } from "../../app/ConfirmProvider";
import {
  EmptyBlock,
  Field,
  PanelTitle,
  ResponsiveForm,
  ResourceRow,
  SelectField,
  StatusPill
} from "../../components/ui";
import { useI18n } from "../../i18n/I18nProvider";
import type { DeveloperCredentialProfile } from "../../types";
import type { ConsolePageProps } from "./types";

function gitIdentity(profile: DeveloperCredentialProfile) {
  const name = profile.git_identity.user_name;
  const email = profile.git_identity.user_email;
  if (name && email) return `${name} <${email}>`;
  return name ?? email ?? "-";
}

export function CredentialsPage({
  busy,
  credentialProfiles,
  request,
  runAction
}: ConsolePageProps) {
  const { t } = useI18n();
  const confirmAction = useConfirm();

  async function createProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await runAction(
      () =>
        request("/developer-credential-profiles", {
          method: "POST",
          body: JSON.stringify({
            display_name: String(form.get("display_name") ?? ""),
            git_identity: {
              user_name: String(form.get("git_user_name") ?? "") || null,
              user_email: String(form.get("git_user_email") ?? "") || null
            },
            github_cli: { mode: String(form.get("github_cli_mode") ?? "remote_login") },
            ssh: { mode: String(form.get("ssh_mode") ?? "agent_forwarding") }
          })
        }).then(() => undefined),
      t("credentials.created")
    );
    formElement.reset();
  }

  return (
    <div className="two-column">
      <section className="panel">
        <PanelTitle icon={BriefcaseBusiness} title={t("credentials.title")} />
        {credentialProfiles.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
        {credentialProfiles.map((profile) => (
          <ResourceRow
            key={profile.id}
            title={profile.display_name}
            meta={`${gitIdentity(profile)} · gh: ${profile.github_cli_mode} · ssh: ${profile.ssh_mode}`}
            actions={
              <>
                <StatusPill status={profile.status} />
                <button
                  disabled={busy || profile.status === "disabled"}
                  onClick={async () => {
                    if (await confirmAction(t("common.confirmDisable", { name: profile.display_name }))) {
                      void runAction(
                        () => request(`/developer-credential-profiles/${profile.id}/disable`, { method: "POST" }).then(() => undefined),
                        t("credentials.disabled")
                      );
                    }
                  }}
                  type="button"
                >
                  <Ban size={15} />
                  {t("common.disable")}
                </button>
              </>
            }
          />
        ))}
      </section>
      <ResponsiveForm
        closeLabel={t("common.dismiss")}
        icon={BriefcaseBusiness}
        onSubmit={createProfile}
        triggerLabel={t("credentials.create")}
      >
        <PanelTitle icon={BriefcaseBusiness} title={t("credentials.create")} />
        <Field name="display_name" label={t("auth.displayName")} required />
        <Field name="git_user_name" label={t("credentials.gitName")} />
        <Field name="git_user_email" label={t("credentials.gitEmail")} type="email" />
        <SelectField name="github_cli_mode" label={t("credentials.githubMode")}>
          <option value="remote_login">remote_login</option>
          <option value="import_token">import_token</option>
          <option value="disabled">disabled</option>
        </SelectField>
        <SelectField name="ssh_mode" label={t("credentials.sshMode")}>
          <option value="agent_forwarding">agent_forwarding</option>
          <option value="deploy_key">deploy_key</option>
          <option value="disabled">disabled</option>
        </SelectField>
        <button className="primary" disabled={busy}>
          <BriefcaseBusiness size={16} />
          {t("common.create")}
        </button>
      </ResponsiveForm>
    </div>
  );
}

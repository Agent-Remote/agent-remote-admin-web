import {
  Ban,
  UserPlus,
  Users
} from "lucide-react";
import React from "react";
import {
  Badge,
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
import { shortId } from "../../utils/format";
import type { ConsolePageProps } from "./types";
export function UsersPage({ users, isAdmin, busy, request, runAction }: ConsolePageProps & { isAdmin: boolean }) {
  const { t } = useI18n();
  const confirmAction = useConfirm();
  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await runAction(
      () =>
        request("/users", {
          method: "POST",
          body: JSON.stringify({
            username: String(form.get("username") ?? ""),
            password: String(form.get("password") ?? ""),
            role: String(form.get("role") ?? "user"),
            display_name: String(form.get("display_name") ?? "") || null
          })
        }).then(() => undefined),
      t("users.created")
    );
    formElement.reset();
  }

  return (
    <div className="two-column">
      <section className="panel">
        <PanelTitle icon={Users} title={t("users.title")} />
        {!isAdmin ? <EmptyBlock label={t("users.adminRequired")} /> : null}
        {isAdmin && users.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
        {isAdmin
          ? users.map((user) => (
              <ResourceRow
                key={user.id}
                title={user.display_name}
                meta={`${user.username} · ${shortId(user.id)}`}
                actions={
                  <>
                    <StatusPill status={user.status} />
                    <Badge>{user.role}</Badge>
                    <button
                      disabled={busy || user.status !== "active"}
                      onClick={async () => {
                        if (await confirmAction(t("common.confirmDisable", { name: user.username }))) {
                          void runAction(
                            () => request(`/users/${user.id}/disable`, { method: "POST" }).then(() => undefined),
                            t("users.disabled")
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
            ))
          : null}
      </section>
      {isAdmin ? (
        <ResponsiveForm
          closeLabel={t("common.dismiss")}
          icon={UserPlus}
          onSubmit={createUser}
          triggerLabel={t("users.create")}
        >
          <PanelTitle icon={UserPlus} title={t("users.create")} />
          <Field name="username" label={t("auth.username")} required />
          <Field name="display_name" label={t("auth.displayName")} />
          <SelectField name="role" label={t("users.role")}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </SelectField>
          <Field name="password" label={t("auth.password")} type="password" required />
          <button className="primary" disabled={busy}>
            <UserPlus size={16} />
            {t("common.create")}
          </button>
        </ResponsiveForm>
      ) : null}
    </div>
  );
}

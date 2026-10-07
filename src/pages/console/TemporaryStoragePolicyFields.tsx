import { Field } from "../../components/ui";
import { useI18n } from "../../i18n/I18nProvider";
import type { NodeItem } from "../../types";

export function TemporaryStoragePolicyFields({ node }: { node?: NodeItem }) {
  const { t } = useI18n();
  const policy = node?.runtime_policy;
  return (
    <>
      <label className="field">
        <span>{t("nodes.tmpStorage")}</span>
        <select name="temporary_storage" defaultValue={String(policy?.temporary_storage ?? "disk")}>
          <option value="disk">{t("nodes.tmpDisk")}</option>
          <option value="tmpfs">{t("nodes.tmpMemory")}</option>
        </select>
      </label>
      <Field name="temporary_size_bytes" label={t("nodes.tmpDiskSize")} type="number" defaultValue={Number(policy?.temporary_size_bytes ?? 17179869184)} />
      <Field name="tmpfs_size_bytes" label={t("nodes.tmpSize")} type="number" defaultValue={Number(policy?.tmpfs_size_bytes ?? 1073741824)} />
      <p className="muted">{t("nodes.tmpHelp")}</p>
    </>
  );
}

export function readTemporaryStoragePolicy(form: FormData) {
  return {
    temporary_storage: String(form.get("temporary_storage") ?? "disk"),
    temporary_size_bytes: Number(form.get("temporary_size_bytes") ?? 17179869184),
    tmpfs_size_bytes: Number(form.get("tmpfs_size_bytes") ?? 1073741824)
  };
}

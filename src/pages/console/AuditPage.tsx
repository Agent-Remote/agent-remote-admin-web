import { FileClock } from "lucide-react";
import {
  EmptyBlock,
  PanelTitle
} from "../../components/ui";
import { useI18n } from "../../i18n/I18nProvider";
import type { AuditLog } from "../../types";
import { AuditRow } from "./ResourceDetails";
export function AuditPage({ auditLogs }: { auditLogs: AuditLog[] }) {
  const { t } = useI18n();
  return (
    <section className="panel">
      <PanelTitle icon={FileClock} title={t("audit.title")} />
      {auditLogs.length === 0 ? <EmptyBlock label={t("common.empty")} /> : null}
      {auditLogs.map((item) => (
        <AuditRow key={item.id} item={item} />
      ))}
    </section>
  );
}

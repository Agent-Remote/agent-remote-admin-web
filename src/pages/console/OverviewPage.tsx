import {
  AlertTriangle,
  Database,
  FileClock,
  FolderSync,
  KeyRound,
  Laptop,
  MonitorUp,
  Server,
  TerminalSquare,
  Users
} from "lucide-react";
import {
  EmptyBlock,
  PanelTitle
} from "../../components/ui";
import { useI18n } from "../../i18n/I18nProvider";
import type { NodeTask } from "../../types";
import {
  AuditRow,
  TaskRow
} from "./ResourceDetails";
import type { ConsolePageProps } from "./types";
export function OverviewPage({
  users,
  devices,
  accounts,
  nodes,
  workspaces,
  syncSessions,
  toolSessions,
  browserSessions,
  failedTasks,
  auditLogs,
  isAdmin
}: ConsolePageProps & { failedTasks: NodeTask[]; isAdmin: boolean }) {
  const { t } = useI18n();
  const sharedCards = [
    [t("nav.devices"), devices.length, Laptop],
    [t("nav.accounts"), accounts.length, KeyRound],
    [t("sync.workspaces"), workspaces.length, Database],
    [t("nav.sync"), syncSessions.length, FolderSync],
    [t("nav.sessions"), toolSessions.length, TerminalSquare],
    [t("nav.browser"), browserSessions.length, MonitorUp]
  ] as const;
  const cards = isAdmin
    ? [
        [t("nav.users"), users.length, Users] as const,
        [t("nav.nodes"), nodes.length, Server] as const,
        ...sharedCards
      ]
    : sharedCards;
  return (
    <div className="content-grid">
      <section className="metric-grid">
        {cards.map(([label, count, Icon]) => (
          <div className="metric" key={label}>
            <Icon size={20} />
            <strong>{count}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>
      {isAdmin ? (
        <section className="panel danger-panel">
          <PanelTitle icon={AlertTriangle} title={t("overview.failedTasks")} />
          {failedTasks.length === 0 ? (
            <EmptyBlock label={t("common.empty")} />
          ) : (
            failedTasks.slice(0, 6).map((task) => <TaskRow key={task.id} task={task} />)
          )}
        </section>
      ) : null}
      <section className="panel">
        <PanelTitle icon={FileClock} title={t("overview.recentAudit")} />
        {auditLogs.length === 0 ? (
          <EmptyBlock label={t("common.empty")} />
        ) : (
          auditLogs.slice(0, 8).map((item) => <AuditRow key={item.id} item={item} />)
        )}
      </section>
    </div>
  );
}

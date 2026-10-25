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
  const totalResources = cards.map((card) => Number(card[1])).reduce((total: number, count: number) => total + count, 0);
  return (
    <div className="content-grid">
      <section className="overview-hero">
        <div className="overview-hero-copy">
          <span className="eyebrow">{t("overview.pageKicker")}</span>
          <h1>{t("overview.heroTitle")}</h1>
          <p>{t("overview.heroCopy")}</p>
        </div>
        <div className="overview-hero-signal" aria-label={t("overview.systemStatus")}>
          <span className="signal-orbit" aria-hidden="true"><i /></span>
          <div>
            <span>{t("overview.systemStatus")}</span>
            <strong>{t("overview.systemHealthy")}</strong>
            <small>{t("overview.signalDetail")}</small>
          </div>
        </div>
      </section>
      <section className="overview-intel" aria-label={t("overview.quickPulse")}>
        <div className="intel-stat">
          <span>{t("overview.activeResources")}</span>
          <strong>{totalResources}</strong>
          <small>{t("overview.activeResourcesDetail")}</small>
        </div>
        <div className="intel-signal">
          <div className="intel-signal-head">
            <span>{t("overview.networkSignal")}</span>
            <strong>{t("overview.signalStable")}</strong>
          </div>
          <div className="signal-bars" aria-hidden="true">
            {[36, 52, 44, 68, 58, 78, 64, 92, 76, 88, 70, 100].map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
        <div className="intel-note">
          <span>{t("overview.recentActivity")}</span>
          <strong>{t("overview.recentActivityDetail")}</strong>
          <small>{t("overview.recentActivityHint")}</small>
        </div>
      </section>
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

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
import { formatDate } from "../../utils/format";

const healthyNodeStatuses = new Set(["active", "healthy", "ready", "online", "connected"]);
const liveResourceStatuses = new Set([
  "active",
  "creating",
  "connected",
  "degraded",
  "queued",
  "ready",
  "running",
  "starting",
  "watching"
]);

function isLiveStatus(status: string) {
  return liveResourceStatuses.has(status.toLowerCase());
}

function nodeIsHealthy(node: ConsolePageProps["nodes"][number], now: number) {
  if (!healthyNodeStatuses.has(node.status.toLowerCase())) return false;
  if (!node.last_heartbeat_at) return false;
  const heartbeat = Date.parse(node.last_heartbeat_at);
  return Number.isFinite(heartbeat) && now - heartbeat <= 5 * 60 * 1000;
}
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
  const { locale, t } = useI18n();
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
  const activeResources = [
    devices.filter((item) => item.status.toLowerCase() === "active").length,
    accounts.filter((item) => item.status.toLowerCase() === "active").length,
    workspaces.length,
    syncSessions.filter((item) => isLiveStatus(item.status)).length,
    toolSessions.filter((item) => isLiveStatus(item.status)).length,
    browserSessions.filter((item) => isLiveStatus(item.status)).length,
    ...(isAdmin ? [users.filter((item) => item.status.toLowerCase() === "active").length] : []),
    ...(isAdmin ? [nodes.filter((item) => isLiveStatus(item.status)).length] : [])
  ].reduce((total, count) => total + count, 0);
  const now = Date.now();
  const healthyNodes = nodes.filter((node) => nodeIsHealthy(node, now)).length;
  const unhealthyNodes = nodes.filter((node) => !nodeIsHealthy(node, now)).length;
  const syncIssues = syncSessions.filter(
    (session) => session.status.toLowerCase() === "failed" || session.conflict_status.toLowerCase() !== "clean"
  ).length;
  // A session or sync record cannot stand in for node heartbeat telemetry.
  // Keep the health card unknown until the node endpoint has returned data.
  const hasHealthData = nodes.length > 0;
  const hasIssues = failedTasks.length > 0 || syncIssues > 0 || unhealthyNodes > 0;
  const latestAudit = auditLogs.reduce<typeof auditLogs[number] | undefined>(
    (latest, item) => (!latest || Date.parse(item.created_at) > Date.parse(latest.created_at) ? item : latest),
    undefined
  );
  const nodeSignalBars = nodes.map((node) => ({
    height: nodeIsHealthy(node, now) ? 100 : healthyNodeStatuses.has(node.status.toLowerCase()) ? 52 : 24,
    label: node.name
  }));
  const healthLabel = !hasHealthData
    ? t("overview.systemNoData")
    : hasIssues
      ? t("overview.systemAttention")
      : t("overview.systemHealthy", { healthy: healthyNodes, total: nodes.length });
  const healthDetail = !hasHealthData
    ? t("overview.signalNoData")
    : t("overview.signalDetail", { nodes: nodes.length, healthy: healthyNodes });
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
            <strong>{healthLabel}</strong>
            <small>{healthDetail}</small>
          </div>
        </div>
      </section>
      <section className="overview-intel" aria-label={t("overview.quickPulse")}>
        <div className="intel-stat">
          <span>{t("overview.activeResources")}</span>
          <strong>{activeResources}</strong>
          <small>{t("overview.activeResourcesDetail", { active: activeResources, total: totalResources })}</small>
        </div>
        <div className="intel-signal">
          <div className="intel-signal-head">
            <span>{t("overview.networkSignal")}</span>
            <strong>
              {nodes.length > 0
                ? t("overview.signalNodes", { healthy: healthyNodes, total: nodes.length })
                : t("overview.signalNoData")}
            </strong>
          </div>
          {nodeSignalBars.length > 0 ? (
            <div className="signal-bars" aria-label={t("overview.signalBarsLabel")}>
              {nodeSignalBars.map((bar) => (
                <i key={bar.label} aria-label={bar.label} style={{ height: `${bar.height}%` }} />
              ))}
            </div>
          ) : <div className="signal-empty">{t("overview.signalNoData")}</div>}
        </div>
        <div className="intel-note">
          <span>{t("overview.recentActivity")}</span>
          <strong>
            {latestAudit
              ? t("overview.recentActivityEvents", { count: auditLogs.length })
              : t("overview.recentActivityNone")}
          </strong>
          <small>
            {latestAudit
              ? t("overview.recentActivityHint", { time: formatDate(latestAudit.created_at, locale) })
              : t("overview.recentActivityNoData")}
          </small>
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

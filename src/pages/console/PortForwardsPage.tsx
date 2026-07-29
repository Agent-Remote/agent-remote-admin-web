import { Cable, LoaderCircle, RefreshCw, Square } from "lucide-react";
import { useConfirm } from "../../app/ConfirmProvider";
import { stopPortForward } from "../../api/portForwards";
import { EmptyBlock, PanelTitle, ResourceRow, StatusPill } from "../../components/ui";
import { useI18n } from "../../i18n/I18nProvider";
import type { NodeItem, PortForward, User } from "../../types";
import { formatBytes, formatDate, shortId } from "../../utils/format";
import type { ConsolePageProps } from "./types";

export function PortForwardsPage({
  busy,
  isAdmin,
  loadAll,
  nodes,
  portForwards,
  portForwardsError,
  portForwardsLoading,
  portForwardsRefreshing,
  request,
  runAction,
  users
}: ConsolePageProps & { isAdmin: boolean }) {
  const { t } = useI18n();
  const confirmAction = useConfirm();

  if (portForwardsLoading) {
    return (
      <section className="panel data-state" aria-live="polite">
        <LoaderCircle className="spin" size={18} />
        <span>{t("forwards.loading")}</span>
      </section>
    );
  }

  if (portForwardsError) {
    return (
      <section className="panel data-state" role="alert">
        <span>{t("forwards.loadFailed")}</span>
        <button disabled={portForwardsRefreshing} onClick={() => void loadAll()} type="button">
          <RefreshCw className={portForwardsRefreshing ? "spin" : ""} size={16} />
          {t("common.retry")}
        </button>
      </section>
    );
  }

  return (
    <section className="panel">
      <PanelTitle
        icon={Cable}
        title={t("forwards.title")}
        action={
          portForwardsRefreshing ? (
            <span className="inline-state" role="status">
              <LoaderCircle className="spin" size={14} />
              {t("common.syncing")}
            </span>
          ) : null
        }
      />
      {portForwards.length === 0 ? <EmptyBlock label={t("forwards.empty")} /> : null}
      {portForwards.map((forward) => (
        <ResourceRow
          key={forward.id}
          title={
            <span className="forward-title">
              <span>{t("forwards.portPair", { local: forward.requested_local_port, remote: forward.remote_port })}</span>
              <StatusPill status={forward.status} />
            </span>
          }
          meta={
            <ForwardMetadata
              forward={forward}
              isAdmin={isAdmin}
              node={nodes.find((node) => node.id === forward.node_id)}
              t={t}
              user={users.find((user) => user.id === forward.user_id)}
            />
          }
          actions={
            !isTerminal(forward.status) ? (
              <button
                className="danger-ghost"
                disabled={busy}
                onClick={async () => {
                  const label = `${shortId(forward.session_id)}:${forward.remote_port}`;
                  if (await confirmAction(t("forwards.confirmStop", { name: label }))) {
                    void runAction(
                      () => stopPortForward(request, forward.id).then(() => undefined),
                      t("forwards.stopped")
                    );
                  }
                }}
                type="button"
              >
                <Square size={14} />
                {t("forwards.stop")}
              </button>
            ) : null
          }
        />
      ))}
    </section>
  );
}

function ForwardMetadata({
  forward,
  isAdmin,
  node,
  t,
  user
}: {
  forward: PortForward;
  isAdmin: boolean;
  node?: NodeItem;
  t: (key: Parameters<ReturnType<typeof useI18n>["t"]>[0], values?: Record<string, string | number>) => string;
  user?: User;
}) {
  return (
    <span className="forward-meta">
      {isAdmin ? (
        <span>{t("forwards.owner", { owner: user?.display_name ?? shortId(forward.user_id) })}</span>
      ) : null}
      <span>{t("forwards.session", { id: shortId(forward.session_id) })}</span>
      <span>{t("forwards.node", { node: node?.name ?? shortId(forward.node_id) })}</span>
      <span>{t("forwards.connections", { count: forward.connection_count })}</span>
      <span>{t("forwards.traffic", { up: formatBytes(forward.bytes_up), down: formatBytes(forward.bytes_down) })}</span>
      <span>{t("forwards.expires", { time: formatDate(forward.expires_at) })}</span>
      {forward.stop_reason ? <span>{t("forwards.reason", { reason: forward.stop_reason })}</span> : null}
    </span>
  );
}

function isTerminal(status: string): boolean {
  return ["stopped", "expired", "revoked", "failed"].includes(status);
}

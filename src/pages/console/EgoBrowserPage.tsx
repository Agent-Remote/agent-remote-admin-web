import {
  Ban,
  CircleStop,
  Laptop,
  LoaderCircle,
  MonitorCog,
  RefreshCw,
  Square,
  TriangleAlert
} from "lucide-react";
import { Fragment, useState } from "react";
import { useConfirm } from "../../app/ConfirmProvider";
import { EmptyBlock, PanelTitle, ResourceRow, StatusPill } from "../../components/ui";
import { useI18n } from "../../i18n/I18nProvider";
import { formatBytes, formatDate, shortId } from "../../utils/format";
import type { EgoBrowserBinding, EgoBrowserRequest } from "../../types";
import type { ConsolePageProps } from "./types";

const terminalStatuses = new Set(["stopped", "expired", "failed", "revoked"]);

export function EgoBrowserPage({
  busy,
  egoBrowserBindings,
  egoBrowserDevices,
  egoBrowserRequestStates,
  egoBrowserError,
  egoBrowserLoading,
  egoBrowserRefreshing,
  loadAll,
  me,
  request,
  runAction,
  toolSessions,
  users
}: ConsolePageProps) {
  const { locale, t } = useI18n();
  const confirmAction = useConfirm();
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);

  async function cancelRequest(
    binding: EgoBrowserBinding,
    browserRequest: EgoBrowserRequest
  ) {
    if (
      !(await confirmAction(
        t("egoBrowser.confirmCancelRequest", { request: shortId(browserRequest.request_id) })
      ))
    ) {
      return;
    }
    setCancellingRequestId(browserRequest.id);
    try {
      await runAction(
        () =>
          request(
            `/ego-browser/bindings/${binding.id}/requests/${encodeURIComponent(browserRequest.request_id)}/cancel`,
            {
              method: "POST",
              body: JSON.stringify({
                generation: browserRequest.generation,
                sequence: browserRequest.sequence
              })
            }
          ).then(() => undefined),
        t("egoBrowser.cancelSubmitted")
      );
    } finally {
      setCancellingRequestId(null);
    }
  }

  return (
    <div className="ego-browser-page">
      <section className="trust-warning" aria-labelledby="ego-browser-trust-title">
        <TriangleAlert aria-hidden="true" size={20} />
        <div>
          <h2 id="ego-browser-trust-title">{t("egoBrowser.fullTrustTitle")}</h2>
          <p>{t("egoBrowser.fullTrustWarning")}</p>
          {egoBrowserDevices.some(
            (device) => device.release_profile === "community-local-trust"
          ) ? (
            <p>{t("egoBrowser.communityTrust")}</p>
          ) : null}
        </div>
      </section>

      {egoBrowserLoading ? (
        <div className="browser-data-state" role="status">
          <span>{t("egoBrowser.loading")}</span>
          <i aria-hidden="true" />
          <i aria-hidden="true" />
        </div>
      ) : null}
      {egoBrowserError ? (
        <div className="browser-data-error" role="alert">
          <span>{t("egoBrowser.loadFailed")}</span>
          <button disabled={egoBrowserRefreshing} onClick={() => void loadAll()} type="button">
            <RefreshCw className={egoBrowserRefreshing ? "spin" : ""} size={15} />
            {t("common.retry")}
          </button>
        </div>
      ) : null}
      {egoBrowserRefreshing && !egoBrowserLoading ? (
        <div className="inline-state" role="status">
          {t("egoBrowser.refreshing")}
        </div>
      ) : null}

      {!egoBrowserLoading && !egoBrowserError ? (
        <div className="ego-browser-columns">
          <section className="panel">
            <PanelTitle icon={Laptop} title={t("egoBrowser.devicesTitle")} />
            {egoBrowserDevices.length === 0 ? (
              <EmptyBlock label={t("egoBrowser.devicesEmpty")} />
            ) : null}
            {egoBrowserDevices.map((device) => {
              const owner = users.find((item) => item.id === device.user_id);
              const runtime =
                device.local_ego_browser_runtime_version ??
                device.ego_lite_runtime_version ??
                t("common.unknown");
              return (
                <ResourceRow
                  key={device.id}
                  title={`${t("egoBrowser.deviceLabel")} ${shortId(device.id)}`}
                  meta={`${t("egoBrowser.owner", { owner: owner?.display_name ?? shortId(device.user_id) })} · ${t("egoBrowser.runtime", { version: runtime })} · ${t("egoBrowser.skill", { version: device.skill_version ?? t("common.unknown") })} · ${t("egoBrowser.generation", { generation: device.generation })} · ${t("egoBrowser.lastSeen", { time: device.last_seen_at ? formatDate(device.last_seen_at, locale) : t("common.unknown") })}`}
                  actions={<StatusPill status={device.status} />}
                />
              );
            })}
          </section>

          <section className="panel">
            <PanelTitle icon={MonitorCog} title={t("egoBrowser.bindingsTitle")} />
            {egoBrowserBindings.length === 0 ? (
              <EmptyBlock label={t("egoBrowser.bindingsEmpty")} />
            ) : null}
            {egoBrowserBindings.map((binding) => {
              const owner = users.find((item) => item.id === binding.user_id);
              const session = toolSessions.find(
                (item) => item.id === binding.tool_session_id
              );
              const sessionLabel = session?.project_key ?? shortId(binding.tool_session_id);
              const stopDisabled = busy || terminalStatuses.has(binding.status);
              const revokeDisabled = busy || binding.status === "revoked";
              const requestState = egoBrowserRequestStates[binding.id];
              return (
                <Fragment key={binding.id}>
                  <ResourceRow
                    title={`${sessionLabel} · ${shortId(binding.id)}`}
                    meta={`${t("egoBrowser.owner", { owner: owner?.display_name ?? shortId(binding.user_id) })} · ${t("egoBrowser.generation", { generation: binding.generation })} · ${t("egoBrowser.lease", { health: binding.lease_health, time: binding.lease_until ? formatDate(binding.lease_until, locale) : t("common.unknown") })} · ${t("egoBrowser.versions", { bridge: binding.bridge_protocol_version, runtime: binding.local_runtime_version ?? t("common.unknown"), skill: binding.skill_version ?? t("common.unknown") })}`}
                    actions={
                      <>
                        <StatusPill status={binding.status} />
                        <button
                          disabled={stopDisabled}
                          onClick={async () => {
                            if (
                              await confirmAction(
                                t("egoBrowser.confirmStop", { name: sessionLabel })
                              )
                            ) {
                              void runAction(
                                () =>
                                  request(`/ego-browser/bindings/${binding.id}/stop`, {
                                    method: "POST",
                                    body: JSON.stringify({
                                      generation: binding.generation,
                                      reason: me.role === "admin" ? "admin_stop" : "user_stop"
                                    })
                                  }).then(() => undefined),
                                t("egoBrowser.stopped")
                              );
                            }
                          }}
                          type="button"
                        >
                          <Square size={14} />
                          {t("egoBrowser.stop")}
                        </button>
                        <button
                          className="danger-ghost"
                          disabled={revokeDisabled}
                          onClick={async () => {
                            if (
                              await confirmAction(
                                t("egoBrowser.confirmRevoke", { name: sessionLabel })
                              )
                            ) {
                              void runAction(
                                () =>
                                  request(`/ego-browser/bindings/${binding.id}/revoke`, {
                                    method: "POST",
                                    body: JSON.stringify({
                                      generation: binding.generation,
                                      reason: me.role === "admin" ? "admin_revoke" : "user_revoke"
                                    })
                                  }).then(() => undefined),
                                t("egoBrowser.revoked")
                              );
                            }
                          }}
                          type="button"
                        >
                          <Ban size={14} />
                          {t("common.revoke")}
                        </button>
                      </>
                    }
                  />
                  {requestState ? (
                    <div
                      className="ego-browser-request-list"
                      aria-label={t("egoBrowser.activeRequestsTitle", { name: sessionLabel })}
                    >
                      {requestState.loading ? (
                        <div className="ego-browser-request-state" role="status">
                          <LoaderCircle className="spin" size={14} />
                          {t("egoBrowser.requestsLoading")}
                        </div>
                      ) : requestState.error ? (
                        <div className="ego-browser-request-state error" role="alert">
                          <span>{t("egoBrowser.requestsLoadFailed")}</span>
                          <button
                            disabled={requestState.refreshing}
                            onClick={() => void loadAll()}
                            type="button"
                          >
                            <RefreshCw
                              className={requestState.refreshing ? "spin" : ""}
                              size={14}
                            />
                            {t("common.retry")}
                          </button>
                        </div>
                      ) : requestState.items.length === 0 ? (
                        <div className="ego-browser-request-state">
                          {t("egoBrowser.requestsEmpty")}
                        </div>
                      ) : (
                        requestState.items.map((browserRequest) => {
                          const localPending = cancellingRequestId === browserRequest.id;
                          const cancellationRequested =
                            browserRequest.status === "cancel_requested";
                          return (
                            <ResourceRow
                              key={browserRequest.id}
                              title={t("egoBrowser.requestLabel", {
                                request: shortId(browserRequest.request_id)
                              })}
                              meta={t("egoBrowser.requestMeta", {
                                generation: browserRequest.generation,
                                sequence: browserRequest.sequence,
                                bytes: formatBytes(browserRequest.payload_bytes),
                                time: formatDate(browserRequest.created_at, locale)
                              })}
                              actions={
                                <>
                                  <StatusPill status={browserRequest.status} />
                                  <button
                                    aria-label={t("egoBrowser.cancelRequestLabel", {
                                      request: shortId(browserRequest.request_id)
                                    })}
                                    disabled={
                                      busy ||
                                      cancellingRequestId !== null ||
                                      cancellationRequested
                                    }
                                    onClick={() =>
                                      void cancelRequest(binding, browserRequest)
                                    }
                                    type="button"
                                  >
                                    {localPending ? (
                                      <LoaderCircle className="spin" size={14} />
                                    ) : (
                                      <CircleStop size={14} />
                                    )}
                                    {cancellationRequested
                                      ? t("egoBrowser.cancelPending")
                                      : t("egoBrowser.cancelRequest")}
                                  </button>
                                </>
                              }
                            />
                          );
                        })
                      )}
                    </div>
                  ) : null}
                </Fragment>
              );
            })}
          </section>
        </div>
      ) : null}
    </div>
  );
}

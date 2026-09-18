import {
  Ban,
  CircleStop,
  Laptop,
  LoaderCircle,
  MonitorCog,
  RefreshCw,
  KeyRound,
  Square,
  TriangleAlert,
  Trash2
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { useConfirm } from "../../app/ConfirmProvider";
import { EmptyBlock, PanelTitle, ResourceRow, StatusPill } from "../../components/ui";
import { useI18n } from "../../i18n/I18nProvider";
import type { MessageKey } from "../../i18n/messages";
import { formatBytes, formatDate, shortId } from "../../utils/format";
import type {
  ApiResponse,
  EgoBrowserBinding,
  EgoBrowserDevice,
  EgoBrowserLifecycleStatus,
  EgoBrowserPolicy,
  EgoBrowserRequest,
  NodeItem,
  NodeJoinCode
} from "../../types";
import type { ConsolePageProps } from "./types";

const terminalStatuses = new Set(["stopped", "expired", "failed", "revoked"]);

export function EgoBrowserPage({
  busy,
  egoBrowserBindings,
  egoBrowserDevices,
  egoBrowserRequestStates,
  egoBrowserStatus,
  egoBrowserError,
  egoBrowserLoading,
  egoBrowserPolicy,
  egoBrowserPolicyError,
  egoBrowserPolicyLoading,
  egoBrowserRefreshing,
  loadAll,
  me,
  nodes,
  request,
  runAction,
  toolSessions,
  users
}: ConsolePageProps) {
  const { locale, t } = useI18n();
  const confirmAction = useConfirm();
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);
  const [pendingResourceId, setPendingResourceId] = useState<string | null>(null);
  const [joinCodes, setJoinCodes] = useState<Record<string, NodeJoinCode>>({});
  const [joinCodeEnableIntent, setJoinCodeEnableIntent] = useState<Record<string, boolean>>({});
  const [joinCodeBusy, setJoinCodeBusy] = useState<string | null>(null);
  const [joinCodeError, setJoinCodeError] = useState<string | null>(null);

  const lifecycle = useMemo(
    () => deriveLifecycle(egoBrowserStatus),
    [egoBrowserStatus]
  );

  async function issueJoinCode(node: NodeItem) {
    setJoinCodeBusy(node.id);
    setJoinCodeError(null);
    try {
      const response = await request<ApiResponse<NodeJoinCode>>(
        `/nodes/${node.id}/join-code`,
        {
          method: "POST",
          body: JSON.stringify({
            expires_in_seconds: 900,
            ego_browser_enabled: joinCodeEnableIntent[node.id] ?? false
          })
        }
      );
      setJoinCodes((current) => ({ ...current, [node.id]: response.data }));
    } catch {
      setJoinCodeError(node.id);
    } finally {
      setJoinCodeBusy(null);
    }
  }

  async function revokeJoinCode(node: NodeItem) {
    setJoinCodeBusy(node.id);
    setJoinCodeError(null);
    try {
      await request(`/nodes/${node.id}/join-code/revoke`, { method: "POST" });
      setJoinCodes((current) => {
        const next = { ...current };
        delete next[node.id];
        return next;
      });
    } catch {
      setJoinCodeError(node.id);
    } finally {
      setJoinCodeBusy(null);
    }
  }

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
                binding_generation: requestBindingGeneration(browserRequest),
                generation: requestBindingGeneration(browserRequest),
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

      <section className="panel ego-browser-lifecycle" aria-labelledby="ego-browser-lifecycle-title">
        <PanelTitle icon={MonitorCog} title={t("egoBrowser.lifecycleTitle")} />
        <div className="ego-browser-state-grid" role="list">
          {lifecycle.map((item) => (
            <div className="ego-browser-state-item" key={item.key} role="listitem">
              <span>{t(item.label)}</span>
              <StatusPill
                status={item.value === null ? "unknown" : item.value ? "active" : "disabled"}
              />
            </div>
          ))}
        </div>
        <p className="muted-copy">{t("egoBrowser.lifecycleBoundary")}</p>
        <div className="ego-browser-admission" aria-label={t("egoBrowser.admissionTitle")}>
          <span>
            {t("egoBrowser.enrollmentAdmission")}: {egoBrowserPolicyLoading
              ? t("egoBrowser.admissionLoading")
              : egoBrowserPolicyError
                ? t("egoBrowser.admissionUnavailable")
                : egoBrowserPolicy?.enrollment_enabled
                  ? t("common.enabled")
                  : t("common.disabled")}
          </span>
          <span>
            {t("egoBrowser.executionAdmission")}: {egoBrowserPolicyLoading
              ? t("egoBrowser.admissionLoading")
              : egoBrowserPolicyError
                ? t("egoBrowser.admissionUnavailable")
                : egoBrowserPolicy?.execution_admission
                  ? t("common.enabled")
                  : t("common.disabled")}
          </span>
        </div>
      </section>

      {me.role === "admin" ? (
        <section className="panel" aria-labelledby="ego-browser-join-code-title">
          <PanelTitle icon={KeyRound} title={t("egoBrowser.joinCodesTitle")} />
          <p className="muted-copy">{t("egoBrowser.joinCodesBoundary")}</p>
          {nodes.length === 0 ? <EmptyBlock label={t("egoBrowser.joinCodesEmpty")} /> : null}
          {joinCodeError ? (
            <div className="browser-data-error" role="alert">
              {t("egoBrowser.joinCodeFailed")}
            </div>
          ) : null}
          {nodes.map((node) => {
            const joinCode = joinCodes[node.id];
            const expired = joinCode
              ? new Date(joinCode.expires_at).getTime() <= Date.now()
              : false;
            return (
              <ResourceRow
                key={node.id}
                title={node.name}
                meta={`${t("egoBrowser.joinCodeNodeMeta", {
                  status: node.status,
                  enabled: node.ego_browser_enabled ?? false
                    ? t("common.enabled")
                    : t("common.disabled")
                })} · ${t("egoBrowser.nodeCapabilityMeta", {
                  configured: node.configured_enabled ?? node.ego_browser_enabled ?? false
                    ? t("common.enabled")
                    : t("common.disabled"),
                  effective: node.effective_enabled ?? false
                    ? t("common.enabled")
                    : t("common.disabled"),
                  allowed: node.node_execution_allowed ?? false
                    ? t("common.enabled")
                    : t("common.disabled")
                })}`}
                actions={
                  <>
                    {joinCode && !expired ? (
                      <code className="one-time-join-code" aria-label={t("egoBrowser.joinCodeValue")}>
                        {joinCode.code}
                      </code>
                    ) : joinCode && expired ? (
                      <StatusPill status="expired" />
                    ) : null}
                    <label className="check-line join-code-intent">
                      <input
                        type="checkbox"
                        checked={joinCodeEnableIntent[node.id] ?? false}
                        disabled={busy || joinCodeBusy !== null}
                        onChange={(event) =>
                          setJoinCodeEnableIntent((current) => ({
                            ...current,
                            [node.id]: event.target.checked
                          }))
                        }
                      />
                      <span>{t("egoBrowser.joinCodeEnableIntent")}</span>
                    </label>
                    <button
                      disabled={busy || joinCodeBusy !== null}
                      onClick={() => void issueJoinCode(node)}
                      type="button"
                    >
                      <KeyRound size={14} />
                      {joinCode && !expired
                        ? t("egoBrowser.joinCodeRotate")
                        : t("egoBrowser.joinCodeGenerate")}
                    </button>
                    {joinCode ? (
                      <button
                        className="danger-ghost"
                        disabled={busy || joinCodeBusy !== null}
                        onClick={() => void revokeJoinCode(node)}
                        type="button"
                      >
                        <Ban size={14} />
                        {t("egoBrowser.joinCodeRevoke")}
                      </button>
                    ) : null}
                  </>
                }
              />
            );
          })}
        </section>
      ) : null}

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
              const hasBindingHistory = egoBrowserBindings.some(
                (binding) => binding.ego_browser_device_id === device.id
              );
              return (
                <ResourceRow
                  key={device.id}
                  title={`${t("egoBrowser.deviceLabel")} ${shortId(device.id)}`}
                  meta={`${t("egoBrowser.owner", { owner: owner?.display_name ?? shortId(device.user_id) })} · ${t("egoBrowser.runtime", { version: runtime })} · ${t("egoBrowser.skill", { version: device.skill_version ?? t("common.unknown") })} · ${t("egoBrowser.generation", { generation: deviceGeneration(device) })} · ${t("egoBrowser.lastSeen", { time: device.last_seen_at ? formatDate(device.last_seen_at, locale) : t("common.unknown") })}`}
                  actions={
                    <>
                      <StatusPill status={device.status} />
                      <button
                        className="danger-ghost"
                        disabled={
                          busy ||
                          pendingResourceId !== null ||
                          device.status === "revoked"
                        }
                        onClick={async () => {
                          if (
                            await confirmAction(
                              t("egoBrowser.confirmRevokeDevice", {
                                name: `${t("egoBrowser.deviceLabel")} ${shortId(device.id)}`
                              })
                            )
                          ) {
                            setPendingResourceId(`device:${device.id}`);
                            try {
                              await runAction(
                                () =>
                                  request(`/ego-browser/devices/${device.id}/revoke`, {
                                    method: "POST",
                                    body: JSON.stringify({
                                      device_generation: deviceGeneration(device),
                                      generation: deviceGeneration(device),
                                      reason: me.role === "admin" ? "admin_revoke" : "user_revoke"
                                    })
                                  }).then(() => undefined),
                                t("egoBrowser.deviceRevoked")
                              );
                            } finally {
                              setPendingResourceId(null);
                            }
                          }
                        }}
                        type="button"
                      >
                        <Ban size={14} />
                        {t("egoBrowser.revokeDevice")}
                      </button>
                      <button
                        className="danger-ghost"
                        disabled={
                          busy ||
                          pendingResourceId !== null ||
                          device.status !== "revoked" ||
                          hasBindingHistory
                        }
                        onClick={async () => {
                          if (
                            await confirmAction(
                              t("egoBrowser.confirmDeleteDevice", {
                                name: `${t("egoBrowser.deviceLabel")} ${shortId(device.id)}`
                              })
                            )
                          ) {
                            setPendingResourceId(`device:${device.id}`);
                            try {
                              await runAction(
                                () =>
                                  request(`/ego-browser/devices/${device.id}`, {
                                    method: "DELETE"
                                  }).then(() => undefined),
                                t("egoBrowser.deviceDeleted")
                              );
                            } finally {
                              setPendingResourceId(null);
                            }
                          }
                        }}
                        type="button"
                      >
                        <Trash2 size={14} />
                        {t("common.delete")}
                      </button>
                    </>
                  }
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
              const stopDisabled =
                busy || pendingResourceId !== null || terminalStatuses.has(binding.status);
              const revokeDisabled =
                busy || pendingResourceId !== null || binding.status === "revoked";
              const deleteDisabled =
                busy ||
                pendingResourceId !== null ||
                !terminalStatuses.has(binding.status);
              const requestState = egoBrowserRequestStates[binding.id];
              return (
                <Fragment key={binding.id}>
                  <ResourceRow
                    title={`${sessionLabel} · ${shortId(binding.id)}`}
                    meta={`${t("egoBrowser.owner", { owner: owner?.display_name ?? shortId(binding.user_id) })} · ${t("egoBrowser.generation", { generation: bindingGeneration(binding) })} · ${t("egoBrowser.lease", { health: binding.lease_health, time: binding.lease_until ? formatDate(binding.lease_until, locale) : t("common.unknown") })} · ${t("egoBrowser.versions", { bridge: binding.bridge_protocol_version, runtime: binding.local_runtime_version ?? t("common.unknown"), skill: binding.skill_version ?? t("common.unknown") })}`}
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
                              setPendingResourceId(`binding:${binding.id}`);
                              try {
                                await runAction(
                                  () =>
                                    request(`/ego-browser/bindings/${binding.id}/stop`, {
                                      method: "POST",
                                      body: JSON.stringify({
                                        binding_generation: bindingGeneration(binding),
                                        generation: bindingGeneration(binding),
                                        reason: me.role === "admin" ? "admin_stop" : "user_stop"
                                      })
                                    }).then(() => undefined),
                                  t("egoBrowser.stopped")
                                );
                              } finally {
                                setPendingResourceId(null);
                              }
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
                              setPendingResourceId(`binding:${binding.id}`);
                              try {
                                await runAction(
                                  () =>
                                    request(`/ego-browser/bindings/${binding.id}/revoke`, {
                                      method: "POST",
                                      body: JSON.stringify({
                                        binding_generation: bindingGeneration(binding),
                                        generation: bindingGeneration(binding),
                                        reason: me.role === "admin" ? "admin_revoke" : "user_revoke"
                                      })
                                    }).then(() => undefined),
                                  t("egoBrowser.revoked")
                                );
                              } finally {
                                setPendingResourceId(null);
                              }
                            }
                          }}
                          type="button"
                        >
                          <Ban size={14} />
                          {t("common.revoke")}
                        </button>
                        <button
                          className="danger-ghost"
                          disabled={deleteDisabled}
                          onClick={async () => {
                            if (
                              await confirmAction(
                                t("egoBrowser.confirmDeleteBinding", { name: sessionLabel })
                              )
                            ) {
                              setPendingResourceId(`binding:${binding.id}`);
                              try {
                                await runAction(
                                  () =>
                                    request(`/ego-browser/bindings/${binding.id}`, {
                                      method: "DELETE"
                                    }).then(() => undefined),
                                  t("egoBrowser.bindingDeleted")
                                );
                              } finally {
                                setPendingResourceId(null);
                              }
                            }
                          }}
                          type="button"
                        >
                          <Trash2 size={14} />
                          {t("common.delete")}
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
                                binding_generation: requestBindingGeneration(browserRequest),
                                generation: requestBindingGeneration(browserRequest),
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

function deriveLifecycle(
  status?: EgoBrowserLifecycleStatus
): Array<{ key: string; label: MessageKey; value: boolean | null }> {
  const state = status?.state;
  return [
    { key: "installed", label: "egoBrowser.stateInstalled", value: state?.installed ?? null },
    { key: "enabled", label: "egoBrowser.stateEnabled", value: state?.enabled ?? null },
    { key: "registered", label: "egoBrowser.stateRegistered", value: state?.registered ?? null },
    { key: "available", label: "egoBrowser.stateAvailable", value: state?.available ?? null },
    { key: "connected", label: "egoBrowser.stateConnected", value: state?.connected ?? null }
  ];
}

function deviceGeneration(device: Pick<EgoBrowserDevice, "generation" | "device_generation">): number {
  return device.device_generation ?? device.generation;
}

function bindingGeneration(
  binding: Pick<EgoBrowserBinding, "generation" | "binding_generation">
): number {
  return binding.binding_generation ?? binding.generation;
}

function requestBindingGeneration(
  request: Pick<EgoBrowserRequest, "generation" | "binding_generation">
): number {
  return request.binding_generation ?? request.generation;
}

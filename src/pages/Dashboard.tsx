import { LogOut, Menu, RefreshCw, X } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { navigationItems } from "../app/navigation";
import { BrandMark, NoticeBar } from "../components/ui";
import { useI18n } from "../i18n/I18nProvider";
import type { Page } from "../types";
import type { ConsolePageProps } from "./console/types";

const AccountsPage = lazy(() => import("./console/AccountsPage").then((module) => ({ default: module.AccountsPage })));
const AuditPage = lazy(() => import("./console/AuditPage").then((module) => ({ default: module.AuditPage })));
const BrowserPage = lazy(() => import("./console/BrowserPage").then((module) => ({ default: module.BrowserPage })));
const CredentialsPage = lazy(() => import("./console/CredentialsPage").then((module) => ({ default: module.CredentialsPage })));
const DevicesPage = lazy(() => import("./console/DevicesPage").then((module) => ({ default: module.DevicesPage })));
const NodesPage = lazy(() => import("./console/NodesPage").then((module) => ({ default: module.NodesPage })));
const OverviewPage = lazy(() => import("./console/OverviewPage").then((module) => ({ default: module.OverviewPage })));
const SessionsPage = lazy(() => import("./console/SessionsPage").then((module) => ({ default: module.SessionsPage })));
const SettingsPage = lazy(() => import("./console/SettingsPage").then((module) => ({ default: module.SettingsPage })));
const SyncPage = lazy(() => import("./console/SyncPage").then((module) => ({ default: module.SyncPage })));
const UsersPage = lazy(() => import("./console/UsersPage").then((module) => ({ default: module.UsersPage })));

export type DashboardProps = ConsolePageProps;

export function Dashboard(props: DashboardProps) {
  const { locale, setLocale, t } = useI18n();
  const isAdmin = props.me.role === "admin";
  const [moreOpen, setMoreOpen] = useState(false);
  const visibleNavigation = navigationItems.filter((item) => !item.adminOnly || isAdmin);
  const title = navigationItems.find((item) => item.id === props.page)?.label ?? "nav.overview";
  const mobileIds: Page[] = isAdmin
    ? ["overview", "nodes", "sessions", "audit"]
    : ["overview", "accounts", "sessions", "browser"];
  const mobileNavigation = visibleNavigation.filter((item) => mobileIds.includes(item.id));
  const failedTasks = props.nodeTasks.filter((task) => task.status === "failed");

  useEffect(() => {
    if (!moreOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMoreOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  function goTo(page: Page) {
    props.setPage(page);
    setMoreOpen(false);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <BrandMark />
          <h1>{t("app.name")}</h1>
        </div>
        <div className="user-chip">
          <strong>{props.me.display_name}</strong>
          <span>{props.me.role}</span>
        </div>
        <nav className="nav-list">
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={props.page === item.id ? "active" : ""}
                onClick={() => goTo(item.id)}
                type="button"
              >
                <Icon size={17} />
                {t(item.label)}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-actions">
          <select
            aria-label={t("settings.language")}
            className="compact-select"
            value={locale}
            onChange={(event) => setLocale(event.target.value === "zh-CN" ? "zh-CN" : "en")}
          >
            <option value="en">English</option>
            <option value="zh-CN">简体中文</option>
          </select>
          <button className="ghost" onClick={props.logout} type="button">
            <LogOut size={16} />
            {t("common.logout")}
          </button>
        </div>
      </aside>
      <section className="workspace">
        <header className="toolbar">
          <div className="mobile-brand"><BrandMark /></div>
          <div className="toolbar-title">
            <strong>{t(title)}</strong>
          </div>
          <div className="sync-state">
            <span
              className={`sync-label ${props.syncError ? "error" : props.syncing ? "syncing" : ""}`}
              title={props.syncError ?? undefined}
            >
              <i />
              {props.syncError
                ? t("common.syncFailed")
                : props.syncing
                  ? t("common.syncing")
                  : t("common.autoSync")}
            </span>
            <button
              aria-label={t("common.refresh")}
              className={`icon-button ${props.syncError ? "sync-error" : ""}`}
              onClick={props.loadAll}
              disabled={props.syncing}
              title={t("common.refresh")}
              type="button"
            >
              <RefreshCw className={props.syncing ? "spin" : ""} size={16} />
            </button>
          </div>
        </header>
        <div className="page-scroll">
          <div className="page-content">
            {props.notice ? (
              <NoticeBar
                dismissLabel={t("common.dismiss")}
                notice={props.notice}
                onDismiss={() => props.setNotice(null)}
              />
            ) : null}
            <Suspense fallback={<div className="route-loading">{t("common.loading")}</div>}>
              {props.page === "overview" ? <OverviewPage {...props} failedTasks={failedTasks} isAdmin={isAdmin} /> : null}
              {props.page === "users" ? <UsersPage {...props} isAdmin={isAdmin} /> : null}
              {props.page === "devices" ? <DevicesPage {...props} /> : null}
              {props.page === "accounts" ? <AccountsPage {...props} /> : null}
              {props.page === "credentials" ? <CredentialsPage {...props} /> : null}
              {props.page === "nodes" ? <NodesPage {...props} isAdmin={isAdmin} /> : null}
              {props.page === "sessions" ? <SessionsPage {...props} /> : null}
              {props.page === "sync" ? <SyncPage {...props} /> : null}
              {props.page === "browser" ? <BrowserPage {...props} /> : null}
              {props.page === "audit" ? <AuditPage auditLogs={props.auditLogs} /> : null}
              {props.page === "settings" ? <SettingsPage {...props} /> : null}
            </Suspense>
          </div>
        </div>
      </section>
      <nav className="mobile-tabbar" aria-label={t("common.primaryNavigation")}>
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={props.page === item.id ? "active" : ""}
              key={item.id}
              onClick={() => goTo(item.id)}
              type="button"
            >
              <Icon size={19} />
              <span>{t(item.label)}</span>
            </button>
          );
        })}
        <button className={moreOpen ? "active" : ""} onClick={() => setMoreOpen(true)} type="button">
          <Menu size={19} />
          <span>{t("common.more")}</span>
        </button>
      </nav>
      {moreOpen ? (
        <div className="mobile-drawer-layer">
          <button
            aria-label={t("common.dismiss")}
            className="mobile-drawer-scrim"
            onClick={() => setMoreOpen(false)}
            type="button"
          />
          <section className="mobile-drawer" aria-label={t("common.allFeatures")}>
            <div className="mobile-drawer-head">
              <div>
                <strong>{props.me.display_name}</strong>
                <span>{props.me.role}</span>
              </div>
              <button
                aria-label={t("common.dismiss")}
                className="icon-button"
                onClick={() => setMoreOpen(false)}
                title={t("common.dismiss")}
                type="button"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mobile-drawer-grid">
              {visibleNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    className={props.page === item.id ? "active" : ""}
                    key={item.id}
                    onClick={() => goTo(item.id)}
                    type="button"
                  >
                    <Icon size={20} />
                    <span>{t(item.label)}</span>
                  </button>
                );
              })}
            </div>
            <div className="mobile-drawer-actions">
              <select
                aria-label={t("settings.language")}
                value={locale}
                onChange={(event) => setLocale(event.target.value === "zh-CN" ? "zh-CN" : "en")}
              >
                <option value="en">English</option>
                <option value="zh-CN">简体中文</option>
              </select>
              <button className="danger-ghost" onClick={props.logout} type="button">
                <LogOut size={16} />{t("common.logout")}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

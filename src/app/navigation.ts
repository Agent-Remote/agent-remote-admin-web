import {
  Activity,
  BriefcaseBusiness,
  FileClock,
  FolderSync,
  KeyRound,
  Laptop,
  MonitorUp,
  Server,
  Settings,
  TerminalSquare,
  Users,
  type LucideIcon
} from "lucide-react";
import type { MessageKey } from "../i18n/messages";
import type { Page } from "../types";

export type NavigationItem = {
  id: Page;
  label: MessageKey;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export const navigationItems: NavigationItem[] = [
  { id: "overview", label: "nav.overview", icon: Activity },
  { id: "users", label: "nav.users", icon: Users, adminOnly: true },
  { id: "devices", label: "nav.devices", icon: Laptop },
  { id: "accounts", label: "nav.accounts", icon: KeyRound },
  { id: "credentials", label: "nav.credentials", icon: BriefcaseBusiness },
  { id: "nodes", label: "nav.nodes", icon: Server, adminOnly: true },
  { id: "sessions", label: "nav.sessions", icon: TerminalSquare },
  { id: "sync", label: "nav.sync", icon: FolderSync },
  { id: "browser", label: "nav.browser", icon: MonitorUp },
  { id: "audit", label: "nav.audit", icon: FileClock },
  { id: "settings", label: "nav.settings", icon: Settings }
];

export const pageIds = new Set<Page>(navigationItems.map((item) => item.id));

export function isPage(value: string | undefined): value is Page {
  return Boolean(value && pageIds.has(value as Page));
}

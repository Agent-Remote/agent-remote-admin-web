import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";

export const supportedLocales = ["en", "zh-CN"] as const;
export type Locale = (typeof supportedLocales)[number];
export type MessageKey = keyof typeof en;

export const messages: Record<Locale, Record<MessageKey, string>> = {
  en,
  "zh-CN": zhCN
};

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized === "zh" || normalized.startsWith("zh-")) return "zh-CN";
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  return null;
}

export function detectBrowserLocale(): Locale {
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  return resolveLocale(candidates);
}

export function resolveLocale(candidates: readonly string[]): Locale {
  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }
  return "en";
}

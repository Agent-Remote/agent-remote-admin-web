import React, { createContext, useContext, useMemo, useState } from "react";
import { type Locale, type MessageKey, messages } from "./messages";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(
    (localStorage.getItem("agentRemoteLocale") as Locale | null) ?? "en"
  );

  const value = useMemo<I18nContextValue>(() => {
    function setLocale(nextLocale: Locale) {
      localStorage.setItem("agentRemoteLocale", nextLocale);
      setLocaleState(nextLocale);
    }

    function t(key: MessageKey, values: Record<string, string | number> = {}) {
      const template = String(messages[locale][key] ?? messages.en[key] ?? key);
      return Object.entries(values).reduce(
        (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
        template
      );
    }

    return { locale, setLocale, t };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return value;
}

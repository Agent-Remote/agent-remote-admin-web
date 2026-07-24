import { describe, expect, it } from "vitest";
import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";
import { normalizeLocale, resolveLocale } from "./messages";

describe("i18n locale resolution", () => {
  it("keeps every locale in sync with the English source keys", () => {
    expect(Object.keys(zhCN).sort()).toEqual(Object.keys(en).sort());
  });

  it("normalizes browser and legacy locale variants", () => {
    expect(normalizeLocale("zh")).toBe("zh-CN");
    expect(normalizeLocale("zh-Hans-CN")).toBe("zh-CN");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("fr-FR")).toBeNull();
  });

  it("uses the first supported browser language and falls back to English", () => {
    expect(resolveLocale(["fr-FR", "zh-TW", "en-US"])).toBe("zh-CN");
    expect(resolveLocale(["fr-FR", "de-DE"])).toBe("en");
  });
});

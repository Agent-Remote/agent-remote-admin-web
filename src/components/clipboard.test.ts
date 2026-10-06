import { afterEach, describe, expect, it, vi } from "vitest";
import { copyToClipboard } from "./ui";

const clipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
const execCommand = Object.getOwnPropertyDescriptor(document, "execCommand");
afterEach(() => {
  if (clipboard) Object.defineProperty(navigator, "clipboard", clipboard);
  else Reflect.deleteProperty(navigator, "clipboard");
  if (execCommand) Object.defineProperty(document, "execCommand", execCommand);
  else Reflect.deleteProperty(document, "execCommand");
  document.body.replaceChildren();
});
function native(writeText?: (value: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: writeText ? { writeText } : undefined });
}
describe("clipboard copy", () => {
  it("awaits Unicode native copying", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    native(writeText);
    expect(await copyToClipboard("中文\nssh host")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("中文\nssh host");
    expect(document.querySelector("textarea")).toBeNull();
  });
  it.each([false, true])("falls back with focus/selection restored (denied=%s)", async (denied) => {
    native(denied ? vi.fn().mockRejectedValue(new Error("denied")) : undefined);
    const field = document.createElement("input");
    field.value = "original";
    document.body.appendChild(field); field.focus(); field.setSelectionRange(1, 4);
    const copy = vi.fn(() => {
      expect(document.querySelector("textarea")?.value).toBe("中文");
      return true;
    });
    Object.defineProperty(document, "execCommand", { configurable: true, value: copy });
    expect(await copyToClipboard("中文")).toBe(true);
    expect(copy).toHaveBeenCalledWith("copy");
    expect(document.activeElement).toBe(field);
    expect([field.selectionStart, field.selectionEnd]).toEqual([1, 4]);
    expect(document.querySelector("textarea")).toBeNull();
  });
  it.each([undefined, () => false, () => { throw new Error("denied"); }])("reports unavailable copy without rejecting", async (legacy) => {
    native(vi.fn().mockRejectedValue(new Error("denied")));
    Object.defineProperty(document, "execCommand", { configurable: true, value: legacy });
    expect(await copyToClipboard("ssh host")).toBe(false);
    expect(document.querySelector("textarea")).toBeNull();
  });
});

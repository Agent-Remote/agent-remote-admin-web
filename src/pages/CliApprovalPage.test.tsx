import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../i18n/I18nProvider";
import type { AppRequest } from "../types";
import { CliApprovalPage } from "./CliApprovalPage";

describe("CliApprovalPage", () => {
  it("loads the query code, normalizes it, and shows completion", async () => {
    window.history.replaceState({}, "", "/cli?code=ab-cd");
    const requestMock = vi.fn(async (_path: string, _options?: RequestInit) => ({ data: {} }));
    const request: AppRequest = (path, options) => requestMock(path, options) as Promise<never>;
    render(<I18nProvider><CliApprovalPage request={request} /></I18nProvider>);
    expect(screen.getByLabelText("Approval code")).toHaveValue("ab-cd");
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(requestMock).toHaveBeenCalledWith("/auth/cli/approve", {
      method: "POST", body: JSON.stringify({ user_code: "AB-CD" })
    }));
    expect(screen.getByRole("button", { name: "Approved" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("CLI login approved");
  });

  it("surfaces request failures and allows dismissing them", async () => {
    window.history.replaceState({}, "", "/cli");
    const requestMock = vi.fn(async (_path: string, _options?: RequestInit) => { throw new Error("expired code"); });
    const request: AppRequest = (path, options) => requestMock(path, options);
    render(<I18nProvider><CliApprovalPage request={request} /></I18nProvider>);
    fireEvent.change(screen.getByLabelText("Approval code"), { target: { value: "code" } });
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("expired code");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

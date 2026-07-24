import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../i18n/I18nProvider";
import { AuthPage } from "./AuthPage";

function renderAuth(
  mode: "bootstrap" | "login",
  overrides: Partial<React.ComponentProps<typeof AuthPage>> = {}
) {
  render(
    <I18nProvider>
      <AuthPage
        mode={mode}
        busy={false}
        notice={null}
        request={vi.fn()}
        setBusy={vi.fn()}
        setNotice={vi.fn()}
        onAuthenticated={vi.fn()}
        onBootstrapComplete={vi.fn()}
        {...overrides}
      />
    </I18nProvider>
  );
}

describe("AuthPage", () => {
  it("shows only login after the system is initialized", () => {
    renderAuth("login");
    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Initial setup" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create administrator" })).not.toBeInTheDocument();
  });

  it("shows only the administrator setup form on first launch", () => {
    renderAuth("bootstrap");
    expect(screen.getByRole("heading", { name: "Initial setup" })).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Login" })).not.toBeInTheDocument();
  });

  it("returns to login flow after initialization instead of authenticating", async () => {
    const request = vi.fn().mockResolvedValue({
      data: { access_token: "bootstrap-token", expires_in: 3600 }
    });
    const onAuthenticated = vi.fn();
    const onBootstrapComplete = vi.fn();
    renderAuth("bootstrap", { request, onAuthenticated, onBootstrapComplete });

    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "secret" } });
    fireEvent.submit(screen.getByRole("button", { name: "Create administrator" }).closest("form")!);

    await waitFor(() => expect(onBootstrapComplete).toHaveBeenCalledOnce());
    expect(onAuthenticated).not.toHaveBeenCalled();
  });
});

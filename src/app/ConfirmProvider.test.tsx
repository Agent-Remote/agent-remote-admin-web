import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { I18nProvider } from "../i18n/I18nProvider";
import { ConfirmProvider, useConfirm } from "./ConfirmProvider";

function ConfirmConsumer() {
  const confirm = useConfirm();
  const [result, setResult] = useState("pending");
  return (
    <>
      <button
        onClick={async () => setResult(await confirm("Delete this resource?") ? "confirmed" : "cancelled")}
        type="button"
      >
        Delete
      </button>
      <output>{result}</output>
    </>
  );
}

describe("ConfirmProvider", () => {
  it("resolves destructive confirmation through the application dialog", async () => {
    render(
      <I18nProvider>
        <ConfirmProvider><ConfirmConsumer /></ConfirmProvider>
      </I18nProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Delete this resource?");
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("confirmed")).toBeInTheDocument();
  });
});

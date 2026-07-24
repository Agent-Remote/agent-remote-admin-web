import { fireEvent, render, screen } from "@testing-library/react";
import { UserPlus } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { ResponsiveForm } from "./ui";

describe("ResponsiveForm", () => {
  it("opens from its mobile trigger and closes with Escape", () => {
    const { container } = render(
      <ResponsiveForm
        closeLabel="Close"
        icon={UserPlus}
        onSubmit={vi.fn()}
        triggerLabel="Create user"
      >
        <label htmlFor="name">Name</label>
        <input id="name" />
      </ResponsiveForm>
    );

    const layer = container.querySelector(".responsive-form-layer");
    expect(layer).not.toHaveClass("open");
    fireEvent.click(screen.getByRole("button", { name: "Create user" }));
    expect(layer).toHaveClass("open");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(layer).not.toHaveClass("open");
  });
});

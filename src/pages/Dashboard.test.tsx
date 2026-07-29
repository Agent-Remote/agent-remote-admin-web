import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { makeConsoleProps, renderConsole } from "../test/console";
import { Dashboard } from "./Dashboard";

describe("Dashboard", () => {
  it("filters admin navigation and wires global controls", async () => {
    const { props } = makeConsoleProps({ notice: { kind: "info", message: "Saved" } });
    renderConsole(<Dashboard {...props} />);
    await screen.findByText("Recent audit");
    expect(screen.queryByRole("button", { name: "Users" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nodes" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(props.loadAll).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(props.setNotice).toHaveBeenCalledWith(null);
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(props.logout).toHaveBeenCalled();
  });

  it("opens and closes the feature drawer and navigates as admin", async () => {
    const { props } = makeConsoleProps({ me: { ...makeConsoleProps().props.me, role: "admin" } });
    renderConsole(<Dashboard {...props} />);
    await screen.findByText("Recent audit");
    expect(screen.getAllByRole("button", { name: "Users" }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByRole("region", { name: "All features" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("region", { name: "All features" })).not.toBeInTheDocument());
    fireEvent.click(screen.getAllByRole("button", { name: "Users" })[0]);
    expect(props.setPage).toHaveBeenCalledWith("users");
  });
});

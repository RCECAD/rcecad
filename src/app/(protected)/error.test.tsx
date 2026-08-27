import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProtectedError from "./error";

describe("ProtectedError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("offers the Next retry callback without exposing the server error", async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const error = new Error("sensitive backend detail");
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<ProtectedError error={error} unstable_retry={retry} />);

    expect(
      screen.getByRole("heading", {
        name: "Não foi possível carregar esta página",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(error.message)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(retry).toHaveBeenCalledOnce();
  });
});

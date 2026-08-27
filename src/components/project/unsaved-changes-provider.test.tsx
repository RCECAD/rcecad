import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  UnsavedChangesProvider,
  useUnsavedChanges,
} from "@/components/project/unsaved-changes-provider";

function NavigationHarness({
  onNavigate,
}: Readonly<{ onNavigate: () => void }>) {
  const { requestNavigation, setHasUnsavedChanges } = useUnsavedChanges();

  return (
    <>
      <button type="button" onClick={() => setHasUnsavedChanges(true)}>
        Marcar alterações
      </button>
      <button type="button" onClick={() => requestNavigation(onNavigate)}>
        Navegar
      </button>
    </>
  );
}

describe("UnsavedChangesProvider", () => {
  it("navigates immediately when there are no pending changes", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <UnsavedChangesProvider>
        <NavigationHarness onNavigate={onNavigate} />
      </UnsavedChangesProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Navegar" }));

    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it("asks before discarding pending changes", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <UnsavedChangesProvider>
        <NavigationHarness onNavigate={onNavigate} />
      </UnsavedChangesProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Marcar alterações" }));
    await user.click(screen.getByRole("button", { name: "Navegar" }));

    expect(
      screen.getByRole("dialog", { name: "Descartar alterações?" }),
    ).toBeInTheDocument();
    expect(onNavigate).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Continuar editando" }),
    );
    expect(onNavigate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Navegar" }));
    await user.click(
      screen.getByRole("button", { name: "Descartar alterações" }),
    );

    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it("warns before the browser unloads while there are pending changes", async () => {
    const user = userEvent.setup();

    render(
      <UnsavedChangesProvider>
        <NavigationHarness onNavigate={vi.fn()} />
      </UnsavedChangesProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Marcar alterações" }));

    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});

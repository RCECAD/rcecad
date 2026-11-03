import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { ClientApiError } from "@/api/client/response";
import {
  UnsavedChangesProvider,
  useUnsavedChanges,
} from "@/components/project/unsaved-changes-provider";
import { ConfirmButton } from "./confirm-button";
import { Feedback, RequestError } from "./feedback";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/link", () => ({
  default: ({
    href,
    onNavigate,
    children,
    ...props
  }: {
    href: string;
    onNavigate?: (event: { preventDefault: () => void }) => void;
    children: React.ReactNode;
  }) => (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onNavigate?.({ preventDefault: () => {} });
      }}
    >
      {children}
    </a>
  ),
}));

function DirtyForm() {
  const { setHasUnsavedChanges } = useUnsavedChanges();
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [setHasUnsavedChanges]);
  return (
    <Feedback
      title="Dados alterados"
      actions={[
        { label: "Ir para validação", href: "/project/123/validation" },
      ]}
    />
  );
}

describe("actionable feedback", () => {
  it("preserves unsaved changes before following a correction link", async () => {
    const user = userEvent.setup();
    render(
      <UnsavedChangesProvider>
        <DirtyForm />
      </UnsavedChangesProvider>,
    );
    const link = screen.getByRole("link", { name: "Ir para validação" });
    expect(link).toHaveAttribute("href", "/project/123/validation");
    expect(link).toHaveAttribute("data-slot", "button");
    await user.click(link);
    expect(push).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Continuar editando" }),
    );
    expect(push).not.toHaveBeenCalled();
    await user.click(link);
    await user.click(
      screen.getByRole("button", { name: "Descartar alterações" }),
    );
    expect(push).toHaveBeenCalledWith("/project/123/validation");
  });

  it("offers a retry only on request and announces a localized error", () => {
    const retry = vi.fn();
    render(
      <RequestError
        title="Não foi possível carregar a rede"
        error={new TypeError("Failed to fetch")}
        onRetry={retry}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Verifique sua conexão",
    );
    expect(retry).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(retry).toHaveBeenCalledOnce();
  });

  it("requires explicit confirmation in Portuguese before deletion", async () => {
    const user = userEvent.setup();
    const remove = vi.fn();
    render(
      <ConfirmButton
        title="Excluir projeto?"
        description="A exclusão não pode ser desfeita."
        confirmLabel="Confirmar exclusão"
        onConfirm={remove}
      >
        Excluir projeto
      </ConfirmButton>,
    );
    await user.click(screen.getByRole("button", { name: "Excluir projeto" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(remove).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Excluir projeto" }));
    await user.click(
      screen.getByRole("button", { name: "Confirmar exclusão" }),
    );
    expect(remove).toHaveBeenCalledOnce();
  });

  it.each([
    403, 404,
  ])("offers a way back when a resource is unavailable (%s)", (status) => {
    render(
      <RequestError
        title="Não foi possível carregar o projeto"
        error={new ClientApiError("Projeto indisponível.", status)}
        onRetry={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("link", { name: "Voltar aos projetos" }),
    ).toHaveAttribute("href", "/home");
    expect(
      screen.queryByRole("button", { name: "Tentar novamente" }),
    ).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState, PageLoading } from "@/components/ui/page-state";

describe("page states", () => {
  it("announces a loading state", () => {
    render(<PageLoading label="Carregando projetos" />);

    expect(screen.getByRole("status")).toHaveAccessibleName(
      "Carregando projetos",
    );
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });

  it("renders an accessible empty state", () => {
    render(
      <EmptyState
        title="Nenhum projeto encontrado"
        description="Os projetos aparecerão aqui quando estiverem disponíveis."
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Nenhum projeto encontrado" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Os projetos aparecerão aqui quando estiverem disponíveis."),
    ).toBeInTheDocument();
  });

  it("retries an error only when the user asks", () => {
    const onRetry = vi.fn();

    render(
      <ErrorState
        title="Não foi possível carregar"
        description="Tente novamente."
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );

    expect(onRetry).toHaveBeenCalledOnce();
  });
});

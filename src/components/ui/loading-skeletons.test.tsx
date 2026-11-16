import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingState } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

describe("loading skeletons", () => {
  it("announces loading while hiding decorative placeholders", () => {
    render(
      <LoadingState label="Carregando projetos">
        <Skeleton data-testid="placeholder" />
      </LoadingState>,
    );

    const status = screen.getByRole("status", {
      name: "Carregando projetos",
    });
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(screen.getByTestId("placeholder").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("disables the pulse animation when reduced motion is requested", () => {
    render(<Skeleton data-testid="skeleton" />);

    expect(screen.getByTestId("skeleton")).toHaveClass(
      "motion-reduce:animate-none",
    );
  });
});

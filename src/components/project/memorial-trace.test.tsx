import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { CalculationMemorial } from "@/api/contracts/resources";
import { MemorialTrace, SegmentMemorial } from "./memorial-trace";

const expression =
  "finalWaterLevel = upstreamInvertM + finalDepthRatio * diameterMm / 1000; n = 0.013; Q = A*Rh^(2/3)";
const memorial: CalculationMemorial = {
  identification: {
    projectId: null,
    name: "Rede",
    contractor: null,
    technicalManager: null,
    location: null,
    revision: null,
    horizon: null,
  },
  generatedAt: "2026-11-05T12:00:00Z",
  rulesetVersion: "nbr-baseline-2",
  adoptedParameters: [],
  formulas: [
    {
      id: "F4",
      key: "finalWaterLevel",
      sourceId: "rcecad.water-level",
      reference: "RCECAD water elevation from invert and relative depth",
      expression,
    },
  ],
  segments: [],
  nonconformities: [],
  justifications: [],
  appliedContributions: [],
};

describe("readable calculation memorial", () => {
  it("shows translated sources, formatted powers and an intact original on demand", async () => {
    const user = userEvent.setup();
    const { container } = render(<MemorialTrace memorial={memorial} />);
    expect(
      screen.getByText(/Critérios normativos NBR · versão 2/),
    ).toBeVisible();
    await user.click(screen.getByText(/Fórmulas aplicadas/));
    expect(
      screen.getByText(
        "Cálculo do nível d’água a partir da cota de fundo e da lâmina relativa",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("list", { name: "Etapas da fórmula F4" }).children,
    ).toHaveLength(3);
    expect(container.querySelector("sup")).toHaveTextContent("2/3");
    expect(screen.getByText("Cota de fundo a montante, em m")).toBeVisible();
    expect(screen.getByText(expression)).not.toBeVisible();
    await user.click(
      screen.getByText("Expressão original e identificação técnica"),
    );
    expect(screen.getByText(expression)).toBeVisible();
  });

  it("keeps formula links and opens the formula section when following them", async () => {
    const user = userEvent.setup();
    const segment: CalculationMemorial["segments"][number] = {
      segmentId: "33333333-3333-4333-8333-333333333333",
      code: "T-01",
      outcome: "DESIGNED",
      choice: null,
      limits: [],
      quantities: [
        { key: "finalWaterLevel", value: 100, unit: "m", formulaId: "F4" },
      ],
      nonconformities: [],
      justifications: [],
      conflicts: [],
      attempts: [],
      reason: null,
      blockedByCodes: [],
    };
    render(
      <>
        <MemorialTrace memorial={memorial} />
        <SegmentMemorial
          segment={segment}
          formulas={memorial.formulas}
          hasFormulaLinks
        />
      </>,
    );
    const link = screen.getByRole("link", { name: "F4" });
    expect(link).toHaveAttribute("href", "#formula-F4");
    await user.click(link);
    expect(document.getElementById("memorial-formulas")).toHaveAttribute(
      "open",
    );
    expect(document.getElementById("formula-F4")).toBeVisible();
  });
});

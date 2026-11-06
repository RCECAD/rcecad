import { describe, expect, it } from "vitest";
import {
  formulaSourceLabel,
  justificationLabel,
  presentExpression,
  rulesetLabel,
} from "./memorial-presentation";

describe("memorial presentation", () => {
  it("translates the PVC infiltration explanation and preserves the normative reference", () => {
    expect(
      justificationLabel(
        "NBR 7367:1988 5.4.1.1 infiltration override applied: the whole network is guaranteed PVC, including declared segment materials and the switch target.",
      ),
    ).toBe(
      "NBR 7367:1988 5.4.1.1 Taxa de infiltração ajustada automaticamente: toda a rede foi identificada como PVC, considerando os materiais informados nos trechos e o material de destino configurado para a troca.",
    );
    expect(justificationLabel("Justificativa específica do projeto.")).toBe(
      "Justificativa específica do projeto.",
    );
  });
  it("translates known rule sets and sources without guessing unknown versions", () => {
    expect(rulesetLabel("nbr-baseline-2")).toBe(
      "Critérios normativos NBR · versão 2",
    );
    expect(rulesetLabel("custom-2026")).toBe(
      "Conjunto de critérios: custom-2026",
    );
    expect(formulaSourceLabel("com.cdre.engine", "CDRE engine")).toBe(
      "Motor de cálculo hidráulico CDRE",
    );
    expect(
      formulaSourceLabel(
        "rcecad.water-level",
        "RCECAD water elevation from invert and relative depth",
      ),
    ).toBe(
      "Cálculo do nível d’água a partir da cota de fundo e da lâmina relativa",
    );
    expect(formulaSourceLabel("NBR 7367:1988", "NBR 7367:1988 5.4.2.1")).toBe(
      "NBR 7367:1988 5.4.2.1",
    );
    expect(formulaSourceLabel("custom", "Referência específica")).toBe(
      "Referência específica",
    );
  });

  it("presents water elevation with named symbols and retains the actual operations", () => {
    const expression =
      "finalWaterLevel = upstreamInvertM + finalDepthRatio * diameterMm / 1000";
    const shown = presentExpression(expression);
    expect(shown.steps).toEqual(["NA_f = Z_mont + (Y/D)_f × D_mm / 1000"]);
    expect(shown.variables.map((variable) => variable.symbol)).toEqual([
      "NA_f",
      "Z_mont",
      "(Y/D)_f",
      "D_mm",
    ]);
    expect(expression).toBe(
      "finalWaterLevel = upstreamInvertM + finalDepthRatio * diameterMm / 1000",
    );
  });

  it("splits algorithm steps and translates explanations while preserving conditions and unknown symbols", () => {
    const shown = presentExpression(
      "n = 0.013; Q = A*Rh^(2/3)*I^(1/2); customAlpha = max(0, q); floor = minimumDesignDischarge (0 if absent); floor applied after accumulation per segment, never propagated upstream or downstream",
    );
    expect(shown.steps).toHaveLength(5);
    expect(shown.steps[0]).toBe("n = 0,013");
    expect(shown.steps[1]).toContain("Rh^(2/3)");
    expect(shown.steps[2]).toBe("customAlpha = máx(0, q)");
    expect(shown.steps[3]).toContain("quando não informado");
    expect(shown.steps[4]).toContain(
      "sem ser propagada para montante ou jusante",
    );
  });
});

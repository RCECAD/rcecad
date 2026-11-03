import { describe, expect, it } from "vitest";
import type { Nonconformity } from "@/api/contracts/design";
import { nonconformityFeedback } from "./nonconformity-feedback";

const finding: Nonconformity = {
  ruleCode: "DOMAIN_VALUE_MISMATCH",
  sourceId: "cdre-engine:check-generico",
  description:
    "Valor 2.0 L/s.km para infiltrationRate, medido pelo projeto, está fora do domínio resolvido.",
  severity: "CRITICAL",
  subject: "infiltrationRate",
  observedValue: "2.0",
  expectedLimit: ">= 0.05 (NBR 9649:1986) e <= 1.0 (NBR 9649:1986)",
  waiverJustification: null,
};

describe("nonconformityFeedback", () => {
  it("uses the returned limits and deduplicates normative references", () => {
    expect(
      nonconformityFeedback({
        ...finding,
        observedValue: "0",
        expectedLimit: ">= 0.1 (Norma A) e <= 0.8 (Norma B)",
        sourceId: "Norma A",
      }),
    ).toMatchObject({
      observedValue: "0 L/s·km",
      expectedLimit: "0,1 a 0,8 L/s·km",
      references: ["Norma A", "Norma B"],
    });
  });

  it("can identify a parameter when only the description supplies it", () => {
    expect(nonconformityFeedback({ ...finding, subject: null })).toMatchObject({
      title: "Taxa de infiltração fora da faixa permitida",
      observedValue: "2 L/s·km",
    });
  });

  it.each([
    ["> 0.05 (NBR 9649:1986)", "> 0,05 L/s·km"],
    ["<= 1.0 (NBR 9649:1986)", "≤ 1 L/s·km"],
    [
      "> 0.05 (NBR 9649:1986) e < 1.0 (NBR 9649:1986)",
      "> 0,05 L/s·km e < 1 L/s·km",
    ],
    [">= 1.0E-7 (NBR 9649:1986)", "≥ 0,0000001 L/s·km"],
  ])("preserves the comparison in %s", (expectedLimit, formatted) => {
    expect(
      nonconformityFeedback({ ...finding, expectedLimit }).expectedLimit,
    ).toBe(formatted);
  });

  it("keeps unsupported limits intact instead of dropping restrictions", () => {
    const expectedLimit = ">= 0.05 (NBR 9649:1986) e um de [0.1, 0.5]";
    expect(
      nonconformityFeedback({ ...finding, expectedLimit }).expectedLimit,
    ).toBe(expectedLimit);
  });

  it("preserves unknown rules, nonnumeric observations and absent values", () => {
    expect(
      nonconformityFeedback({
        ...finding,
        ruleCode: "CUSTOM_RULE",
        description: "Verifique o material escolhido para este trecho.",
        subject: null,
        observedValue: "PVC JEI",
        expectedLimit: null,
      }),
    ).toMatchObject({
      description: "Verifique o material escolhido para este trecho.",
      observedValue: "PVC JEI",
      expectedLimit: null,
    });
    expect(
      nonconformityFeedback({ ...finding, observedValue: null }).observedValue,
    ).toBeNull();
  });
});

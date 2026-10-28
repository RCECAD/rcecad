import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  networkDesignSchema,
  segmentDesignSchema,
} from "@/api/contracts/design";
import { DesignResults, quantityValue } from "./design-results";

const common = {
  segmentId: "11111111-1111-4111-8111-111111111111",
  segmentCode: "T-01",
  rulesetVersionId: "nbr-test",
  justifications: [],
};
const choice = {
  diameterMm: 100,
  slope: 0.0045,
  material: "PVC JEI",
  upstreamInvertM: 100,
  diameterImposed: false,
  upstreamDropM: 0,
};
describe("CDRE outcomes", () => {
  it("separates critical and warning segments and keeps the four result views usable", async () => {
    const user = userEvent.setup();
    const finding = {
      ruleCode: "COVER",
      sourceId: "NBR",
      description: "Recobrimento insuficiente",
      severity: "WARNING",
      subject: null,
      observedValue: null,
      expectedLimit: null,
      waiverJustification: null,
    };
    const design = networkDesignSchema.parse({
      projectId: common.segmentId,
      rulesetVersionId: "nbr-test",
      justifications: [],
      adoptedParameters: [],
      nonconformities: [],
      segments: [
        {
          ...common,
          status: "designed",
          choice,
          quantities: [{ key: "initialDischarge", unit: "L/s", value: 0 }],
          nonconformities: [finding],
        },
        {
          ...common,
          segmentId: "22222222-2222-4222-8222-222222222222",
          segmentCode: "T-02",
          status: "designed",
          choice,
          quantities: [],
          nonconformities: [finding, { ...finding, severity: "CRITICAL" }],
        },
      ],
    });
    render(<DesignResults design={design} tabbed />);
    expect(screen.getByRole("group", { name: "Conformes" })).toHaveTextContent(
      "Conformes0",
    );
    expect(screen.getByRole("group", { name: "Em atenção" })).toHaveTextContent(
      "Em atenção1",
    );
    expect(
      screen.getByRole("group", { name: "Não conformes" }),
    ).toHaveTextContent("Não conformes1");
    await user.click(
      screen.getByRole("tab", { name: "Resultados por Trecho" }),
    );
    const [, qi] = within(
      screen.getByRole("row", { name: /T-01/ }),
    ).getAllByRole("cell");
    expect(qi).toHaveTextContent(/^0$/);
    await user.click(screen.getByRole("link", { name: "T-01" }));
    expect(
      screen.getByRole("tab", { name: "Memória de Cálculo" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Vazão inicial (Qi)")).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "Não conformidades" }));
    expect(screen.getAllByText("Recobrimento insuficiente")).toHaveLength(3);
  });
  it("reads hydraulic quantities by key and preserves numeric zero", () => {
    const segment = segmentDesignSchema.parse({
      ...common,
      status: "designed",
      choice,
      quantities: [
        { key: "finalVelocity", unit: "m/s", value: 0 },
        { key: "initialDischarge", unit: "L/s", value: 1.5 },
      ],
      nonconformities: [],
    });
    expect(quantityValue(segment, "initialDischarge")).toBe(1.5);
    expect(quantityValue(segment, "finalVelocity")).toBe(0);
    expect(quantityValue(segment, "finalDischarge")).toBeUndefined();
  });
  it("shows conflicts, rejected attempts and the codes blocking downstream segments", () => {
    const design = networkDesignSchema.parse({
      projectId: common.segmentId,
      rulesetVersionId: "nbr-test",
      justifications: [],
      adoptedParameters: [],
      nonconformities: [],
      segments: [
        {
          ...common,
          status: "conflicted",
          conflicts: [
            {
              subject: "diameter",
              reason: "Domínio vazio",
              conflictingSources: ["NBR", "Outra norma"],
            },
          ],
        },
        {
          ...common,
          segmentId: "22222222-2222-4222-8222-222222222222",
          segmentCode: "T-02",
          status: "infeasible",
          attempts: [
            {
              choice,
              quantities: [],
              blocking: [
                {
                  ruleCode: "COVER",
                  sourceId: "NBR",
                  description: "Recobrimento insuficiente",
                  severity: "CRITICAL",
                  subject: null,
                  observedValue: "0.1",
                  expectedLimit: "0.65",
                  waiverJustification: null,
                },
              ],
            },
          ],
        },
        {
          ...common,
          segmentId: "33333333-3333-4333-8333-333333333333",
          segmentCode: "T-03",
          status: "notEvaluated",
          reason: "Trecho de montante recusado",
          blockedBy: [common.segmentId],
          blockedByCodes: ["T-01"],
        },
      ],
    });
    render(<DesignResults design={design} />);
    expect(
      screen.getByText("Domínio vazio", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText("Recobrimento insuficiente")).toBeInTheDocument();
    expect(screen.getByText("Trecho de montante recusado")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "T-01", hidden: true }),
    ).toHaveLength(2);
  });
  it("shows an imposed-diameter segment as verified with its critical findings", () => {
    const design = networkDesignSchema.parse({
      projectId: common.segmentId,
      rulesetVersionId: "nbr-test",
      justifications: [],
      adoptedParameters: [
        {
          key: "perCapitaFlow",
          unit: "L/hab.dia",
          value: 150,
          origin: "PROJECT:measuredValue",
          projectSupplied: true,
        },
      ],
      nonconformities: [],
      segments: [
        {
          ...common,
          status: "verified",
          choice: { ...choice, diameterMm: 150, diameterImposed: true },
          quantities: [{ key: "initialDischarge", unit: "L/s", value: 1.5 }],
          nonconformities: [
            {
              ruleCode: "VELOCITY",
              sourceId: "NBR",
              description: "Velocidade acima do limite",
              severity: "CRITICAL",
              subject: null,
              observedValue: null,
              expectedLimit: null,
              waiverJustification: null,
            },
          ],
        },
      ],
    });
    render(<DesignResults design={design} tabbed />);
    expect(
      screen.getByRole("group", { name: "Não conformes" }),
    ).toHaveTextContent("Não conformes1");
    expect(screen.getByText("Consumo per capita")).toBeVisible();
    expect(screen.getByText("Informado no projeto")).toBeVisible();
  });
  it("rejects unknown or incomplete result variants", () => {
    expect(
      segmentDesignSchema.safeParse({ ...common, status: "designed" }).success,
    ).toBe(false);
    expect(
      segmentDesignSchema.safeParse({ ...common, status: "success", choice })
        .success,
    ).toBe(false);
  });
});

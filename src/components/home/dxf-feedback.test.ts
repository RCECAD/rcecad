import { describe, expect, it } from "vitest";
import { ClientApiError } from "@/api/client/response";
import { formatDxfImportError, formatDxfWarning } from "./dxf-feedback";

describe("DXF feedback in Portuguese", () => {
  it("preserves node codes and translates the server's truncated list", () => {
    const warning = formatDxfWarning(
      "12 node(s) without an identified type were assumed as PV: [PV-01, PV-02, PV_OUTLET_1 and 9 more]",
    );
    expect(warning.description).toContain(
      "12 nós serão importados como poços de visita (PV)",
    );
    expect(warning.affectedNodes).toBe("PV-01, PV-02, PV_OUTLET_1 e mais 9");
  });

  it("explains independent outlets without changing their identifiers", () => {
    const warning = formatDxfWarning(
      "The network has 2 independent parts ending at PV_OUTLET_1, PV_OUTLET_2. Check that every branch is connected; several outlets are only valid when they discharge at different points.",
    );
    expect(warning.description).toContain("A rede tem 2 partes desconectadas.");
    expect(warning.description).toContain("pontos distintos");
    expect(warning.affectedNodes).toBe("PV_OUTLET_1, PV_OUTLET_2");
  });

  it("keeps unrecognized warnings visible without exposing untranslated diagnostics", () => {
    const warning = formatDxfWarning("New parser warning in English");
    expect(warning.title).toBe("Aviso na leitura do DXF");
    expect(warning.description).toContain("precisa de revisão");
    expect(warning.affectedNodes).toBeUndefined();
    expect(JSON.stringify(warning)).not.toContain("English");
  });

  it.each([
    ["Cycle detected at node PV-03", "ciclo no nó PV-03"],
    [
      "The network has a cycle: sewage cannot flow back into a segment it came from. Segments that could never be reached: [T-01, T-02].",
      "sentido dos trechos: T-01, T-02",
    ],
    [
      "Node PV-01 is the upstream end of more than one segment: [T-01, T-02]. Each of them would receive the whole contribution.",
      "O nó PV-01 tem mais de um trecho de saída: T-01, T-02",
    ],
    [
      "Segment T-01 has length 0.0 m. Contribution is distributed over accumulated length.",
      "O trecho T-01 tem comprimento inválido",
    ],
  ])("translates topology errors and preserves affected codes: %s", (message, translated) => {
    expect(
      formatDxfImportError(
        new ClientApiError(message, 422, "INVALID_NETWORK_TOPOLOGY"),
      ),
    ).toContain(translated);
  });

  it.each([
    new TypeError("Failed to fetch"),
    new SyntaxError("Unexpected token"),
    new Error("Could not read file"),
  ])("uses Portuguese for unexpected server and browser failures", (error) => {
    expect(formatDxfImportError(error)).toBe(
      "Não foi possível concluir a importação do DXF. Confira o arquivo e tente novamente.",
    );
  });

  it("explains temporary server failures in Portuguese", () => {
    expect(
      formatDxfImportError(new ClientApiError("Internal Server Error", 500)),
    ).toContain("temporariamente indisponível");
  });
});

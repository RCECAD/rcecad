import { describe, expect, it } from "vitest";
import { z } from "zod";
import { getErrorMessage, parseClientJson } from "./response";

describe("client API feedback", () => {
  it.each([
    [
      503,
      "Há outros uploads em processamento.",
      "Há outros arquivos em processamento. Aguarde alguns instantes e tente novamente.",
    ],
    [
      413,
      "O arquivo DXF deve ter até 300 MB.",
      "O arquivo DXF deve ter até 300 MB.",
    ],
    [
      422,
      "Cycle detected at node PV-03",
      "A rede contém um ciclo no nó PV-03. Revise as ligações e o sentido dos trechos no desenho.",
    ],
    [
      404,
      "Project not found",
      "Este projeto não foi encontrado ou não está disponível para sua conta.",
    ],
    [422, "Unknown backend diagnostic", "Falha ao importar."],
  ])("shows Portuguese feedback for status %s", async (status, error, translated) => {
    await expect(
      parseClientJson(
        Response.json({ error }, { status }),
        z.object({ id: z.string() }),
        "Falha ao importar.",
      ),
    ).rejects.toMatchObject({ message: translated, status });
  });

  it("keeps the fallback when a proxy returns an unreadable error", async () => {
    await expect(
      parseClientJson(
        new Response("<html>unavailable</html>", { status: 503 }),
        z.object({}),
        "Falha ao importar.",
      ),
    ).rejects.toMatchObject({
      message:
        "O serviço está temporariamente indisponível. Aguarde alguns instantes e tente novamente.",
      status: 503,
    });
  });

  it("handles invalid successful responses without exposing JSON diagnostics", async () => {
    await expect(
      parseClientJson(
        new Response("not json"),
        z.object({ id: z.string() }),
        "Falha ao carregar.",
      ),
    ).rejects.toThrow("Não foi possível ler os dados recebidos");
  });

  it("translates browser failures and never displays unexpected exceptions", () => {
    expect(getErrorMessage(new TypeError("Failed to fetch"))).toContain(
      "Verifique sua conexão",
    );
    expect(
      getErrorMessage(new Error("internal error detail"), "Tente novamente."),
    ).toBe("Tente novamente.");
  });
});

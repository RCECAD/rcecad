import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseClientJson } from "./response";

describe("client API feedback", () => {
  it.each([
    [503, "Há outros uploads em processamento."],
    [413, "O arquivo DXF deve ter até 300 MB."],
    [422, "Cycle detected at node PV-03"],
  ])("shows the safe Next error for status %s", async (status, error) => {
    await expect(
      parseClientJson(
        Response.json({ error }, { status }),
        z.object({ id: z.string() }),
        "Falha ao importar.",
      ),
    ).rejects.toMatchObject({ message: error, status });
  });

  it("keeps the fallback when a proxy returns an unreadable error", async () => {
    await expect(
      parseClientJson(
        new Response("<html>unavailable</html>", { status: 503 }),
        z.object({}),
        "Falha ao importar.",
      ),
    ).rejects.toMatchObject({ message: "Falha ao importar.", status: 503 });
  });
});

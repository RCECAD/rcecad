import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { projectQueryKeys } from "@/api/client/query-keys";
import { NetworkFieldEditor } from "./network-field-editor";
import { UnsavedChangesProvider } from "./unsaved-changes-provider";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const projectId = "11111111-1111-4111-8111-111111111111";
const nodeId = "22222222-2222-4222-8222-222222222222";
const segment = {
  id: "33333333-3333-4333-8333-333333333333",
  projectId,
  code: "T-01",
  upstreamNodeId: nodeId,
  downstreamNodeId: nodeId,
  length: 10,
  slope: 0.01,
  upstreamInvert: 100,
  downstreamInvert: 99.9,
  fixedDiameterMm: 150,
  material: "Concreto",
  pavementTypeRaw: "ASFALTO",
  pavementType: "SIDEWALK",
  elementType: "COLLECTOR",
  receivesDryWeatherFlow: null,
  surfaceMaterial: "ASPHALT",
  surfaceCondition: "FAIR",
  pavementNotes: "Preservar esta nota",
};
const detail = {
  project: {
    id: projectId,
    name: "Rede",
    contractor: null,
    technicalManager: null,
    location: null,
    status: "pending",
    owner: null,
    cnpj: "00000000000191",
    createdAt: "2026-10-21T12:00:00Z",
    updatedAt: "2026-10-21T12:00:00Z",
  },
  nodes: [
    {
      id: nodeId,
      projectId,
      code: "PV-01",
      type: "PV",
      hasDropTube: false,
      x: 0,
      y: 0,
      invertElevation: 100,
      terrainElevation: null,
      angle: null,
    },
  ],
  segments: [segment],
};
function setup(mode: "survey" | "paving" = "survey") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <UnsavedChangesProvider>
        <NetworkFieldEditor projectId={projectId} mode={mode} />
      </UnsavedChangesProvider>
    </QueryClientProvider>,
  );
  return client;
}
afterEach(() => vi.unstubAllGlobals());
describe("network field data", () => {
  it("saves paving edits from every page and retains failed drafts across pagination and search", async () => {
    const user = userEvent.setup();
    const segments = Array.from({ length: 12 }, (_, i) => ({
      ...segment,
      id: `33333333-3333-4333-8333-${String(i + 1).padStart(12, "0")}`,
      code: `T-${String(i + 1).padStart(2, "0")}`,
    }));
    let failLast = true;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (!init?.method) return Response.json({ ...detail, segments });
      const current = segments.find((item) => url.includes(item.id));
      if (current === segments[10] && failLast)
        return Response.json({ detail: "Falha temporária" }, { status: 503 });
      return Response.json({ ...current, ...JSON.parse(String(init.body)) });
    });
    vi.stubGlobal("fetch", fetchMock);
    setup("paving");
    await screen.findByLabelText("Observações T-01");
    expect(screen.getByLabelText("Observações T-11")).not.toBeVisible();
    await user.type(screen.getByLabelText("Observações T-01"), " A");
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Observações T-01")).not.toBeVisible();
    await user.type(screen.getByLabelText("Observações T-11"), " B");
    await user.click(screen.getByRole("button", { name: "Página anterior" }));
    expect(screen.getByLabelText("Observações T-01")).toHaveValue(
      "Preservar esta nota A",
    );
    await user.type(screen.getByLabelText("Buscar nó ou trecho"), "T-02");
    await user.click(
      screen.getByRole("button", { name: "Salvar todos os trechos" }),
    );
    await screen.findByText(/1 de 2 linhas salvas/);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Salvar todos os trechos" }),
      ).toBeEnabled(),
    );
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === "PUT"),
    ).toHaveLength(2);
    await user.clear(screen.getByLabelText("Buscar nó ou trecho"));
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(screen.getByLabelText("Observações T-11")).toHaveValue(
      "Preservar esta nota B",
    );
    failLast = false;
    await user.click(
      screen.getByRole("button", { name: "Salvar todos os trechos" }),
    );
    await screen.findByText(
      "1 linha salva. Recalcule o dimensionamento para atualizar os resultados.",
    );
    const writes = fetchMock.mock.calls.filter(
      ([, init]) => init?.method === "PUT",
    );
    expect(writes.map(([url]) => url.split("/").at(-2))).toEqual([
      segments[0].id,
      segments[10].id,
      segments[10].id,
    ]);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Salvar todos os trechos" }),
      ).toBeDisabled(),
    );
  });

  it("changes paving page size without resetting unsaved values", async () => {
    const user = userEvent.setup();
    const segments = Array.from({ length: 12 }, (_, i) => ({
      ...segment,
      id: `33333333-3333-4333-8333-${String(i + 1).padStart(12, "0")}`,
      code: `T-${i + 1}`,
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ ...detail, segments })),
    );
    setup("paving");
    await user.type(
      await screen.findByLabelText("Observações T-1"),
      " Alterado",
    );
    await user.click(
      screen.getByRole("combobox", { name: "Linhas por página" }),
    );
    await user.click(screen.getByRole("option", { name: "25" }));
    expect(screen.getByText("Página 1 de 1")).toBeInTheDocument();
    expect(screen.getByText("1–12 de 12 linhas")).toBeInTheDocument();
    expect(screen.getByLabelText("Observações T-12")).toBeVisible();
    expect(screen.getByLabelText("Observações T-1")).toHaveValue(
      "Preservar esta nota Alterado",
    );
    expect(
      screen.getByRole("button", { name: "Salvar todos os trechos" }),
    ).toBeEnabled();
  });

  it("saves only changed node elevations and leaves the segment draft untouched", async () => {
    const user = userEvent.setup();
    const nodes = [
      detail.nodes[0],
      {
        ...detail.nodes[0],
        id: "44444444-4444-4444-8444-444444444444",
        code: "PV-02",
      },
      {
        ...detail.nodes[0],
        id: "55555555-5555-4555-8555-555555555555",
        code: "PV-03",
      },
    ];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (!init?.method) return Response.json({ ...detail, nodes });
      const node = nodes.find((item) => url.includes(item.id));
      return Response.json({ ...node, ...JSON.parse(String(init.body)) });
    });
    vi.stubGlobal("fetch", fetchMock);
    setup();
    await user.type(
      await screen.findByLabelText("Cota de terreno PV-01"),
      "101.5",
    );
    await user.type(screen.getByLabelText("Cota de terreno PV-02"), "102");
    await user.clear(screen.getByLabelText("Material T-01"));
    await user.type(screen.getByLabelText("Material T-01"), "PVC");
    await user.click(
      screen.getByRole("button", { name: "Salvar todos os nós" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Salvar todos os nós" }),
      ).toBeDisabled(),
    );
    await screen.findByText(
      "2 linhas salvas. Recalcule o dimensionamento para atualizar os resultados.",
    );
    const writes = fetchMock.mock.calls.filter(
      ([, init]) => init?.method === "PUT",
    );
    expect(writes).toHaveLength(2);
    expect(writes.map(([, init]) => JSON.parse(String(init?.body)))).toEqual([
      { terrainElevation: 101.5 },
      { terrainElevation: 102 },
    ]);
    expect(screen.getByLabelText("Cota de terreno PV-03")).toHaveValue(null);
    expect(screen.getByLabelText("Material T-01")).toHaveValue("PVC");
    expect(
      screen.getByRole("button", { name: "Salvar todos os trechos" }),
    ).toBeEnabled();
  });

  it("retains failed segment drafts, retries only failures and preserves fields from other tabs", async () => {
    const user = userEvent.setup();
    const segments = [
      segment,
      { ...segment, id: "44444444-4444-4444-8444-444444444444", code: "T-02" },
    ];
    let failSecond = true;
    let finishFirst: (() => void) | undefined;
    const firstWrite = new Promise<void>((resolve) => {
      finishFirst = resolve;
    });
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (!init?.method) return Response.json({ ...detail, segments });
      const current = segments.find((item) => url.includes(item.id));
      if (current === segments[0]) await firstWrite;
      if (current === segments[1] && failSecond)
        return Response.json({ detail: "Falha temporária" }, { status: 503 });
      return Response.json({ ...current, ...JSON.parse(String(init.body)) });
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = setup();
    client.setQueryData(projectQueryKeys.calculations(projectId), {
      old: true,
    });
    await user.type(
      await screen.findByLabelText("Cota de terreno PV-01"),
      "105",
    );
    for (const code of ["T-01", "T-02"]) {
      await user.clear(screen.getByLabelText(`Material ${code}`));
      await user.type(screen.getByLabelText(`Material ${code}`), "PVC");
    }
    await user.click(
      screen.getByRole("button", { name: "Salvar todos os trechos" }),
    );
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([, init]) => init?.method === "PUT"),
      ).toHaveLength(1),
    );
    expect(screen.getByLabelText("Material T-02")).toBeDisabled();
    expect(screen.getByLabelText("Cota de terreno PV-01")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Salvar todos os nós" }),
    ).toBeDisabled();
    finishFirst?.();
    await screen.findByText(/1 de 2 linhas salvas/);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Salvar todos os trechos" }),
      ).toBeEnabled(),
    );
    expect(screen.getByLabelText("Material T-02")).toHaveValue("PVC");
    expect(screen.getByLabelText("Cota de terreno PV-01")).toHaveValue(105);
    expect(
      client.getQueryData(projectQueryKeys.calculations(projectId)),
    ).toBeUndefined();
    failSecond = false;
    await user.click(
      screen.getByRole("button", { name: "Salvar todos os trechos" }),
    );
    await screen.findByText(
      "1 linha salva. Recalcule o dimensionamento para atualizar os resultados.",
    );
    const writes = fetchMock.mock.calls.filter(
      ([, init]) => init?.method === "PUT",
    );
    expect(writes.map(([url]) => url.split("/").at(-2))).toEqual([
      segments[0].id,
      segments[1].id,
      segments[1].id,
    ]);
    for (const [, init] of writes) {
      expect(JSON.parse(String(init?.body))).toMatchObject({
        material: "PVC",
        pavementType: "SIDEWALK",
        surfaceMaterial: "ASPHALT",
        surfaceCondition: "FAIR",
        pavementNotes: "Preservar esta nota",
        fixedDiameterMm: 150,
      });
    }
    expect(
      screen.getByRole("button", { name: "Salvar todos os nós" }),
    ).toBeEnabled();
  });

  it("validates all changed segments before sending any writes", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        ...detail,
        segments: [
          segment,
          {
            ...segment,
            id: "44444444-4444-4444-8444-444444444444",
            code: "T-02",
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    setup();
    await user.type(await screen.findByLabelText("Material T-01"), " editado");
    await user.clear(screen.getByLabelText("DN imposto T-02"));
    await user.type(screen.getByLabelText("DN imposto T-02"), "-1");
    await user.click(
      screen.getByRole("button", { name: "Salvar todos os trechos" }),
    );
    await screen.findByText(/Nenhuma linha foi enviada/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("DN imposto T-02")).toHaveValue(-1);
    expect(screen.getByLabelText("Material T-01")).toHaveValue(
      "Concreto editado",
    );
  });

  it("keeps missing ground elevation and dry-weather answers undecided", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(detail));
    vi.stubGlobal("fetch", fetchMock);
    setup();
    expect(await screen.findByLabelText("Cota de terreno PV-01")).toHaveValue(
      null,
    );
    expect(
      screen.getByLabelText("Contribuição de tempo seco T-01"),
    ).toHaveTextContent("Não respondido");
    expect(
      screen.getByRole("button", { name: "Salvar todos os trechos" }),
    ).toBeDisabled();
  });
  it("preserves pavement, imposed diameter and material when saving an explicit false answer, then clears obsolete results", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(detail))
      .mockResolvedValueOnce(
        Response.json({ ...segment, receivesDryWeatherFlow: false }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const client = setup();
    client.setQueryData(projectQueryKeys.calculations(projectId), {
      old: true,
    });
    client.setQueryData(projectQueryKeys.validation(projectId), { old: true });
    await user.click(
      await screen.findByLabelText("Contribuição de tempo seco T-01"),
    );
    await user.click(screen.getByRole("option", { name: "Não" }));
    await user.click(
      screen.getByRole("button", { name: "Salvar todos os trechos" }),
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const sent = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(sent).toEqual({
      elementType: "COLLECTOR",
      receivesDryWeatherFlow: false,
      fixedDiameterMm: 150,
      material: "Concreto",
      pavementType: "SIDEWALK",
      surfaceMaterial: "ASPHALT",
      surfaceCondition: "FAIR",
      pavementNotes: "Preservar esta nota",
    });
    await waitFor(() =>
      expect(
        client.getQueryData(projectQueryKeys.calculations(projectId)),
      ).toBeUndefined(),
    );
    expect(
      client.getQueryData(projectQueryKeys.validation(projectId)),
    ).toBeUndefined();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Salvar todos os trechos" }),
      ).toBeDisabled(),
    );
    expect(
      screen.getByLabelText("Contribuição de tempo seco T-01"),
    ).toHaveTextContent("Não");
  });
  it("clears a dry-weather answer back to null and restores the clean form state", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          ...detail,
          segments: [{ ...segment, receivesDryWeatherFlow: true }],
        }),
      )
      .mockResolvedValueOnce(Response.json(segment));
    vi.stubGlobal("fetch", fetchMock);
    setup();
    await user.click(
      await screen.findByLabelText("Contribuição de tempo seco T-01"),
    );
    await user.click(screen.getByRole("option", { name: "Não respondido" }));
    await user.click(
      screen.getByRole("button", { name: "Salvar todos os trechos" }),
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(
      JSON.parse(fetchMock.mock.calls[1][1].body).receivesDryWeatherFlow,
    ).toBeNull();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Salvar todos os trechos" }),
      ).toBeDisabled(),
    );
    expect(
      screen.getByLabelText("Contribuição de tempo seco T-01"),
    ).toHaveTextContent("Não respondido");
  });
  it("clears paving selections without losing the remaining segment data", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json(detail))
      .mockResolvedValueOnce(
        Response.json({ ...segment, surfaceMaterial: null }),
      );
    vi.stubGlobal("fetch", fetchMock);
    setup("paving");
    await user.click(await screen.findByLabelText("Material superficial T-01"));
    await user.click(screen.getByRole("option", { name: "Não informado" }));
    await user.click(screen.getByRole("button", { name: "Salvar trecho" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      elementType: "COLLECTOR",
      receivesDryWeatherFlow: null,
      fixedDiameterMm: 150,
      material: "Concreto",
      pavementType: "SIDEWALK",
      surfaceMaterial: null,
      surfaceCondition: "FAIR",
      pavementNotes: "Preservar esta nota",
    });
    await waitFor(() =>
      expect(screen.getByText("Salvo", { exact: true })).toBeInTheDocument(),
    );
  });
});

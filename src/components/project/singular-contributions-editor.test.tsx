import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { projectQueryKeys } from "@/api/client/query-keys";
import type { SingularContribution } from "@/api/contracts/resources";
import { SingularContributionsEditor } from "./singular-contributions-editor";
import { UnsavedChangesProvider } from "./unsaved-changes-provider";

const projectId = "11111111-1111-4111-8111-111111111111";
const id = (n: number) =>
  `33333333-3333-4333-8333-${String(n).padStart(12, "0")}`;
function onSegments(count: number): SingularContribution[] {
  return Array.from({ length: count }, (_, i) => ({
    id: id(101 + i),
    name: `Contribuição T-${i + 1}`,
    type: "OTHER",
    nodeId: null,
    segmentId: id(i + 1),
    initialLps: 0,
    finalLps: 0,
    targetCode: `T-${i + 1}`,
  }));
}
function setup(count = 12, contributions: SingularContribution[] = []) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  client.setQueryData(projectQueryKeys.network(projectId), {
    segments: Array.from({ length: count }, (_, i) => ({
      id: id(i + 1),
      code: `T-${i + 1}`,
      upstreamNodeId: i === 0 ? id(50) : id(90),
      downstreamNodeId: i === 0 ? id(51) : id(91),
    })),
    nodes: [
      { id: id(50), code: "PV-01" },
      { id: id(51), code: "PV-02" },
    ],
  });
  client.setQueryData(projectQueryKeys.contributions(projectId), contributions);
  render(
    <QueryClientProvider client={client}>
      <UnsavedChangesProvider>
        <SingularContributionsEditor projectId={projectId} />
      </UnsavedChangesProvider>
    </QueryClientProvider>,
  );
  return client;
}
function successfulFetch() {
  let n = 200;
  return vi.fn(async (url: string, init?: RequestInit) => {
    const last = url.split("/").at(-1) ?? "";
    return Response.json({
      ...JSON.parse(String(init?.body)),
      id: last.length === 36 ? last : id(n++),
      targetCode: "T-1",
    });
  });
}
afterEach(() => vi.unstubAllGlobals());

describe("contribution grid", () => {
  it("starts without rows and explains that only concentrated flows belong here", () => {
    setup();
    expect(
      screen.getByText(/A vazão doméstica já é distribuída linearmente/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Nenhuma contribuição singular cadastrada/),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Nome da contribuição/),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar todos" })).toBeDisabled();
  });

  it("pages saved contributions and saves only edits from every page", async () => {
    const user = userEvent.setup();
    const fetchMock = successfulFetch();
    vi.stubGlobal("fetch", fetchMock);
    setup(12, onSegments(12));
    expect(
      screen.getByLabelText("Nome da contribuição Trecho T-1"),
    ).toHaveValue("Contribuição T-1");
    expect(
      screen.queryByLabelText("Nome da contribuição Trecho T-11"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar todos" })).toBeDisabled();
    await user.clear(screen.getByLabelText("Vazão inicial (L/s) Trecho T-1"));
    await user.type(
      screen.getByLabelText("Vazão inicial (L/s) Trecho T-1"),
      "2.5",
    );
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    await user.clear(screen.getByLabelText("Vazão final (L/s) Trecho T-11"));
    await user.type(
      screen.getByLabelText("Vazão final (L/s) Trecho T-11"),
      "4",
    );
    await user.click(screen.getByRole("button", { name: "Página anterior" }));
    expect(screen.getByLabelText("Vazão inicial (L/s) Trecho T-1")).toHaveValue(
      2.5,
    );
    await user.click(screen.getByRole("button", { name: "Salvar todos" }));
    await screen.findByText(
      "2 contribuições salvas. Recalcule o dimensionamento para atualizar as vazões.",
    );
    expect(
      fetchMock.mock.calls.map(([url, init]) => [
        url,
        init?.method,
        JSON.parse(String(init?.body)),
      ]),
    ).toEqual([
      [
        `/api/projects/${projectId}/singular-contributions/${id(101)}`,
        "PUT",
        {
          name: "Contribuição T-1",
          type: "OTHER",
          segmentId: id(1),
          nodeId: null,
          initialLps: 2.5,
          finalLps: 0,
        },
      ],
      [
        `/api/projects/${projectId}/singular-contributions/${id(111)}`,
        "PUT",
        {
          name: "Contribuição T-11",
          type: "OTHER",
          segmentId: id(11),
          nodeId: null,
          initialLps: 0,
          finalLps: 4,
        },
      ],
    ]);
    expect(screen.getByRole("button", { name: "Salvar todos" })).toBeDisabled();
  });

  it("validates every page before sending any changes and opens the invalid page", async () => {
    const user = userEvent.setup();
    const fetchMock = successfulFetch();
    vi.stubGlobal("fetch", fetchMock);
    setup(12, onSegments(12));
    await user.type(
      screen.getByLabelText("Vazão inicial (L/s) Trecho T-1"),
      "2",
    );
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    await user.clear(screen.getByLabelText("Vazão final (L/s) Trecho T-11"));
    await user.click(screen.getByRole("button", { name: "Página anterior" }));
    await user.click(screen.getByRole("button", { name: "Salvar todos" }));
    expect(
      await screen.findByText(
        "Informe nome, destino e vazões iguais ou maiores que zero.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps failed drafts and retries only unsaved rows after partial success", async () => {
    const user = userEvent.setup();
    const fetchMock = successfulFetch();
    fetchMock.mockImplementationOnce(async (url, init) =>
      Response.json({
        ...JSON.parse(String(init?.body)),
        id: url.split("/").at(-1),
        targetCode: "T-1",
      }),
    );
    fetchMock.mockImplementationOnce(async () =>
      Response.json({ message: "Falha temporária" }, { status: 500 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    setup(2, onSegments(2));
    await user.type(
      screen.getByLabelText("Vazão inicial (L/s) Trecho T-1"),
      "2",
    );
    await user.type(
      screen.getByLabelText("Vazão inicial (L/s) Trecho T-2"),
      "3",
    );
    await user.click(screen.getByRole("button", { name: "Salvar todos" }));
    await screen.findByText(/1 contribuição salva\. 1 não foram salvas/);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Salvar todos" }),
      ).toBeEnabled(),
    );
    expect(screen.getByLabelText("Vazão inicial (L/s) Trecho T-2")).toHaveValue(
      3,
    );
    await user.click(screen.getByRole("button", { name: "Salvar todos" }));
    await screen.findByText(
      "1 contribuição salva. Recalcule o dimensionamento para atualizar as vazões.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body)).segmentId).toBe(
      id(2),
    );
  });

  it("updates existing segment and node contributions without creating duplicates", async () => {
    const user = userEvent.setup();
    const existing: SingularContribution[] = [
      {
        id: id(100),
        name: "Indústria",
        type: "INDUSTRIAL",
        nodeId: null,
        segmentId: id(1),
        initialLps: 1,
        finalLps: 2,
        targetCode: "T-1",
      },
      {
        id: id(101),
        name: "Escola",
        type: "INSTITUTIONAL",
        nodeId: id(50),
        segmentId: null,
        initialLps: 2,
        finalLps: 3,
        targetCode: "PV-01",
      },
    ];
    const fetchMock = successfulFetch();
    vi.stubGlobal("fetch", fetchMock);
    setup(1, existing);
    await user.type(screen.getByLabelText("Vazão final (L/s) Trecho T-1"), "5");
    await user.type(screen.getByLabelText("Vazão final (L/s) Nó PV-01"), "6");
    await user.click(screen.getByRole("button", { name: "Salvar todos" }));
    await screen.findByText(
      "2 contribuições salvas. Recalcule o dimensionamento para atualizar as vazões.",
    );
    expect(
      fetchMock.mock.calls.map(([url, init]) => [url, init?.method]),
    ).toEqual(
      existing.map((item) => [
        `/api/projects/${projectId}/singular-contributions/${item.id}`,
        "PUT",
      ]),
    );
  });

  it("adds a contribution targeted at a node by its code and saves it", async () => {
    const user = userEvent.setup();
    const fetchMock = successfulFetch();
    vi.stubGlobal("fetch", fetchMock);
    setup(1);
    await user.click(
      screen.getByRole("button", { name: "Adicionar contribuição" }),
    );
    await user.type(
      screen.getByLabelText("Nome da contribuição Nova contribuição"),
      "Escola",
    );
    await user.click(
      screen.getByRole("combobox", {
        name: "Destino da contribuição Nova contribuição",
      }),
    );
    await user.click(screen.getByRole("option", { name: "PV-01" }));
    await user.type(
      screen.getByLabelText("Vazão final (L/s) Nova contribuição"),
      "3",
    );
    await user.click(screen.getByRole("button", { name: "Salvar todos" }));
    await screen.findByText(
      "1 contribuição salva. Recalcule o dimensionamento para atualizar as vazões.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.method).toBe("POST");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      name: "Escola",
      nodeId: id(50),
      segmentId: null,
      finalLps: 3,
    });
  });

  it("tells segments apart from nodes by showing each segment's end nodes", async () => {
    const user = userEvent.setup();
    setup(1, onSegments(1));
    expect(screen.getByText("PV-01 → PV-02")).toBeInTheDocument();
    await user.click(
      screen.getByRole("combobox", {
        name: "Destino da contribuição Trecho T-1",
      }),
    );
    expect(
      screen.getByRole("option", { name: "T-1 (PV-01 → PV-02)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "PV-01" })).toBeInTheDocument();
  });

  it("removes an unsaved new row", async () => {
    const user = userEvent.setup();
    setup(1);
    await user.click(
      screen.getByRole("button", { name: "Adicionar contribuição" }),
    );
    await user.click(screen.getByRole("button", { name: "Remover" }));
    expect(
      screen.queryByLabelText("Nome da contribuição Nova contribuição"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Nenhuma contribuição singular cadastrada/),
    ).toBeInTheDocument();
  });

  it("changes page size without losing drafts", async () => {
    const user = userEvent.setup();
    setup(12, onSegments(12));
    await user.type(
      screen.getByLabelText("Vazão inicial (L/s) Trecho T-1"),
      "5",
    );
    await user.click(
      screen.getByRole("combobox", { name: "Linhas por página" }),
    );
    await user.click(screen.getByRole("option", { name: "25" }));
    expect(screen.getByText("Página 1 de 1")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Vazão inicial (L/s) Trecho T-12"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Vazão inicial (L/s) Trecho T-1")).toHaveValue(
      5,
    );
  });
});

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
      screen.getByRole("button", { name: "Salvar trecho" }),
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
    await user.click(screen.getByRole("button", { name: "Salvar trecho" }));
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
        screen.getByRole("button", { name: "Salvar trecho" }),
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
    await user.click(screen.getByRole("button", { name: "Salvar trecho" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(
      JSON.parse(fetchMock.mock.calls[1][1].body).receivesDryWeatherFlow,
    ).toBeNull();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Salvar trecho" }),
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

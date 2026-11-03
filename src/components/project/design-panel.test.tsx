import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DesignPanel } from "./design-results";
import { UnsavedChangesProvider } from "./unsaved-changes-provider";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const projectId = "9e8c6966-c49a-4f2f-9d9a-0953d2f6d0dc";
const segmentId = "6a3f7f43-8f6c-4d49-9e0a-2e4c6f1b0b01";
const snapshotId = "6a3f7f43-8f6c-4d49-9e0a-2e4c6f1b0c01";
const metadata = {
  id: snapshotId,
  revision: "R0",
  rulesetVersionId: "nbr-baseline-2",
  trigger: "VALIDATION",
  contentSha256: "abc",
  createdAt: "2026-10-27T12:00:00Z",
  createdBy: "11111111-1111-1111-1111-111111111111",
  exportIds: [],
};
const memorial = {
  identification: {
    projectId,
    name: "Rede salva",
    contractor: null,
    technicalManager: null,
    location: null,
    revision: "R0",
    horizon: null,
  },
  rulesetVersion: "nbr-baseline-2",
  generatedAt: "2026-10-27T12:00:00Z",
  adoptedParameters: [],
  formulas: [],
  segments: [
    {
      segmentId,
      code: "T-01",
      outcome: "DESIGNED",
      choice: {
        diameterMm: 100,
        slope: 0.01,
        material: "PVC",
        upstreamInvertM: 100,
        diameterImposed: false,
        upstreamDropM: 0,
      },
      limits: [],
      quantities: [],
      nonconformities: [],
      justifications: [],
      conflicts: [],
      attempts: [],
      reason: null,
      blockedByCodes: [],
    },
  ],
  nonconformities: [],
  justifications: [],
  appliedContributions: [],
};
const network = {
  project: {
    id: projectId,
    name: "Rede salva",
    contractor: null,
    technicalManager: null,
    location: null,
    status: "validated",
    owner: null,
    cnpj: "00000000000191",
    createdAt: "2026-10-20T12:00:00Z",
    updatedAt: "2026-10-27T12:00:00Z",
  },
  nodes: [],
  segments: [],
  designOutdated: true,
  lastSnapshotAt: "2026-10-27T12:00:00Z",
};

afterEach(() => vi.unstubAllGlobals());

describe("results panel", () => {
  it("opens the latest saved record and warns that the inputs changed since", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/network")) return Response.json(network);
        if (url.endsWith("/design-snapshots")) return Response.json([metadata]);
        if (url.endsWith(`/design-snapshots/${snapshotId}`))
          return Response.json({ ...metadata, ...memorial, inputs: null });
        return Response.json({ error: "inesperado" }, { status: 500 });
      }),
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <UnsavedChangesProvider>
          <DesignPanel projectId={projectId} tabbed />
        </UnsavedChangesProvider>
      </QueryClientProvider>,
    );
    expect(
      await screen.findByText(/Exibindo o registro salvo na validação/),
    ).toHaveTextContent("Os dados do projeto mudaram");
    expect(screen.getByText("Rede salva")).toBeVisible();
  });
});

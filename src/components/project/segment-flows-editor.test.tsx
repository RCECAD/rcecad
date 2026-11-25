import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { projectQueryKeys } from "@/api/client/query-keys";
import type {
  ProjectFlows,
  SegmentFlow,
  SingularContribution,
} from "@/api/contracts/resources";
import { SegmentFlowsEditor, toInformedLps } from "./segment-flows-editor";
import { UnsavedChangesProvider } from "./unsaved-changes-provider";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const projectId = "11111111-1111-4111-8111-111111111111";
const id = (n: number) =>
  `33333333-3333-4333-8333-${String(n).padStart(12, "0")}`;

function flow(n: number, patch: Partial<SegmentFlow> = {}): SegmentFlow {
  return {
    segmentId: id(n),
    code: `T-${n}`,
    calculatedInitialLps: 0.35 * n,
    calculatedFinalLps: 1.1 * n,
    initialLps: 0.35 * n,
    finalLps: 1.1 * n,
    informedInitialLps: null,
    informedFinalLps: null,
    ...patch,
  };
}

function setup(
  flows: Partial<ProjectFlows> = {},
  contributions: SingularContribution[] = [],
) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  client.setQueryData(projectQueryKeys.contributions(projectId), contributions);
  client.setQueryData(projectQueryKeys.network(projectId), {
    segments: [],
    nodes: [],
  });
  client.setQueryData(projectQueryKeys.flows(projectId), {
    availability: "AVAILABLE",
    minimumDesignDischargeLps: 0,
    segments: [flow(1), flow(2)],
    ...flows,
  } satisfies ProjectFlows);
  render(
    <QueryClientProvider client={client}>
      <UnsavedChangesProvider>
        <SegmentFlowsEditor projectId={projectId} />
      </UnsavedChangesProvider>
    </QueryClientProvider>,
  );
  return client;
}

afterEach(() => vi.unstubAllGlobals());

describe("segment flows", () => {
  it("opens with the calculated flows marked as coming from the system", () => {
    setup();

    expect(
      screen.getByRole("spinbutton", {
        name: "Vazão inicial (Qi) do trecho T-1, em L/s",
      }),
    ).toHaveValue(0.35);
    expect(screen.getAllByText("Sistema")).toHaveLength(2);
    expect(screen.queryByText("Informado")).not.toBeInTheDocument();
  });

  it("shows an informed flow beside the value the system calculated", () => {
    setup({
      segments: [
        flow(1, { initialLps: 5, informedInitialLps: 5 }),
        flow(2, { initialLps: 5.35 }),
      ],
    });

    expect(screen.getByText("Informado")).toBeVisible();
    expect(screen.getByText("Calculado: 0,35")).toBeVisible();
    expect(screen.getByText("Inclui vazão informada a montante")).toBeVisible();
    expect(
      screen.getByRole("button", { name: /Restaurar calculado/ }),
    ).toBeVisible();
  });

  it("keeps the concentrated contributions in the same card and points each one at its segment", () => {
    setup({}, [
      {
        id: id(101),
        name: "Hospital",
        type: "INSTITUTIONAL",
        nodeId: null,
        segmentId: id(1),
        initialLps: 2,
        finalLps: 3,
        targetCode: "T-1",
      },
    ]);

    expect(screen.getByText("Contribuições concentradas")).toBeVisible();
    expect(screen.getByText("1 cadastrada")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "+2 / 3 L/s Hospital" }),
    ).toHaveAttribute("href", `#contribution-${id(101)}`);
  });

  it("warns when the sizing will raise a flow to the minimum", () => {
    setup({ minimumDesignDischargeLps: 1.5 });

    expect(
      screen.getAllByText("Dimensionado com o mínimo de 1,5").length,
    ).toBeGreaterThan(0);
  });

  it("saves only the edited segment and keeps the untouched horizon calculated", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () =>
      Response.json({
        availability: "AVAILABLE",
        minimumDesignDischargeLps: 0,
        segments: [flow(1, { initialLps: 5, informedInitialLps: 5 }), flow(2)],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    setup();

    const input = screen.getByRole("spinbutton", {
      name: "Vazão inicial (Qi) do trecho T-1, em L/s",
    });
    await user.clear(input);
    await user.type(input, "5");
    expect(screen.getByText("Não salvo")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /Salvar vazões/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`/api/projects/${projectId}/flows/segments/${id(1)}`);
    expect(JSON.parse(String(init.body))).toEqual({
      initialLps: 5,
      finalLps: null,
    });
  });

  it("asks for the hydraulic parameters before showing any flow", () => {
    setup({ availability: "NO_PARAMETERS", segments: [] });

    expect(screen.getByText("Informe os parâmetros hidráulicos")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Ir para hidráulica" }),
    ).toHaveAttribute("href", `/project/${projectId}/hydraulics`);
  });
});

describe("informed value from the input", () => {
  it("treats the value the system already uses as not informed", () => {
    expect(toInformedLps("0.35", flow(1), "initial")).toBeNull();
    expect(toInformedLps("", flow(1), "initial")).toBeNull();
  });

  it("keeps an explicitly informed value even when it matches the calculation", () => {
    expect(
      toInformedLps("0.35", flow(1, { informedInitialLps: 5 }), "initial"),
    ).toBe(0.35);
  });

  it("rejects a negative flow", () => {
    expect(toInformedLps("-1", flow(1), "initial")).toBe("invalid");
  });
});

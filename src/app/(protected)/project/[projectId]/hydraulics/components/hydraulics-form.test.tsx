import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectParameters } from "@/api/contracts/spring";
import { UnsavedChangesProvider } from "@/components/project/unsaved-changes-provider";
import { HydraulicsForm } from "./hydraulics-form";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: mocks.toastError,
    success: mocks.toastSuccess,
  },
}));

const fetchMock = vi.fn();

const parameters: ProjectParameters = {
  initialPopulation: 312,
  finalPopulation: 468,
  returnCoefficient: 0.8,
  perCapitaFlow: 220,
  infiltrationRate: 0.1,
  peakDailyFactor: 1.25,
  peakHourlyFactor: 1.6,
  manningCoefficient: 0.01,
  defaultNetworkMaterial: "PVC JEI",
};

function details(values: Partial<ProjectParameters>, configured = true) {
  return {
    configured,
    initialPopulation: null,
    finalPopulation: null,
    returnCoefficient: null,
    perCapitaFlow: null,
    infiltrationRate: null,
    peakDailyFactor: null,
    peakHourlyFactor: null,
    manningCoefficient: null,
    defaultNetworkMaterial: null,
    justification: null,
    ...values,
    infiltrationRateUnit: "L_PER_S_KM",
    materialSwitch: null,
    defaults: {
      returnCoefficient: { value: 0.8, source: "NBR 9649:1986" },
    },
    normativeProfile: {
      rulesetVersion: "nbr-baseline-1",
      name: "ABNT NBR 9649",
      standards: ["NBR 9649:1986"],
    },
  };
}

function createJsonResponse(body: unknown, ok = true) {
  return {
    json: async () => body,
    ok,
  } as Response;
}

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <UnsavedChangesProvider>
        <HydraulicsForm projectId="project-1" />
      </UnsavedChangesProvider>
    </QueryClientProvider>,
  );
}

describe("HydraulicsForm", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    mocks.push.mockReset();
    mocks.toastError.mockReset();
    mocks.toastSuccess.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("shows conditional infiltration and Manning references without filling project inputs", async () => {
    const data = details({}, false);
    data.normativeProfile.standards.push("NBR 7367:1988");
    fetchMock.mockResolvedValue(createJsonResponse(data));
    renderForm();
    const infiltration = await screen.findByLabelText(
      "Taxa de infiltração (opcional)",
    );
    expect(infiltration).toHaveValue(null);
    expect(infiltration).toHaveAccessibleDescription(
      /Referência normativa: 0,05 a 1,0 L\/s por km \(NBR 9649:1986\).*0 L\/s por km em rede 100% PVC.*Redes mistas exigem taxa informada/,
    );
    const manning = screen.getByLabelText(
      "Coeficiente de Manning (registro) (opcional)",
    );
    expect(manning).toHaveValue(null);
    expect(manning).toHaveAccessibleDescription(
      /Referência normativa: 0,013 \(NBR 9649:1986\).*0,010 para PVC com h\/D de 0,20 a 0,75.*fora da faixa: 0,013.*Apenas registro/,
    );
    expect(
      screen.getByLabelText("Vazão per capita"),
    ).toHaveAccessibleDescription(/dados locais.*sem valor normativo fixo/);
  });

  it("shows a recoverable error instead of an editable default form when loading fails", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(createJsonResponse(details(parameters)));

    renderForm();

    expect(
      await screen.findByRole("heading", {
        name: "Não foi possível carregar a hidráulica",
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByLabelText("Coeficiente de retorno")).toHaveValue(
      parameters.returnCoefficient,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("links validation feedback to its input", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(createJsonResponse(details(parameters)));

    renderForm();

    const returnCoefficient = await screen.findByLabelText(
      "Coeficiente de retorno",
    );
    await user.clear(returnCoefficient);
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(
      await screen.findByText("Informe um número válido."),
    ).toHaveAttribute("id", "returnCoefficient-error");
    expect(returnCoefficient).toHaveAttribute(
      "aria-describedby",
      "returnCoefficient-description returnCoefficient-error",
    );
    expect(returnCoefficient).toHaveAttribute("aria-invalid", "true");
  });

  it("confirms before leaving a dirty form", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(createJsonResponse(details(parameters)));

    renderForm();

    const returnCoefficient = await screen.findByLabelText(
      "Coeficiente de retorno",
    );
    await user.clear(returnCoefficient);
    await user.type(returnCoefficient, "0.81");
    await user.click(screen.getByRole("button", { name: "Voltar" }));

    expect(
      screen.getByRole("dialog", { name: "Descartar alterações?" }),
    ).toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Continuar editando" }),
    );
    expect(mocks.push).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Voltar" }));
    await user.click(
      screen.getByRole("button", { name: "Descartar alterações" }),
    );

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith("/project/project-1");
    });
  });

  it("saves blank optional coefficients as null and preserves the network material", async () => {
    const user = userEvent.setup();
    const saved = {
      ...parameters,
      infiltrationRate: null,
      manningCoefficient: null,
      justification: null,
      materialSwitch: null,
    };
    fetchMock
      .mockResolvedValueOnce(createJsonResponse(details(parameters)))
      .mockResolvedValueOnce(createJsonResponse(saved))
      .mockResolvedValue(createJsonResponse(details(saved)));
    renderForm();
    await user.clear(
      await screen.findByLabelText("Taxa de infiltração (opcional)"),
    );
    await user.clear(
      screen.getByLabelText("Coeficiente de Manning (registro) (opcional)"),
    );
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    const put = () =>
      fetchMock.mock.calls.find(([, init]) => init?.method === "PUT");
    await waitFor(() => expect(put()).toBeDefined());
    expect(JSON.parse(put()?.[1].body)).toEqual(saved);
  });

  it("lets a new project configure its first parameters without fabricated values", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(details({ returnCoefficient: 0.8 }, false)),
    );
    renderForm();
    expect(
      await screen.findByText(/ainda não possui parâmetros hidráulicos/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("População inicial")).toHaveValue(null);
    expect(screen.getByLabelText("Taxa de infiltração (opcional)")).toHaveValue(
      null,
    );
    expect(screen.getByLabelText("Material da rede")).toHaveValue("");
    expect(screen.getByLabelText("Coeficiente de retorno")).toHaveValue(null);
    expect(
      screen.getByText("Referência normativa: 0,8 (NBR 9649:1986)"),
    ).toBeInTheDocument();
  });
});

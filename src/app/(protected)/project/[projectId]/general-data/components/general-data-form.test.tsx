import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnsavedChangesProvider } from "@/components/project/unsaved-changes-provider";
import {
  GENERAL_DATA_DEFAULTS,
  type GeneralDataFormValues,
} from "@/schemas/general-data";
import { GeneralDataForm } from "./general-data-form";

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

const completeGeneralData: GeneralDataFormValues = {
  ...GENERAL_DATA_DEFAULTS,
  name: "Projeto Centro",
  contractor: "Prefeitura Municipal de Cascavel",
  technicalManager: "Eng. João Silva",
  location: "Cascavel, PR",
  status: "inProgress",
};

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
        <GeneralDataForm projectId="project-1" />
      </UnsavedChangesProvider>
    </QueryClientProvider>,
  );
}

describe("GeneralDataForm", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    mocks.push.mockReset();
    mocks.toastError.mockReset();
    mocks.toastSuccess.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("shows a recoverable error when loading fails", async () => {
    const user = userEvent.setup();
    fetchMock
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(createJsonResponse(completeGeneralData));

    renderForm();

    expect(
      await screen.findByRole("heading", {
        name: "Não foi possível carregar os dados gerais",
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByLabelText("Nome do Projeto")).toHaveValue(
      completeGeneralData.name,
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("links validation feedback to required fields", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(createJsonResponse(completeGeneralData));

    renderForm();

    const projectName = await screen.findByLabelText("Nome do Projeto");
    await user.clear(projectName);
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(
      await screen.findByText("Informe o nome do projeto."),
    ).toHaveAttribute("id", "name-error");
    expect(projectName).toHaveAttribute("aria-describedby", "name-error");
    expect(projectName).toHaveAttribute("aria-invalid", "true");
  });

  it("saves edited general data", async () => {
    const user = userEvent.setup();
    const savedData: GeneralDataFormValues = {
      ...completeGeneralData,
      name: "Projeto atualizado",
    };

    fetchMock
      .mockResolvedValueOnce(createJsonResponse(completeGeneralData))
      .mockResolvedValueOnce(createJsonResponse(savedData));

    renderForm();

    const projectName = await screen.findByLabelText("Nome do Projeto");
    await user.clear(projectName);
    await user.type(projectName, savedData.name);
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => {
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        "Dados gerais salvos com sucesso!",
      );
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/projects/project-1/general-data",
        expect.objectContaining({
          method: "PUT",
        }),
      );
    });
  });

  it("confirms before leaving a dirty form", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue(createJsonResponse(completeGeneralData));

    renderForm();

    const location = await screen.findByLabelText("Localidade (opcional)");
    await user.clear(location);
    await user.type(location, "Cascavel");
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
      expect(mocks.push).toHaveBeenCalledWith("/home");
    });
  });
});

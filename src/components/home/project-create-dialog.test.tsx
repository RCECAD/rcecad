import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_DXF_BYTES } from "@/api/contracts/spring";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  success: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("sonner", () => ({ toast: mocks }));

import { ProjectCreateDialog } from "./project-create-dialog";

const id = "9e8c6966-c49a-4f2f-9d9a-0953d2f6d0dc";
const fetchMock = vi.fn();
const BrowserFormData = globalThis.FormData;

function submitImport() {
  const form = screen.getByLabelText("Nome do projeto").closest("form");
  if (!form) throw new Error("Import form not found");
  fireEvent.submit(form);
}

async function fillImport(size = 10) {
  const user = userEvent.setup();
  render(<ProjectCreateDialog mode="import" onClose={vi.fn()} />);
  await user.type(screen.getByLabelText("Nome do projeto"), "Rede");
  const file = new File(["DXF"], "rede.dxf", { type: "application/dxf" });
  Object.defineProperty(file, "size", { value: size });
  vi.spyOn(file, "slice").mockReturnValue({
    text: async () => "0\nSECTION",
  } as Blob);
  await user.upload(screen.getByLabelText("Arquivo DXF"), file);
  return { user, file };
}

describe("project upload dialog", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    // jsdom does not copy user-event's simulated FileList into FormData.
    vi.stubGlobal(
      "FormData",
      class extends BrowserFormData {
        constructor(form?: HTMLFormElement) {
          super(form);
          const input =
            form?.querySelector<HTMLInputElement>('input[type="file"]');
          if (input?.files?.[0]) this.set("file", input.files[0]);
        }
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sends a file above the old 5 MB limit as multipart with the import metadata", async () => {
    fetchMock.mockResolvedValue(Response.json({ id }, { status: 201 }));
    const { user, file } = await fillImport(6 * 1024 * 1024);
    await user.type(
      screen.getByLabelText("Contratante (opcional)"),
      "Prefeitura",
    );
    await user.type(
      screen.getByLabelText("Responsável técnico (opcional)"),
      "Ana",
    );
    await user.type(screen.getByLabelText("Revisão (opcional)"), "R1");
    await user.type(screen.getByLabelText("Bacia (opcional)"), "Centro");
    submitImport();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe("/api/projects/import-dxf");
    expect(init.headers).toBeUndefined();
    expect(init.body.get("file")).toBe(file);
    expect(Object.fromEntries(init.body)).toMatchObject({
      name: "Rede",
      contractor: "Prefeitura",
      technicalManager: "Ana",
      revision: "R1",
      basin: "Centro",
    });
    expect(mocks.push).toHaveBeenCalledWith(`/project/${id}/general-data`);
    expect(file.slice).toHaveBeenCalledWith(0, 18);
  });

  it("rejects a file over 300 MB before starting the upload", async () => {
    await fillImport(MAX_DXF_BYTES + 1);
    submitImport();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "O arquivo DXF deve ter até 300 MB.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the file and metadata for retry after UPLOADS_BUSY", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json(
          { error: "Há outros uploads em processamento." },
          { status: 503 },
        ),
      )
      .mockResolvedValueOnce(Response.json({ id }, { status: 201 }));
    const { file } = await fillImport();
    submitImport();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Há outros uploads em processamento.",
    );
    expect(screen.getByLabelText("Nome do projeto")).toHaveValue("Rede");
    expect(
      (screen.getByLabelText("Arquivo DXF") as HTMLInputElement).files?.[0],
    ).toBe(file);
    submitImport();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(mocks.push).toHaveBeenCalledWith(`/project/${id}/general-data`);
  });
});

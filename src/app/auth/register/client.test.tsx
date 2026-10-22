import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
}));
vi.mock("../actions", () => ({ registerAction: mocks.register }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("sonner", () => ({
  toast: { error: mocks.error, success: mocks.success },
}));

import { RegisterForm } from "./client";

async function fillForm(confirm = "Test-password!") {
  const user = userEvent.setup();
  render(<RegisterForm />);
  await user.type(screen.getByLabelText("CNPJ"), "55444333000101");
  await user.type(screen.getByLabelText("Email"), "test@example.com");
  await user.type(
    screen.getByLabelText("Senha", { exact: true }),
    "Test-password!",
  );
  await user.type(screen.getByLabelText("Confirmar Senha"), confirm);
  await user.click(screen.getByRole("button", { name: "Criar Conta" }));
}

describe("registration UI", () => {
  it("opens home after a successful registration", async () => {
    mocks.register.mockResolvedValue({ success: true, authenticated: true });
    await fillForm();
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/home"));
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("keeps the form and reports action failures", async () => {
    mocks.register.mockResolvedValue({
      success: false,
      message: "Revise os dados.",
    });
    await fillForm();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Revise os dados.",
    );
    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email")).toHaveValue("test@example.com");
  });

  it("does not submit mismatched passwords", async () => {
    await fillForm("different");
    expect(
      await screen.findByText("As senhas não coincidem."),
    ).toBeInTheDocument();
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it("offers login instead of a second registration when automatic login fails", async () => {
    mocks.register.mockResolvedValue({ success: true, authenticated: false });
    await fillForm();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Sua conta foi criada",
    );
    expect(screen.getByRole("link", { name: "Fazer login" })).toHaveAttribute(
      "href",
      "/auth/login",
    );
    expect(
      screen.queryByRole("button", { name: "Criar Conta" }),
    ).not.toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.register).toHaveBeenCalledOnce();
  });

  it("marks and focuses a rejected field without losing entered values", async () => {
    mocks.register.mockResolvedValue({
      success: false,
      field: "cnpj",
      message: "CNPJ já cadastrado.",
    });
    await fillForm();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "CNPJ já cadastrado.",
    );
    expect(screen.getByLabelText("CNPJ")).toHaveFocus();
    expect(screen.getByLabelText("CNPJ")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("Email")).toHaveValue("test@example.com");
  });

  it("handles a lost server-action response without claiming registration failed", async () => {
    mocks.register.mockRejectedValue(new Error("connection interrupted"));
    await fillForm();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível confirmar o cadastro",
    );
    expect(screen.getByLabelText("Email")).toHaveValue("test@example.com");
    expect(screen.getByRole("button", { name: "Criar Conta" })).toBeEnabled();
  });

  it("disables fields and submission while registration is pending", async () => {
    let finish!: (value: { success: boolean; message: string }) => void;
    mocks.register.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    await fillForm();
    expect(screen.getByRole("button", { name: "Criando..." })).toBeDisabled();
    expect(screen.getByLabelText("CNPJ")).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();
    finish({ success: false, message: "Tente novamente." });
    expect(
      await screen.findByRole("button", { name: "Criar Conta" }),
    ).toBeEnabled();
  });
});

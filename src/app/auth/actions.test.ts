import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({
  setAuthSession: vi.fn(),
  clearAuthSession: vi.fn(),
  getAuthSession: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/api/server/session", () => session);

import { loginAction, logoutAction, registerAction } from "./actions";

const input = {
  email: "test@example.com",
  cnpj: "55444333000101",
  password: "test-password",
  confirmPassword: "test-password",
};
const tokens = {
  accessToken: "access-fixture",
  refreshToken: "refresh-fixture",
  tokenType: "Bearer",
  expiresIn: 900,
  refreshExpiresIn: 604800,
};

describe("authentication actions with controlled Spring responses", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    session.getAuthSession.mockResolvedValue({
      refreshToken: "refresh-fixture",
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers then logs in, keeps tokens server-side and removes password confirmation", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json({
          id: "3a80ba2e-6af1-475c-8328-ed5fa619617d",
          email: input.email,
          cnpj: input.cnpj,
          corporateName: "E2E LTDA",
          roles: ["USER"],
        }),
      )
      .mockResolvedValueOnce(Response.json(tokens));
    expect(await registerAction(input)).toEqual({
      success: true,
      authenticated: true,
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      email: input.email,
      cnpj: input.cnpj,
      password: input.password,
    });
    expect(new URL(fetchMock.mock.calls[1][0]).pathname).toBe(
      "/api/auth/login",
    );
    expect(session.setAuthSession).toHaveBeenCalledWith(tokens);
  });

  it("rejects mismatched passwords without contacting Spring", async () => {
    expect(
      await registerAction({ ...input, confirmPassword: "different" }),
    ).toMatchObject({ success: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not log in or set cookies when registration is rejected", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ details: "CNPJ invalid" }, { status: 400 }),
    );
    expect(await registerAction(input)).toMatchObject({ success: false });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(session.setAuthSession).not.toHaveBeenCalled();
  });

  it("reports a created account when only automatic login fails", async () => {
    fetchMock
      .mockResolvedValueOnce(
        Response.json(
          {
            id: "3a80ba2e-6af1-475c-8328-ed5fa619617d",
            email: input.email,
            cnpj: input.cnpj,
            corporateName: "E2E LTDA",
            roles: ["USER"],
          },
          { status: 201 },
        ),
      )
      .mockRejectedValueOnce(new TypeError("offline after registration"));

    expect(await registerAction(input)).toEqual({
      success: true,
      authenticated: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(session.setAuthSession).not.toHaveBeenCalled();
  });

  it.each([
    [
      "Email already registered",
      "email",
      "Já existe uma conta com este e-mail. Faça login.",
    ],
    [
      "CNPJ already registered",
      "cnpj",
      "Já existe uma conta com este CNPJ. Faça login.",
    ],
    [
      "CNPJ has an irregular status: BAIXADA",
      "cnpj",
      "O CNPJ precisa estar ativo na Receita Federal para se cadastrar.",
    ],
  ])("explains registration rejection: %s", async (details, field, message) => {
    fetchMock.mockResolvedValueOnce(
      Response.json(
        {
          details,
          developerMessage: "private-backend-diagnostic",
        },
        { status: 400 },
      ),
    );

    expect(await registerAction(input)).toEqual({
      success: false,
      field,
      message,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("explains temporary registration unavailability without exposing internals", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json(
        {
          details: "ReceitaWS rate limit exceeded",
          developerMessage: "private-backend-diagnostic",
        },
        { status: 503 },
      ),
    );

    expect(await registerAction(input)).toEqual({
      success: false,
      message:
        "Serviço de cadastro temporariamente indisponível. Tente novamente em instantes.",
    });
  });

  it("accepts a formatted CNPJ and only sends its digits to Spring", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ details: "CNPJ already registered" }, { status: 400 }),
    );
    await registerAction({ ...input, cnpj: "55.444.333/0001-01" });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).cnpj).toBe(input.cnpj);
  });

  it("rejects whitespace-only passwords before contacting Spring", async () => {
    expect(
      await registerAction({
        ...input,
        password: "   ",
        confirmPassword: "   ",
      }),
    ).toMatchObject({ success: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports invalid credentials without exposing Spring diagnostics", async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json(
        { developerMessage: "sensitive-internal-detail" },
        { status: 401 },
      ),
    );
    expect(
      await loginAction({ email: input.email, password: input.password }),
    ).toEqual({ success: false, message: "E-mail ou senha inválidos." });
    expect(session.setAuthSession).not.toHaveBeenCalled();
  });

  it("clears local cookies during logout even when Spring is unavailable", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    await logoutAction();
    expect(session.clearAuthSession).toHaveBeenCalledOnce();
  });
});

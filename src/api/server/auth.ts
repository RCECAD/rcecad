import "server-only";

import { redirect } from "next/navigation";
import {
  loginResponseSchema,
  refreshTokenRequestSchema,
  registeredUserResponseSchema,
} from "@/api/contracts/spring";
import type { LoginFormValues } from "@/schemas/login";
import type { RegisterFormValues } from "@/schemas/register";
import {
  clearAuthSession,
  getAuthSession,
  hasAuthSession,
  setAuthSession,
} from "./session";
import { SpringApiError, springRequest } from "./spring-client";

export type AuthActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof SpringApiError && error.status === 401) {
    return "E-mail ou senha inválidos.";
  }

  if (error instanceof SpringApiError && error.status === 409) {
    return "Já existe uma conta com estes dados.";
  }

  if (error instanceof SpringApiError && error.status === 400) {
    return "Verifique os dados informados e tente novamente.";
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}

export async function loginWithSpring(input: LoginFormValues): Promise<void> {
  const payload = await springRequest(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    { auth: false, schema: loginResponseSchema },
  );

  await setAuthSession(payload);
}

export async function registerWithSpring(
  input: RegisterFormValues,
): Promise<void> {
  const { confirmPassword: _confirmPassword, ...payload } = input;
  const response = await springRequest(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { auth: false, schema: registeredUserResponseSchema },
  );

  if (!response.id) {
    throw new Error("Cadastro concluído sem identificador de usuário.");
  }

  await loginWithSpring({ email: input.email, password: input.password });
}

export async function ensureAuthenticated(): Promise<void> {
  if (!(await hasAuthSession())) {
    redirect("/auth/login");
  }
}

export async function logoutFromSpring(): Promise<void> {
  const session = await getAuthSession();

  try {
    if (session.refreshToken) {
      await springRequest(
        "/auth/logout",
        {
          method: "POST",
          body: JSON.stringify(
            refreshTokenRequestSchema.parse({
              refreshToken: session.refreshToken,
            }),
          ),
        },
        { auth: false, schema: loginResponseSchema.nullable() },
      );
    }
  } catch {
    // Local session cleanup must happen even if the backend is unavailable.
  } finally {
    await clearAuthSession();
  }
}

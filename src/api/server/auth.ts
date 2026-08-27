import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@/domain/entities";
import type { LoginFormValues } from "@/schemas/login";
import type { RegisterFormValues } from "@/schemas/register";
import { clearAuthSession, hasAuthSession, setAuthSession } from "./session";
import {
  normalizeAuthTokens,
  SpringApiError,
  springRequest,
  springRequestWithRefresh,
} from "./spring-client";

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
    return "E-mail ou senha invalidos.";
  }

  if (error instanceof SpringApiError && error.status === 409) {
    return "Ja existe uma conta com estes dados.";
  }

  return "Nao foi possivel concluir a operacao. Tente novamente.";
}

export async function loginWithSpring(input: LoginFormValues): Promise<void> {
  const payload = await springRequest<unknown>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    { auth: false },
  );

  await setAuthSession(normalizeAuthTokens(payload));
}

export async function registerWithSpring(
  input: RegisterFormValues,
): Promise<void> {
  const { confirmPassword: _confirmPassword, ...payload } = input;
  const response = await springRequest<unknown>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { auth: false },
  );

  try {
    await setAuthSession(normalizeAuthTokens(response));
  } catch {
    await loginWithSpring({
      email: input.email,
      password: input.password,
    });
  }
}

export async function getCurrentUser(): Promise<User> {
  try {
    return await springRequest<User>("/auth/me");
  } catch (error) {
    if (error instanceof SpringApiError && error.status === 401) {
      redirect("/auth/login");
    }

    throw error;
  }
}

export async function getCurrentUserWithRefresh(): Promise<User> {
  return springRequestWithRefresh<User>("/auth/me");
}

export async function ensureAuthenticated(): Promise<void> {
  if (!(await hasAuthSession())) {
    redirect("/auth/login");
  }
}

export async function logoutFromSpring(): Promise<void> {
  try {
    await springRequestWithRefresh("/auth/logout", { method: "POST" });
  } catch {
    // Local session cleanup must happen even if the backend is unavailable.
  } finally {
    await clearAuthSession();
  }
}

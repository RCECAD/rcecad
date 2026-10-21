import "server-only";

import { redirect } from "next/navigation";
import {
  loginResponseSchema,
  refreshTokenRequestSchema,
  registeredUserResponseSchema,
  springErrorSchema,
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

export type RegisterActionResult =
  | { success: true; authenticated: boolean }
  | {
      success: false;
      message: string;
      field?: keyof RegisterFormValues;
    };

export function getRegistrationError(
  error: unknown,
): Extract<RegisterActionResult, { success: false }> {
  if (error instanceof SpringApiError) {
    const parsed = springErrorSchema.safeParse(error.payload);
    const details = parsed.success ? parsed.data.details : undefined;

    // Translate only known business errors; never forward upstream diagnostics.
    if (error.status === 400 || error.status === 409) {
      if (details === "Email already registered") {
        return {
          success: false,
          field: "email",
          message: "Já existe uma conta com este e-mail. Faça login.",
        };
      }
      if (details === "CNPJ already registered") {
        return {
          success: false,
          field: "cnpj",
          message: "Já existe uma conta com este CNPJ. Faça login.",
        };
      }
      if (details?.startsWith("CNPJ has an irregular status:")) {
        return {
          success: false,
          field: "cnpj",
          message:
            "O CNPJ precisa estar ativo na Receita Federal para se cadastrar.",
        };
      }
      if (
        details === "Invalid or unknown CNPJ" ||
        parsed.data?.developerMessage ===
          "com.rcecad.domain.exception.InvalidCnpjException"
      ) {
        return {
          success: false,
          field: "cnpj",
          message:
            "CNPJ inválido ou não encontrado. Confira o número informado.",
        };
      }
    }

    if ([429, 502, 503, 504].includes(error.status)) {
      return {
        success: false,
        message:
          "Serviço de cadastro temporariamente indisponível. Tente novamente em instantes.",
      };
    }
    if (error.status === 422) {
      return { success: false, message: "Revise os dados informados." };
    }
  }
  return { success: false, message: getAuthErrorMessage(error) };
}

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
): Promise<{ authenticated: boolean }> {
  const { confirmPassword: _confirmPassword, corporateName, ...values } = input;
  const payload = { ...values, corporateName: corporateName || undefined };
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

  try {
    await loginWithSpring({ email: input.email, password: input.password });
    return { authenticated: true };
  } catch {
    // Registration is committed. Do not invite the user to create it again.
    await clearAuthSession();
    return { authenticated: false };
  }
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

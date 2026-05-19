"use server";

import { registerUser } from "@/domain/features/auth/register-user";
import { type RegisterFormValues, registerSchema } from "@/schemas/register";

type RegisterActionResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      fieldErrors?: Partial<Record<keyof RegisterFormValues, string[]>>;
    };

export const registerUserAction = async (
  input: RegisterFormValues,
): Promise<RegisterActionResult> => {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Dados de cadastro inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, cnpj, email, password } = parsed.data;

  try {
    await registerUser({ name, cnpj, email, password });
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao registrar conta.";

    return {
      ok: false,
      message,
    };
  }
};

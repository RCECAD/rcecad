"use server";

import {
  type AuthActionResult,
  getAuthErrorMessage,
  loginWithSpring,
  logoutFromSpring,
  registerWithSpring,
} from "@/api/server/auth";
import { type LoginFormValues, loginSchema } from "@/schemas/login";
import { type RegisterFormValues, registerSchema } from "@/schemas/register";

export async function loginAction(
  values: LoginFormValues,
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Revise os dados informados.",
    };
  }

  try {
    await loginWithSpring(parsed.data);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: getAuthErrorMessage(error),
    };
  }
}

export async function registerAction(
  values: RegisterFormValues,
): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      message: "Revise os dados informados.",
    };
  }

  try {
    await registerWithSpring(parsed.data);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: getAuthErrorMessage(error),
    };
  }
}

export async function logoutAction(): Promise<void> {
  await logoutFromSpring();
}

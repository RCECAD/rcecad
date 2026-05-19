import { z } from "zod";

const cnpjRegex = /^\d{14}$/;

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome da empresa.")
      .max(120, "O nome da empresa deve conter no máximo 120 caracteres."),

    cnpj: z.string().trim().regex(cnpjRegex, "O CNPJ deve ter 14 dígitos."),

    email: z.string().trim().email("Informe um email válido."),

    password: z
      .string()
      .min(8, "Senha deve ter no mínimo 8 caracteres.")
      .regex(/[A-Z]/, "A senha deve conter pelo menos 1 letra maiúscula.")
      .regex(/[0-9]/, "A senha deve conter pelo menos 1 número."),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

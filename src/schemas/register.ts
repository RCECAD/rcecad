import { z } from "zod";

const cnpjRegex = /^\d{14}$/;

export const registerSchema = z
  .object({
    cnpj: z.string().trim().regex(cnpjRegex, "O CNPJ deve ter 14 dígitos."),

    email: z.string().trim().email("Informe um email válido."),

    password: z.string().min(1, "Informe a senha."),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um email válido."),
  password: z.string().min(1, "Informe a senha."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

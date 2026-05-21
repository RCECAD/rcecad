import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um email válido."),
  password: z.string().min(8, "Informe uma senha válida."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

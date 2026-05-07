import { z } from "zod";

export const exampleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe um nome.")
    .max(120, "O nome deve ter no maximo 120 caracteres."),
  description: z
    .string()
    .trim()
    .max(255, "A descricao deve ter no maximo 255 caracteres.")
    .optional(),
});

export type ExampleFormValues = z.infer<typeof exampleSchema>;

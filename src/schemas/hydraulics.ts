import { z } from "zod";

const numericStringRefinement = (val: string) => !Number.isNaN(Number(val));

export const hydraulicsSchema = z.object({
  returnCoefficient: z
    .string()
    .trim()
    .min(1, "O coeficiente de retorno é obrigatório.")
    .refine(
      numericStringRefinement,
      "O coeficiente de retorno deve ser um número válido.",
    ),
  consumptionPerCapita: z
    .string()
    .trim()
    .min(1, "O consumo per capita é obrigatório.")
    .refine(
      numericStringRefinement,
      "O consumo per capita deve ser um número válido.",
    ),
  infiltrationRate: z
    .string()
    .trim()
    .min(1, "A taxa de infiltração é obrigatória.")
    .refine(
      numericStringRefinement,
      "A taxa de infiltração deve ser um número válido.",
    ),
  minFlowCoefficient: z
    .string()
    .trim()
    .min(1, "O coeficiente de mínima vazão é obrigatório.")
    .refine(
      numericStringRefinement,
      "O coeficiente de mínima vazão deve ser um número válido.",
    ),
  maxFlowCoefficient: z
    .string()
    .trim()
    .min(1, "O coeficiente de máxima vazão é obrigatório.")
    .refine(
      numericStringRefinement,
      "O coeficiente de máxima vazão deve ser um número válido.",
    ),
  justification: z.string().trim().optional(),
  calculationRule: z
    .string()
    .trim()
    .min(1, "A regra de cálculo é obrigatória."),
  regulatoryProfile: z
    .string()
    .trim()
    .min(1, "O perfil normativo é obrigatório."),
});

export type HydraulicsFormValues = z.infer<typeof hydraulicsSchema>;

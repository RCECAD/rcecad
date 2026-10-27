import { z } from "zod";
import { projectStatusSchema } from "@/api/contracts/spring";

const optionalText = z.string().trim().max(200);

/** Editable project fields accepted by PUT /api/projects/{id}. */
export const generalDataSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do projeto.").max(200),
  contractor: optionalText,
  technicalManager: optionalText,
  location: optionalText,
  status: projectStatusSchema,
  internalCode: z.string().trim().max(50).optional(),
  revision: z.string().trim().max(50).optional(),
  systemType: z.string().trim().max(100).optional(),
  horizon: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(5000).optional(),
  totalAreaKm2: z.number().finite().nonnegative().nullable().optional(),
  totalNetworkLengthM: z.number().finite().positive().nullable().optional(),
  sector: optionalText.optional(),
  basin: optionalText.optional(),
});

export const projectStatuses = [
  { value: "pending", label: "Com pendências" },
  { value: "inProgress", label: "Em andamento" },
  { value: "validated", label: "Validado" },
  { value: "exported", label: "Exportado" },
] as const;

export type GeneralDataFormValues = z.infer<typeof generalDataSchema>;

export const GENERAL_DATA_DEFAULTS: GeneralDataFormValues = {
  name: "",
  contractor: "",
  technicalManager: "",
  location: "",
  status: "pending",
};

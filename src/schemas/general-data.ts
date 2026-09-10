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

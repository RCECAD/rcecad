import { z } from "zod";

const requiredText = (message: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, message)
    .max(maxLength, `Máximo de ${maxLength} caracteres.`);

export const systemTypes = [
  "Esgotamento Sanitário",
  "Drenagem Urbana",
  "Abastecimento de Água",
] as const;

export const generalDataSchema = z.object({
  projectName: requiredText("Informe o nome do projeto."),
  internalCode: requiredText("Informe o código interno.", 50),
  contractor: requiredText("Informe o contratante."),
  city: requiredText("Informe o município ou localidade."),
  revision: requiredText("Informe a revisão.", 50),
  technicalManager: requiredText("Informe o responsável técnico."),
  systemType: z
    .string()
    .trim()
    .min(1, "Selecione o tipo de sistema.")
    .refine(
      (value) => systemTypes.includes(value as (typeof systemTypes)[number]),
      "Selecione um tipo de sistema válido.",
    ),
  horizonStage: requiredText("Informe a etapa ou horizonte."),
  notes: z
    .string()
    .trim()
    .max(1000, "As observações devem conter no máximo 1000 caracteres."),
  basin: requiredText("Informe a bacia."),
  sector: requiredText("Informe o setor."),
  totalArea: requiredText("Informe a área total.", 50),
});

export type GeneralDataFormValues = z.infer<typeof generalDataSchema>;

export const GENERAL_DATA_DEFAULTS: GeneralDataFormValues = {
  projectName: "proj_sanepar",
  internalCode: "00000",
  contractor: "Prefeitura Municipal de Cascavel",
  city: "Cascavel PR",
  revision: "rev.129",
  technicalManager: "Giovane Comelli",
  systemType: "",
  horizonStage: "",
  notes: "",
  basin: "",
  sector: "",
  totalArea: "",
};

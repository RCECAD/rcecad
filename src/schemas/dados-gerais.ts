import { z } from "zod";

const requiredText = (message: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, message)
    .max(maxLength, `Máximo de ${maxLength} caracteres.`);

export const dadosGeraisSchema = z.object({
  nomeProjeto: requiredText("Informe o nome do projeto."),
  codigoInterno: requiredText("Informe o código interno.", 50),
  contratante: requiredText("Informe o contratante."),
  municipioLocalidade: requiredText("Informe o município ou localidade."),
  revisao: requiredText("Informe a revisão.", 50),
  responsavelTecnico: requiredText("Informe o responsável técnico."),
  tipoDeSistema: requiredText("Informe o tipo de sistema."),
  etapaHorizonte: requiredText("Informe a etapa ou horizonte."),
  observacoes: z
    .string()
    .trim()
    .max(1000, "As observações devem conter no máximo 1000 caracteres."),
  bacia: requiredText("Informe a bacia."),
  setor: requiredText("Informe o setor."),
  areaTotal: requiredText("Informe a área total.", 50),
});

export type DadosGeraisFormValues = z.infer<typeof dadosGeraisSchema>;

import type { z } from "zod";
import { pt } from "zod/locales";

// Per-parse configuration keeps messages in Portuguese without global Zod state.
const locale = pt().localeError;
const error: z.core.$ZodErrorMap = (issue) => {
  switch (issue.code) {
    case "invalid_type":
      return issue.expected === "number"
        ? "Informe um número válido."
        : issue.expected === "int"
          ? "Informe um número inteiro."
          : "Preencha este campo com um valor válido.";
    case "too_big":
      return issue.origin === "string"
        ? `Use no máximo ${issue.maximum} caracteres.`
        : `Informe um valor ${issue.inclusive ? "menor ou igual a" : "menor que"} ${issue.maximum.toLocaleString("pt-BR")}.`;
    case "too_small":
      return issue.origin === "string"
        ? `Use no mínimo ${issue.minimum} caracteres.`
        : `Informe um valor ${issue.inclusive ? "maior ou igual a" : "maior que"} ${issue.minimum.toLocaleString("pt-BR")}.`;
    case "invalid_value":
      return "Selecione uma opção válida.";
    default:
      return locale(issue);
  }
};
export const portugueseValidation = { error };

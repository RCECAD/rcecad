import { z } from "zod";

const cnpjRegex = /^\d{14}$/;

function hasPasswordSymbol(value: string) {
  return Array.from(value).some((character) => {
    const code = character.codePointAt(0) ?? 0;
    // Match Java's Character.isWhitespace/isSpaceChar, including U+001C-U+001F.
    const whitespace =
      (code >= 9 && code <= 13) ||
      (code >= 28 && code <= 32) ||
      /\p{Z}/u.test(character);
    return !whitespace && !/[\p{L}\p{Nd}]/u.test(character);
  });
}

export const registerSchema = z
  .object({
    cnpj: z
      .string()
      .trim()
      .transform((value) => value.replace(/[./-]/g, ""))
      .pipe(z.string().regex(cnpjRegex, "O CNPJ deve ter 14 dígitos.")),

    email: z.string().trim().email("Informe um email válido."),

    corporateName: z
      .string()
      .trim()
      .max(255, "Use até 255 caracteres.")
      .optional(),

    password: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres.")
      .regex(/\p{Uppercase}/u, "A senha deve ter uma letra maiúscula.")
      .refine(hasPasswordSymbol, "A senha deve ter um símbolo.")
      .refine(
        (value) => new TextEncoder().encode(value).byteLength <= 72,
        "A senha deve ter no máximo 72 bytes.",
      ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

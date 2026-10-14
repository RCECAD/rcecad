import { describe, expect, it } from "vitest";
import { registerSchema } from "./register";

const input = {
  cnpj: "55.444.333/0001-01",
  email: "  test@example.com  ",
  password: " password with spaces ",
  confirmPassword: " password with spaces ",
};

describe("registration validation", () => {
  it("normalizes CNPJ and e-mail without changing the password", () => {
    expect(registerSchema.parse(input)).toEqual({
      ...input,
      cnpj: "55444333000101",
      email: "test@example.com",
    });
  });

  it.each([
    "",
    "123",
    "55.444.333/0001-01abc",
    "554443330001012",
    "55444333000101\nextra",
  ])("rejects an invalid CNPJ format: %s", (cnpj) => {
    expect(registerSchema.safeParse({ ...input, cnpj }).success).toBe(false);
  });

  it("rejects blank passwords without trimming valid ones", () => {
    expect(
      registerSchema.safeParse({
        ...input,
        password: "  ",
        confirmPassword: "  ",
      }).success,
    ).toBe(false);
  });
});

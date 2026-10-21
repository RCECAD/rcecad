import { describe, expect, it } from "vitest";
import { registerSchema } from "./register";

const input = {
  cnpj: "55.444.333/0001-01",
  email: "  test@example.com  ",
  password: " Password with spaces! ",
  confirmPassword: " Password with spaces! ",
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

  it.each([
    "Abcdef!",
    "lowercase!",
    "Uppercase1",
    "Uppercase ",
    "Password\u001c",
  ])("rejects a password outside the backend policy: %s", (password) => {
    expect(
      registerSchema.safeParse({
        ...input,
        password,
        confirmPassword: password,
      }).success,
    ).toBe(false);
  });

  it("matches the backend's Unicode and BCrypt byte limits", () => {
    for (const password of [
      "Ábcdefg!",
      "Ⅰbcdefg!",
      "Password²",
      `A!${"x".repeat(70)}`,
    ]) {
      expect(
        registerSchema.safeParse({
          ...input,
          password,
          confirmPassword: password,
        }).success,
      ).toBe(true);
    }
    const password = `A!${"é".repeat(36)}`;
    expect(
      registerSchema.safeParse({
        ...input,
        password,
        confirmPassword: password,
      }).success,
    ).toBe(false);
  });

  it("accepts and trims the optional company name", () => {
    expect(
      registerSchema.parse({ ...input, corporateName: " Empresa Ltda " })
        .corporateName,
    ).toBe("Empresa Ltda");
    expect(
      registerSchema.safeParse({ ...input, corporateName: "x".repeat(256) })
        .success,
    ).toBe(false);
  });
});

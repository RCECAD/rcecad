import { expect, type Page, test } from "@playwright/test";
import { appUrl, login } from "./helpers";

async function fillRegistration(page: Page, email = login.email) {
  await page.goto("/auth/register");
  await page.getByLabel("CNPJ", { exact: true }).fill("00.000.000/0001-91");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Registration-fixture!");
  await page.getByLabel("Confirmar Senha").fill("Registration-fixture!");
}

test.afterEach(async ({ context }) => {
  await context.request.post(`${appUrl}/api/auth/logout`);
});

test("registration: invalid form never reaches the server", async ({
  page,
}) => {
  let submissions = 0;
  page.on("request", (request) => {
    if (request.url().includes("/auth/register") && request.method() === "POST")
      submissions++;
  });
  await fillRegistration(page);
  await page.getByLabel("CNPJ", { exact: true }).fill("123");
  await page.getByLabel("Confirmar Senha").fill("different");
  await page.getByRole("button", { name: "Criar Conta" }).click();
  await expect(page.getByText("O CNPJ deve ter 14 dígitos.")).toBeVisible();
  await expect(page.getByText("As senhas não coincidem.")).toBeVisible();
  expect(submissions).toBe(0);
});

test("registration: real Spring rejects duplicate email and CNPJ with field messages", async ({
  page,
  context,
}) => {
  await fillRegistration(page);
  await page.getByRole("button", { name: "Criar Conta" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "Já existe uma conta com este e-mail. Faça login.",
  );
  await expect(page.getByLabel("Email", { exact: true })).toBeFocused();
  await page
    .getByLabel("Email", { exact: true })
    .fill(`duplicate-${Date.now()}@example.invalid`);
  await page.getByRole("button", { name: "Criar Conta" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "Já existe uma conta com este CNPJ. Faça login.",
  );
  await expect(page.getByLabel("CNPJ", { exact: true })).toBeFocused();
  expect(
    (await context.cookies()).filter((cookie) =>
      cookie.name.startsWith("rcecad."),
    ).length,
  ).toBe(0);
});

test("registration: a lost action response keeps the form and allows recovery", async ({
  page,
}) => {
  await fillRegistration(page);
  await page.route("**/auth/register", async (route) => {
    if (route.request().method() === "POST")
      await route.abort("connectionfailed");
    else await route.continue();
  });
  await page.getByRole("button", { name: "Criar Conta" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "Não foi possível confirmar o cadastro.",
  );
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(
    login.email,
  );
  await page.unroute("**/auth/register");
  await page.getByRole("button", { name: "Criar Conta" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText(
    "Já existe uma conta com este e-mail. Faça login.",
  );
});

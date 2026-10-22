import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { appUrl } from "../e2e/helpers";

test("live registration: ReceitaWS, account, automatic login, project and later login", async ({
  page,
  context,
}) => {
  const cnpj = process.env.E2E_REGISTRATION_CNPJ?.replace(/[./-]/g, "").trim();
  if (!cnpj || !/^\d{14}$/.test(cnpj)) {
    throw new Error(
      "Set E2E_REGISTRATION_CNPJ to an active CNPJ not registered in the local database. This test creates and retains a real local account.",
    );
  }
  const email = `cadastro-e2e-${Date.now()}@example.invalid`;
  const password = `A!${randomUUID()}`;
  console.log(`Registration fixture email: ${email}`);
  page.on("pageerror", (error) => {
    throw error;
  });

  try {
    await page.goto("/auth/register");
    const formatted = cnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5",
    );
    await page.getByLabel("CNPJ", { exact: true }).fill(formatted);
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByLabel("Confirmar Senha").fill(password);
    await page.getByRole("button", { name: "Criar Conta" }).click();
    await expect(page).toHaveURL(/\/home$/, { timeout: 35_000 });

    const cookies = (await context.cookies()).filter((cookie) =>
      cookie.name.startsWith("rcecad."),
    );
    expect(cookies.length).toBe(2);
    expect(
      cookies.every((cookie) => cookie.httpOnly && cookie.sameSite === "Lax"),
    ).toBe(true);
    const html = await page.content();
    expect(cookies.some((cookie) => html.includes(cookie.value))).toBe(false);
    expect(await page.evaluate(() => document.cookie.includes("rcecad."))).toBe(
      false,
    );

    const initial = await context.request.get(`${appUrl}/api/projects`);
    expect(initial.status()).toBe(200);
    expect(await initial.json()).toMatchObject({
      content: [],
      totalElements: 0,
    });

    const name = `Cadastro E2E ${Date.now()}`;
    await page.getByRole("button", { name: /Novo Projeto/ }).click();
    await page.getByLabel("Nome do projeto", { exact: true }).fill(name);
    await page
      .getByRole("button", { name: "Criar projeto", exact: true })
      .click();
    await expect(page).toHaveURL(/\/general-data$/);
    const id = new URL(page.url()).pathname.split("/")[2];
    console.log(`Registration fixture project: ${name} | ${id}`);

    await context.request.post(`${appUrl}/api/auth/logout`);
    await page.goto("/home");
    await expect(page).toHaveURL(/\/auth\/login$/);
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    await page.goto(`/project/${id}/general-data`);
    await expect(
      page.getByLabel("Nome do Projeto", { exact: true }),
    ).toHaveValue(name);
  } finally {
    await context.request.post(`${appUrl}/api/auth/logout`);
  }
});

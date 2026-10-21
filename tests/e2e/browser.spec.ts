import { expect, test } from "@playwright/test";
import {
  appUrl,
  createProject,
  dxf,
  login,
  principalToken,
  setSession,
  testPrefix,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => {
    throw error;
  });
});
test.afterEach(async ({ context }) => {
  await context.request.post(`${appUrl}/api/auth/logout`);
});

test("browser: login, cookie privacy, SSR renewal and logout", async ({
  page,
  context,
}) => {
  await page.goto("/home");
  await expect(page).toHaveURL(/\/auth\/login$/);
  await page.getByLabel("E-mail", { exact: true }).fill(login.email);
  await page.getByLabel("Senha", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("E-mail ou senha inválidos.")).toBeVisible();
  await page.getByLabel("Senha", { exact: true }).fill(login.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
  const authCookies = (await context.cookies()).filter((cookie) =>
    cookie.name.startsWith("rcecad."),
  );
  expect(authCookies.length).toBe(2);
  expect(
    authCookies.every((cookie) => cookie.httpOnly && cookie.sameSite === "Lax"),
  ).toBe(true);
  expect(await page.evaluate(() => document.cookie.includes("rcecad."))).toBe(
    false,
  );
  const html = await page.content();
  expect(authCookies.some((cookie) => html.includes(cookie.value))).toBe(false);
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage)
        .concat(Object.keys(sessionStorage))
        .some((key) => /token/i.test(key)),
    ),
  ).toBe(false);
  let refreshes = 0;
  page.on("request", (request) => {
    if (
      request.url().endsWith("/api/auth/refresh") &&
      request.method() === "POST"
    )
      refreshes++;
  });
  await context.clearCookies({ name: "rcecad.access_token" });
  await page.goto("/home");
  await expect(
    page.getByRole("button", { name: /Novo Projeto/ }),
  ).toBeVisible();
  expect(refreshes).toBe(1);
  expect(
    (await context.cookies()).some(
      (cookie) => cookie.name === "rcecad.access_token",
    ),
  ).toBe(true);
  await context.request.post("/api/auth/logout");
  await page.goto("/home");
  await expect(page).toHaveURL(/\/auth\/login$/);
});

test("browser: create, edit, confirm unsaved changes and persist hydraulic values", async ({
  page,
  context,
}) => {
  await setSession(context);
  await page.goto("/home");
  await page.getByRole("button", { name: /Novo Projeto/ }).click();
  const name = `${testPrefix} Interface`;
  await page.getByLabel("Nome do projeto", { exact: true }).fill(name);
  await page
    .getByRole("button", { name: "Criar projeto", exact: true })
    .click();
  await expect(page).toHaveURL(/\/general-data$/);
  const id = new URL(page.url()).pathname.split("/")[2];
  console.log(`Fixture: ${name} | ${id}`);
  await expect(page.getByLabel("Nome do Projeto", { exact: true })).toHaveValue(
    name,
  );
  await page.getByLabel("Contratante (opcional)").fill("Prefeitura E2E");
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Descartar alterações?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continuar editando" }).click();
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(
    page.getByText("Dados gerais salvos com sucesso!"),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Contratante (opcional)")).toHaveValue(
    "Prefeitura E2E",
  );
  await page.goto(`/project/${id}/hydraulics`);
  await expect(
    page.getByText(/ainda não possui parâmetros hidráulicos/),
  ).toBeVisible();
  for (const [label, value] of [
    ["População inicial", "100"],
    ["População final", "200"],
    ["Coeficiente de retorno", "0.8"],
    ["Vazão per capita", "200"],
    ["Fator de pico diário (K1)", "1.2"],
    ["Fator de pico horário (K2)", "1.5"],
    ["Material da rede", "PVC JEI"],
  ]) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(
    page.getByText("Nenhuma alteração foi feita ainda.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByLabel("Material da rede", { exact: true }),
  ).toHaveValue("PVC JEI");
  await expect(page.getByLabel("Taxa de infiltração (opcional)")).toHaveValue(
    "",
  );
  await expect(page.getByText("L/s por km", { exact: true })).toBeVisible();
  await page.getByLabel("Taxa de infiltração (opcional)").fill("0.1");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(
    page.getByText("Nenhuma alteração foi feita ainda.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Taxa de infiltração (opcional)")).toHaveValue(
    "0.1",
  );
});

test("browser: DXF validation, recoverable backend rejection and successful upload", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 650 });
  await setSession(context);
  await page.goto("/home");
  await page.getByRole("button", { name: /Importar .DXF/ }).click();
  const name = `${testPrefix} DXF interface`;
  await page.getByLabel("Nome do projeto", { exact: true }).fill(name);
  const upload = page.getByLabel("Arquivo DXF", { exact: true });
  for (const file of [
    {
      name: "empty.dxf",
      buffer: Buffer.alloc(0),
      error: "Selecione um arquivo .dxf válido.",
    },
    {
      name: "binary.dxf",
      buffer: Buffer.from("AutoCAD Binary DXF"),
      error: "Exporte o desenho no formato DXF de texto (ASCII).",
    },
    {
      name: "invalid.dxf",
      buffer: Buffer.from(dxf.replace("SANC_REDE", "OTHER")),
      error: /network|rede/i,
    },
  ]) {
    await upload.setInputFiles({
      name: file.name,
      mimeType: "application/dxf",
      buffer: file.buffer,
    });
    await page
      .getByRole("button", { name: "Importar projeto", exact: true })
      .click();
    await expect(page.getByRole("alert")).toHaveText(file.error);
    await expect(
      page.getByLabel("Nome do projeto", { exact: true }),
    ).toHaveValue(name);
  }
  await upload.setInputFiles({
    name: "valid.dxf",
    mimeType: "application/dxf",
    buffer: Buffer.from(`999\n${"x".repeat(1000)}\n`.repeat(6200) + dxf),
  });
  await page
    .getByRole("button", { name: "Importar projeto", exact: true })
    .click();
  await expect(page).toHaveURL(/\/general-data$/);
  const id = new URL(page.url()).pathname.split("/")[2];
  console.log(`Fixture: ${name} | ${id}`);
  expect(
    (await (await context.request.get(`/api/projects/${id}`)).json())
      .totalSegments,
  ).toBe(1);
});

test("browser: refresh rejects external redirects and handles an invalid session", async ({
  context,
  page,
}) => {
  await setSession(context);
  await page.goto("/auth/refresh?next=https%3A%2F%2Fexample.com");
  await expect(page).toHaveURL(`${appUrl}/home`);
  await context.addCookies([
    {
      name: "rcecad.access_token",
      value: principalToken({ expired: true }),
      url: appUrl,
      httpOnly: true,
    },
    {
      name: "rcecad.refresh_token",
      value: "invalid-refresh-fixture",
      url: appUrl,
      httpOnly: true,
    },
  ]);
  await page.goto("/home");
  await expect(page).toHaveURL(/\/auth\/login$/);
  expect(
    (await context.cookies()).filter((cookie) =>
      cookie.name.startsWith("rcecad."),
    ).length,
  ).toBe(0);
});

test("browser: hydraulic API errors display retry and recover without defaults", async ({
  context,
  page,
}) => {
  await setSession(context);
  const project = await createProject(context.request, "Erro de rede");
  const endpoint = `**/api/projects/${project.id}/hydraulics`;
  await page.route(endpoint, (route) =>
    route.fulfill({ status: 503, json: { error: "Offline test" } }),
  );
  await page.goto(`/project/${project.id}/hydraulics`);
  await expect(
    page.getByRole("heading", {
      name: "Não foi possível carregar a hidráulica",
    }),
  ).toBeVisible();
  await expect(page.getByLabel("População inicial")).toHaveCount(0);
  await page.unroute(endpoint);
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByLabel("População inicial")).toHaveValue("");
});

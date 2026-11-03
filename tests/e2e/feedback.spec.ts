import { expect, test } from "@playwright/test";
import { createProject, setSession } from "./helpers";

test("feedback em português: recupera falha, salva e segue para a próxima etapa", async ({
  context,
  page,
}, testInfo) => {
  await setSession(context);
  const project = await createProject(
    context.request,
    "Feedback de salvamento",
  );
  let fail = true;
  await page.route(
    `**/api/projects/${project.id}/general-data`,
    async (route) => {
      if (fail) {
        fail = false;
        await route.fulfill({
          status: 503,
          json: { error: "Internal Server Error" },
        });
      } else await route.continue();
    },
  );
  await page.goto(`/project/${project.id}/general-data`);
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "temporariamente indisponível",
  );
  await expect(page.getByText("Internal Server Error")).toHaveCount(0);
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await page
    .getByLabel("Contratante (opcional)", { exact: true })
    .fill("Verificação de feedback");
  await page
    .getByRole("button", { name: "Salvar alterações", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Dados gerais salvos" }),
  ).toBeInViewport({ ratio: 1 });
  const persisted = await context.request.get(
    `/api/projects/${project.id}/general-data`,
  );
  expect((await persisted.json()).contractor).toBe("Verificação de feedback");
  await page.screenshot({
    path: testInfo.outputPath("salvamento.png"),
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Configurar dados hidráulicos", exact: true })
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/project/${project.id}/hydraulics$`),
  );
  await expect(
    page.getByRole("heading", { name: "Hidráulica", exact: true }),
  ).toBeVisible();
});

test("pendências e exportação bloqueada oferecem correções úteis também no celular", async ({
  context,
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setSession(context);
  const project = await createProject(
    context.request,
    "Feedback de pendências",
  );
  await page.goto(`/project/${project.id}/validation`);
  await page.getByRole("button", { name: "Iniciar validação" }).click();
  const missing = page.getByRole("listitem").filter({
    has: page.getByRole("heading", {
      name: "Parâmetros hidráulicos não informados",
    }),
  });
  await expect(missing).toContainText("Informe população");
  await expect(page.getByText("Missing design parameters")).toHaveCount(0);
  await expect(
    missing.getByRole("link", { name: "Ir para correção" }),
  ).toHaveAttribute("href", `/project/${project.id}/hydraulics`);
  await page.screenshot({
    path: testInfo.outputPath("validacao-mobile.png"),
    fullPage: true,
  });
  await missing.getByRole("link", { name: "Ir para correção" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/project/${project.id}/hydraulics$`),
  );
  await page.goto(`/project/${project.id}/sizing`);
  await page.getByRole("link", { name: "Cadastrar rede", exact: true }).click();
  await expect(
    page.getByRole("group", { name: "Nó", exact: true }),
  ).toBeVisible();
  await page.goto(`/project/${project.id}/export`);
  await page
    .getByRole("button", { name: "Exportar documentos selecionados" })
    .click();
  await expect(
    page.getByText("Exportação bloqueada pela validação", { exact: true }),
  ).toBeInViewport();
  await page.screenshot({
    path: testInfo.outputPath("exportacao-mobile.png"),
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Ir para validação", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(
    new RegExp(`/project/${project.id}/validation$`),
  );
});

test("endereço inexistente mostra orientação e navegação em português", async ({
  page,
}) => {
  await page.goto("/pagina-inexistente-feedback");
  await expect(
    page.getByRole("heading", { name: "Página não encontrada" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Ir para o login", exact: true })
    .click();
  await expect(page).toHaveURL(/\/auth\/login$/);
});

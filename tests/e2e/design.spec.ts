import { expect, test } from "@playwright/test";
import { networkDesignSchema } from "../../src/api/contracts/design";
import { projectDetailResponseSchema } from "../../src/api/contracts/spring";
import { appUrl, dxf, parameters, setSession, testPrefix } from "./helpers";

test("CDRE: importa, salva dados de campo, calcula, invalida resultados e valida com Spring real", async ({
  context,
  page,
}) => {
  test.setTimeout(180_000);
  await setSession(context);
  const api = context.request;
  const imported = await api.post("/api/projects/import-dxf", {
    multipart: {
      name: `${testPrefix} CDRE didático`,
      file: {
        name: "rede.dxf",
        mimeType: "application/dxf",
        buffer: Buffer.from(dxf),
      },
    },
  });
  expect(imported.status()).toBe(201);
  const project = await imported.json();
  console.log(`Fixture CDRE didática: ${project.id}`);
  const base = `/api/projects/${project.id}`;
  const networkResponse = await api.get(`${base}/network`);
  const network = projectDetailResponseSchema.parse(
    await networkResponse.json(),
  );
  const missing = await api.get(`${base}/validation`);
  expect(missing.status()).toBe(200);
  expect((await missing.json()).readyToConclude).toBe(false);
  const refused = await api.get(`${base}/design`);
  expect(refused.status()).toBe(422);
  expect((await refused.json()).code).toBe("INCOMPLETE_SURVEY_DATA");

  expect(
    (await api.put(`${base}/hydraulics`, { data: parameters })).status(),
  ).toBe(200);
  await page.goto(`/project/${project.id}/sizing`);
  for (const node of network.nodes) {
    const input = page.getByLabel(`Cota de terreno ${node.code}`, {
      exact: true,
    });
    await input.fill("101.5");
    const row = page.getByRole("row").filter({ has: input });
    await row.getByRole("button", { name: "Salvar cota", exact: true }).click();
    await expect(
      row.getByRole("button", { name: "Salvar cota", exact: true }),
    ).toBeDisabled();
  }
  for (const segment of network.segments) {
    const input = page.getByLabel(
      `Contribuição de tempo seco ${segment.code}`,
      { exact: true },
    );
    await input.selectOption("false");
    await page
      .getByLabel(`Tipo de elemento ${segment.code}`, { exact: true })
      .selectOption("COLLECTOR");
    const row = page.getByRole("row").filter({ has: input });
    await row
      .getByRole("button", { name: "Salvar trecho", exact: true })
      .click();
    await expect(
      row.getByRole("button", { name: "Salvar trecho", exact: true }),
    ).toBeDisabled();
  }
  await page
    .getByRole("main")
    .getByRole("button", { name: "Pavimentação", exact: true })
    .click();
  const category = page.getByLabel(
    `Categoria de recobrimento ${network.segments[0].code}`,
    { exact: true },
  );
  await category.selectOption("SIDEWALK");
  const pavingRow = page.getByRole("row").filter({ has: category });
  await pavingRow
    .getByRole("button", { name: "Salvar trecho", exact: true })
    .click();
  await expect(
    pavingRow.getByRole("button", { name: "Salvar trecho", exact: true }),
  ).toBeDisabled();

  await page
    .getByRole("button", { name: "Dimensionamento", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Calcular dimensionamento", exact: true })
    .click();
  await expect(
    page.getByText("Dimensionamento por trecho", { exact: true }),
  ).toBeVisible();
  const response = await api.get(`${base}/design`);
  expect(response.status()).toBe(200);
  const design = networkDesignSchema.parse(await response.json());
  expect(
    design.segments.every((segment) => segment.status === "designed"),
  ).toBe(true);
  const first = design.segments[0];
  expect(first.status).toBe("designed");
  if (first.status !== "designed")
    throw new Error("Expected a designed segment");
  const initial = first.quantities.find(
    (quantity) => quantity.key === "initialDischarge",
  );
  expect(initial?.value).toBe(1.5);

  await page.getByRole("button", { name: "Vazões", exact: true }).click();
  const contribution = page.getByLabel(
    `Contribuição inicial ${first.segmentCode}`,
    { exact: true },
  );
  await contribution.fill("2");
  const flowRow = page.getByRole("row").filter({ has: contribution });
  await flowRow
    .getByRole("button", { name: "Salvar trecho", exact: true })
    .click();
  await expect(
    flowRow.getByRole("button", { name: "Salvar trecho", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Resultados", exact: true }).click();
  await expect(
    page.getByText("Dimensionamento por trecho", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Calcular dimensionamento", exact: true })
    .click();
  await expect(
    page.getByRole("tab", { name: "Resumo Executivo" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Resultados por Trecho" }).click();
  await expect(
    page.getByText("Dimensionamento por trecho", { exact: true }),
  ).toBeVisible();
  const recalculated = networkDesignSchema.parse(
    await (await api.get(`${base}/design`)).json(),
  );
  const changed = recalculated.segments[0];
  expect(changed.status).toBe("designed");
  if (changed.status === "designed")
    expect(
      changed.quantities.find((quantity) => quantity.key === "initialDischarge")
        ?.value,
    ).toBeGreaterThan(initial?.value ?? 0);
  await page.getByRole("button", { name: "Validação", exact: true }).click();
  await page
    .getByRole("button", { name: "Validar projeto", exact: true })
    .click();
  await expect(
    page.getByText("Projeto apto a concluir:", { exact: false }),
  ).toBeVisible();
  const updatedNetwork = projectDetailResponseSchema.parse(
    await (await api.get(`${base}/network`)).json(),
  );
  expect(updatedNetwork.project.status).toBe("validated");
  await page.reload();
  await expect(
    page.getByText("Execute a validação para consultar as pendências atuais."),
  ).toBeVisible();
  expect(page.url()).toContain(`${appUrl}/project/${project.id}/validation`);
});

import { exportDocumentSchema } from "@/api/contracts/resources";
import { exportDocument } from "@/api/server/resources";
import { handleFile } from "@/api/server/route-handler";

type Context = { params: Promise<{ projectId: string; document: string }> };

export async function POST(_request: Request, { params }: Context) {
  const { projectId, document } = await params;
  const parsed = exportDocumentSchema.safeParse(document);
  if (!parsed.success)
    return Response.json(
      { error: "Documento de exportação inválido." },
      { status: 404 },
    );
  const extension = parsed.data === "spreadsheet" ? "xlsx" : "pdf";
  return handleFile(
    () => exportDocument(projectId, parsed.data),
    `${parsed.data}.${extension}`,
  );
}

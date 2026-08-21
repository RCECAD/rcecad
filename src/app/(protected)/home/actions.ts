"use server";
import type { HydraulicNode, Project, Segment } from "@/domain/entities";
import { importDxf } from "@/domain/features/dxf/import-dxf";

export type ImportDxfState =
  | { status: "idle" }
  | {
      status: "success";
      project: Project;
      nodes: HydraulicNode[];
      segments: Segment[];
    }
  | { status: "error"; error: string };

export async function importDxfAction(
  _prev: ImportDxfState,
  formData: FormData,
): Promise<ImportDxfState> {
  try {
    const name = formData.get("name");
    const file = formData.get("dxf");

    if (typeof name !== "string" || !name.trim()) {
      return { status: "error", error: "Nome do projeto é obrigatório." };
    }
    if (!(file instanceof File) || file.size === 0) {
      return { status: "error", error: "Arquivo DXF inválido." };
    }

    const dxfContent = await file.text();
    const result = await importDxf({ projectName: name.trim(), dxfContent });
    return { status: "success", ...result };
  } catch (e) {
    return { status: "error", error: String(e) };
  }
}

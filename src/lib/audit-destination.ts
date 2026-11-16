import type { ProjectAuditItem } from "@/api/contracts/design";

export interface AuditDestination {
  href: string;
  label: string;
}

const encoded = (value: string) => encodeURIComponent(value);

export function auditDestination(
  projectId: string,
  item: ProjectAuditItem,
): AuditDestination | null {
  if (item.operation === "DELETE") return null;

  const root = `/project/${encoded(projectId)}`;
  const entityId = item.entityId ? encoded(item.entityId) : null;
  const firstField = item.changes?.[0]?.field;

  switch (item.area) {
    case "GENERAL_DATA":
      return {
        href: `${root}/general-data${firstField ? `#${encoded(firstField)}` : ""}`,
        label: "Ver nos dados gerais",
      };
    case "HYDRAULICS":
      return {
        href: `${root}/hydraulics${firstField ? `#${encoded(firstField)}` : ""}`,
        label: "Ver nos dados hidráulicos",
      };
    case "TOPOLOGY":
    case "SURVEY":
      return {
        href: `${root}/sizing${entityId && item.entityType ? `#${item.entityType.toLowerCase()}-${entityId}` : "#network-topology"}`,
        label:
          item.entityType === "NODE"
            ? "Ver nó no dimensionamento"
            : item.entityType === "SEGMENT"
              ? "Ver trecho no dimensionamento"
              : "Ver rede no dimensionamento",
      };
    case "PAVING":
      return {
        href: `${root}/paving${entityId ? `#segment-${entityId}` : ""}`,
        label: "Ver trecho na pavimentação",
      };
    case "FLOWS":
      return {
        href: `${root}/flows${entityId ? `#contribution-${entityId}` : ""}`,
        label: "Ver contribuição nas vazões",
      };
    case "VALIDATION": {
      const prefix =
        item.entityType === "WAIVER"
          ? "waiver"
          : item.entityType === "NONCONFORMITY"
            ? "nonconformity"
            : "project-validation";
      return {
        href: `${root}/validation#${entityId && prefix !== "project-validation" ? `${prefix}-${entityId}` : prefix}`,
        label: "Ver na validação",
      };
    }
    case "RESULTS":
      return entityId
        ? {
            href: `${root}/results?snapshot=${entityId}#snapshot-${entityId}`,
            label: "Ver registro nos resultados",
          }
        : { href: `${root}/results`, label: "Ver resultados" };
    case "EXPORT":
      return {
        href: `${root}/export#export-history`,
        label: "Ver no histórico de exportações",
      };
  }
}

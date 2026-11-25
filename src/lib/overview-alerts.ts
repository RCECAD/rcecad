import type { ValidationItem } from "@/api/contracts/design";
import type { TrackedNonconformity } from "@/api/contracts/resources";
import { nonconformityFeedback } from "@/lib/nonconformity-feedback";
import { correctionPath, validationGuidance } from "@/lib/project-feedback";

export type OverviewAlertSeverity = ValidationItem["severity"];

export type OverviewAlert = {
  key: string;
  severity: OverviewAlertSeverity;
  title: string;
  target: string | null;
  href: string;
  actionLabel: string;
};

const targetLabels = { SEGMENT: "Trecho", NODE: "Nó" } as const;
const severityOrder: Record<OverviewAlertSeverity, number> = {
  CRITICAL: 0,
  ALERT: 1,
  INFO: 2,
};
const nonconformitySeverity: Record<
  TrackedNonconformity["severity"],
  OverviewAlertSeverity
> = { CRITICAL: "CRITICAL", WARNING: "ALERT", INFO: "INFO" };

function pendingAlert(projectId: string, item: ValidationItem): OverviewAlert {
  const { type, id, code } = item.target;
  return {
    key: `pending-${item.title}-${id ?? "project"}`,
    severity: item.severity,
    title: validationGuidance(item).title,
    target: type !== "PROJECT" && code ? `${targetLabels[type]} ${code}` : null,
    href: correctionPath(projectId, item),
    actionLabel: "Ir para correção",
  };
}

function nonconformityAlert(
  projectId: string,
  item: TrackedNonconformity,
): OverviewAlert {
  return {
    key: `nonconformity-${item.id}`,
    severity: nonconformitySeverity[item.severity],
    title: nonconformityFeedback(item).title,
    target: item.segmentCode ? `Trecho ${item.segmentCode}` : null,
    href: `/project/${projectId}/validation#nonconformity-${item.id}`,
    actionLabel: "Ver na validação",
  };
}

export function overviewAlerts(
  projectId: string,
  pendingItems: ValidationItem[],
  openNonconformities: TrackedNonconformity[],
): OverviewAlert[] {
  return [
    ...pendingItems.map((item) => pendingAlert(projectId, item)),
    ...openNonconformities.map((item) => nonconformityAlert(projectId, item)),
  ].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

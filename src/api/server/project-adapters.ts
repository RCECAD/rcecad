import "server-only";

import type {
  ProjectDetailResponse,
  ProjectResponse,
  ProjectSummaryResponse,
} from "@/api/contracts/spring";
import type { Project } from "@/domain/entities";
import type { GeneralDataFormValues } from "@/schemas/general-data";

function optionalValue(value: string | null) {
  return value ?? undefined;
}

export function toProject(
  source: ProjectSummaryResponse | ProjectResponse,
): Project {
  return {
    id: source.id,
    name: source.name,
    contractor: optionalValue(source.contractor),
    location: optionalValue(source.location),
    status: source.status,
    createdAt: source.createdAt,
    ...("internalCode" in source
      ? {
          internalCode: source.internalCode ?? undefined,
          revision: source.revision ?? undefined,
          systemType: source.systemType ?? undefined,
          horizon: source.horizon ?? undefined,
          notes: source.notes ?? undefined,
          totalAreaKm2: source.totalAreaKm2 ?? undefined,
          sector: source.sector ?? undefined,
          basin: source.basin ?? undefined,
        }
      : {}),
    ...("updatedAt" in source ? { updatedAt: source.updatedAt } : {}),
    ...("technicalManager" in source
      ? { technicalManager: optionalValue(source.technicalManager) }
      : {}),
    ...("owner" in source ? { owner: optionalValue(source.owner) } : {}),
    ...("cnpj" in source ? { cnpj: source.cnpj } : {}),
    ...("totalSegments" in source
      ? { totalSegments: source.totalSegments }
      : {}),
  };
}

export function toProjectFromDetail(source: ProjectDetailResponse): Project {
  return {
    ...toProject(source.project),
    totalSegments: source.segments.length,
  };
}

export function toGeneralDataFormValues(
  project: Project,
): GeneralDataFormValues {
  return {
    name: project.name,
    contractor: project.contractor ?? "",
    technicalManager: project.technicalManager ?? "",
    location: project.location ?? "",
    status: project.status,
    internalCode: project.internalCode ?? "",
    revision: project.revision ?? "",
    systemType: project.systemType ?? "",
    horizon: project.horizon ?? "",
    notes: project.notes ?? "",
    totalAreaKm2: project.totalAreaKm2 ?? null,
    sector: project.sector ?? "",
    basin: project.basin ?? "",
  };
}

export function toProjectUpdateRequest(values: GeneralDataFormValues) {
  return {
    name: values.name,
    contractor: values.contractor || null,
    technicalManager: values.technicalManager || null,
    location: values.location || null,
    status: values.status,
  };
}

import "server-only";

import type { Project } from "@/domain/entities";

// Explicit opt-in for UI work without Spring. Integration is the default.
export const isDevPreview =
  process.env.NODE_ENV === "development" && process.env.DEV_PREVIEW === "true";

export const previewProject: Project = {
  id: "dev-project",
  name: "proj_sanepar",
  createdAt: "2026-04-12T12:22:00-03:00",
  updatedAt: "2026-04-12T13:24:00-03:00",
  contractor: "Prefeitura Municipal de Cascavel",
  technicalManager: "Giovane Comelli",
  status: "inProgress",
};

import "server-only";

import type { Project } from "@/domain/entities";

// Temporary UI preview. Set DEV_PREVIEW=false to require login locally again.
export const isDevPreview =
  process.env.NODE_ENV === "development" && process.env.DEV_PREVIEW !== "false";

export const previewProject: Project = {
  id: "dev-project",
  name: "proj_sanepar",
  createdAt: "2026-04-12T12:22:00-03:00",
  updatedAt: "2026-04-12T13:24:00-03:00",
  contractor: "Prefeitura Municipal de Cascavel",
  technicalManager: "Giovane Comelli",
  status: "inProgress",
};

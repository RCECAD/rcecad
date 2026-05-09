import type { HomeProjectStatus } from "@/domain/entities/home-project-status";

export type HomeProject = {
  id: string;
  name: string;
  updatedAt: string;
  location: string;
  owner: string;
  status: HomeProjectStatus;
};

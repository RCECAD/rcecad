import type { QueryClient } from "@tanstack/react-query";
import type { ProjectListQuery } from "@/api/contracts/spring";

export const projectQueryKeys = {
  all: ["projects"] as const,
  lists: () => [...projectQueryKeys.all, "list"] as const,
  list: (query: ProjectListQuery) =>
    [...projectQueryKeys.lists(), query] as const,
  detail: (projectId: string) =>
    [...projectQueryKeys.all, "detail", projectId] as const,
  generalData: (projectId: string) =>
    [...projectQueryKeys.all, "general-data", projectId] as const,
  parameters: (projectId: string) =>
    [...projectQueryKeys.all, "parameters", projectId] as const,
  calculations: (projectId: string) =>
    [...projectQueryKeys.all, "calculations", projectId] as const,
};

export async function invalidateProjectDependents(
  queryClient: QueryClient,
  projectId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() }),
    queryClient.invalidateQueries({
      queryKey: projectQueryKeys.detail(projectId),
    }),
    queryClient.invalidateQueries({
      queryKey: projectQueryKeys.calculations(projectId),
    }),
  ]);
}

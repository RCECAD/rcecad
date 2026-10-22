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
  network: (projectId: string) =>
    [...projectQueryKeys.all, "network", projectId] as const,
  validation: (projectId: string) =>
    [...projectQueryKeys.all, "validation", projectId] as const,
  overview: (projectId: string) =>
    [...projectQueryKeys.all, "overview", projectId] as const,
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
      queryKey: projectQueryKeys.overview(projectId),
    }),
    queryClient.cancelQueries({
      queryKey: projectQueryKeys.calculations(projectId),
    }),
    queryClient.cancelQueries({
      queryKey: projectQueryKeys.validation(projectId),
    }),
  ]);
  await Promise.all([
    queryClient.resetQueries({
      queryKey: projectQueryKeys.calculations(projectId),
    }),
    queryClient.resetQueries({
      queryKey: projectQueryKeys.validation(projectId),
    }),
  ]);
}

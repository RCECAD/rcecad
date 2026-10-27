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
  actions: (projectId: string, limit: number) =>
    [...projectQueryKeys.all, "actions", projectId, limit] as const,
  contributions: (projectId: string) =>
    [...projectQueryKeys.all, "contributions", projectId] as const,
  nonconformities: (projectId: string) =>
    [...projectQueryKeys.all, "nonconformities", projectId] as const,
  waivers: (projectId: string) =>
    [...projectQueryKeys.all, "waivers", projectId] as const,
  memorial: (projectId: string) =>
    [...projectQueryKeys.all, "memorial", projectId] as const,
  executiveSummary: (projectId: string) =>
    [...projectQueryKeys.all, "executive-summary", projectId] as const,
  snapshots: (projectId: string) =>
    [...projectQueryKeys.all, "snapshots", projectId] as const,
  exports: (projectId: string) =>
    [...projectQueryKeys.all, "exports", projectId] as const,
};

export const normativeProfileQueryKey = ["normative-profile"] as const;

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
  // Memorial and summary are computed on demand from the current inputs.
  await Promise.all(
    [
      projectQueryKeys.calculations(projectId),
      projectQueryKeys.validation(projectId),
      projectQueryKeys.memorial(projectId),
      projectQueryKeys.executiveSummary(projectId),
    ].map((queryKey) => queryClient.resetQueries({ queryKey })),
  );
}

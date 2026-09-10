import { getHomeProjects } from "@/api/server/projects";
import { HomeHero } from "@/components/home/home-hero";
import { HomeClient } from "./client";

export default async function Page() {
  const payload = await getHomeProjects();

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-background pt-16 overflow-y-auto">
      <HomeHero userName="Usuário" />
      <HomeClient payload={payload} />
    </main>
  );
}

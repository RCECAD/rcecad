import { currentUser } from "@clerk/nextjs/server";
import { HomeHero } from "@/components/home/home-hero";
import { getHomeProjects } from "@/domain/features/home/get-home-projects";
import { HomeClient } from "./client";

export default async function Page() {
  const user = await currentUser();
  const userName =
    user?.firstName ??
    user?.username ??
    user?.emailAddresses[0]?.emailAddress?.split("@")[0] ??
    "Giovane";

  const payload = await getHomeProjects({});

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-background pt-16 overflow-y-auto">
      <HomeHero userName={userName} />
      <HomeClient payload={payload} />
    </main>
  );
}

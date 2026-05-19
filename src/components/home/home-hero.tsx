import { HomeActions } from "@/components/home/home-actions";

type HomeHeroProps = {
  userName: string;
};

export function HomeHero({ userName }: Readonly<HomeHeroProps>) {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-5xl select-none font-semibold tracking-tight text-foreground">
          Olá, {userName}!
        </h1>
        <p className="text-[32px] select-none text-muted-foreground">
          O que faremos hoje?
        </p>
      </div>
      <div className="w-full max-w-186">
        <HomeActions />
      </div>
    </section>
  );
}

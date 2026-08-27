import Link from "next/link";
import { hasAuthSession } from "@/api/server/session";
import { NavbarLogo } from "@/components/navbar/navbar-logo";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const isSignedIn = await hasAuthSession();

  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50 px-6 py-12">
      <main className="flex w-full max-w-3xl flex-col items-center gap-10 rounded-lg border border-slate-200 bg-white px-8 py-14 text-center shadow-sm">
        <NavbarLogo />
        <div className="flex flex-col items-center gap-4">
          <h1 className="max-w-xl text-3xl font-semibold leading-10 tracking-tight text-slate-950">
            Plataforma RCECAD
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Acesse seus projetos e continue o dimensionamento com os dados do
            backend Spring Boot.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-base font-medium sm:flex-row">
          {isSignedIn ? (
            <Link href="/home">
              <Button>Ir para o início</Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/login">
                <Button>Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="secondary">Cadastrar</Button>
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

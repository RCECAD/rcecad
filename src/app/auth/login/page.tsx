import { NavbarLogo } from "@/components/navbar/navbar-logo";
import { LoginForm } from "./client";

export const metadata = {
  title: "Login - RCECAD",
  description: "Acesse sua conta no RCECAD",
};

export default async function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-slate-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex flex-col gap-1 items-center justify-center h-fit w-full mb-8">
            <NavbarLogo />
            <h1 className="text-center font-bold text-xl">
              Bem-vindo(a) ao RCEcad.
            </h1>
            <p className="text-center text-sm text-slate-600">
              Ainda não tem uma conta?{" "}
              <a href="/auth/register" className="underline">
                Crie uma conta
              </a>
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

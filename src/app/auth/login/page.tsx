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
          <LoginForm />

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-center text-sm text-slate-600">
              Ainda não tem uma conta?{" "}
              <a
                href="/auth/register"
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Crie uma conta
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

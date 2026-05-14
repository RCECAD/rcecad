import { RegisterForm } from "./client";

export const metadata = {
  title: "Criar Conta - RCECAD",
  description: "Registre sua empresa no RCECAD",
};

export default async function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-slate-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <RegisterForm />

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-center text-sm text-slate-600">
              Já tem uma conta?{" "}
              <a
                href="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Faça login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

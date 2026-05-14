"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function RegisterError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-slate-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Algo deu errado
            </h2>
            <p className="text-slate-600 mb-6">
              Houve um erro ao carregar a página de registro.
            </p>

            <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-left">
              <p className="text-sm text-red-700 font-mono">
                {error.message || "Erro desconhecido"}
              </p>
            </div>

            <Button onClick={reset} className="w-full">
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

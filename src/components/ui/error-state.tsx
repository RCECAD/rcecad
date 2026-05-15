"use client";

import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title: string;
  description: string;
  errorMessage?: string;
  retryLabel?: string;
  onRetry: () => void;
};

export function ErrorState({
  title,
  description,
  errorMessage,
  retryLabel = "Tentar novamente",
  onRetry,
}: Readonly<ErrorStateProps>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-slate-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">{title}</h2>
            <p className="text-slate-600 mb-6">{description}</p>

            <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-left">
              <p className="text-sm text-red-700 font-mono">
                {errorMessage || "Erro desconhecido"}
              </p>
            </div>

            <Button onClick={onRetry} className="w-full">
              {retryLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

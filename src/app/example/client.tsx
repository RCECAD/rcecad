"use client";

import Link from "next/link";
import { ExampleComponent } from "@/components/example/component";
import type { Example } from "@/domain/entities";

interface Props {
  example: Example;
}

export function ExampleClient({ example }: Readonly<Props>) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      {example.name}
      <div>
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-50">
          Example
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Rota de exemplo com componente, estados de rota e paginas aninhadas.
        </p>
      </div>

      <ExampleComponent
        title="Componente de exemplo"
        description="Este componente vive em src/components/example porque pertence a rota app/example."
      />

      <div className="flex gap-3">
        <Link
          href="/example/create"
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white dark:bg-slate-50 dark:text-slate-950"
        >
          Criar exemplo
        </Link>
        <Link
          href="/example/1"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:text-slate-100"
        >
          Ver detalhe
        </Link>
      </div>
    </main>
  );
}

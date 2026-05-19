"use client";

import Link from "next/link";

type ExampleDetailsClientProps = {
  id: string;
};

export function ExampleDetailsClient({
  id,
}: Readonly<ExampleDetailsClientProps>) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-50">
          Detalhe do exemplo
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          ID selecionado: {id}
        </p>
      </div>

      <Link
        href="/example"
        className="w-fit rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:text-slate-100"
      >
        Voltar
      </Link>
    </main>
  );
}

"use client";

import { exampleSchema } from "@/schemas/example";

export function CreateExampleClient() {
  const sample = exampleSchema.parse({
    name: "Exemplo inicial",
    description: "Payload validado com Zod antes de criar o registro.",
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-50">
          Criar exemplo
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Formulario base para uma pagina de criacao.
        </p>
      </div>

      <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
        <label className="grid gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
          Nome
          <input
            name="name"
            defaultValue={sample.name}
            className="rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none dark:border-slate-700"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
          Descricao
          <textarea
            name="description"
            defaultValue={sample.description}
            className="min-h-24 rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none dark:border-slate-700"
          />
        </label>
        <button
          type="button"
          className="w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white dark:bg-slate-50 dark:text-slate-950"
        >
          Salvar
        </button>
      </form>
    </main>
  );
}

"use client";
import Link from "next/link";
import type { ProjectListItem } from "@/domain/entities";

type Props = {
  projects: ProjectListItem[];
};

export function ProjectsClient({ projects }: Readonly<Props>) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
            Projetos
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {projects.length === 0
              ? "Nenhum projeto cadastrado."
              : `${projects.length} projeto${projects.length > 1 ? "s" : ""} encontrado${projects.length > 1 ? "s" : ""}.`}
          </p>
        </div>
        <Link
          href="/import-dxf"
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950"
        >
          Importar DXF
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">
            Nenhum projeto ainda.{" "}
            <Link
              href="/import-dxf"
              className="font-medium text-zinc-950 underline dark:text-zinc-50"
            >
              Importe um arquivo DXF
            </Link>{" "}
            para começar.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
                  Nome
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-600 dark:text-zinc-400">
                  Contratante
                </th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">
                  Trechos
                </th>
                <th className="px-4 py-3 text-right font-medium text-zinc-600 dark:text-zinc-400">
                  Criado em
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {projects.map((p) => (
                <tr
                  key={p.id}
                  className="bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                >
                  <td className="px-4 py-3 font-medium text-zinc-950 dark:text-zinc-50">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {p.contractor ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {p.totalSegments}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                    {p.createdAt.toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/projects/${p.id}`}
                      className="font-medium text-zinc-950 underline-offset-2 hover:underline dark:text-zinc-50"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

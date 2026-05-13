"use client";
import Link from "next/link";
import type { ProjectDetailOutput } from "@/domain/features/project/get-project";

type Props = {
  data: NonNullable<ProjectDetailOutput>;
};

export function ProjectDetailClient({ data }: Readonly<Props>) {
  const { project, nodes, segments } = data;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/projects"
            className="mb-2 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ← Projetos
          </Link>
          <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
            {project.name}
          </h1>
          <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {project.contractor && (
              <div>
                <dt className="inline font-medium text-zinc-700 dark:text-zinc-300">
                  Contratante:{" "}
                </dt>
                <dd className="inline">{project.contractor}</dd>
              </div>
            )}
            {project.technicalManager && (
              <div>
                <dt className="inline font-medium text-zinc-700 dark:text-zinc-300">
                  Resp. Técnico:{" "}
                </dt>
                <dd className="inline">{project.technicalManager}</dd>
              </div>
            )}
            <div>
              <dt className="inline font-medium text-zinc-700 dark:text-zinc-300">
                Criado:{" "}
              </dt>
              <dd className="inline">
                {project.createdAt.toLocaleDateString("pt-BR")}
              </dd>
            </div>
          </dl>
        </div>

        {project.hasOriginalDxf && (
          <a
            href={`/api/projects/${project.id}/export-dxf`}
            className="shrink-0 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Baixar DXF original
          </a>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          Trechos{" "}
          <span className="text-sm font-normal text-zinc-500">
            ({segments.length})
          </span>
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                {[
                  "Código",
                  "PV Mon",
                  "PV Jus",
                  "GI Mon (m)",
                  "GI Jus (m)",
                  "Comp (m)",
                  "Decliv (%)",
                  "Pavimento",
                  "Diâm (mm)",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {segments.map((s) => (
                <tr
                  key={s.id}
                  className="bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                >
                  <td className="px-3 py-2 font-mono font-medium">{s.code}</td>
                  <td className="px-3 py-2 font-mono">{s.upstreamNode}</td>
                  <td className="px-3 py-2 font-mono">{s.downstreamNode}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {s.upstreamInvert.toFixed(3)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {s.downstreamInvert.toFixed(3)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {s.length.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {(s.slope * 100).toFixed(4)}
                  </td>
                  <td className="px-3 py-2">{s.pavementType ?? "—"}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {s.diameter != null ? s.diameter * 1000 : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          Nós Hidráulicos{" "}
          <span className="text-sm font-normal text-zinc-500">
            ({nodes.length})
          </span>
        </h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                {[
                  "Código",
                  "Tipo",
                  "X (UTM)",
                  "Y (UTM)",
                  "GI (m)",
                  "Cota Terr (m)",
                  "Prof (m)",
                  "Ângulo (°)",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {nodes.map((n) => {
                const depth =
                  n.terrainElevation != null
                    ? n.terrainElevation - n.invertElevation
                    : null;
                return (
                  <tr
                    key={n.id}
                    className="bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                  >
                    <td className="px-3 py-2 font-mono font-medium">
                      {n.code}
                    </td>
                    <td className="px-3 py-2">{n.type}</td>
                    <td className="px-3 py-2 tabular-nums">{n.x.toFixed(3)}</td>
                    <td className="px-3 py-2 tabular-nums">{n.y.toFixed(3)}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {n.invertElevation.toFixed(3)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {n.terrainElevation?.toFixed(3) ?? "—"}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {depth != null ? depth.toFixed(3) : "—"}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {n.angle?.toFixed(2) ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

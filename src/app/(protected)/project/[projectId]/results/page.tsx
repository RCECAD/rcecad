import Link from "next/link";
import { getProjectCalculations } from "@/domain/features/calculations/get-calculations";
import type { ApiSegmentCalculation } from "@/lib/projects/projects-api";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

const COLUMNS: ReadonlyArray<{
  label: string;
  value: (row: ApiSegmentCalculation) => string;
}> = [
  { label: "Trecho", value: (r) => r.code },
  { label: "PV Mon", value: (r) => r.upstreamNodeCode },
  { label: "PV Jus", value: (r) => r.downstreamNodeCode },
  { label: "Comp (m)", value: (r) => r.length.toFixed(2) },
  { label: "Terr Mon", value: (r) => fmt(r.terrainUpstream) },
  { label: "Terr Jus", value: (r) => fmt(r.terrainDownstream) },
  { label: "GI Mon", value: (r) => r.invertUpstream.toFixed(3) },
  { label: "GI Jus", value: (r) => r.invertDownstream.toFixed(3) },
  { label: "NA Mon", value: (r) => r.waterLevelUpstream.toFixed(3) },
  { label: "NA Jus", value: (r) => r.waterLevelDownstream.toFixed(3) },
  { label: "Prof Mon", value: (r) => fmt(r.depthUpstream) },
  { label: "Prof Jus", value: (r) => fmt(r.depthDownstream) },
  { label: "Diâm (mm)", value: (r) => (r.diameter * 1000).toFixed(0) },
  { label: "Decliv (%)", value: (r) => (r.slope * 100).toFixed(4) },
  { label: "Q ini (L/s)", value: (r) => r.contributionInitial.toFixed(3) },
  { label: "Q fim (L/s)", value: (r) => r.contributionFinal.toFixed(3) },
  { label: "Q calc ini", value: (r) => r.designInitial.toFixed(2) },
  { label: "Q calc fim", value: (r) => r.designFinal.toFixed(2) },
  { label: "Vel Ini", value: (r) => r.velocityInitial.toFixed(2) },
  { label: "Vel Fim", value: (r) => r.velocityFinal.toFixed(2) },
  { label: "Trativa (Pa)", value: (r) => r.tractiveTension.toFixed(2) },
  { label: "H/D Ini", value: (r) => r.depthRatioInitial.toFixed(3) },
  { label: "H/D Fim", value: (r) => r.depthRatioFinal.toFixed(3) },
];

function fmt(value: number | null): string {
  return value != null ? value.toFixed(3) : "—";
}

export default async function ResultsPage({ params }: Readonly<PageProps>) {
  const { projectId } = await params;
  const rows = await getProjectCalculations(projectId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Resultados
        </h1>
        <p className="text-muted-foreground mt-1">
          Dimensionamento hidráulico por trecho (NBR 9649).
        </p>
      </div>

      {rows == null ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Parâmetros do projeto não configurados.{" "}
          <Link
            href={`/project/${projectId}/general-data`}
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Configure os parâmetros
          </Link>{" "}
          para rodar os cálculos.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {COLUMNS.map((column) => (
                  <th
                    key={column.label}
                    className="whitespace-nowrap px-3 py-2 text-left font-medium text-muted-foreground"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.code} className="hover:bg-muted/30">
                  {COLUMNS.map((column) => (
                    <td
                      key={column.label}
                      className="whitespace-nowrap px-3 py-2 tabular-nums"
                    >
                      {column.value(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

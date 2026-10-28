"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { projectQueryKeys } from "@/api/client/query-keys";
import { parseClientJson } from "@/api/client/response";
import { projectDetailResponseSchema } from "@/api/contracts/spring";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { nodeRows, segmentRows } from "./network-geometry";

const elementLabels: Record<string, string> = {
  COLLECTOR: "Coletor",
  TRUNK_COLLECTOR: "Coletor tronco",
  INTERCEPTOR: "Interceptor",
  OUTFALL: "Emissário",
  BUILDING_CONNECTION: "Ramal predial",
};
const pavementLabels: Record<string, string> = {
  SIDEWALK: "Passeio",
  PAVED_STREET_WITH_CURB_AND_GUTTER: "Via pavimentada",
  UNPAVED_OR_UNDEFINED_GRADE: "Via de terra",
};
const number = (value: number | null | undefined, digits = 3) =>
  value === null || value === undefined
    ? "—"
    : value.toLocaleString("pt-BR", { maximumFractionDigits: digits });

type Column<T> = {
  key: string;
  label: string;
  value: (row: T) => string | number | null;
  render?: (row: T) => ReactNode;
};

function SortableTable<T extends { id: string }>({
  rows,
  columns,
  caption,
}: {
  rows: T[];
  columns: Column<T>[];
  caption: string;
}) {
  const [sort, setSort] = useState<{ key: string; asc: boolean }>();
  const sorted = useMemo(() => {
    const column = columns.find((item) => item.key === sort?.key);
    if (!column || !sort) return rows;
    return [...rows].sort((a, b) => {
      const left = column.value(a);
      const right = column.value(b);
      if (left === right) return 0;
      if (left === null) return 1;
      if (right === null) return -1;
      const order =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right), "pt-BR", {
              numeric: true,
            });
      return sort.asc ? order : -order;
    });
  }, [rows, columns, sort]);
  return (
    <Table aria-label={caption}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead
              key={column.key}
              aria-sort={
                sort?.key === column.key
                  ? sort.asc
                    ? "ascending"
                    : "descending"
                  : undefined
              }
            >
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 px-2"
                onClick={() =>
                  setSort({
                    key: column.key,
                    asc: sort?.key === column.key ? !sort.asc : true,
                  })
                }
              >
                {column.label}
                <ArrowUpDown className="size-3.5" aria-hidden="true" />
              </Button>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={row.id}>
            {columns.map((column) => (
              <TableCell key={column.key}>
                {column.render?.(row) ?? column.value(row) ?? "—"}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

type SegmentRow = ReturnType<typeof segmentRows>[number] & { id: string };
type NodeRow = ReturnType<typeof nodeRows>[number];

const segmentColumns: Column<SegmentRow>[] = [
  { key: "code", label: "Trecho", value: (r) => r.segment.code },
  {
    key: "nodes",
    label: "Montante → Jusante",
    value: (r) => `${r.upstreamCode} → ${r.downstreamCode}`,
  },
  {
    key: "length",
    label: "Comprimento (m)",
    value: (r) => r.segment.length,
    render: (r) => number(r.segment.length, 2),
  },
  {
    key: "upInvert",
    label: "CF montante (m)",
    value: (r) => r.segment.upstreamInvert,
    render: (r) => number(r.segment.upstreamInvert),
  },
  {
    key: "downInvert",
    label: "CF jusante (m)",
    value: (r) => r.segment.downstreamInvert,
    render: (r) => number(r.segment.downstreamInvert),
  },
  {
    key: "slope",
    label: "Declividade (m/m)",
    value: (r) => r.segment.slope,
    render: (r) => number(r.segment.slope, 5),
  },
  {
    key: "upDepth",
    label: "Prof. montante (m)",
    value: (r) => r.upstreamDepth,
    render: (r) => number(r.upstreamDepth),
  },
  {
    key: "downDepth",
    label: "Prof. jusante (m)",
    value: (r) => r.downstreamDepth,
    render: (r) => number(r.downstreamDepth),
  },
  {
    key: "element",
    label: "Elemento",
    value: (r) =>
      r.segment.elementType ? elementLabels[r.segment.elementType] : null,
  },
  {
    key: "pavement",
    label: "Pavimento (DXF)",
    value: (r) =>
      [
        r.segment.pavementType ? pavementLabels[r.segment.pavementType] : null,
        r.segment.pavementTypeRaw,
      ]
        .filter(Boolean)
        .join(" · ") || null,
  },
  {
    key: "diameter",
    label: "DN imposto",
    value: (r) => r.segment.fixedDiameterMm,
  },
  { key: "material", label: "Material", value: (r) => r.segment.material },
];

const nodeColumns: Column<NodeRow>[] = [
  { key: "code", label: "Nó", value: (r) => r.code },
  { key: "type", label: "Tipo", value: (r) => r.type },
  {
    key: "drop",
    label: "Tubo de queda",
    value: (r) => (r.hasDropTube ? "Sim" : "Não"),
  },
  {
    key: "invert",
    label: "CF (m)",
    value: (r) => r.invertElevation,
    render: (r) => number(r.invertElevation),
  },
  {
    key: "ground",
    label: "Terreno (m)",
    value: (r) => r.terrainElevation,
    render: (r) => number(r.terrainElevation),
  },
  {
    key: "depth",
    label: "Profundidade (m)",
    value: (r) => r.depth,
    render: (r) => number(r.depth),
  },
  {
    key: "links",
    label: "Chegam / saem",
    value: (r) => `${r.incoming} / ${r.outgoing}`,
  },
  { key: "x", label: "X", value: (r) => r.x, render: (r) => number(r.x, 2) },
  { key: "y", label: "Y", value: (r) => r.y, render: (r) => number(r.y, 2) },
  {
    key: "angle",
    label: "Ângulo (°)",
    value: (r) => r.angle,
    render: (r) => number(r.angle, 1),
  },
];

export function NetworkTable({ projectId }: { projectId: string }) {
  const [view, setView] = useState<"segments" | "nodes">("segments");
  const [search, setSearch] = useState("");
  const network = useQuery({
    queryKey: projectQueryKeys.network(projectId),
    queryFn: async ({ signal }) =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/network`, { signal }),
        projectDetailResponseSchema,
        "Não foi possível carregar a rede.",
      ),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const matches = (code: string) =>
    code.toLocaleLowerCase("pt-BR").includes(term);
  return (
    <Card className="rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
      <CardHeader>
        <CardTitle>Rede do projeto</CardTitle>
        <CardDescription>
          Dados salvos de trechos e nós. CF = cota de fundo; profundidade =
          terreno − CF. Clique no cabeçalho para ordenar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="tablist"
            aria-label="Visão da rede"
            className="flex gap-1 rounded-md bg-card p-1"
          >
            {(
              [
                ["segments", "Trechos"],
                ["nodes", "Nós"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={view === value}
                className={`rounded px-3 py-1 text-sm ${view === value ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                onClick={() => setView(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <Input
            type="search"
            aria-label="Filtrar rede por código"
            placeholder="Filtrar por código..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-xs"
          />
        </div>
        {network.isPending && <p className="text-sm">Carregando rede...</p>}
        {network.isError && (
          <p role="alert" className="text-sm text-destructive">
            {network.error.message}
          </p>
        )}
        {network.data && view === "segments" && (
          <SortableTable
            caption="Trechos da rede"
            columns={segmentColumns}
            rows={segmentRows(network.data)
              .filter((row) => matches(row.segment.code))
              .map((row) => ({ ...row, id: row.segment.id }))}
          />
        )}
        {network.data && view === "nodes" && (
          <SortableTable
            caption="Nós da rede"
            columns={nodeColumns}
            rows={nodeRows(network.data).filter((row) => matches(row.code))}
          />
        )}
      </CardContent>
    </Card>
  );
}

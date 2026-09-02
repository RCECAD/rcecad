"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Pencil, Save, Trash2, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useUnsavedChanges } from "@/components/project/unsaved-changes-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FlowsContentProps = {
  projectId: string;
};

type SingularContribution = {
  id: number;
  identification: string;
  type: string;
  segment: string;
  initialValue: string;
  finalValue: string;
  status: string;
};

const singularContributions: Array<SingularContribution> = Array.from(
  { length: 5 },
  (_, index) => ({
    id: index + 1,
    identification: "Contribuição Industrial --",
    type: "Industrial",
    segment: "T-12",
    initialValue: "2.5 L/s",
    finalValue: "3.2 L/s",
    status: "válido",
  }),
);

export function FlowsContent({ projectId }: Readonly<FlowsContentProps>) {
  const router = useRouter();
  const { requestNavigation } = useUnsavedChanges();

  const columns = useMemo<Array<ColumnDef<SingularContribution>>>(
    () => [
      {
        accessorKey: "identification",
        header: "Identificação",
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.identification}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Tipo",
      },
      {
        accessorKey: "segment",
        header: "Nó/Trecho",
      },
      {
        accessorKey: "initialValue",
        header: "Valor Inicial",
      },
      {
        accessorKey: "finalValue",
        header: "Valor Final",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="rounded-full border-teal-300 bg-teal-50 px-2.5 text-xs font-semibold text-teal-600"
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Ações</span>,
        cell: () => (
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Editar contribuição"
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Excluir contribuição"
              className="text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: singularContributions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-9">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Vazões
      </h1>

      <Card className="rounded-lg border border-border/80 bg-card/40 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Contribuições Singulares
          </CardTitle>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            Vazões concentradas e contribuições específicas que afetam a rede. A
            vazão total de cada trecho será composta pelas contribuições difusas
            mais as concentradas.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          <Input
            type="search"
            placeholder="Buscar por identificação, tipo, nó..."
            className="h-10 max-w-md bg-background"
          />

          <div className="overflow-hidden rounded-lg border border-border/80">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="bg-muted/20 hover:bg-muted/20"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="h-12 px-4 text-xs font-semibold text-muted-foreground"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="h-16 hover:bg-muted/20">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 text-foreground">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">5 de 24 nós</p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" disabled>
                Anterior
              </Button>
              <Button type="button" variant="outline" disabled>
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <div className="flex h-12 flex-1 select-none items-center justify-center gap-2 rounded-lg border border-[#818cf8]/35 bg-[#818cf8] px-4 text-sm font-semibold text-white">
          <Save className="size-4 shrink-0" />
          Nenhuma alteração foi feita ainda.
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => {
            requestNavigation(() => router.push(`/project/${projectId}`));
          }}
          className="flex h-12 items-center justify-center gap-2 rounded-lg px-8 font-semibold"
        >
          <Undo2 className="size-4" />
          Voltar
        </Button>
      </div>
    </div>
  );
}

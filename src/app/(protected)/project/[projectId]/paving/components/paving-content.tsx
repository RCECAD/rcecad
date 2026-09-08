"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Save, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUnsavedChanges } from "@/components/project/unsaved-changes-provider";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type PavingSegment, pavingTypes, surfaceConditions } from "../data";

type PavingContentProps = { projectId: string; initialData: PavingSegment[] };

export function PavingContent({
  projectId,
  initialData,
}: Readonly<PavingContentProps>) {
  const router = useRouter();
  const { requestNavigation, setHasUnsavedChanges } = useUnsavedChanges();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const isDirty = JSON.stringify(data) !== JSON.stringify(initialData);

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
    return () => setHasUnsavedChanges(false);
  }, [isDirty, setHasUnsavedChanges]);

  const updateSegment = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<PavingSegment, "pavingType" | "surfaceCondition" | "notes">
      >,
    ) => {
      setData((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const columns = useMemo<ColumnDef<PavingSegment>[]>(
    () => [
      { accessorKey: "segment", header: "Trecho", size: 80 },
      {
        accessorKey: "pavingType",
        header: "Tipo",
        size: 210,
        cell: ({ row }) => (
          <Select
            value={row.original.pavingType}
            onValueChange={(value) => {
              const pavingType = pavingTypes.find((option) => option === value);
              if (pavingType) updateSegment(row.original.id, { pavingType });
            }}
          >
            <SelectTrigger
              aria-label={`Tipo de pavimentação ${row.original.segment}`}
              className="w-full bg-background"
            >
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {pavingTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        accessorKey: "surfaceCondition",
        header: "Condição superficial",
        size: 190,
        cell: ({ row }) => (
          <Select
            value={row.original.surfaceCondition}
            onValueChange={(value) => {
              const surfaceCondition = surfaceConditions.find(
                (option) => option === value,
              );
              if (surfaceCondition)
                updateSegment(row.original.id, { surfaceCondition });
            }}
          >
            <SelectTrigger
              aria-label={`Condição superficial ${row.original.segment}`}
              className="w-full bg-background"
            >
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {surfaceConditions.map((condition) => (
                <SelectItem key={condition} value={condition}>
                  {condition}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        accessorKey: "notes",
        header: "Observações",
        size: 340,
        cell: ({ row }) => (
          <Input
            aria-label={`Observações ${row.original.segment}`}
            placeholder="Digite..."
            value={row.original.notes}
            onChange={(event) =>
              updateSegment(row.original.id, { notes: event.target.value })
            }
            className="bg-background"
          />
        ),
      },
      {
        id: "status",
        header: "Status",
        size: 110,
        cell: ({ row }) => {
          const complete = Boolean(
            row.original.pavingType && row.original.surfaceCondition,
          );
          return (
            <Badge
              variant="outline"
              className={
                complete
                  ? "rounded-full border-teal-300 bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-300"
                  : "rounded-full text-muted-foreground"
              }
            >
              {complete ? "completo" : "pendente"}
            </Badge>
          );
        },
      },
    ],
    [updateSegment],
  );

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    state: { globalFilter: search },
    onGlobalFilterChange: setSearch,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
    autoResetPageIndex: false,
  });

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-9">
      <h1 className="text-3xl font-bold text-foreground">Pavimentação</h1>
      <Card className="min-w-0 rounded-lg border border-border/80 bg-card/40 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Dados de Pavimentação por Trecho
          </CardTitle>
          <CardDescription>
            Configure o tipo de pavimentação e condição superficial de cada
            trecho
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4">
          <Input
            type="search"
            aria-label="Buscar trechos"
            placeholder="Buscar por trecho, condição..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              table.setPageIndex(0);
            }}
            className="max-w-sm bg-background"
          />
          <div className="overflow-hidden rounded-lg border border-border/80">
            <Table className="min-w-[800px] table-fixed">
              <TableHeader>
                {table.getHeaderGroups().map((group) => (
                  <TableRow
                    key={group.id}
                    className="bg-muted/20 hover:bg-muted/20"
                  >
                    {group.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        style={{
                          width: `${(header.getSize() / table.getTotalSize()) * 100}%`,
                        }}
                        className="h-11 px-3 text-xs text-muted-foreground"
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
                  <TableRow key={row.id} className="hover:bg-muted/20">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-3 py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {table.getRowModel().rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhum trecho encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {table.getRowModel().rows.length} de{" "}
              {table.getFilteredRowModel().rows.length} trechos
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          disabled
          className="h-auto min-h-11 min-w-0 flex-1 whitespace-normal py-2"
          title="Salvamento indisponível nesta versão"
        >
          <Save className="size-4 shrink-0" />
          {isDirty
            ? "Alterações não salvas"
            : "Nenhuma alteração foi feita ainda."}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="h-11 shrink-0 px-5"
          onClick={() =>
            requestNavigation(() => router.push(`/project/${projectId}`))
          }
        >
          <Undo2 className="size-4" />
          Voltar
        </Button>
      </div>
    </div>
  );
}

"use client";

import type {
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataLayer } from "@/components/data-layer/data-layer";
import { DataTable } from "@/components/data-layer/data-table/data-table";
import { createHomeColumns } from "@/components/home/home-columns";
import type { HomeProject } from "@/domain/entities";

type HomeProjectsTableProps = {
  projects: Array<HomeProject>;
};

export function HomeProjectsTable({
  projects,
}: Readonly<HomeProjectsTableProps>) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = useMemo(() => createHomeColumns(), []);

  return (
    <DataLayer
      data={projects}
      columns={columns}
      pagination={pagination}
      onPaginationChange={setPagination}
      columnVisibility={columnVisibility}
      onColumnVisibilityChange={setColumnVisibility}
      columnFilters={columnFilters}
      onColumnFiltersChange={setColumnFilters}
      sorting={sorting}
      onSortingChange={setSorting}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      className="space-y-4"
    >
      <DataTable
        dataCount={projects.length}
        labels={{
          emptyText: "Nenhum projeto encontrado.",
          totalText: "projeto(s) selecionados.",
        }}
        paginationLabels={{
          previous: "Anterior",
          next: "Próxima",
          page: "Página",
          of: "de",
          rowsPerPage: "Linhas por página",
          pageSizePlaceholder: "Selecione...",
          first: "Primeira",
          last: "Última",
        }}
      />
    </DataLayer>
  );
}

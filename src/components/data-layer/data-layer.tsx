/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Updater,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
import { DataLayerContext } from "@/components/data-layer/data-layer-context";

type DataLayerProps<TData> = {
  data: Array<TData>;
  columns: Array<ColumnDef<TData, any>>;
  pagination?: PaginationState;
  pageCount?: number;
  onPaginationChange?: (updater: Updater<PaginationState>) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (updater: Updater<VisibilityState>) => void;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (updater: Updater<ColumnFiltersState>) => void;
  sorting?: SortingState;
  onSortingChange?: (updater: Updater<SortingState>) => void;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (updater: Updater<RowSelectionState>) => void;
  manualPagination?: boolean;
  manualFiltering?: boolean;
  manualSorting?: boolean;
  children: ReactNode;
  className?: string;
};

export function DataLayer<TData>({
  data,
  columns,
  pagination,
  pageCount,
  onPaginationChange,
  columnVisibility = {},
  onColumnVisibilityChange,
  columnFilters = [],
  onColumnFiltersChange,
  sorting = [],
  onSortingChange,
  rowSelection = {},
  onRowSelectionChange,
  manualPagination = false,
  manualFiltering = false,
  manualSorting = false,
  children,
  className,
}: DataLayerProps<TData>) {
  const table = useReactTable<TData>({
    data,
    columns,
    state: {
      pagination,
      columnVisibility,
      columnFilters,
      sorting,
      rowSelection,
    },
    manualPagination,
    pageCount,
    onPaginationChange,
    enableHiding: true,
    enableRowSelection: true,
    onColumnVisibilityChange,
    onColumnFiltersChange,
    onSortingChange,
    onRowSelectionChange,
    manualFiltering,
    manualSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <DataLayerContext.Provider value={{ table }}>
      <div className={className}>{children}</div>
    </DataLayerContext.Provider>
  );
}

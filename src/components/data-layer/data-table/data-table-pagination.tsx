/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useMemo } from "react";
import { useDataLayer } from "@/components/data-layer/data-layer-context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DataTablePaginationLabels = {
  previous: string;
  next: string;
  page: string;
  of: string;
  rowsPerPage: string;
  pageSizePlaceholder: string;
  first: string;
  last: string;
};

type DataTablePaginationProps = {
  labels?: Partial<DataTablePaginationLabels>;
  pageSizeOptions?: Array<number>;
};

const defaultLabels: DataTablePaginationLabels = {
  previous: "Anterior",
  next: "Próxima",
  page: "Página",
  of: "de",
  rowsPerPage: "Linhas por página",
  pageSizePlaceholder: "Selecione...",
  first: "Primeira",
  last: "Última",
};

export function DataTablePagination({
  labels,
  pageSizeOptions = [10, 20, 30, 50, 100],
}: DataTablePaginationProps) {
  const { table } = useDataLayer<any>();
  const mergedLabels = { ...defaultLabels, ...labels };

  const { pageIndex, pageSize } = table.getState().pagination;

  const pageCount = table.getPageCount();
  const canPrev = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();

  const pageLabel = useMemo(() => {
    const current = pageCount === 0 ? 0 : pageIndex + 1;
    return `${mergedLabels.page} ${current} ${mergedLabels.of} ${pageCount}`;
  }, [mergedLabels.page, mergedLabels.of, pageIndex, pageCount]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-2">
      <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {mergedLabels.rowsPerPage}
        </span>

        <Select
          value={String(pageSize)}
          onValueChange={(v) => table.setPageSize(Number(v))}
        >
          <SelectTrigger className="w-17.5 sm:w-27.5">
            <SelectValue placeholder={mergedLabels.pageSizePlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end w-full sm:w-auto">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {pageLabel}
        </span>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0 lg:w-auto lg:px-3"
            onClick={() => table.setPageIndex(0)}
            disabled={!canPrev}
          >
            <span className="sr-only">{mergedLabels.first}</span>
            <ChevronsLeft className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline">{mergedLabels.first}</span>
          </Button>

          <Button
            variant="outline"
            className="h-8 w-8 p-0 lg:w-auto lg:px-3"
            onClick={() => table.previousPage()}
            disabled={!canPrev}
          >
            <span className="sr-only">{mergedLabels.previous}</span>
            <ChevronLeft className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline">{mergedLabels.previous}</span>
          </Button>

          <Button
            variant="outline"
            className="h-8 w-8 p-0 lg:w-auto lg:px-3"
            onClick={() => table.nextPage()}
            disabled={!canNext}
          >
            <span className="sr-only">{mergedLabels.next}</span>
            <span className="hidden lg:inline">{mergedLabels.next}</span>
            <ChevronRight className="h-4 w-4 lg:ml-2" />
          </Button>

          <Button
            variant="outline"
            className="h-8 w-8 p-0 lg:w-auto lg:px-3"
            onClick={() => table.setPageIndex(Math.max(pageCount - 1, 0))}
            disabled={!canNext}
          >
            <span className="sr-only">{mergedLabels.last}</span>
            <span className="hidden lg:inline">{mergedLabels.last}</span>
            <ChevronsRight className="h-4 w-4 lg:ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

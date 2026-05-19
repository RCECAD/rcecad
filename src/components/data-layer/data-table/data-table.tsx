/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
"use client";

import { flexRender } from "@tanstack/react-table";
import { useDataLayer } from "@/components/data-layer/data-layer-context";
import {
  DataTablePagination,
  type DataTablePaginationLabels,
} from "@/components/data-layer/data-table/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type DataTableLabels = {
  emptyText: string;
  totalText: string;
};

type DataTableProps = {
  labels?: Partial<DataTableLabels>;
  paginationLabels?: Partial<DataTablePaginationLabels>;
  showPagination?: boolean;
  dataCount: number;
};

const defaultLabels: DataTableLabels = {
  emptyText: "Nenhum registro encontrado.",
  totalText: "Total de ordens:",
};

export function DataTable({
  labels,
  paginationLabels,
  showPagination = true,
  dataCount,
}: DataTableProps) {
  const { table } = useDataLayer<any>();

  const mergedLabels = { ...defaultLabels, ...labels };

  const rows = table.getRowModel().rows;
  const leafColumns = table.getAllLeafColumns();

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={leafColumns.length}
                  className="h-24 text-center"
                >
                  {mergedLabels.emptyText}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            {table.getFooterGroups().map((footerGroup) => (
              <TableRow key={footerGroup.id}>
                {footerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    style={{ borderTop: "1px solid #ccc", padding: 8 }}
                  >
                    {flexRender(
                      header.column.columnDef.footer,
                      header.getContext(),
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableFooter>
        </Table>
      </div>

      {showPagination ? (
        <DataTablePagination labels={paginationLabels} />
      ) : null}
      <p className="flex flex-row gap-2 text-sm text-muted-foreground whitespace-nowrap">
        <span>{dataCount}</span>
        <span>{labels?.totalText ?? defaultLabels.totalText}</span>
      </p>
    </div>
  );
}

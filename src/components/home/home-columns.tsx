"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/status-badge";
import type { HomeProject } from "@/domain/entities";
import { formatHomeProjectDateLong, getStatusMeta } from "@/utils";

function SortableHeader({
  column,
  label,
}: Readonly<{
  column: {
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: (desc?: boolean) => void;
  };
  label: string;
}>) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown className="size-4" />
    </Button>
  );
}

export function createHomeColumns(): Array<ColumnDef<HomeProject>> {
  return [
    {
      id: "select",
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar todos os projetos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Selecionar ${row.original.name}`}
        />
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column} label="Nome do projeto" />
      ),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <SortableHeader column={column} label="Última edição" />
      ),
      cell: ({ row }) => (
        <span className="text-foreground">
          {formatHomeProjectDateLong(row.original.updatedAt)}
        </span>
      ),
      sortingFn: (rowA, rowB, columnId) =>
        new Date(rowA.getValue<string>(columnId)).getTime() -
        new Date(rowB.getValue<string>(columnId)).getTime(),
    },
    {
      accessorKey: "location",
      header: ({ column }) => (
        <SortableHeader column={column} label="Localidade" />
      ),
    },
    {
      accessorKey: "owner",
      header: "Responsável",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = getStatusMeta(row.original.status);

        return <StatusBadge tone={status.tone} label={status.shortLabel} />;
      },
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      header: "",
      cell: () => (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Ações do projeto"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      ),
    },
  ];
}

/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
"use client";

import type { Column } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TextFilterProps = {
  column: Column<any, any>;
  placeholder?: string;
};

export function TextFilter({ column, placeholder }: TextFilterProps) {
  const value = (column.getFilterValue() as string) ?? "";

  return (
    <div className="flex items-center gap-2">
      <Input
        className="w-60"
        placeholder={placeholder ?? "Buscar..."}
        value={value}
        onChange={(e) => column.setFilterValue(e.target.value)}
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => column.setFilterValue(undefined)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
"use client";

import type { Column } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type NumberRangeFilterProps = {
  column: Column<any, any>;
  placeholderMin?: string;
  placeholderMax?: string;
};

export function NumberRangeFilter({
  column,
  placeholderMin,
  placeholderMax,
}: NumberRangeFilterProps) {
  const current = column.getFilterValue() as [number | null, number | null];
  const [min, max] = current ?? [null, null];

  return (
    <div className="flex items-center gap-2">
      <Input
        inputMode="decimal"
        className="w-28"
        placeholder={placeholderMin}
        value={min ?? ""}
        onChange={(e) =>
          column.setFilterValue([
            e.target.value === "" ? null : Number(e.target.value),
            max ?? null,
          ])
        }
      />
      <Input
        inputMode="decimal"
        className="w-28"
        placeholder={placeholderMax}
        value={max ?? ""}
        onChange={(e) =>
          column.setFilterValue([
            min ?? null,
            e.target.value === "" ? null : Number(e.target.value),
          ])
        }
      />
      {current !== undefined &&
        (current[0] !== null || current[1] !== null) && (
          <Button
            type="button"
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

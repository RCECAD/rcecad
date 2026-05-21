/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
"use client";

import type { Column } from "@tanstack/react-table";
import { CalendarIcon, X } from "lucide-react";
import type { DateRangeValue } from "@/components/data-layer/data-layer-columns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DateRangeFilterProps = {
  column: Column<any, any>;
};

export function DateRangeFilter({ column }: DateRangeFilterProps) {
  const value = (column.getFilterValue() as DateRangeValue) ?? {};

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-60 justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.from || value.to
              ? `${value.from?.toLocaleDateString() ?? ""} - ${
                  value.to?.toLocaleDateString() ?? ""
                }`
              : "Selecionar período"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-fit">
          <Calendar
            className="sm:[&.rdp-months]:flex [&.rdp-months]:flex-col"
            mode="range"
            selected={{
              from: value.from,
              to: value.to,
            }}
            onSelect={(range) =>
              column.setFilterValue({
                from: range?.from,
                to: range?.to,
              })
            }
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {(value.from || value.to) && (
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

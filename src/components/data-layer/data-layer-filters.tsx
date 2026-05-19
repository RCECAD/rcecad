/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
"use client";

import type { Column } from "@tanstack/react-table";
import { Filter, X } from "lucide-react";
import { DateRangeFilter } from "@/components/data-layer/data-filters/date-range-filter";
import { NumberRangeFilter } from "@/components/data-layer/data-filters/number-range-filter";
import { SelectFilter } from "@/components/data-layer/data-filters/select-filter";
import { TextFilter } from "@/components/data-layer/data-filters/text-filter";
import type {
  FilterMeta,
  SelectOption,
} from "@/components/data-layer/data-layer-columns";
import { useDataLayer } from "@/components/data-layer/data-layer-context";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type FiltersBarProps = {
  externalOptions?: Record<string, Array<SelectOption>>;
  texts?: {
    openFilters?: string;
    clearAll?: string;
    filtersTitle?: string;
    noFilters?: string;
  };
};

function resolveFilterLabel(column: Column<any, any>, filter: FilterMeta) {
  const anyFilter = filter as any;
  if (typeof anyFilter.label === "string" && anyFilter.label.trim()) {
    return anyFilter.label;
  }

  const header = column.columnDef.header;
  if (typeof header === "string" && header.trim()) return header;

  return column.id;
}

type FilterableColumn = {
  column: Column<any, any>;
  filter: FilterMeta;
  label: string;
};

function isFilterableColumn(x: FilterableColumn | null): x is FilterableColumn {
  return x !== null;
}

export function FiltersBar({ externalOptions, texts }: FiltersBarProps) {
  const { table } = useDataLayer<any>();
  const columns = table.getAllLeafColumns();

  const hasAnyFilter = table.getState().columnFilters.length > 0;

  const t = {
    openFilters: texts?.openFilters ?? "Filtros",
    clearAll: texts?.clearAll ?? "Limpar tudo",
    filtersTitle: texts?.filtersTitle ?? "Filtros",
    noFilters: texts?.noFilters ?? "Nenhum filtro disponível",
  };

  const filterableColumns = columns
    .map((column) => {
      const meta = column.columnDef.meta as { filter?: FilterMeta } | undefined;
      const filter = meta?.filter;
      if (!filter) return null;

      return {
        column,
        filter,
        label: resolveFilterLabel(column, filter),
      } satisfies FilterableColumn;
    })
    .filter(isFilterableColumn);

  const filtersCount = (() => {
    let count = 0;
    table.getState().columnFilters.forEach(() => {
      // if (["situation", "payer", "tag", "product"].includes(columnFilter.id)) {
      // 	if (typeof columnFilter.value === "string") {
      // 		const selectedValues = columnFilter.value.split(",");
      // 		count += selectedValues.length;
      // 		return;
      // 	}
      // }
      count++;
    });
    return count;
  })();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="max-w-28 gap-2 flex flex-row items-center"
        >
          <Filter className="h-4 w-4" />
          {t.openFilters}
          <span className="text-sm text-muted-foreground">
            ({filtersCount})
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[90vw] md:w-150 p-4 max-h-[60vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">{t.filtersTitle}</div>

          <Button
            type="button"
            variant="outline"
            onClick={() => table.resetColumnFilters()}
            disabled={!hasAnyFilter}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            {t.clearAll}
          </Button>
        </div>

        <div className="mt-4">
          {filterableColumns.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t.noFilters}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filterableColumns.map(({ column, filter, label }) => {
                if (filter.type === "text") {
                  return (
                    <div key={column.id} className="space-y-2 min-w-0">
                      <div className="text-xs font-medium text-muted-foreground">
                        {label}
                      </div>
                      <TextFilter
                        column={column}
                        placeholder={filter.placeholder}
                      />
                    </div>
                  );
                }

                if (filter.type === "select") {
                  return (
                    <div key={column.id} className="space-y-2  min-w-0">
                      <div className="text-xs font-medium text-muted-foreground">
                        {label}
                      </div>
                      <SelectFilter
                        column={column}
                        options={filter.options}
                        searchPlaceholder="Pesquisar..."
                        allLabel="Todos"
                        maxBadges={3}
                        placeholder={filter.placeholder}
                        emptyPlaceholder={filter.noValuesPlaceholder}
                        externalOptions={externalOptions}
                      />
                    </div>
                  );
                }

                if (filter.type === "numberRange") {
                  return (
                    <div key={column.id} className="space-y-2 min-w-0">
                      <div className="text-xs font-medium text-muted-foreground">
                        {label}
                      </div>
                      <NumberRangeFilter
                        column={column}
                        placeholderMin={"Mín."}
                        placeholderMax={"Máx."}
                      />
                    </div>
                  );
                }

                if (filter.type === "dateRange") {
                  return (
                    <div key={column.id} className="space-y-2 min-w-0">
                      <div className="text-xs font-medium text-muted-foreground">
                        {label}
                      </div>
                      <DateRangeFilter column={column} />
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import type { ColumnDef } from "@tanstack/react-table";

export type DateRangeValue = { from?: Date; to?: Date };
export type NumberRangeValue = { min?: number; max?: number };

export type SelectOption = { label: string; value: string };

export type SelectOptionsSource =
  | { kind: "static"; options: Array<SelectOption> }
  | { kind: "dynamic"; getOptions: () => Array<SelectOption> }
  | { kind: "external"; key: string };

type FilterBase = { label?: string };

export type FilterMeta =
  | (FilterBase & { type: "text"; placeholder?: string })
  | (FilterBase & {
      type: "select";
      options: SelectOptionsSource;
      placeholder?: string;
      noValuesPlaceholder?: string;
    })
  | (FilterBase & {
      type: "numberRange";
      placeholderMin?: string;
      placeholderMax?: string;
    })
  | (FilterBase & { type: "dateRange" });

export type ColumnMetaWithFilter = {
  filter?: FilterMeta;
};

export type AppColumnDef<TData> = ColumnDef<TData, any> & {
  meta?: ColumnMetaWithFilter;
};

/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
"use client";

import type { Column } from "@tanstack/react-table";
import { ChevronDown, Eye, EyeOff, RotateCcw } from "lucide-react";
import * as React from "react";
import { useDataLayer } from "@/components/data-layer/data-layer-context";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

type ColumnSelectorTexts = {
  triggerLabel: string;
  title: string;
  showAll: string;
  hideAll: string;
  reset: string;
  empty: string;
};

type ColumnSelectorProps = {
  storageKey: string;
  labels?: Record<string, string>;
  texts?: Partial<ColumnSelectorTexts>;
  columns?: Array<string>;
};

const defaultTexts: ColumnSelectorTexts = {
  triggerLabel: "Colunas",
  title: "Selecionar colunas",
  showAll: "Mostrar todas",
  hideAll: "Esconder todas",
  reset: "Resetar",
  empty: "Nenhuma coluna disponível",
};

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function getHidableLeafColumns(table: any, whitelist?: Array<string>) {
  const all = table.getAllLeafColumns() as Array<Column<any, any>>;
  const filtered = whitelist?.length
    ? all.filter((c) => whitelist.includes(c.id))
    : all;

  return filtered.filter((c) => c.getCanHide());
}

export function ColumnSelector({
  storageKey,
  labels,
  texts,
  columns,
}: ColumnSelectorProps) {
  const { table } = useDataLayer<any>();
  const t = { ...defaultTexts, ...texts };

  const cols = React.useMemo(
    () => getHidableLeafColumns(table, columns),
    [table, columns],
  );

  const didInitRef = React.useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <>
  React.useEffect(() => {
    const saved = safeParse<Record<string, boolean>>(
      localStorage.getItem(storageKey),
    );
    if (saved) {
      table.setColumnVisibility(saved);
    }
    didInitRef.current = true;
  }, [storageKey]);

  const visibility = table.getState().columnVisibility as Record<
    string,
    boolean
  >;

  React.useEffect(() => {
    if (!didInitRef.current) return;
    localStorage.setItem(storageKey, JSON.stringify(visibility));
  }, [storageKey, visibility]);

  const hasColumns = cols.length > 0;

  const setAll = (visible: boolean) => {
    const next: Record<string, boolean> = {};
    for (const c of cols) next[c.id] = visible;
    table.setColumnVisibility(next);
  };

  const reset = () => {
    table.resetColumnVisibility();
  };

  const stickColumns = ["blocked"];

  return (
    <Popover>
      <PopoverTrigger asChild className="max-w-28">
        <Button variant="outline" type="button" className="gap-2">
          <ChevronDown className="h-4 w-4" />
          {t.triggerLabel}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-fit p-3" align="start">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium">{t.title}</div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setAll(true)}
              disabled={!hasColumns}
            >
              <Eye className="h-4 w-4" />
              {t.showAll}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setAll(false)}
              disabled={!hasColumns}
            >
              <EyeOff className="h-4 w-4" />
              {t.hideAll}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={reset}
              disabled={!hasColumns}
            >
              <RotateCcw className="h-4 w-4" />
              {t.reset}
            </Button>
          </div>
        </div>

        <Separator className="my-3" />

        {!hasColumns ? (
          <div className="text-sm text-muted-foreground">{t.empty}</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {cols
              .filter((col) => !stickColumns.includes(col.id))
              .map((column) => {
                const checked = column.getIsVisible();
                const label = labels?.[column.id] ?? column.id;
                return (
                  <Label
                    key={column.id}
                    htmlFor={column.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    <Checkbox
                      id={column.id}
                      checked={checked}
                      onCheckedChange={(v) => column.toggleVisibility(!!v)}
                    />
                    <span className="truncate">{label}</span>
                  </Label>
                );
              })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

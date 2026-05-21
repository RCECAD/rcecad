/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
"use client";

import type { Column } from "@tanstack/react-table";
import { Check, ChevronDown, X } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { SelectOption, SelectOptionsSource } from "../data-layer-columns";

type SelectFilterProps = {
  column: Column<any, any>;
  options: SelectOptionsSource;
  externalOptions?: Record<string, Array<SelectOption>>;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyPlaceholder?: string;
  allLabel?: string;
  clearLabel?: string;
  maxBadges?: number;
};

function resolveOptions(
  source: SelectOptionsSource,
  externalOptions?: Record<string, Array<SelectOption>>,
): Array<SelectOption> {
  if (source.kind === "static") return source.options;
  if (source.kind === "dynamic") return source.getOptions();
  return externalOptions?.[source.key] ?? [];
}

function toggleValue(list: Array<string>, v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function SelectFilter({
  column,
  options,
  externalOptions,
  placeholder,
  searchPlaceholder,
  emptyPlaceholder,
  allLabel,
  clearLabel,
  maxBadges = 2,
}: SelectFilterProps) {
  const resolvedOptions = resolveOptions(options, externalOptions);

  const allValues = useMemo(
    () => resolvedOptions.map((o) => o.value),
    [resolvedOptions],
  );

  const current = (column.getFilterValue() as Array<string> | undefined) ?? [];
  const hasOptions = resolvedOptions.length > 0;

  const labelByValue = useMemo(
    () => new Map(resolvedOptions.map((o) => [o.value, o.label] as const)),
    [resolvedOptions],
  );

  const selectedLabels = current.map((v) => labelByValue.get(v) ?? v);

  const shown = selectedLabels.slice(0, maxBadges);
  const remaining = selectedLabels.length - shown.length;

  const allSelected =
    allValues.length > 0 &&
    current.length === allValues.length &&
    allValues.every((v) => current.includes(v));

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-9 w-60 justify-between"
            disabled={!hasOptions}
          >
            <div className="flex min-w-0 items-center gap-2">
              {current.length === 0 ? (
                <span className="truncate text-muted-foreground">
                  {placeholder ?? "Selecionar..."}
                </span>
              ) : (
                <div className="flex flex-row gap-1 max-w-full overflow-hidden">
                  {shown.map((lbl) => (
                    <Badge
                      key={lbl}
                      variant="secondary"
                      className="max-w-36 truncate"
                    >
                      {lbl}
                    </Badge>
                  ))}
                  {remaining > 0 && (
                    <Badge variant="secondary">+{remaining}</Badge>
                  )}
                </div>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[--radix-popover-trigger-width] max-w-[90vw] p-2"
        >
          <Command className="max-h-72 overflow-auto">
            <CommandInput placeholder={searchPlaceholder ?? "Pesquisar..."} />
            <CommandList>
              <CommandEmpty>
                {emptyPlaceholder ?? "Sem resultados"}
              </CommandEmpty>

              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    if (!allValues.length) return;
                    column.setFilterValue(allSelected ? undefined : allValues);
                  }}
                  className="gap-2"
                >
                  <span className="flex h-4 w-4 items-center justify-center">
                    {allSelected ? <Check className="h-4 w-4" /> : null}
                  </span>
                  {allLabel ?? "Todos"}
                </CommandItem>

                {resolvedOptions.map((opt) => {
                  const checked = current.includes(opt.value);
                  return (
                    <CommandItem
                      key={opt.value}
                      onSelect={() => {
                        const next = toggleValue(current, opt.value);
                        column.setFilterValue(next.length ? next : undefined);
                      }}
                      className="gap-2"
                    >
                      <span className="flex h-4 w-4 items-center justify-center">
                        {checked ? <Check className="h-4 w-4" /> : null}
                      </span>
                      <span className="truncate">{opt.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => column.setFilterValue(null)}
        disabled={current.length === 0}
        aria-label={clearLabel ?? "Limpar filtro"}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

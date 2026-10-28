"use client";

import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

const keyMoves: Record<string, (index: number, count: number) => number> = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_, count) => count - 1,
};

export const tabId = (panelId: string, value: string) => `${panelId}-${value}`;

type Props<T extends string> = {
  label: string;
  panelId: string;
  tabs: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function TabList<T extends string>({
  label,
  panelId,
  tabs,
  value,
  onChange,
  className,
}: Props<T>) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const move = keyMoves[event.key];
    if (!move) return;
    event.preventDefault();
    const current = tabs.findIndex(([tab]) => tab === value);
    const [next] = tabs[move(current, tabs.length)];
    onChange(next);
    document.getElementById(tabId(panelId, next))?.focus();
  };
  return (
    <div
      role="tablist"
      aria-label={label}
      className={className}
      onKeyDown={handleKeyDown}
    >
      {tabs.map(([tab, text]) => (
        <button
          key={tab}
          id={tabId(panelId, tab)}
          type="button"
          role="tab"
          aria-selected={tab === value}
          aria-controls={panelId}
          tabIndex={tab === value ? 0 : -1}
          className={cn(
            "rounded px-3 py-1.5 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            tab === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onChange(tab)}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

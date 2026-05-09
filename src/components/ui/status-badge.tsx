"use client";

import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusBadgeTone = "teal" | "yellow" | "blue" | "slate" | "rose";

const toneClasses: Record<StatusBadgeTone, string> = {
  teal: "border-teal-200 bg-teal-50 text-teal-700",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  slate: "border-slate-200 bg-slate-100 text-slate-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
};

type StatusBadgeProps = {
  tone: StatusBadgeTone;
  label: string;
  icon?: LucideIcon;
};

export function StatusBadge({
  tone,
  label,
  icon: Icon,
}: Readonly<StatusBadgeProps>) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow-none",
        toneClasses[tone],
      )}
    >
      {Icon ? <Icon className="size-3.5" /> : null}
      {label}
    </Badge>
  );
}

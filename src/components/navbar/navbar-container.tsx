import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode | Array<ReactNode>;
  className?: string;
}

export const NavbarContainer = ({ children, className }: Props) => {
  return (
    <div
      className={cn(
        "sticky z-30 flex h-20 shrink-0 w-full items-center border-b border-slate-200/70 bg-slate-50/95 px-4 backdrop-blur-sm lg:px-32",
        className,
      )}
    >
      {children}
    </div>
  );
};

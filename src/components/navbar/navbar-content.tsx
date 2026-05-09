import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode | Array<ReactNode>;
  className?: string;
  betweenItems?: boolean;
}

export const NavbarContent = ({
  children,
  className,
  betweenItems = true,
}: Props) => {
  return (
    <div
      className={cn(
        `flex w-full h-auto items-center ${betweenItems ? "justify-between" : " gap-8"}`,
        className,
      )}
    >
      {children}
    </div>
  );
};

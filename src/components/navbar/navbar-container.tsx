import type { ReactNode } from "react";

interface Props {
  children: ReactNode | Array<ReactNode>;
}

export const NavbarContainer = ({ children }: Props) => {
  return (
    <div className="sticky  z-30 flex h-full max-h-16 w-full items-center border-b border-slate-200/70 bg-slate-50/95 p-4 py-6 backdrop-blur-sm lg:px-32">
      {children}
    </div>
  );
};

import type { ReactNode } from "react";

interface Props {
  children: ReactNode | Array<ReactNode>;
}

export const NavbarCTAs = ({ children }: Props) => {
  return (
    <div className="flex flex-col lg:flex-row lg:w-fit h-fit gap-3">
      {children}
    </div>
  );
};

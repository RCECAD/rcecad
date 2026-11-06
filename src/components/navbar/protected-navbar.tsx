"use client";

import { usePathname } from "next/navigation";
import { NavbarBreadcrumb } from "./navbar-breadcrumb";
import { NavbarContainer } from "./navbar-container";
import { NavbarContent } from "./navbar-content";
import { NavbarCTAs } from "./navbar-ctas";
import { NavbarLogo } from "./navbar-logo";
import { UserCard } from "./user-card";

export function ProtectedNavbar() {
  const isProject = usePathname().startsWith("/project/");
  if (!isProject)
    return (
      <NavbarContainer>
        <NavbarContent betweenItems={false}>
          <NavbarLogo />
          <NavbarCTAs>
            <NavbarBreadcrumb />
          </NavbarCTAs>
          <div className="ml-auto">
            <UserCard />
          </div>
        </NavbarContent>
      </NavbarContainer>
    );

  return (
    <NavbarContainer className="md:px-0 lg:px-0">
      <NavbarContent
        betweenItems={false}
        className="h-full min-w-0 gap-4 md:gap-0"
      >
        <div className="flex shrink-0 items-center md:h-full md:w-64 md:justify-center">
          <NavbarLogo />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mx-auto flex w-full min-w-0 max-w-[1600px] items-center justify-between gap-4 md:px-8">
            <div className="min-w-0 flex-1">
              <NavbarBreadcrumb />
            </div>
            <div className="shrink-0">
              <UserCard />
            </div>
          </div>
        </div>
      </NavbarContent>
    </NavbarContainer>
  );
}

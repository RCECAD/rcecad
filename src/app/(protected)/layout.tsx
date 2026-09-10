import type { ReactNode } from "react";
import { ensureAuthenticated } from "@/api/server/auth";
import { NavbarBreadcrumb } from "@/components/navbar/navbar-breadcrumb";
import { NavbarContainer } from "@/components/navbar/navbar-container";
import { NavbarContent } from "@/components/navbar/navbar-content";
import { NavbarCTAs } from "@/components/navbar/navbar-ctas";
import { NavbarLogo } from "@/components/navbar/navbar-logo";
import { UnsavedChangesProvider } from "@/components/project/unsaved-changes-provider";

export default async function Layout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await ensureAuthenticated();

  return (
    <UnsavedChangesProvider>
      <div className="flex h-svh min-w-0 flex-1 flex-col overflow-hidden">
        <NavbarContainer>
          <NavbarContent betweenItems={false}>
            <NavbarLogo />
            <NavbarCTAs>
              <NavbarBreadcrumb />
            </NavbarCTAs>
          </NavbarContent>
        </NavbarContainer>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </UnsavedChangesProvider>
  );
}

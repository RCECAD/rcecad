import type { ReactNode } from "react";
import { ensureAuthenticated } from "@/api/server/auth";
import { isDevPreview } from "@/api/server/dev-preview";
import { ProtectedNavbar } from "@/components/navbar/protected-navbar";
import { UnsavedChangesProvider } from "@/components/project/unsaved-changes-provider";

export default async function Layout({
  children,
}: Readonly<{ children: ReactNode }>) {
  if (!isDevPreview) {
    await ensureAuthenticated();
  }

  return (
    <UnsavedChangesProvider>
      <div className="flex h-svh min-w-0 flex-none flex-col overflow-hidden">
        <ProtectedNavbar />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </UnsavedChangesProvider>
  );
}

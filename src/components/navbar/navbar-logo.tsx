"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useOptionalUnsavedChanges } from "@/components/project/unsaved-changes-provider";

export const NavbarLogo = () => {
  const router = useRouter();
  const unsavedChanges = useOptionalUnsavedChanges();

  const handleNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      !unsavedChanges ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    unsavedChanges.requestNavigation(() => router.push("/"));
  };

  return (
    <div className="h-12 w-fit">
      <Link
        href="/"
        className="hover:cursor-pointer"
        onClick={handleNavigation}
      >
        <Image src="/rcecad-logo.png" alt="RCECAD" width={156} height={48} />
      </Link>
    </div>
  );
};

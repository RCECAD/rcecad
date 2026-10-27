"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const UserCard = () => {
  const [pending, setPending] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        // The route clears the HttpOnly cookies even when Spring is down.
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
        window.location.assign("/auth/login");
      }}
    >
      <LogOut className="size-4" aria-hidden="true" />
      Sair
    </Button>
  );
};

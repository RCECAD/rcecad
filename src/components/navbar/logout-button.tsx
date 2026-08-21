"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export function LogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/auth/login");
  }

  return (
    <Button variant="ghost" className="ml-auto" onClick={handleLogout}>
      <LogOut />
      Sair
    </Button>
  );
}

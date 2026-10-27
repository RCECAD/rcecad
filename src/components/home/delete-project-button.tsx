"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { expectNoContent } from "@/api/client/response";
import { Button } from "@/components/ui/button";

export function DeleteProjectButton({
  projectId,
  name,
}: {
  projectId: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      className="text-muted-foreground hover:text-destructive"
      aria-label={`Excluir ${name}`}
      onClick={async () => {
        if (
          !window.confirm(
            `Excluir o projeto "${name}"? A rede, os cálculos registrados e o histórico serão removidos definitivamente.`,
          )
        )
          return;
        setPending(true);
        try {
          await expectNoContent(
            await fetch(`/api/projects/${projectId}`, { method: "DELETE" }),
            "Não foi possível excluir o projeto.",
          );
          toast.success("Projeto excluído.");
          router.refresh();
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Erro ao excluir.",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}

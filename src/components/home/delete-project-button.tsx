"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { expectNoContent, getErrorMessage } from "@/api/client/response";
import { ConfirmButton } from "@/components/ui/confirm-button";

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
    <ConfirmButton
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      className="text-muted-foreground hover:text-destructive"
      aria-label={`Excluir ${name}`}
      title={`Excluir o projeto "${name}"?`}
      description="A rede, os cálculos registrados e o histórico serão removidos definitivamente. Esta ação não pode ser desfeita."
      confirmLabel="Excluir projeto"
      onConfirm={async () => {
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
            getErrorMessage(
              error,
              "Não foi possível excluir o projeto. Tente novamente.",
            ),
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <Trash2 className="size-4" />
    </ConfirmButton>
  );
}

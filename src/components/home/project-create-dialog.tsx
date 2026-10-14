"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { parseClientJson } from "@/api/client/response";
import { MAX_DXF_BYTES } from "@/api/contracts/spring";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const createdProjectSchema = z.object({ id: z.string().uuid() });

export function ProjectCreateDialog({
  mode,
  onClose,
}: {
  mode: "create" | "import";
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const importing = mode === "import";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(undefined);

    try {
      const name = String(data.get("name") ?? "").trim();
      if (!name) throw new Error("Informe o nome do projeto.");
      let body: object;
      if (importing) {
        const file = data.get("dxf");
        if (
          !(file instanceof File) ||
          !file.name.toLowerCase().endsWith(".dxf") ||
          file.size === 0
        ) {
          throw new Error("Selecione um arquivo .dxf válido.");
        }
        if (file.size > MAX_DXF_BYTES)
          throw new Error("O arquivo DXF deve ter até 5 MB.");
        const dxf = await file.text();
        if (dxf.startsWith("AutoCAD Binary DXF"))
          throw new Error("Exporte o desenho no formato DXF de texto (ASCII).");
        body = { name, dxf };
      } else {
        const optional = (key: string) =>
          String(data.get(key) ?? "").trim() || null;
        body = {
          name,
          contractor: optional("contractor"),
          technicalManager: optional("technicalManager"),
          location: optional("location"),
        };
      }
      const project = await parseClientJson(
        await fetch(importing ? "/api/projects/import-dxf" : "/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        createdProjectSchema,
        importing
          ? "Não foi possível importar o DXF. Verifique o arquivo e tente novamente."
          : "Não foi possível criar o projeto. Tente novamente.",
      );

      toast.success(
        importing
          ? "Projeto importado com sucesso."
          : "Projeto criado com sucesso.",
      );
      router.push(`/project/${project.id}/general-data`);
      router.refresh();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível concluir a operação.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>
            {importing ? "Importar .DXF" : "Novo projeto"}
          </DialogTitle>
          <DialogDescription>
            {importing
              ? "Crie um projeto a partir do desenho da rede. Use um DXF de texto de até 5 MB."
              : "Informe os dados iniciais. Você poderá completá-los depois."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} aria-busy={pending} className="space-y-5">
          <fieldset disabled={pending} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="new-project-name">
                Nome do projeto
              </FieldLabel>
              <Input
                id="new-project-name"
                name="name"
                required
                maxLength={200}
              />
            </Field>
            {importing ? (
              <Field>
                <FieldLabel htmlFor="new-project-dxf">Arquivo DXF</FieldLabel>
                <Input
                  id="new-project-dxf"
                  name="dxf"
                  type="file"
                  accept=".dxf"
                  required
                />
              </Field>
            ) : (
              <>
                <Field>
                  <FieldLabel htmlFor="new-project-contractor">
                    Contratante (opcional)
                  </FieldLabel>
                  <Input
                    id="new-project-contractor"
                    name="contractor"
                    maxLength={200}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="new-project-manager">
                    Responsável técnico (opcional)
                  </FieldLabel>
                  <Input
                    id="new-project-manager"
                    name="technicalManager"
                    maxLength={200}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="new-project-location">
                    Localidade (opcional)
                  </FieldLabel>
                  <Input
                    id="new-project-location"
                    name="location"
                    maxLength={200}
                  />
                </Field>
              </>
            )}
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? importing
                  ? "Importando..."
                  : "Criando..."
                : importing
                  ? "Importar projeto"
                  : "Criar projeto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

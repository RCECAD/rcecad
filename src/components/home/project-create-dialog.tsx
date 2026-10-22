"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { parseClientJson } from "@/api/client/response";
import { type DxfPreview, dxfPreviewSchema } from "@/api/contracts/design";
import { importDxfRequestSchema, MAX_DXF_BYTES } from "@/api/contracts/spring";
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
  const [preview, setPreview] = useState<DxfPreview>();
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
      let init: RequestInit;
      if (importing) {
        const file = data.get("file");
        if (
          !(file instanceof File) ||
          !file.name.toLowerCase().endsWith(".dxf") ||
          file.size === 0
        ) {
          throw new Error("Selecione um arquivo .dxf válido.");
        }
        if (file.size > MAX_DXF_BYTES)
          throw new Error("O arquivo DXF deve ter até 300 MB.");
        if (
          !importDxfRequestSchema.safeParse(Object.fromEntries(data)).success
        ) {
          throw new Error("Revise os dados do projeto e o arquivo DXF.");
        }
        const header = await file.slice(0, 18).text();
        if (header.startsWith("AutoCAD Binary DXF"))
          throw new Error("Exporte o desenho no formato DXF de texto (ASCII).");
        data.set("name", name);
        init = { method: "POST", body: data };
      } else {
        const optional = (key: string) =>
          String(data.get(key) ?? "").trim() || null;
        const body = {
          name,
          contractor: optional("contractor"),
          technicalManager: optional("technicalManager"),
          location: optional("location"),
        };
        init = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        };
      }
      if (importing && !preview) {
        setPreview(
          await parseClientJson(
            await fetch("/api/projects/dxf-preview", init),
            dxfPreviewSchema,
            "Não foi possível conferir o DXF.",
          ),
        );
        return;
      }
      const project = await parseClientJson(
        await fetch(
          importing ? "/api/projects/import-dxf" : "/api/projects",
          init,
        ),
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
      router.push(
        `/project/${project.id}/${importing ? "sizing" : "general-data"}`,
      );
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
      <DialogContent
        showCloseButton={!pending}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {importing ? "Importar .DXF" : "Novo projeto"}
          </DialogTitle>
          <DialogDescription>
            {importing
              ? "Crie um projeto a partir do desenho da rede. Use um DXF de texto de até 300 MB."
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
                  name="file"
                  type="file"
                  accept=".dxf"
                  required
                  onChange={() => {
                    setPreview(undefined);
                    setError(undefined);
                  }}
                />
              </Field>
            ) : null}
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
            {importing ? (
              <>
                <Field>
                  <FieldLabel htmlFor="new-project-revision">
                    Revisão (opcional)
                  </FieldLabel>
                  <Input
                    id="new-project-revision"
                    name="revision"
                    maxLength={50}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="new-project-basin">
                    Bacia (opcional)
                  </FieldLabel>
                  <Input id="new-project-basin" name="basin" maxLength={200} />
                </Field>
              </>
            ) : (
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
            )}
          </fieldset>
          {preview && (
            <section
              aria-label="Pré-visualização do DXF"
              className="rounded-md border p-3 text-sm space-y-2"
            >
              <p className="font-medium">
                {preview.segmentCount} trechos · {preview.nodeCount} nós
              </p>
              <p>Saídas: {preview.outletCodes.join(", ") || "Nenhuma"}</p>
              {preview.warnings.map((warning) => (
                <p
                  key={warning}
                  role="alert"
                  className="text-amber-700 dark:text-amber-300"
                >
                  {warning}
                </p>
              ))}
              <p className="text-muted-foreground">
                Confira a rede e confirme a importação. Parâmetros hidráulicos e
                dados de campo serão preenchidos no projeto.
              </p>
            </section>
          )}
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
                  ? preview
                    ? "Importando..."
                    : "Conferindo DXF..."
                  : "Criando..."
                : importing
                  ? preview
                    ? "Importar projeto"
                    : "Pré-visualizar DXF"
                  : "Criar projeto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

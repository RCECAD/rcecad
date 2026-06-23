"use client";

import { motion } from "framer-motion";
import { ScanSearch } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import {
  type ImportDxfState,
  importDxfAction,
} from "@/app/(protected)/home/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const initialState: ImportDxfState = { status: "idle" };

type ImportDxfDialogProps = {
  index: number;
};

export function ImportDxfDialog({ index }: Readonly<ImportDxfDialogProps>) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    importDxfAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.push(`/projects/${state.project.id}`);
    }
  }, [state, router]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.08 * index }}
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="text-left"
        >
          <Card className="rounded-xl border border-border bg-card py-0 shadow-none transition-colors hover:bg-muted/40">
            <CardContent className="flex min-h-28 items-center gap-5 px-8 py-6">
              <div className="flex size-14 items-center justify-center rounded-xl">
                <ScanSearch className="size-12 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                  Importar .DXF
                </h3>
                <p className="text-sm text-muted-foreground">
                  Comece rapidamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar projeto .DXF</DialogTitle>
          <DialogDescription>
            Selecione um arquivo .DXF exportado pelo Sancad para importar a rede
            de esgoto.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="name">Nome do projeto</FieldLabel>
            <Input
              id="name"
              name="name"
              placeholder="Ex: COLETOR 01"
              required
              disabled={isPending}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="dxf">Arquivo .DXF</FieldLabel>
            <Input
              id="dxf"
              name="dxf"
              type="file"
              accept=".dxf"
              required
              disabled={isPending}
            />
          </Field>

          {state.status === "error" && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Importando…" : "Importar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

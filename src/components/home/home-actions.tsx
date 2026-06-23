"use client";

import { motion } from "framer-motion";
import { FilePlus2 } from "lucide-react";
import { ImportDxfDialog } from "@/components/home/import-dxf-dialog";
import { Card, CardContent } from "@/components/ui/card";

export function HomeActions() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0 }}
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="text-left"
      >
        <Card className="rounded-xl border border-border bg-card py-0 shadow-none transition-colors hover:bg-muted/40">
          <CardContent className="flex min-h-28 items-center gap-5 px-8 py-6">
            <div className="flex size-14 items-center justify-center rounded-xl">
              <FilePlus2 className="size-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                Novo Projeto
              </h3>
              <p className="text-sm text-muted-foreground">
                Comece pelo básico.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.button>

      <ImportDxfDialog index={1} />
    </div>
  );
}

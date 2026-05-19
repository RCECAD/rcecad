"use client";

import { motion } from "framer-motion";
import { FilePlus2, ScanSearch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const actions = [
  {
    title: "Novo Projeto",
    description: "Comece pelo básico.",
    icon: FilePlus2,
  },
  {
    title: "Importar .DXF",
    description: "Comece rapidamente.",
    icon: ScanSearch,
  },
];

export function HomeActions() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {actions.map((action, index) => {
        const Icon = action.icon;

        const iconColor = action.title.toLowerCase().includes("dxf")
          ? "text-primary"
          : "text-muted-foreground";

        return (
          <motion.button
            key={action.title}
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
                  <Icon className={`size-12 ${iconColor}`} />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                    {action.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.button>
        );
      })}
    </div>
  );
}

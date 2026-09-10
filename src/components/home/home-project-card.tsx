"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Project } from "@/domain/entities";
import { formatHomeProjectDate, getStatusMeta } from "@/utils";

type HomeProjectCardProps = {
  project: Project;
  index: number;
};

export function HomeProjectCard({
  project,
  index,
}: Readonly<HomeProjectCardProps>) {
  const status = getStatusMeta(project.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link href={`/project/${project.id}`} className="block h-full">
        <Card
          size="sm"
          className="h-full min-h-38 rounded-lg border border-border bg-card py-0 shadow-none transition-colors hover:bg-muted/40"
        >
          <CardHeader className="gap-4 px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-lg font-semibold text-foreground">
                {project.name}
              </CardTitle>
              <span className="text-sm text-muted-foreground">
                {formatHomeProjectDate(project.createdAt)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pt-0 text-sm text-muted-foreground">
            {project.contractor ?? "Contratante não informado"} •{" "}
            {project.location ?? "Localidade não informada"}
          </CardContent>
          <CardFooter className="px-4 pt-0 pb-4">
            <StatusBadge tone={status.tone} label={status.shortLabel} />
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}

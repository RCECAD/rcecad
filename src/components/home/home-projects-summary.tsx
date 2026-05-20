"use client";

import { motion } from "framer-motion";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ProjectStatus, ProjectsStatusSummary } from "@/domain/entities";
import { getStatusMeta } from "@/utils";

const orderedStatuses: Array<ProjectStatus> = [
  "inProgress",
  "pending",
  "validated",
  "exported",
];

type HomeProjectsSummaryProps = {
  summary: ProjectsStatusSummary;
};

export function HomeProjectsSummary({
  summary,
}: Readonly<HomeProjectsSummaryProps>) {
  return (
    <div className="flex flex-nowrap items-center gap-2">
      {orderedStatuses.map((status, index) => {
        const meta = getStatusMeta(status);

        return (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.04 * index }}
          >
            <StatusBadge
              tone={meta.tone}
              label={`${summary[status]} ${meta.label}`}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

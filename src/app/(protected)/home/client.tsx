"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, Search, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { HomeProjectCard } from "@/components/home/home-project-card";
import { HomeProjectsSummary } from "@/components/home/home-projects-summary";
import { HomeProjectsTable } from "@/components/home/home-projects-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/page-state";
import type { HomeProjectsPayload } from "@/domain/entities";
import { filterHomeProjects } from "@/utils";

type HomeClientProps = {
  payload: HomeProjectsPayload;
};

export function HomeClient({ payload }: Readonly<HomeClientProps>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const filteredProjects = useMemo(
    () => filterHomeProjects(payload.projects, debouncedQuery),
    [payload.projects, debouncedQuery],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-6 pb-16 pt-10"
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Últimos projetos
            </h2>
            <p className="text-base text-muted-foreground">
              Continue de onde parou.
            </p>
          </div>

          <div className="relative min-h-9 md:w-[28rem] md:flex-none">
            <AnimatePresence initial={false} mode="wait">
              {isExpanded ? (
                <motion.div
                  key="expanded-controls"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex items-center justify-start gap-3 md:absolute md:inset-y-0 md:right-0 md:justify-end"
                >
                  <HomeProjectsSummary summary={payload.statusSummary} />
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2"
                    onClick={() => setIsExpanded(false)}
                  >
                    <Undo2 className="size-4" />
                    Voltar
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="compact-action"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex justify-start md:absolute md:inset-y-0 md:right-0 md:justify-end"
                >
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2"
                    onClick={() => setIsExpanded(true)}
                  >
                    <LayoutGrid className="size-4" />
                    Ver todos
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <motion.div
          layout
          transition={{
            layout: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {isExpanded ? (
              <motion.div
                key="expanded-state"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{
                  opacity: { duration: 0.22 },
                  y: { duration: 0.28 },
                }}
                className="rounded-xl border border-border bg-card p-6 shadow-xs"
              >
                <div className="mb-5 flex flex-col gap-4">
                  <div className="relative max-w-md">
                    <label htmlFor="project-search" className="sr-only">
                      Buscar projetos
                    </label>
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="project-search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="h-10 pl-9"
                      placeholder="Buscar por nome, revisão, status..."
                    />
                  </div>
                </div>
                <HomeProjectsTable
                  projects={filteredProjects}
                  emptyText={
                    debouncedQuery
                      ? "Nenhum projeto corresponde à busca."
                      : "Nenhum projeto encontrado."
                  }
                />
              </motion.div>
            ) : (
              <motion.div
                key="compact-state"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{
                  opacity: { duration: 0.22 },
                  y: { duration: 0.28 },
                }}
                className="grid gap-3 md:grid-cols-3"
              >
                {payload.recentProjects.length > 0 ? (
                  payload.recentProjects.map((project, index) => (
                    <HomeProjectCard
                      key={project.id}
                      project={project}
                      index={index}
                    />
                  ))
                ) : (
                  <div className="md:col-span-3">
                    <EmptyState
                      title="Nenhum projeto encontrado"
                      description="Quando houver projetos disponíveis, eles aparecerão aqui."
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.section>
  );
}

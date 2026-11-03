"use client";

import { CircleX } from "lucide-react";
import { type FeedbackAction, FeedbackActions } from "@/components/ui/feedback";

type ErrorStateProps = {
  title: string;
  description: string;
  retryLabel?: string;
  onRetry: () => void;
  retrying?: boolean;
  actions?: FeedbackAction[];
};

export function ErrorState({
  title,
  description,
  retryLabel = "Tentar novamente",
  onRetry,
  retrying = false,
  actions = [{ label: "Voltar aos projetos", href: "/home" }],
}: Readonly<ErrorStateProps>) {
  return (
    <section
      aria-live="assertive"
      className="flex min-h-[320px] items-center justify-center px-4 py-8"
      role="alert"
    >
      <div className="w-full max-w-md">
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <div className="text-center">
            <CircleX
              aria-hidden="true"
              className="mx-auto mb-4 size-10 text-destructive"
            />
            <h2 className="mb-2 text-2xl font-bold text-destructive">
              {title}
            </h2>
            <p className="mb-6 text-muted-foreground">{description}</p>

            <div className="flex justify-center">
              <FeedbackActions
                actions={[
                  {
                    label: retrying ? "Tentando novamente..." : retryLabel,
                    onClick: onRetry,
                    disabled: retrying,
                  },
                  ...actions,
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

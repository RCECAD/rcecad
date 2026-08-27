"use client";

import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title: string;
  description: string;
  errorMessage?: string;
  retryLabel?: string;
  onRetry: () => void;
};

export function ErrorState({
  title,
  description,
  errorMessage,
  retryLabel = "Tentar novamente",
  onRetry,
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
            <h2 className="mb-2 text-2xl font-bold text-destructive">
              {title}
            </h2>
            <p className="mb-6 text-muted-foreground">{description}</p>

            {errorMessage ? (
              <div className="mb-6 rounded border border-destructive/30 bg-destructive/10 p-4 text-left">
                <p className="font-mono text-sm text-destructive">
                  {errorMessage}
                </p>
              </div>
            ) : null}

            <Button onClick={onRetry} className="w-full">
              {retryLabel}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

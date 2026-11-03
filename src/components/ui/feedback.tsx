"use client";

import { CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, type ReactNode, useEffect, useRef } from "react";
import { ClientApiError, getErrorMessage } from "@/api/client/response";
import { useOptionalUnsavedChanges } from "@/components/project/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FeedbackAction = { label: string; disabled?: boolean } & (
  | { href: string; onClick?: never }
  | { href?: never; onClick: () => void }
);

function GuardedLink({
  href,
  children,
  ...props
}: ComponentProps<typeof Link> & { href: string }) {
  const router = useRouter();
  const unsaved = useOptionalUnsavedChanges();
  return (
    <Link
      {...props}
      href={href}
      onNavigate={(event) => {
        if (unsaved) {
          event.preventDefault();
          unsaved.requestNavigation(() => {
            const target = new URL(href, window.location.href);
            if (
              target.pathname === window.location.pathname &&
              target.search === window.location.search &&
              target.hash
            ) {
              // Next navigation does not emit hashchange for an in-page link.
              const unchanged = window.location.hash === target.hash;
              window.location.hash = target.hash;
              if (unchanged)
                window.dispatchEvent(new HashChangeEvent("hashchange"));
              document
                .getElementById(decodeURIComponent(target.hash.slice(1)))
                ?.scrollIntoView({ block: "start" });
            } else router.push(href);
          });
        }
      }}
    >
      {children}
    </Link>
  );
}

export function FeedbackActions({ actions }: { actions?: FeedbackAction[] }) {
  const unsaved = useOptionalUnsavedChanges();
  if (!actions?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          type="button"
          variant="outline"
          size="sm"
          className="h-auto min-h-9 whitespace-normal text-left"
          disabled={action.disabled}
          asChild={Boolean(action.href)}
          onClick={action.onClick}
        >
          {action.href ? (
            unsaved ? (
              <GuardedLink href={action.href}>{action.label}</GuardedLink>
            ) : (
              <Link href={action.href}>{action.label}</Link>
            )
          ) : (
            action.label
          )}
        </Button>
      ))}
    </div>
  );
}

const appearances = {
  error: {
    Icon: CircleX,
    style: "border-destructive/30 bg-destructive/5 text-destructive",
  },
  warning: {
    Icon: TriangleAlert,
    style:
      "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200",
  },
  success: {
    Icon: CircleCheck,
    style:
      "border-teal-300 bg-teal-50 text-teal-900 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-200",
  },
  info: { Icon: Info, style: "border-border bg-muted/30 text-foreground" },
};

export function Feedback({
  title,
  description,
  tone = "info",
  actions,
  className,
  reveal = false,
}: {
  title: string;
  description?: ReactNode;
  tone?: keyof typeof appearances;
  actions?: FeedbackAction[];
  className?: string;
  reveal?: boolean;
}) {
  const { Icon, style } = appearances[tone];
  const feedbackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reveal) feedbackRef.current?.scrollIntoView({ block: "nearest" });
  }, [reveal]);
  return (
    <div
      ref={feedbackRef}
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex min-w-0 items-start gap-3 rounded-lg border p-4",
        style,
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-sm font-semibold">{title}</p>
        {description && (
          <div className="break-words text-sm leading-relaxed">
            {description}
          </div>
        )}
        <FeedbackActions actions={actions} />
      </div>
    </div>
  );
}

export function RequestError({
  error,
  title,
  onRetry,
  retrying,
  actions = [],
  reveal,
}: {
  error: unknown;
  title: string;
  onRetry?: () => void;
  retrying?: boolean;
  actions?: FeedbackAction[];
  reveal?: boolean;
}) {
  const expired = error instanceof ClientApiError && error.status === 401;
  const unavailable =
    error instanceof ClientApiError &&
    (error.status === 403 || error.status === 404);
  return (
    <Feedback
      reveal={reveal}
      tone="error"
      title={title}
      description={getErrorMessage(
        error,
        "Verifique sua conexão e tente novamente.",
      )}
      actions={
        expired
          ? [{ label: "Entrar novamente", href: "/auth/login" }]
          : [
              ...(onRetry && !unavailable
                ? [
                    {
                      label: retrying
                        ? "Tentando novamente..."
                        : "Tentar novamente",
                      onClick: onRetry,
                      disabled: retrying,
                    },
                  ]
                : []),
              ...(unavailable
                ? [{ label: "Voltar aos projetos", href: "/home" }]
                : []),
              ...actions,
            ]
      }
    />
  );
}

import type { ComponentProps, HTMLAttributes } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = HTMLAttributes<HTMLDivElement>;

export function Field({ className, ...props }: Readonly<FieldProps>) {
  return <div className={cn("space-y-1.5", className)} {...props} />;
}

type FieldLabelProps = ComponentProps<typeof Label>;

export function FieldLabel({ className, ...props }: Readonly<FieldLabelProps>) {
  return (
    <Label
      className={cn("text-sm leading-none font-medium", className)}
      {...props}
    />
  );
}

type FieldDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export function FieldDescription({
  className,
  ...props
}: Readonly<FieldDescriptionProps>) {
  return (
    <p className={cn("text-muted-foreground text-sm", className)} {...props} />
  );
}

type FieldErrorItem = {
  message?: string;
};

type FieldErrorProps = {
  errors?: ReadonlyArray<FieldErrorItem | undefined>;
  className?: string;
};

export function FieldError({ errors, className }: Readonly<FieldErrorProps>) {
  const messages = (errors ?? [])
    .map((error) => error?.message)
    .filter((message): message is string => Boolean(message));

  if (messages.length === 0) {
    return null;
  }

  return <p className={cn("text-sm text-red-600", className)}>{messages[0]}</p>;
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { getErrorMessage } from "@/api/client/response";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { portugueseValidation } from "@/lib/form-validation";
import { type LoginFormValues, loginSchema } from "@/schemas/login";
import { loginAction } from "../actions";

export function LoginForm() {
  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema, portugueseValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const router = useRouter();
  const [error, setError] = useState<string>();

  async function onSubmit(values: LoginFormValues) {
    setError(undefined);
    try {
      const result = await loginAction(values);

      if (!result.success) {
        setError(result.message);
        return;
      }

      toast.success("Login realizado com sucesso");
      reset();
      router.push("/home");
      router.refresh();
    } catch (cause) {
      setError(
        getErrorMessage(
          cause,
          "Não foi possível entrar. Verifique sua conexão e tente novamente.",
        ),
      );
    }
  }

  return (
    <form
      noValidate
      aria-busy={isSubmitting}
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-w-0 flex-col gap-4"
    >
      <Controller
        name="email"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>E-mail</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="email"
              placeholder="seu.email@empresa.com"
              aria-invalid={fieldState.invalid}
            />
            <FieldDescription>
              Este e-mail será usado para acessar a conta.
            </FieldDescription>
            {fieldState.invalid && (
              <FieldError role="alert" errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Senha</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="password"
              placeholder="••••••••"
              aria-invalid={fieldState.invalid}
            />
            <FieldDescription>
              Digite sua senha para acessar a conta.
            </FieldDescription>
            {fieldState.invalid && (
              <FieldError role="alert" errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      {error && (
        <Feedback
          tone="error"
          title="Não foi possível entrar"
          description={error}
          actions={[{ label: "Criar uma conta", href: "/auth/register" }]}
        />
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

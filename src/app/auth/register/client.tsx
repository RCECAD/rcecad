"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type RegisterFormValues, registerSchema } from "@/schemas/register";
import { registerAction } from "../actions";

export function RegisterForm() {
  const {
    handleSubmit,
    control,
    reset,
    setError,
    setFocus,
    clearErrors,
    formState: { isSubmitting, errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      cnpj: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const router = useRouter();
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    if (isSubmitting) return;
    const fields = ["cnpj", "email", "password", "confirmPassword"] as const;
    const rejectedField = fields.find(
      (name) => errors[name]?.type === "server",
    );
    // The fieldset must be enabled again before the browser can focus an error.
    if (rejectedField) setFocus(rejectedField);
  }, [errors, isSubmitting, setFocus]);

  async function onSubmit(values: RegisterFormValues) {
    clearErrors();
    try {
      const result = await registerAction(values);

      if (!result.success) {
        setError(
          result.field ?? "root.server",
          {
            type: "server",
            message: result.message,
          },
          { shouldFocus: true },
        );
        return;
      }

      reset();
      if (!result.authenticated) {
        setNeedsLogin(true);
        return;
      }

      toast.success("Usuário criado com sucesso!");
      router.push("/home");
      router.refresh();
    } catch {
      setError("root.server", {
        type: "server",
        message:
          "Não foi possível confirmar o cadastro. Confira sua conexão. Se a conta já foi criada, faça login.",
      });
    }
  }

  if (needsLogin) {
    return (
      <div className="space-y-4" role="status">
        <p>
          Sua conta foi criada, mas não foi possível entrar automaticamente.
        </p>
        <Button asChild className="w-full">
          <Link href="/auth/login">Fazer login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-busy={isSubmitting}>
      <fieldset disabled={isSubmitting} className="space-y-4">
        {/* Campo: CNPJ */}
        <Controller
          name="cnpj"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>CNPJ</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="text"
                placeholder="12.345.678/0001-90"
                inputMode="numeric"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
                aria-describedby="cnpj-description cnpj-error"
              />
              <FieldDescription id="cnpj-description">
                Informe o CNPJ da empresa, com ou sem pontuação. Ele precisa
                estar ativo.
              </FieldDescription>
              <FieldError
                id="cnpj-error"
                role="alert"
                errors={[fieldState.error]}
              />
            </Field>
          )}
        />

        {/* Campo: Email */}
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                autoComplete="email"
                placeholder="seu.email@empresa.com"
                aria-invalid={fieldState.invalid}
                aria-describedby="email-error"
              />
              <FieldDescription>
                Este email será usado para acessar a conta.
              </FieldDescription>
              <FieldError
                id="email-error"
                role="alert"
                errors={[fieldState.error]}
              />
            </Field>
          )}
        />

        {/* Campo: Senha */}
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
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={fieldState.invalid}
                aria-describedby="password-error"
              />
              <FieldDescription>
                Escolha uma senha para acessar a conta.
              </FieldDescription>
              <FieldError
                id="password-error"
                role="alert"
                errors={[fieldState.error]}
              />
            </Field>
          )}
        />

        {/* Campo: Confirmar Senha */}
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Confirmar Senha</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={fieldState.invalid}
                aria-describedby="confirm-password-error"
              />
              <FieldDescription>
                Repita a senha para confirmar o cadastro.
              </FieldDescription>
              <FieldError
                id="confirm-password-error"
                role="alert"
                errors={[fieldState.error]}
              />
            </Field>
          )}
        />
        {errors.root?.server?.message && (
          <p role="alert" className="text-sm text-destructive">
            {errors.root.server.message}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          O cadastro consulta o CNPJ e pode levar alguns segundos.
        </p>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Criando..." : "Criar Conta"}
        </Button>
      </fieldset>
    </form>
  );
}

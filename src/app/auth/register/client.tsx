"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { type RegisterFormValues, registerSchema } from "@/schemas/register";
import { registerUserAction } from "./actions";

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { handleSubmit, control, reset } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      cnpj: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const result = await registerUserAction(values);

    if (!result.ok) {
      const fieldError =
        result.fieldErrors?.email?.[0] ||
        result.fieldErrors?.name?.[0] ||
        result.fieldErrors?.cnpj?.[0] ||
        result.fieldErrors?.password?.[0] ||
        result.fieldErrors?.confirmPassword?.[0];

      setError(fieldError ?? result.message);
      setIsLoading(false);
      return;
    }

    reset();
    setSuccess("Conta criada com sucesso!");
    setIsLoading(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Campo: Nome da Empresa */}
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Nome da Empresa</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="text"
              placeholder="Sua Empresa LTDA"
              disabled={isLoading}
              aria-invalid={fieldState.invalid}
            />
            <FieldDescription>
              Nome oficial da empresa para identificação no sistema.
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

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
              placeholder="12345678901234"
              disabled={isLoading}
              aria-invalid={fieldState.invalid}
            />
            <FieldDescription>
              Informe apenas os 14 dígitos do CNPJ.
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              placeholder="seu.email@empresa.com"
              disabled={isLoading}
              aria-invalid={fieldState.invalid}
            />
            <FieldDescription>
              Este email será usado para acessar a conta.
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              placeholder="••••••••"
              disabled={isLoading}
              aria-invalid={fieldState.invalid}
            />
            <FieldDescription>
              Mínimo 8 caracteres, com 1 letra maiúscula e 1 número.
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              placeholder="••••••••"
              disabled={isLoading}
              aria-invalid={fieldState.invalid}
            />
            <FieldDescription>
              Repita a senha para confirmar o cadastro.
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Botão Enviar */}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Criando conta..." : "Criar Conta"}
      </Button>
    </form>
  );
}

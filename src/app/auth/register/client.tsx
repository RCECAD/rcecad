"use client";

import { useSignUp } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "next/client";
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

export function RegisterForm() {
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

  const { signUp, setActive, isLoaded } = useSignUp();

  async function onSubmit(values: RegisterFormValues) {
    if (!isLoaded) return;

    const result = await signUp.create({
      firstName: values.name,
      emailAddress: values.email,
      password: values.password,
    });

    if (result.error) {
      throw new Error("Erro ao criar conta. Por favor, tente novamente.");
    }

    await createUserInDb({
      clerkId: result.userId,
      name: values.name,
      cnpj: values.cnpj,
      email: values.email,
    });

    await setActive({ session: result.createdSessionId });

    router.push("/home");

    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
      <Button type="submit" className="w-full">
        Criar Conta
      </Button>
    </form>
  );
}

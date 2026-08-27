"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      cnpj: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const router = useRouter();

  async function onSubmit(values: RegisterFormValues) {
    const result = await registerAction(values);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success("Usuário criado com sucesso!");
    reset();
    router.push("/home");
    router.refresh();
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
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Criando..." : "Criar Conta"}
      </Button>
    </form>
  );
}

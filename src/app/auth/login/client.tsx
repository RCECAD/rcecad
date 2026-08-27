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
import { type LoginFormValues, loginSchema } from "@/schemas/login";
import { loginAction } from "../actions";

export function LoginForm() {
  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const router = useRouter();

  async function onSubmit(values: LoginFormValues) {
    const result = await loginAction(values);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success("Login realizado com sucesso");
    reset();
    router.push("/home");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

"use client";

import { useSignIn } from "@clerk/nextjs";
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

export function LoginForm() {
  const { handleSubmit, control, reset } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const router = useRouter();

  const { signIn, fetchStatus } = useSignIn();

  async function onSubmit(values: LoginFormValues) {
    if (fetchStatus === "fetching") return null;

    const { error } = await signIn.password({
      emailAddress: values.email,
      password: values.password,
    });

    if (error) {
      toast.error("Erro ao logar no sistema, por favor, tente novamente.");
      console.error("Erro celrk ai mano: ", error);
      return;
    }

    console.log(signIn.status);

    if (signIn.status === "complete") {
      toast.success("Login realizado com sucesso");
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }

          const url = decorateUrl("/home");
          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.push(url);
            reset();
          }
        },
      });
    } else {
      console.error("Error at signin: ", signIn);
    }
  }

  return (
    <div>
      signIn
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <Button type="submit" className="w-full">
          Entrar
        </Button>
      </form>
    </div>
  );
}

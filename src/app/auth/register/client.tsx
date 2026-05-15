"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type RegisterFormValues, registerSchema } from "@/schemas/register";
import { registerUserAction } from "./actions";

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormValues>({
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
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome da Empresa</Label>
        <Input
          {...register("name")}
          id="name"
          type="text"
          placeholder="Sua Empresa LTDA"
          disabled={isLoading}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Campo: CNPJ */}
      <div className="space-y-1.5">
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input
          {...register("cnpj")}
          id="cnpj"
          type="text"
          placeholder="12345678901234"
          disabled={isLoading}
        />
        {errors.cnpj && (
          <p className="mt-1 text-sm text-red-600">{errors.cnpj.message}</p>
        )}
      </div>

      {/* Campo: Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          {...register("email")}
          id="email"
          type="email"
          placeholder="seu.email@empresa.com"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Campo: Senha */}
      <div className="space-y-1.5">
        <Label htmlFor="password">Senha</Label>
        <Input
          {...register("password")}
          id="password"
          type="password"
          placeholder="••••••••"
          disabled={isLoading}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Campo: Confirmar Senha */}
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
        <Input
          {...register("confirmPassword")}
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          disabled={isLoading}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Botão Enviar */}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Criando conta..." : "Criar Conta"}
      </Button>
    </form>
  );
}

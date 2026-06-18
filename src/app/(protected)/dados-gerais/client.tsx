"use client";

import { SaveIcon, Undo2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// trocar isso pelo zod depois, só pra testar mesmo
type DadosGeraisFormValues = {
  nomeProjeto: string;
  codigoInterno: string;
  contratante: string;
  municipioLocalidade: string;
  revisao: string;
  responsavelTecnico: string;
  tipoDeSistema: string;
  etapaHorizonte: string;
  observacoes?: string;
  bacia: string;
  setor: string;
  areaTotal: string;
};

export function DadosGeraisClient() {
  const { control, handleSubmit } = useForm<DadosGeraisFormValues>({
    defaultValues: {
      nomeProjeto: "",
      codigoInterno: "",
      contratante: "",
      municipioLocalidade: "",
      revisao: "",
      responsavelTecnico: "",
      tipoDeSistema: "",
      etapaHorizonte: "",
      observacoes: "",
      bacia: "",
      setor: "",
      areaTotal: "",
    },
  });

  const router = useRouter();

  function onSubmit(values: DadosGeraisFormValues) {
    console.log(values);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 pb-6">
      <h1 className="text-2xl font-semibold mb-5">Dados Gerais</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="bg-slate-100 border border-slate-300 rounded-lg p-6">
          <div className="flex flex-col mb-6">
            <h2 className="text-base font-semibold">1. Identificação</h2>
            <p className="text-sm font-normal text-slate-500">
              Informações básicas de identificação do projeto
            </p>
          </div>
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <div className="w-full">
              <Controller
                name="nomeProjeto"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Nome do Projeto
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
                      placeholder="Digite o nome do projeto"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="w-full">
              <Controller
                name="codigoInterno"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Código Interno</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
                      placeholder="Digite o código interno"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="w-full">
              <Controller
                name="contratante"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Contratante</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
                      placeholder="Digite o contratante"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-full">
              <Controller
                name="municipioLocalidade"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Município/Localidade
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
                      placeholder="Digite o município/localidade"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="w-full">
              <Controller
                name="revisao"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Revisão</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
                      placeholder="Digite a revisão"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="w-full">
              <Controller
                name="responsavelTecnico"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Responsável Técnico
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
                      placeholder="Digite o responsável técnico"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-100 border border-slate-300 rounded-lg p-6">
          <div className="flex flex-col mb-6">
            <h2 className="text-base font-semibold">2. Contexto Técnico</h2>
            <p className="text-sm font-normal text-slate-500">
              Características técnicas e escopo do projeto
            </p>
          </div>
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <div className="w-full">
              <Controller
                name="tipoDeSistema"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Tipo de Sistema
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
                      placeholder="Digite o tipo de sistema"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="w-full">
              <Controller
                name="etapaHorizonte"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Etapa do Horizonte
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
                      placeholder="Ex. 2024-2034, Fase 1"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-full">
              <Controller
                name="observacoes"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Observações</FieldLabel>
                    <Textarea
                      {...field}
                      id={field.name}
                      placeholder="Digite suas observações aqui..."
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-100 border border-slate-300 rounded-lg p-6">
          <div className="flex flex-col mb-6">
            <h2 className="text-base font-semibold">3. Escopo Espacial</h2>
            <p className="text-sm font-normal text-slate-500">
              Delimitação geográfica e setorização do projeto
            </p>
          </div>
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <div className="w-full">
              <Controller
                name="bacia"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Bacia</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
                      placeholder="Ex. Bacia do Rio Paraná"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="w-full">
              <Controller
                name="setor"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Setor</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
                      placeholder="Ex. Setor Central"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="w-full">
              <Controller
                name="areaTotal"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Área Total</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
                      placeholder="Ex. 2.5km²"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button type="submit" className="flex-1">
            <SaveIcon />
            Nenhuma alteração foi feita ainda.
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            <Undo2Icon />
            Voltar
          </Button>
        </div>
      </form>
    </div>
  );
}

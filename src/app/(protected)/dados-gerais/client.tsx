"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon, Undo2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type Control,
  Controller,
  type FieldPath,
  useForm,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type DadosGeraisFormValues,
  dadosGeraisSchema,
} from "@/schemas/dados-gerais";

type FormFieldConfig = {
  name: FieldPath<DadosGeraisFormValues>;
  label: string;
  placeholder: string;
  type?: "input" | "textarea";
  className?: string;
};

const identificacaoFields = [
  {
    name: "nomeProjeto",
    label: "Nome do Projeto",
    placeholder: "Digite o nome do projeto",
  },
  {
    name: "codigoInterno",
    label: "Código Interno",
    placeholder: "Digite o código interno",
  },
  {
    name: "contratante",
    label: "Contratante",
    placeholder: "Digite o contratante",
  },
  {
    name: "municipioLocalidade",
    label: "Município/Localidade",
    placeholder: "Digite o município/localidade",
  },
  {
    name: "revisao",
    label: "Revisão",
    placeholder: "Digite a revisão",
  },
  {
    name: "responsavelTecnico",
    label: "Responsável Técnico",
    placeholder: "Digite o responsável técnico",
  },
] satisfies FormFieldConfig[];

const contextoTecnicoFields = [
  {
    name: "tipoDeSistema",
    label: "Tipo de Sistema",
    placeholder: "Digite o tipo de sistema",
  },
  {
    name: "etapaHorizonte",
    label: "Etapa do Horizonte",
    placeholder: "Ex. 2024-2034, Fase 1",
  },
  {
    name: "observacoes",
    label: "Observações",
    placeholder: "Digite suas observações aqui...",
    type: "textarea",
    className: "col-span-2",
  },
] satisfies FormFieldConfig[];

const escopoEspacialFields = [
  {
    name: "bacia",
    label: "Bacia",
    placeholder: "Ex. Bacia do Rio Paraná",
  },
  {
    name: "setor",
    label: "Setor",
    placeholder: "Ex. Setor Central",
  },
  {
    name: "areaTotal",
    label: "Área Total",
    placeholder: "Ex. 2.5km²",
  },
] satisfies FormFieldConfig[];

type ControlledFormFieldProps = FormFieldConfig & {
  control: Control<DadosGeraisFormValues>;
};

function ControlledFormField({
  name,
  label,
  placeholder,
  type = "input",
  className,
  control,
}: ControlledFormFieldProps) {
  return (
    <div className={className}>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            {type === "textarea" ? (
              <Textarea
                {...field}
                id={field.name}
                placeholder={placeholder}
                aria-invalid={fieldState.invalid}
                className="bg-background"
              />
            ) : (
              <Input
                {...field}
                id={field.name}
                type="text"
                placeholder={placeholder}
                aria-invalid={fieldState.invalid}
              />
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </div>
  );
}

export function DadosGeraisClient() {
  const { control, handleSubmit } = useForm<DadosGeraisFormValues>({
    resolver: zodResolver(dadosGeraisSchema),
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
      <h1 className="mb-5 text-2xl font-semibold">Dados Gerais</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="rounded-lg border border-slate-300 bg-slate-100 p-6">
          <div className="mb-6 flex flex-col">
            <h2 className="text-base font-semibold">1. Identificação</h2>
            <p className="text-sm font-normal text-slate-500">
              Informações básicas de identificação do projeto
            </p>
          </div>
          <div className="grid grid-cols-3 gap-x-2.5 gap-y-5">
            {identificacaoFields.map((field) => (
              <ControlledFormField
                key={field.name}
                {...field}
                control={control}
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-300 bg-slate-100 p-6">
          <div className="mb-6 flex flex-col">
            <h2 className="text-base font-semibold">2. Contexto Técnico</h2>
            <p className="text-sm font-normal text-slate-500">
              Características técnicas e escopo do projeto
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-5">
            {contextoTecnicoFields.map((field) => (
              <ControlledFormField
                key={field.name}
                {...field}
                control={control}
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-300 bg-slate-100 p-6">
          <div className="mb-6 flex flex-col">
            <h2 className="text-base font-semibold">3. Escopo Espacial</h2>
            <p className="text-sm font-normal text-slate-500">
              Delimitação geográfica e setorização do projeto
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {escopoEspacialFields.map((field) => (
              <ControlledFormField
                key={field.name}
                {...field}
                control={control}
              />
            ))}
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

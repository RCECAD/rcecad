"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Save, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  type FieldErrors,
  type FieldPath,
  type UseFormRegister,
  useForm,
} from "react-hook-form";
import { toast } from "sonner";
import {
  invalidateProjectDependents,
  projectQueryKeys,
} from "@/api/client/query-keys";
import { parseClientJson } from "@/api/client/response";
import { useUnsavedChanges } from "@/components/project/unsaved-changes-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageLoading } from "@/components/ui/page-state";
import { Textarea } from "@/components/ui/textarea";
import {
  GENERAL_DATA_DEFAULTS,
  type GeneralDataFormValues,
  generalDataSchema,
  projectStatuses,
} from "@/schemas/general-data";

type GeneralDataFormProps = {
  projectId: string;
};

type TextFieldConfig = {
  name: Exclude<FieldPath<GeneralDataFormValues>, "status">;
  label: string;
  placeholder: string;
  optional?: boolean;
};

const textFields = [
  {
    name: "name",
    label: "Nome do Projeto",
    placeholder: "Digite o nome do projeto",
  },
  {
    name: "internalCode",
    label: "Código Interno",
    placeholder: "Ex.: 00042",
    optional: true,
  },
  {
    name: "contractor",
    label: "Contratante",
    placeholder: "Digite o contratante",
    optional: true,
  },
  {
    name: "revision",
    label: "Revisão",
    placeholder: "Ex.: rev.129",
    optional: true,
  },
  {
    name: "technicalManager",
    label: "Responsável Técnico",
    placeholder: "Digite o responsável técnico",
    optional: true,
  },
  {
    name: "location",
    label: "Localidade",
    placeholder: "Digite a localidade",
    optional: true,
  },
] satisfies Array<TextFieldConfig>;
const identificationOrder = [
  "name",
  "internalCode",
  "contractor",
  "location",
  "revision",
  "technicalManager",
];

function getErrorId(name: FieldPath<GeneralDataFormValues>) {
  return `${name}-error`;
}

function TextField({
  config,
  errors,
  register,
}: Readonly<{
  config: TextFieldConfig;
  errors: FieldErrors<GeneralDataFormValues>;
  register: UseFormRegister<GeneralDataFormValues>;
}>) {
  const error = errors[config.name];
  const errorId = getErrorId(config.name);

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={config.name}>
        {config.label}
        {config.optional ? " (opcional)" : ""}
      </FieldLabel>
      <Input
        id={config.name}
        type="text"
        placeholder={config.placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...register(config.name)}
      />
      {error && <FieldError id={errorId} errors={[error]} />}
    </Field>
  );
}

export function GeneralDataForm({ projectId }: Readonly<GeneralDataFormProps>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { requestNavigation, setHasUnsavedChanges } = useUnsavedChanges();
  const queryKey = projectQueryKeys.generalData(projectId);

  const {
    data: generalData,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/general-data`),
        generalDataSchema,
        "Erro ao carregar dados gerais.",
      ),
    enabled: Boolean(projectId),
    retry: false,
  });

  const {
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
  } = useForm<GeneralDataFormValues>({
    resolver: zodResolver(generalDataSchema),
    defaultValues: GENERAL_DATA_DEFAULTS,
  });

  useEffect(() => {
    if (generalData) {
      reset(generalData);
    }
  }, [generalData, reset]);

  const saveMutation = useMutation({
    mutationFn: async (values: GeneralDataFormValues) =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/general-data`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }),
        generalDataSchema,
        "Erro ao salvar dados gerais.",
      ),
    onSuccess: async (data) => {
      queryClient.setQueryData(queryKey, data);
      reset(data);
      await invalidateProjectDependents(queryClient, projectId);
      toast.success("Dados gerais salvos com sucesso!");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Ocorreu um erro ao salvar os dados gerais.");
    },
  });

  useEffect(() => {
    setHasUnsavedChanges(isDirty && !saveMutation.isPending);
  }, [isDirty, saveMutation.isPending, setHasUnsavedChanges]);

  useEffect(
    () => () => {
      setHasUnsavedChanges(false);
    },
    [setHasUnsavedChanges],
  );

  if (isLoading) {
    return <PageLoading label="Carregando dados gerais" />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Não foi possível carregar os dados gerais"
        description="Não altere as informações até conseguirmos carregar os dados do projeto."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
      aria-busy={saveMutation.isPending}
      className="mx-auto max-w-[1088px] space-y-6 pt-2"
    >
      <p aria-live="polite" className="sr-only">
        {saveMutation.isPending
          ? "Salvando alterações."
          : isDirty
            ? "Existem alterações não salvas."
            : "Nenhuma alteração pendente."}
      </p>

      <h1 className="pb-4 text-2xl font-semibold tracking-tight text-foreground">
        Dados Gerais
      </h1>

      <Card className="gap-3 rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            1. Identificação
          </CardTitle>
          <CardDescription>
            Informações básicas de identificação do projeto
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {textFields
            .toSorted(
              (a, b) =>
                identificationOrder.indexOf(a.name) -
                identificationOrder.indexOf(b.name),
            )
            .map((field) => (
              <TextField
                key={field.name}
                config={field}
                errors={errors}
                register={register}
              />
            ))}
        </CardContent>
      </Card>
      <Card className="gap-3 rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
        <CardHeader>
          <CardTitle>2. Contexto Técnico</CardTitle>
          <CardDescription>
            Características técnicas e escopo do projeto
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <TextField
            config={{
              name: "systemType",
              label: "Tipo de Sistema",
              placeholder: "Ex.: Separador absoluto",
            }}
            register={register}
            errors={errors}
          />
          <TextField
            config={{
              name: "horizon",
              label: "Etapa/Horizonte",
              placeholder: "Ex.: 2026–2046, Fase 1",
            }}
            register={register}
            errors={errors}
          />
          <Field className="md:col-span-3">
            <FieldLabel htmlFor="notes">Observações</FieldLabel>
            <Textarea
              id="notes"
              maxLength={5000}
              className="min-h-32 bg-background"
              placeholder="Digite..."
              {...register("notes")}
            />
            {errors.notes && <FieldError errors={[errors.notes]} />}
          </Field>
        </CardContent>
      </Card>
      <Card className="gap-3 rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
        <CardHeader>
          <CardTitle>3. Escopo Espacial</CardTitle>
          <CardDescription>
            Delimitação geográfica e setorização do projeto
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <TextField
            config={{
              name: "basin",
              label: "Bacia",
              placeholder: "Ex.: Bacia do Rio Paraná",
            }}
            register={register}
            errors={errors}
          />
          <TextField
            config={{
              name: "sector",
              label: "Setor",
              placeholder: "Ex.: Setor Central",
            }}
            register={register}
            errors={errors}
          />
          <Field>
            <FieldLabel htmlFor="totalAreaKm2">Área Total (km²)</FieldLabel>
            <Input
              id="totalAreaKm2"
              type="number"
              min="0"
              step="any"
              placeholder="Ex.: 2,5"
              {...register("totalAreaKm2", {
                setValueAs: (value) =>
                  value === "" || value == null ? null : Number(value),
              })}
            />
            {errors.totalAreaKm2 && (
              <FieldError errors={[errors.totalAreaKm2]} />
            )}
          </Field>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Status:{" "}
        {
          projectStatuses.find((item) => item.value === generalData?.status)
            ?.label
        }
        . Definido automaticamente pela validação do projeto.
      </p>
      <div className="flex flex-col items-stretch gap-4 pt-2 sm:flex-row sm:items-center">
        {isDirty ? (
          <Button
            type="submit"
            size="lg"
            disabled={saveMutation.isPending}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg font-semibold"
          >
            <Save className="size-4" />
            {saveMutation.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        ) : (
          <div className="flex h-12 flex-1 select-none items-center justify-center gap-2 rounded-lg border border-[#818cf8]/35 bg-[#818cf8]/15 px-4 text-sm font-semibold text-[#4f46e5] dark:text-[#a5b4fc]">
            <Lock className="size-4 shrink-0 text-[#6366f1]" />
            Nenhuma alteração foi feita ainda.
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => {
            requestNavigation(() => router.push("/home"));
          }}
          className="flex h-12 items-center justify-center gap-2 rounded-lg px-8 font-semibold"
        >
          <Undo2 className="size-4" />
          Voltar
        </Button>
      </div>
    </form>
  );
}

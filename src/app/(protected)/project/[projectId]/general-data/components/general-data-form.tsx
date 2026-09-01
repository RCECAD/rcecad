"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Save, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Controller,
  type FieldErrors,
  type FieldPath,
  type UseFormRegister,
  useForm,
} from "react-hook-form";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  GENERAL_DATA_DEFAULTS,
  type GeneralDataFormValues,
  generalDataSchema,
  systemTypes,
} from "@/schemas/general-data";

type GeneralDataFormProps = {
  projectId: string;
};

type TextFieldConfig = {
  name: FieldPath<GeneralDataFormValues>;
  label: string;
  placeholder: string;
};

const identificationFields = [
  {
    name: "projectName",
    label: "Nome do Projeto",
    placeholder: "Digite o nome do projeto",
  },
  {
    name: "internalCode",
    label: "Código Interno",
    placeholder: "Digite o código interno",
  },
  {
    name: "contractor",
    label: "Contratante",
    placeholder: "Digite o contratante",
  },
  {
    name: "city",
    label: "Município/Localidade",
    placeholder: "Digite o município/localidade",
  },
  {
    name: "revision",
    label: "Revisão",
    placeholder: "Digite a revisão",
  },
  {
    name: "technicalManager",
    label: "Responsável Técnico",
    placeholder: "Digite o responsável técnico",
  },
] satisfies Array<TextFieldConfig>;

const spatialScopeFields = [
  {
    name: "basin",
    label: "Bacia",
    placeholder: "Ex. Bacia do Rio Paraná",
  },
  {
    name: "sector",
    label: "Setor",
    placeholder: "Ex. Setor Central",
  },
  {
    name: "totalArea",
    label: "Área Total",
    placeholder: "Ex. 2.5km²",
  },
] satisfies Array<TextFieldConfig>;

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
      <FieldLabel htmlFor={config.name}>{config.label}</FieldLabel>
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

  const {
    data: generalData,
    isError,
    isLoading,
    refetch,
  } = useQuery<GeneralDataFormValues>({
    queryKey: ["projectGeneralData", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/general-data`);

      if (!response.ok) {
        throw new Error("Erro ao carregar dados gerais.");
      }

      return (await response.json()) as GeneralDataFormValues;
    },
    enabled: Boolean(projectId),
    retry: false,
  });

  const {
    control,
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
    mutationFn: async (values: GeneralDataFormValues) => {
      const response = await fetch(`/api/projects/${projectId}/general-data`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar dados gerais.");
      }

      return (await response.json()) as GeneralDataFormValues;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["projectGeneralData", projectId], data);
      reset(data);
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

  useEffect(() => {
    return () => {
      setHasUnsavedChanges(false);
    };
  }, [setHasUnsavedChanges]);

  function onSubmit(values: GeneralDataFormValues) {
    saveMutation.mutate(values);
  }

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
      onSubmit={handleSubmit(onSubmit)}
      aria-busy={saveMutation.isPending}
      className="mx-auto max-w-5xl space-y-6"
    >
      <p aria-live="polite" className="sr-only">
        {saveMutation.isPending
          ? "Salvando alterações."
          : isDirty
            ? "Existem alterações não salvas."
            : "Nenhuma alteração pendente."}
      </p>

      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Dados Gerais
      </h1>

      <Card className="rounded-lg border border-border/80 bg-card/40 shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">
            1. Identificação
          </CardTitle>
          <CardDescription>
            Informações básicas de identificação do projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {identificationFields.map((field) => (
              <TextField
                key={field.name}
                config={field}
                errors={errors}
                register={register}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-border/80 bg-card/40 shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">
            2. Contexto Técnico
          </CardTitle>
          <CardDescription>
            Características técnicas e escopo do projeto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Controller
              name="systemType"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Tipo de Sistema</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id={field.name}
                      className="w-full bg-background"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Selecione o Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {systemTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <TextField
              config={{
                name: "horizonStage",
                label: "Etapa/Horizonte",
                placeholder: "Ex. 2024-2034, Fase 1",
              }}
              errors={errors}
              register={register}
            />
          </div>

          <Field data-invalid={Boolean(errors.notes)}>
            <FieldLabel htmlFor="notes">Observações</FieldLabel>
            <Textarea
              id="notes"
              placeholder="Digite..."
              aria-invalid={Boolean(errors.notes)}
              aria-describedby={errors.notes ? getErrorId("notes") : undefined}
              className="min-h-32 bg-background"
              {...register("notes")}
            />
            {errors.notes && (
              <FieldError id={getErrorId("notes")} errors={[errors.notes]} />
            )}
          </Field>
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-border/80 bg-card/40 shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">
            3. Escopo Espacial
          </CardTitle>
          <CardDescription>
            Delimitação geográfica e setorização do projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 md:grid-cols-3">
            {spatialScopeFields.map((field) => (
              <TextField
                key={field.name}
                config={field}
                errors={errors}
                register={register}
              />
            ))}
          </div>
        </CardContent>
      </Card>

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

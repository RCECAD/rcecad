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
    name: "contractor",
    label: "Contratante",
    placeholder: "Digite o contratante",
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
            Identificação do projeto
          </CardTitle>
          <CardDescription>
            Campos disponíveis no cadastro oficial do projeto.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          {textFields.map((field) => (
            <TextField
              key={field.name}
              config={field}
              errors={errors}
              register={register}
            />
          ))}
          <Field data-invalid={Boolean(errors.status)}>
            <FieldLabel htmlFor="status">Status</FieldLabel>
            <select
              id="status"
              className="flex h-9 w-full rounded-md border border-input bg-background px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-invalid={Boolean(errors.status)}
              aria-describedby={
                errors.status ? getErrorId("status") : undefined
              }
              {...register("status")}
            >
              {projectStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <FieldError id={getErrorId("status")} errors={[errors.status]} />
            )}
          </Field>
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

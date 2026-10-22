"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Lock, Save, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { type FieldPath, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  invalidateProjectDependents,
  projectQueryKeys,
} from "@/api/client/query-keys";
import { parseClientJson } from "@/api/client/response";
import type { NetworkDesign } from "@/api/contracts/design";
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { PageLoading } from "@/components/ui/page-state";
import { Textarea } from "@/components/ui/textarea";
import {
  type HydraulicsFormValues,
  hydraulicsSchema,
} from "@/schemas/hydraulics";

type HydraulicsFormProps = {
  projectId: string;
};

type ParameterField = {
  name: FieldPath<HydraulicsFormValues>;
  label: string;
  unit: string;
  min: number;
  step: number;
};

const parameterFields = [
  {
    name: "initialPopulation",
    label: "População inicial",
    unit: "hab.",
    min: 0,
    step: 1,
  },
  {
    name: "finalPopulation",
    label: "População final",
    unit: "hab.",
    min: 0,
    step: 1,
  },
  {
    name: "returnCoefficient",
    label: "Coeficiente de retorno",
    unit: "adimensional",
    min: Number.MIN_VALUE,
    step: 0.01,
  },
  {
    name: "perCapitaFlow",
    label: "Vazão per capita",
    unit: "L/hab.dia",
    min: Number.MIN_VALUE,
    step: 0.1,
  },
  {
    name: "infiltrationRate",
    label: "Taxa de infiltração",
    unit: "L/s por km",
    min: 0,
    step: 0.01,
  },
  {
    name: "peakDailyFactor",
    label: "Fator de pico diário (K1)",
    unit: "adimensional",
    min: Number.MIN_VALUE,
    step: 0.01,
  },
  {
    name: "peakHourlyFactor",
    label: "Fator de pico horário (K2)",
    unit: "adimensional",
    min: Number.MIN_VALUE,
    step: 0.01,
  },
  {
    name: "manningCoefficient",
    label: "Coeficiente de Manning (registro)",
    unit: "adimensional",
    min: Number.MIN_VALUE,
    step: 0.001,
  },
] satisfies Array<ParameterField>;

function getErrorId(name: string) {
  return `${name}-error`;
}

export function HydraulicsForm({ projectId }: Readonly<HydraulicsFormProps>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { requestNavigation, setHasUnsavedChanges } = useUnsavedChanges();
  const queryKey = projectQueryKeys.parameters(projectId);
  const calculated = queryClient.getQueryData<NetworkDesign>(
    projectQueryKeys.calculations(projectId),
  );

  const {
    data: hydraulicData,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/hydraulics`),
        hydraulicsSchema.nullable(),
        "Erro ao carregar parâmetros hidráulicos.",
      ),
    enabled: Boolean(projectId),
    retry: false,
  });

  const {
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
  } = useForm<HydraulicsFormValues>({
    resolver: zodResolver(hydraulicsSchema),
  });

  useEffect(() => {
    if (hydraulicData !== undefined) {
      reset(
        hydraulicData ?? {
          infiltrationRate: null,
          manningCoefficient: null,
          defaultNetworkMaterial: null,
        },
      );
    }
  }, [hydraulicData, reset]);

  const saveMutation = useMutation({
    mutationFn: async (values: HydraulicsFormValues) =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/hydraulics`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }),
        hydraulicsSchema,
        "Erro ao salvar parâmetros hidráulicos.",
      ),
    onSuccess: async (data) => {
      queryClient.setQueryData(queryKey, data);
      reset(data);
      await invalidateProjectDependents(queryClient, projectId);
      toast.success("Parâmetros salvos com sucesso!", {
        description:
          "Os cálculos do projeto serão atualizados no próximo dimensionamento.",
        duration: 4000,
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error("Ocorreu um erro ao salvar os parâmetros.");
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
    return <PageLoading label="Carregando parâmetros hidráulicos" />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Não foi possível carregar a hidráulica"
        description="Não altere os parâmetros até conseguirmos carregar os dados do projeto."
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
      className="mx-auto max-w-[1088px] space-y-6"
    >
      <p aria-live="polite" className="sr-only">
        {saveMutation.isPending
          ? "Salvando alterações."
          : isDirty
            ? "Existem alterações não salvas."
            : "Nenhuma alteração pendente."}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Hidráulica
      </h1>
      {hydraulicData === null && (
        <p className="text-sm text-muted-foreground">
          Este projeto ainda não possui parâmetros hidráulicos. Preencha os
          campos para começar.
        </p>
      )}

      <Card className="rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">
            Parâmetros globais do sistema
          </CardTitle>
          <CardDescription>
            Parâmetros da rede usados no dimensionamento. O coeficiente de
            Manning é mantido apenas como registro; o cálculo define a
            rugosidade pelo material.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-x-3 gap-y-5 md:grid-cols-3">
          <Field
            data-invalid={Boolean(errors.defaultNetworkMaterial)}
            className="md:col-span-3"
          >
            <FieldLabel htmlFor="defaultNetworkMaterial">
              Material da rede
            </FieldLabel>
            <Input
              id="defaultNetworkMaterial"
              maxLength={100}
              placeholder="Ex.: PVC JEI"
              aria-invalid={Boolean(errors.defaultNetworkMaterial)}
              aria-describedby="defaultNetworkMaterial-description defaultNetworkMaterial-error"
              {...register("defaultNetworkMaterial", {
                setValueAs: (value: string | null) => value?.trim() || null,
              })}
            />
            <FieldDescription id="defaultNetworkMaterial-description">
              Pode ficar em branco durante o cadastro, mas é necessário para
              dimensionar a rede.
            </FieldDescription>
            {errors.defaultNetworkMaterial && (
              <FieldError
                id="defaultNetworkMaterial-error"
                errors={[errors.defaultNetworkMaterial]}
                role="alert"
              />
            )}
          </Field>
          {parameterFields.map((field) => {
            const error = errors[field.name];
            const errorId = getErrorId(field.name);

            return (
              <Field key={field.name} data-invalid={Boolean(error)}>
                <FieldLabel htmlFor={field.name}>
                  {field.label}
                  {field.name === "infiltrationRate" ||
                  field.name === "manningCoefficient"
                    ? " (opcional)"
                    : ""}
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id={field.name}
                    type="number"
                    min={field.min}
                    step={field.step}
                    inputMode="decimal"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    aria-errormessage={error ? errorId : undefined}
                    {...register(field.name, {
                      setValueAs: (value: string | null) =>
                        value === "" || value === null ? null : Number(value),
                    })}
                  />
                  <InputGroupAddon align="inline-end">
                    {field.unit}
                  </InputGroupAddon>
                </InputGroup>
                {field.name === "infiltrationRate" && (
                  <FieldDescription>
                    Em branco, será definida conforme a norma do material,
                    quando houver valor aplicável.
                  </FieldDescription>
                )}
                {error && (
                  <FieldError id={errorId} errors={[error]} role="alert" />
                )}
              </Field>
            );
          })}
          <Field className="md:col-span-3">
            <FieldLabel htmlFor="justification">
              Justificativa Técnica (opcional)
            </FieldLabel>
            <Textarea
              id="justification"
              className="min-h-32 bg-background"
              maxLength={5000}
              placeholder="Explique os critérios utilizados para definição dos parâmetros..."
              {...register("justification", {
                setValueAs: (value: string) => value?.trim() || null,
              })}
            />
            {errors.justification && (
              <FieldError errors={[errors.justification]} />
            )}
          </Field>
        </CardContent>
      </Card>

      <div className="flex gap-3.5 rounded-lg border border-blue-200/50 bg-blue-50/20 p-4 text-sm dark:border-blue-900/20 dark:bg-blue-950/10">
        <FileText className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <p className="leading-relaxed text-blue-800/85 dark:text-blue-300/80">
          Após salvar, execute novamente o dimensionamento para atualizar os
          resultados do projeto.
        </p>
      </div>

      <Card className="rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
        <CardHeader>
          <CardTitle>Regras Ativas e Perfil Normativo</CardTitle>
          <CardDescription>
            Normas e regras utilizadas no dimensionamento
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">
              Versão da regra de cálculo
            </p>
            <p className="mt-1">
              {calculated?.rulesetVersionId ?? "Disponível após calcular"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Material adotado</p>
            <p className="mt-1">
              {hydraulicData?.defaultNetworkMaterial ?? "Não informado"}
            </p>
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Consulte as fontes normativas e as justificativas na Memória de
            Cálculo.
          </p>
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
            requestNavigation(() => router.push(`/project/${projectId}`));
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

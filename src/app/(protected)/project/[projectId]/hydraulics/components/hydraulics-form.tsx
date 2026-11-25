"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Lock, Save, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, type FieldPath, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  invalidateProjectDependents,
  projectQueryKeys,
} from "@/api/client/query-keys";
import { getErrorMessage, parseClientJson } from "@/api/client/response";
import { projectParametersDetailsSchema } from "@/api/contracts/spring";
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
import { Feedback, RequestError } from "@/components/ui/feedback";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { FieldHint } from "@/components/ui/field-hint";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { FormPageSkeleton } from "@/components/ui/loading-skeletons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCorrectionFocus } from "@/lib/correction-focus";
import { portugueseValidation } from "@/lib/form-validation";
import { networkMaterialOptions } from "@/lib/network-materials";
import {
  convertInfiltrationRate,
  type HydraulicsFormValues,
  hydraulicsFormSchema,
  hydraulicsSchema,
  type InfiltrationUnit,
  returnCoefficientToPercent,
  toHydraulicsFormValues,
  toParametersRequest,
} from "@/schemas/hydraulics";

const INFILTRATION_UNIT_KEY = "rcecad:infiltration-unit";

function readInfiltrationUnit(): InfiltrationUnit {
  try {
    return window.localStorage.getItem(INFILTRATION_UNIT_KEY) === "m"
      ? "m"
      : "km";
  } catch {
    return "km";
  }
}

function writeInfiltrationUnit(unit: InfiltrationUnit) {
  try {
    window.localStorage.setItem(INFILTRATION_UNIT_KEY, unit);
  } catch {
    // Unit preference is a convenience; blocked storage keeps the km default.
  }
}

type HydraulicsFormProps = {
  projectId: string;
};

const parameterGroups = [
  { id: "demand", label: "População e consumo" },
  { id: "peak", label: "Coeficientes de pico" },
  { id: "network", label: "Rede" },
] as const;

type ParameterField = {
  name: FieldPath<HydraulicsFormValues>;
  group: (typeof parameterGroups)[number]["id"];
  label: string;
  unit: string;
  min: number;
  step: number;
};

const parameterFields = [
  {
    name: "initialPopulation",
    group: "demand",
    label: "População inicial",
    unit: "hab.",
    min: 0,
    step: 1,
  },
  {
    name: "finalPopulation",
    group: "demand",
    label: "População final",
    unit: "hab.",
    min: 0,
    step: 1,
  },
  {
    name: "returnCoefficient",
    group: "demand",
    label: "Coeficiente de retorno",
    unit: "%",
    min: Number.MIN_VALUE,
    step: 0.1,
  },
  {
    name: "perCapitaFlow",
    group: "demand",
    label: "Vazão per capita",
    unit: "L/hab.dia",
    min: Number.MIN_VALUE,
    step: 0.1,
  },
  {
    name: "infiltrationRate",
    group: "network",
    label: "Taxa de infiltração",
    unit: "L/s por km",
    min: 0,
    step: 0.01,
  },
  {
    name: "peakDailyFactor",
    group: "peak",
    label: "K1 (Fator de pico diário)",
    unit: "adimensional",
    min: Number.MIN_VALUE,
    step: 0.01,
  },
  {
    name: "peakHourlyFactor",
    group: "peak",
    label: "K2 (Fator de pico horário)",
    unit: "adimensional",
    min: Number.MIN_VALUE,
    step: 0.01,
  },
  {
    name: "manningCoefficient",
    group: "network",
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

  const {
    data: hydraulicData,
    isError,
    error: loadError,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/hydraulics`),
        projectParametersDetailsSchema,
        "Erro ao carregar parâmetros hidráulicos.",
      ),
    enabled: Boolean(projectId),
    retry: false,
  });

  const {
    control,
    formState: { errors, isDirty, defaultValues },
    getFieldState,
    getValues,
    handleSubmit,
    register,
    reset,
    resetField,
    setValue,
  } = useForm<HydraulicsFormValues>({
    resolver: zodResolver(hydraulicsFormSchema, portugueseValidation),
  });
  const [switchFrom, switchTo, switchAbove] = useWatch({
    control,
    name: ["switchFromMaterial", "switchToMaterial", "switchAboveDiameterMm"],
  });
  const switchSummary =
    switchFrom && switchTo && switchAbove
      ? `${switchFrom} → ${switchTo} acima de ${switchAbove} mm`
      : "Não configurada";
  const [isSwitchOpen, setSwitchOpen] = useState(false);
  const switchError = errors.switchAboveDiameterMm;
  useEffect(() => {
    if (switchError) setSwitchOpen(true);
  }, [switchError]);
  const [infiltrationUnit, setInfiltrationUnit] =
    useState<InfiltrationUnit>("km");
  // Read by the reset effect so a refetch after saving keeps the chosen unit without re-running it.
  const infiltrationUnitRef = useRef<InfiltrationUnit | null>(null);

  useEffect(() => {
    if (hydraulicData) {
      infiltrationUnitRef.current ??= readInfiltrationUnit();
      const unit = infiltrationUnitRef.current;
      const values = toHydraulicsFormValues(hydraulicData);
      reset({
        ...values,
        infiltrationRate: convertInfiltrationRate(
          values.infiltrationRate,
          "km",
          unit,
        ),
      } as HydraulicsFormValues);
      setInfiltrationUnit(unit);
    }
  }, [hydraulicData, reset]);

  function changeInfiltrationUnit(next: InfiltrationUnit) {
    const previous = infiltrationUnit;
    if (next === previous) return;
    const wasDirty = getFieldState("infiltrationRate").isDirty;
    const current = getValues("infiltrationRate") ?? null;
    resetField("infiltrationRate", {
      defaultValue: convertInfiltrationRate(
        defaultValues?.infiltrationRate ?? null,
        previous,
        next,
      ),
    });
    if (wasDirty) {
      setValue(
        "infiltrationRate",
        convertInfiltrationRate(current, previous, next),
        { shouldDirty: true },
      );
    }
    infiltrationUnitRef.current = next;
    setInfiltrationUnit(next);
    writeInfiltrationUnit(next);
  }
  useCorrectionFocus(Boolean(hydraulicData));

  const saveMutation = useMutation({
    mutationFn: async (values: HydraulicsFormValues) => {
      await parseClientJson(
        await fetch(`/api/projects/${projectId}/hydraulics`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toParametersRequest(values, infiltrationUnit)),
        }),
        hydraulicsSchema,
        "Erro ao salvar parâmetros hidráulicos.",
      );
      return values;
    },
    onSuccess: async (values) => {
      reset(values);
      await queryClient.invalidateQueries({ queryKey });
      await invalidateProjectDependents(queryClient, projectId);
      toast.success("Parâmetros salvos com sucesso!", {
        description:
          "Execute novamente o dimensionamento para atualizar os resultados do projeto.",
        duration: 4000,
      });
    },
    onError: (error) => {
      console.error(error);
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
    return <FormPageSkeleton sections={2} />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Não foi possível carregar a hidráulica"
        description={getErrorMessage(
          loadError,
          "Não altere os parâmetros até conseguirmos carregar os dados do projeto.",
        )}
        retrying={isFetching}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
      aria-busy={saveMutation.isPending}
      className="flex w-full min-w-0 flex-col gap-6"
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
      {hydraulicData && !hydraulicData.configured && (
        <p className="text-sm text-muted-foreground">
          Este projeto ainda não possui parâmetros hidráulicos. Preencha os
          campos para começar; os valores publicados pela norma aparecem como
          referência abaixo de cada campo.
        </p>
      )}

      <Card className="rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Parâmetros globais do sistema
          </CardTitle>
          <CardDescription>
            Parâmetros da rede usados no dimensionamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-x-3 gap-y-5 md:grid-cols-3">
          <Field
            data-invalid={Boolean(errors.defaultNetworkMaterial)}
            className="md:col-span-3"
          >
            <div className="flex items-center gap-1">
              <FieldLabel htmlFor="defaultNetworkMaterial">
                Material padrão da rede
              </FieldLabel>
              <FieldHint
                id="defaultNetworkMaterial-description"
                label="Material padrão da rede"
              >
                <p>
                  Vale para todos os trechos sem material próprio e pode ser
                  alterado em cada trecho. Pode ficar em branco durante o
                  cadastro, mas é necessário para dimensionar a rede.
                </p>
              </FieldHint>
            </div>
            <Controller
              control={control}
              name="defaultNetworkMaterial"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="defaultNetworkMaterial"
                    ref={field.ref}
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(errors.defaultNetworkMaterial)}
                    aria-describedby="defaultNetworkMaterial-description defaultNetworkMaterial-error"
                    className="w-full bg-background"
                  >
                    <SelectValue placeholder="Selecione o material" />
                  </SelectTrigger>
                  <SelectContent>
                    {networkMaterialOptions(field.value).map((material) => (
                      <SelectItem key={material} value={material}>
                        {material}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.defaultNetworkMaterial && (
              <FieldError
                id="defaultNetworkMaterial-error"
                errors={[errors.defaultNetworkMaterial]}
                role="alert"
              />
            )}
          </Field>
          <details
            open={isSwitchOpen}
            onToggle={(event) => setSwitchOpen(event.currentTarget.open)}
            className="group rounded-lg border border-border/80 md:col-span-3"
          >
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <ChevronRight
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90 motion-reduce:transition-none"
              />
              <span className="font-medium">
                Troca de material por diâmetro (opcional)
              </span>
              <span className="ml-auto truncate text-muted-foreground">
                {switchSummary}
              </span>
            </summary>
            <fieldset className="grid gap-3 border-t border-border/80 p-3 md:grid-cols-3">
              <legend className="sr-only">
                Troca de material por diâmetro
              </legend>
              {(
                [
                  ["switchFromMaterial", "Material de origem da troca", "De"],
                  ["switchToMaterial", "Material de destino da troca", "Para"],
                ] as const
              ).map(([name, label, placeholder]) => (
                <Controller
                  key={name}
                  control={control}
                  name={name}
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) =>
                        field.onChange(value === "unset" ? null : value)
                      }
                    >
                      <SelectTrigger
                        ref={field.ref}
                        onBlur={field.onBlur}
                        aria-label={label}
                        className="w-full bg-background"
                      >
                        <SelectValue
                          placeholder={`${placeholder} (material)`}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unset">Não informado</SelectItem>
                        {networkMaterialOptions(field.value).map((material) => (
                          <SelectItem key={material} value={material}>
                            {material}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ))}
              <InputGroup>
                <InputGroupInput
                  aria-label="Trocar acima do diâmetro"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Acima de"
                  aria-invalid={Boolean(errors.switchAboveDiameterMm)}
                  {...register("switchAboveDiameterMm", {
                    setValueAs: (value: string | null) =>
                      value === "" || value === null ? null : Number(value),
                  })}
                />
                <InputGroupAddon align="inline-end">mm</InputGroupAddon>
              </InputGroup>
              <FieldDescription className="md:col-span-3">
                Aplica-se apenas aos trechos sem material próprio. Não há limite
                padrão: em branco, nenhuma troca é feita.
              </FieldDescription>
              {errors.switchAboveDiameterMm && (
                <FieldError
                  className="md:col-span-3"
                  errors={[errors.switchAboveDiameterMm]}
                  role="alert"
                />
              )}
            </fieldset>
          </details>
          {parameterGroups.map((group) => (
            <fieldset
              key={group.id}
              className="grid gap-x-3 gap-y-5 border-t border-border/80 pt-5 md:col-span-3 md:grid-cols-3"
            >
              <legend className="mb-3 text-sm font-semibold">
                {group.label}
              </legend>
              {parameterFields
                .filter((field) => field.group === group.id)
                .map((field) => {
                  const error = errors[field.name];
                  const errorId = getErrorId(field.name);
                  const baseline = hydraulicData?.defaults[field.name];
                  const descriptionId = `${field.name}-description`;
                  const standards =
                    hydraulicData?.normativeProfile.standards ?? [];
                  const hintLines = [
                    field.name === "initialPopulation" &&
                      "População atendida no início do plano, conforme o levantamento do projeto; sem valor normativo fixo.",
                    field.name === "finalPopulation" &&
                      "População prevista para o horizonte do projeto, conforme o estudo populacional; sem valor normativo fixo.",
                    field.name === "perCapitaFlow" &&
                      "Consumo de água por habitante, definido com dados locais ou diretrizes da prestadora; sem valor normativo fixo no perfil atual.",
                    field.name === "infiltrationRate" &&
                      standards.includes("NBR 9649:1986") &&
                      `Referência normativa: ${
                        infiltrationUnit === "km"
                          ? "0,05 a 1,0 L/s por km"
                          : "0,00005 a 0,001 L/s por m"
                      } (NBR 9649:1986)`,
                    field.name === "infiltrationRate" &&
                      standards.includes("NBR 7367:1988") &&
                      `Referência normativa: 0 L/s por ${infiltrationUnit} em rede 100% PVC com junta elástica (NBR 7367:1988)`,
                    field.name === "infiltrationRate" &&
                      "Em branco: conforme o material. Redes mistas exigem taxa informada.",
                    field.name === "manningCoefficient" &&
                      standards.includes("NBR 9649:1986") &&
                      "Referência normativa: 0,013 (NBR 9649:1986)",
                    field.name === "manningCoefficient" &&
                      standards.includes("NBR 7367:1988") &&
                      "Referência normativa: 0,010 para PVC com h/D de 0,20 a 0,75 (NBR 7367:1988); fora da faixa: 0,013.",
                    field.name === "manningCoefficient" &&
                      "Apenas registro; coeficiente calculado por trecho.",
                    baseline?.value != null &&
                      `Referência normativa: ${
                        field.name === "returnCoefficient"
                          ? `${returnCoefficientToPercent(baseline.value).toLocaleString("pt-BR")}%`
                          : baseline.value.toLocaleString("pt-BR")
                      }${baseline.source ? ` (${baseline.source})` : ""}`,
                  ].filter((line): line is string => Boolean(line));
                  const reference = hintLines
                    .find((line) => line.startsWith("Referência normativa:"))
                    ?.replace("Referência normativa:", "Ref.:");

                  return (
                    <Field key={field.name} data-invalid={Boolean(error)}>
                      <div className="flex items-center gap-1">
                        <FieldLabel htmlFor={field.name}>
                          {field.label}
                          {field.name === "infiltrationRate" ||
                          field.name === "manningCoefficient"
                            ? " (opcional)"
                            : ""}
                        </FieldLabel>
                        {hintLines.length > 0 && (
                          <FieldHint id={descriptionId} label={field.label}>
                            {hintLines.map((line) => (
                              <p key={line}>{line}</p>
                            ))}
                          </FieldHint>
                        )}
                      </div>
                      <InputGroup>
                        <InputGroupInput
                          id={field.name}
                          type="number"
                          min={field.min}
                          step={
                            field.name === "infiltrationRate" &&
                            infiltrationUnit === "m"
                              ? "any"
                              : field.step
                          }
                          inputMode="decimal"
                          aria-invalid={Boolean(error)}
                          aria-describedby={[
                            hintLines.length > 0 ? descriptionId : undefined,
                            error ? errorId : undefined,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          aria-errormessage={error ? errorId : undefined}
                          {...register(field.name, {
                            setValueAs: (value: string | null) =>
                              value === "" || value === null
                                ? null
                                : Number(value),
                          })}
                        />
                        <InputGroupAddon align="inline-end">
                          {field.name === "infiltrationRate" ? (
                            <select
                              aria-label="Unidade da taxa de infiltração"
                              value={infiltrationUnit}
                              // The addon focuses the input on click, which would close the native list.
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) =>
                                changeInfiltrationUnit(
                                  event.target.value as InfiltrationUnit,
                                )
                              }
                              className="cursor-pointer rounded-sm bg-transparent text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <option value="km">L/s por km</option>
                              <option value="m">L/s por m</option>
                            </select>
                          ) : (
                            field.unit
                          )}
                        </InputGroupAddon>
                      </InputGroup>
                      {reference && (
                        <p
                          aria-hidden="true"
                          className="text-xs text-muted-foreground"
                        >
                          {reference}
                        </p>
                      )}
                      {error && (
                        <FieldError
                          id={errorId}
                          errors={[error]}
                          role="alert"
                        />
                      )}
                    </Field>
                  );
                })}
            </fieldset>
          ))}
          <Field className="md:col-span-3">
            <FieldLabel htmlFor="justification">
              Justificativa técnica (opcional)
            </FieldLabel>
            <Textarea
              id="justification"
              className="max-h-80 bg-background"
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

      <Card className="rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
        <CardHeader>
          <CardTitle>Regras ativas e perfil normativo</CardTitle>
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
              {hydraulicData?.normativeProfile.rulesetVersion ?? "—"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Perfil normativo</p>
            <p className="mt-1">{hydraulicData?.normativeProfile.name}</p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {hydraulicData?.normativeProfile.standards.map((standard) => (
                <li
                  key={standard}
                  className="rounded-full border px-2 py-0.5 text-xs"
                >
                  {standard}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Material adotado</p>
            <p className="mt-1">
              {hydraulicData?.defaultNetworkMaterial ?? "Não informado"}
            </p>
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Consulte as fontes normativas e as justificativas na Memória de
            cálculo.
          </p>
        </CardContent>
      </Card>

      {saveMutation.isError && (
        <RequestError
          reveal
          title="Não foi possível salvar os parâmetros hidráulicos"
          error={saveMutation.error}
          onRetry={() =>
            void handleSubmit((values) => saveMutation.mutate(values))()
          }
          retrying={saveMutation.isPending}
        />
      )}
      {saveMutation.isSuccess && !isDirty && (
        <Feedback
          reveal
          tone="success"
          title="Parâmetros hidráulicos salvos"
          description="As alterações foram salvas. Continue para a próxima etapa do projeto."
          actions={[
            {
              label: "Ir para dimensionamento",
              href: `/project/${projectId}/sizing`,
            },
          ]}
        />
      )}
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
            Nenhuma alteração pendente.
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

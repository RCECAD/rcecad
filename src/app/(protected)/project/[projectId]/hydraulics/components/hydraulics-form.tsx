"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Lock,
  Save,
  Undo2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type HydraulicsFormValues,
  hydraulicsSchema,
} from "@/schemas/hydraulics";
import { SYSTEM_DEFAULTS } from "@/utils/constants";

interface HydraulicsFormProps {
  projectId: string;
}

export function HydraulicsForm({ projectId }: Readonly<HydraulicsFormProps>) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // TanStack Query to fetch form data
  const { data: hydraulicData, isLoading } = useQuery<HydraulicsFormValues>({
    queryKey: ["projectHydraulics", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/hydraulics`);

      if (!response.ok) {
        throw new Error("Erro ao carregar parametros hidraulicos.");
      }

      return (await response.json()) as HydraulicsFormValues;
    },
    enabled: !!projectId,
  });

  // React Hook Form initialization
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<HydraulicsFormValues>({
    resolver: zodResolver(hydraulicsSchema),
    defaultValues: SYSTEM_DEFAULTS,
  });

  // Reset form values when query data is loaded/updated
  useEffect(() => {
    if (hydraulicData) {
      reset(hydraulicData);
    }
  }, [hydraulicData, reset]);

  // TanStack Query Mutation to save form data
  const saveMutation = useMutation({
    mutationFn: async (values: HydraulicsFormValues) => {
      const response = await fetch(`/api/projects/${projectId}/hydraulics`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar parametros hidraulicos.");
      }

      return (await response.json()) as HydraulicsFormValues;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["projectHydraulics", projectId], data);
      reset(data); // reset dirty state to newly saved values
      toast.success("Parâmetros salvos com sucesso!", {
        description:
          "Os cálculos do projeto serão atualizados no próximo dimensionamento.",
        duration: 4000,
      });
    },
    onError: (err) => {
      console.error(err);
      toast.error("Ocorreu um erro ao salvar os parâmetros.");
    },
  });

  // Watch current form state to calculate default changes status
  const currentValues = watch();

  // Determine if parameters differ from system defaults
  const isModifiedFromDefaults = useMemo(() => {
    if (!currentValues.returnCoefficient) return false;
    return (
      currentValues.returnCoefficient !== SYSTEM_DEFAULTS.returnCoefficient ||
      currentValues.consumptionPerCapita !==
        SYSTEM_DEFAULTS.consumptionPerCapita ||
      currentValues.infiltrationRate !== SYSTEM_DEFAULTS.infiltrationRate ||
      currentValues.minFlowCoefficient !== SYSTEM_DEFAULTS.minFlowCoefficient ||
      currentValues.maxFlowCoefficient !== SYSTEM_DEFAULTS.maxFlowCoefficient
    );
  }, [
    currentValues.returnCoefficient,
    currentValues.consumptionPerCapita,
    currentValues.infiltrationRate,
    currentValues.minFlowCoefficient,
    currentValues.maxFlowCoefficient,
  ]);

  const onSubmit = (values: HydraulicsFormValues) => {
    saveMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Hidráulica
          </h1>
        </div>
      </div>

      {/* Parâmetros Globais do Sistema Card */}
      <Card className="border border-border/80 shadow-xs bg-card/40 backdrop-blur-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-foreground">
            Parâmetros Globais do Sistema
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground/80">
            Estes parâmetros afetarão todos os trechos do projeto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Coeficiente de retorno */}
            <div className="space-y-2">
              <Label
                htmlFor="return-coef"
                className="text-xs font-semibold text-muted-foreground/90 uppercase tracking-wider"
              >
                Coeficiente de retorno
              </Label>
              <InputGroup>
                <InputGroupInput
                  id="return-coef"
                  type="text"
                  aria-invalid={!!errors.returnCoefficient}
                  {...register("returnCoefficient")}
                />
                <InputGroupAddon
                  align="inline-end"
                  className="text-xs text-muted-foreground/50"
                >
                  adimensional
                </InputGroupAddon>
              </InputGroup>
              {errors.returnCoefficient && (
                <p className="text-xs text-destructive font-medium mt-1">
                  {errors.returnCoefficient.message}
                </p>
              )}
              <span className="text-xs text-muted-foreground/50 block">
                Valor padrão do sistema: 0.80
              </span>
            </div>

            {/* Consumo per capita */}
            <div className="space-y-2">
              <Label
                htmlFor="consumption"
                className="text-xs font-semibold text-muted-foreground/90 uppercase tracking-wider"
              >
                Consumo per capita
              </Label>
              <InputGroup>
                <InputGroupInput
                  id="consumption"
                  type="text"
                  aria-invalid={!!errors.consumptionPerCapita}
                  {...register("consumptionPerCapita")}
                />
                <InputGroupAddon
                  align="inline-end"
                  className="text-xs text-muted-foreground/50"
                >
                  L/hab.dia
                </InputGroupAddon>
              </InputGroup>
              {errors.consumptionPerCapita && (
                <p className="text-xs text-destructive font-medium mt-1">
                  {errors.consumptionPerCapita.message}
                </p>
              )}
              <span className="text-xs text-muted-foreground/50 block">
                Valor padrão do sistema: 150 L/hab.dia
              </span>
            </div>

            {/* Taxa de infiltração */}
            <div className="space-y-2">
              <Label
                htmlFor="infiltration"
                className="text-xs font-semibold text-muted-foreground/90 uppercase tracking-wider"
              >
                Taxa de infiltração
              </Label>
              <InputGroup>
                <InputGroupInput
                  id="infiltration"
                  type="text"
                  aria-invalid={!!errors.infiltrationRate}
                  {...register("infiltrationRate")}
                />
                <InputGroupAddon
                  align="inline-end"
                  className="text-xs text-muted-foreground/50"
                >
                  adimensional
                </InputGroupAddon>
              </InputGroup>
              {errors.infiltrationRate && (
                <p className="text-xs text-destructive font-medium mt-1">
                  {errors.infiltrationRate.message}
                </p>
              )}
              <span className="text-xs text-muted-foreground/50 block">
                Valor padrão do sistema: 0.0005 L/s.m
              </span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Coeficiente de mínima vazão */}
            <div className="space-y-2">
              <Label
                htmlFor="min-flow"
                className="text-xs font-semibold text-muted-foreground/90 uppercase tracking-wider"
              >
                Coeficiente de mínima vazão
              </Label>
              <InputGroup>
                <InputGroupInput
                  id="min-flow"
                  type="text"
                  aria-invalid={!!errors.minFlowCoefficient}
                  {...register("minFlowCoefficient")}
                />
                <InputGroupAddon
                  align="inline-end"
                  className="text-xs text-muted-foreground/50"
                >
                  adimensional
                </InputGroupAddon>
              </InputGroup>
              {errors.minFlowCoefficient && (
                <p className="text-xs text-destructive font-medium mt-1">
                  {errors.minFlowCoefficient.message}
                </p>
              )}
              <span className="text-xs text-muted-foreground/50 block">
                Valor padrão do sistema: 0.50
              </span>
            </div>

            {/* Coeficiente de máxima vazão */}
            <div className="space-y-2">
              <Label
                htmlFor="max-flow"
                className="text-xs font-semibold text-muted-foreground/90 uppercase tracking-wider"
              >
                Coeficiente de máxima vazão
              </Label>
              <InputGroup>
                <InputGroupInput
                  id="max-flow"
                  type="text"
                  aria-invalid={!!errors.maxFlowCoefficient}
                  {...register("maxFlowCoefficient")}
                />
                <InputGroupAddon
                  align="inline-end"
                  className="text-xs text-muted-foreground/50"
                >
                  adimensional
                </InputGroupAddon>
              </InputGroup>
              {errors.maxFlowCoefficient && (
                <p className="text-xs text-destructive font-medium mt-1">
                  {errors.maxFlowCoefficient.message}
                </p>
              )}
              <span className="text-xs text-muted-foreground/50 block">
                Valor padrão do sistema: 1.20
              </span>
            </div>
          </div>

          {/* Justificativa Técnica */}
          <div className="space-y-2">
            <Label
              htmlFor="justification"
              className="text-xs font-semibold text-muted-foreground/90 uppercase tracking-wider"
            >
              Justificativa Técnica (opcional)
            </Label>
            <Textarea
              id="justification"
              placeholder="Explique os critérios utilizados para definição dos parâmetros..."
              className="min-h-24 bg-card/60 border-border/80 text-foreground resize-y"
              {...register("justification")}
            />
          </div>

          {/* Impact Warning Alert */}
          <div className="flex gap-3.5 rounded-lg border border-blue-200/50 bg-blue-50/20 p-4 text-sm dark:border-blue-900/20 dark:bg-blue-950/10">
            <FileText className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-blue-950 dark:text-blue-200 block text-sm">
                Impacto dos parâmetros
              </span>
              <p className="text-blue-800/85 dark:text-blue-300/80 leading-relaxed text-sm">
                Estes valores afetarão o cálculo de vazão de todos os trechos do
                projeto. Após salvar, será necessário recalcular o
                dimensionamento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regras Ativas e Perfil Normativo Card */}
      <Card className="border border-border/80 shadow-xs bg-card/40 backdrop-blur-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-foreground">
            Regras Ativas e Perfil Normativo
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground/80">
            Configure as normas e regras de cálculo aplicáveis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="calc-rule"
                className="text-xs font-semibold text-muted-foreground/90 uppercase tracking-wider"
              >
                Versão da regra de cálculo
              </Label>
              <Input
                id="calc-rule"
                type="text"
                className="bg-card text-foreground border-border/80"
                aria-invalid={!!errors.calculationRule}
                {...register("calculationRule")}
              />
              {errors.calculationRule && (
                <p className="text-xs text-destructive font-medium mt-1">
                  {errors.calculationRule.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="normative"
                className="text-xs font-semibold text-muted-foreground/90 uppercase tracking-wider"
              >
                Perfil normativo utilizado
              </Label>
              <Input
                id="normative"
                type="text"
                className="bg-card text-foreground border-border/80"
                aria-invalid={!!errors.regulatoryProfile}
                {...register("regulatoryProfile")}
              />
              {errors.regulatoryProfile && (
                <p className="text-xs text-destructive font-medium mt-1">
                  {errors.regulatoryProfile.message}
                </p>
              )}
            </div>
          </div>

          {/* Parameters Status Table */}
          <div className="rounded-lg border border-border bg-card/30 overflow-hidden text-sm">
            <div className="flex justify-between items-center p-3 border-b border-border hover:bg-muted/10 transition-colors">
              <span className="text-muted-foreground font-medium">
                Status dos parâmetros
              </span>
              <span className="font-semibold text-foreground">
                {isModifiedFromDefaults
                  ? "Valores personalizados"
                  : "Valores padrão"}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-muted/10 transition-colors">
              <span className="text-muted-foreground font-medium">
                Indicador de alterações manuais
              </span>
              <span
                className={`font-semibold flex items-center gap-1.5 ${
                  isModifiedFromDefaults
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground"
                }`}
              >
                {isModifiedFromDefaults ? (
                  <>
                    <AlertCircle className="size-4" />
                    Modificado
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Não modificado
                  </>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center pt-2">
        {isDirty ? (
          <Button
            type="submit"
            size="lg"
            disabled={saveMutation.isPending}
            className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold rounded-lg cursor-pointer transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
          >
            <Save className="size-4" />
            {saveMutation.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        ) : (
          <div className="flex-1 h-12 rounded-lg bg-[#818cf8]/15 border border-[#818cf8]/35 text-[#4f46e5] dark:text-[#a5b4fc] text-sm font-semibold flex items-center justify-center gap-2 px-4 select-none">
            <Lock className="size-4 text-[#6366f1] shrink-0" />
            Nenhuma alteração foi feita ainda.
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push("/home")}
          className="h-12 px-8 font-semibold rounded-lg border-border hover:bg-muted bg-card cursor-pointer flex items-center justify-center gap-2 transition-all"
        >
          <Undo2 className="size-4" />
          Voltar
        </Button>
      </div>
    </form>
  );
}

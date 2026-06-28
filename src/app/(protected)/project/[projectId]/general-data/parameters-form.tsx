"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveProjectParameters } from "@/domain/features/calculations/save-parameters";
import type { ApiProjectParameters } from "@/lib/projects/projects-api";

type Field = {
  key: keyof ApiProjectParameters;
  label: string;
  fallback: number;
};

const FIELDS: ReadonlyArray<Field> = [
  { key: "initialPopulation", label: "População inicial (hab)", fallback: 312 },
  { key: "finalPopulation", label: "População final (hab)", fallback: 468 },
  { key: "returnCoefficient", label: "Coef. de retorno C", fallback: 0.8 },
  {
    key: "perCapitaFlow",
    label: "Consumo per capita q (L/hab·dia)",
    fallback: 220,
  },
  {
    key: "infiltrationRate",
    label: "Taxa de infiltração (L/s·m)",
    fallback: 0.0001,
  },
  { key: "peakDailyFactor", label: "K1 (variação diária)", fallback: 1.25 },
  { key: "peakHourlyFactor", label: "K2 (variação horária)", fallback: 1.6 },
  { key: "manningCoefficient", label: "Manning n", fallback: 0.01 },
];

type ParametersFormProps = {
  projectId: string;
  initial: ApiProjectParameters | null;
};

export function ParametersForm({
  projectId,
  initial,
}: Readonly<ParametersFormProps>) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      FIELDS.map((field) => [
        field.key,
        String(initial?.[field.key] ?? field.fallback),
      ]),
    ),
  );
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const parameters = Object.fromEntries(
        FIELDS.map((field) => [field.key, Number(values[field.key])]),
      ) as unknown as ApiProjectParameters;
      await saveProjectParameters(projectId, parameters);
      toast.success("Parâmetros salvos.");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar os parâmetros.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              type="number"
              step="any"
              value={values[field.key]}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  [field.key]: event.target.value,
                }))
              }
            />
          </div>
        ))}
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Salvando..." : "Salvar parâmetros"}
      </Button>
    </form>
  );
}

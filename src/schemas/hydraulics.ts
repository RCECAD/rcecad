import { z } from "zod";
import {
  type ProjectParameters,
  type ProjectParametersDetails,
  projectParametersSchema,
} from "@/api/contracts/spring";

/** Parameters accepted by PUT /api/projects/{id}/parameters. */
export const hydraulicsSchema = projectParametersSchema;

const switchMaterial = z.string().trim().max(100).nullable();

/** The material switch is flattened so each input binds to one form field. */
export const hydraulicsFormSchema = projectParametersSchema
  .omit({ materialSwitch: true })
  .extend({
    switchFromMaterial: switchMaterial,
    switchToMaterial: switchMaterial,
    switchAboveDiameterMm: z.number().int().positive().nullable(),
  })
  .superRefine((values, context) => {
    const filled = [
      values.switchFromMaterial,
      values.switchToMaterial,
      values.switchAboveDiameterMm,
    ].filter((value) => value !== null && value !== "").length;
    if (filled !== 0 && filled !== 3)
      context.addIssue({
        code: "custom",
        path: ["switchAboveDiameterMm"],
        message:
          "Preencha os três campos da troca de material ou deixe todos em branco.",
      });
  });

export type HydraulicsFormValues = z.infer<typeof hydraulicsFormSchema>;
export type HydraulicsFormDefaults = {
  [Key in keyof HydraulicsFormValues]-?: HydraulicsFormValues[Key] | null;
};

// The API and the engine take the return coefficient as a fraction (0.8); the form shows it in percent (80).
export function returnCoefficientToPercent(fraction: number) {
  return Math.round(fraction * 100 * 1e6) / 1e6;
}

export function toParametersRequest({
  switchFromMaterial,
  switchToMaterial,
  switchAboveDiameterMm,
  ...values
}: HydraulicsFormValues): ProjectParameters {
  return {
    ...values,
    returnCoefficient: values.returnCoefficient / 100,
    materialSwitch:
      switchFromMaterial && switchToMaterial && switchAboveDiameterMm
        ? {
            fromMaterial: switchFromMaterial,
            toMaterial: switchToMaterial,
            aboveDiameterMm: switchAboveDiameterMm,
          }
        : null,
  };
}

/** Unconfigured projects start blank: baseline defaults are hints, never saved silently. */
export function toHydraulicsFormValues(
  details: ProjectParametersDetails,
): HydraulicsFormDefaults {
  const stored = details.configured ? details : undefined;
  return {
    initialPopulation: stored?.initialPopulation ?? null,
    finalPopulation: stored?.finalPopulation ?? null,
    returnCoefficient:
      stored?.returnCoefficient == null
        ? null
        : returnCoefficientToPercent(stored.returnCoefficient),
    perCapitaFlow: stored?.perCapitaFlow ?? null,
    infiltrationRate: stored?.infiltrationRate ?? null,
    peakDailyFactor: stored?.peakDailyFactor ?? null,
    peakHourlyFactor: stored?.peakHourlyFactor ?? null,
    manningCoefficient: stored?.manningCoefficient ?? null,
    defaultNetworkMaterial: stored?.defaultNetworkMaterial ?? null,
    justification: stored?.justification ?? null,
    switchFromMaterial: stored?.materialSwitch?.fromMaterial ?? null,
    switchToMaterial: stored?.materialSwitch?.toMaterial ?? null,
    switchAboveDiameterMm: stored?.materialSwitch?.aboveDiameterMm ?? null,
  };
}

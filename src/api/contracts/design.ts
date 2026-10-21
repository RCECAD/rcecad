import { z } from "zod";
import { projectStatusSchema, segmentResponseSchema } from "./spring";

const uuid = z.string().uuid();
const finite = z.number().finite();

export const pavementTypeSchema = z.enum([
  "SIDEWALK",
  "PAVED_STREET_WITH_CURB_AND_GUTTER",
  "UNPAVED_OR_UNDEFINED_GRADE",
]);
export const nodeFieldDataSchema = z.object({
  terrainElevation: finite.nullable(),
});
export const segmentFieldDataSchema = segmentResponseSchema
  .pick({
    elementType: true,
    receivesDryWeatherFlow: true,
    initialSingularContributionLps: true,
    finalSingularContributionLps: true,
    surfaceMaterial: true,
    surfaceCondition: true,
    pavementNotes: true,
  })
  .extend({
    pavementType: pavementTypeSchema.nullable(),
    pavementNotes: z.string().max(1000).nullable(),
  });

export const dxfPreviewSchema = z.object({
  fileName: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  segmentCount: z.number().int().nonnegative(),
  nodeCount: z.number().int().nonnegative(),
  layers: z.array(z.string()),
  outletCodes: z.array(z.string()),
  warnings: z.array(z.string()),
});

export const quantitySchema = z.object({
  key: z.string(),
  unit: z.string(),
  value: finite,
});
export const nonconformitySchema = z.object({
  ruleCode: z.string(),
  sourceId: z.string(),
  description: z.string(),
  severity: z.enum(["CRITICAL", "WARNING", "INFO"]),
  subject: z.string().nullable(),
  observedValue: z.string().nullable(),
  expectedLimit: z.string().nullable(),
  waiverJustification: z.string().nullable(),
});
const choiceSchema = z.object({
  diameterMm: z.number().int().positive(),
  slope: finite,
  material: z.string(),
  upstreamInvertM: finite,
});
const common = {
  segmentId: uuid,
  segmentCode: z.string(),
  rulesetVersionId: z.string(),
  justifications: z.array(z.string()),
};
export const segmentDesignSchema = z.discriminatedUnion("status", [
  z.object({
    ...common,
    status: z.literal("designed"),
    choice: choiceSchema,
    quantities: z.array(quantitySchema),
    nonconformities: z.array(nonconformitySchema),
  }),
  z.object({
    ...common,
    status: z.literal("conflicted"),
    conflicts: z.array(
      z.object({
        subject: z.string(),
        reason: z.string(),
        conflictingSources: z.array(z.string()),
      }),
    ),
  }),
  z.object({
    ...common,
    status: z.literal("infeasible"),
    attempts: z.array(
      z.object({
        choice: choiceSchema,
        quantities: z.array(quantitySchema),
        blocking: z.array(nonconformitySchema),
      }),
    ),
  }),
  z.object({
    ...common,
    status: z.literal("notEvaluated"),
    reason: z.string(),
    blockedBy: z.array(uuid),
    blockedByCodes: z.array(z.string()),
  }),
]);
export const networkDesignSchema = z.object({
  projectId: uuid,
  rulesetVersionId: z.string(),
  justifications: z.array(z.string()),
  nonconformities: z.array(nonconformitySchema),
  segments: z.array(segmentDesignSchema),
});
export const validationItemSchema = z.object({
  severity: z.enum(["CRITICAL", "ALERT", "INFO"]),
  category: z.enum(["REQUIRED_DATA", "TOPOLOGY", "CALCULATION"]),
  step: z.enum(["HYDRAULICS", "NETWORK", "CONTRIBUTIONS", "DESIGN"]),
  title: z.string(),
  message: z.string(),
  suggestedAction: z.string(),
  target: z.object({
    type: z.enum(["PROJECT", "SEGMENT", "NODE"]),
    id: uuid.nullable(),
    code: z.string().nullable(),
  }),
});
export const projectValidationSchema = z.object({
  readyToConclude: z.boolean(),
  summary: z.object({
    critical: z.number().int().nonnegative(),
    alert: z.number().int().nonnegative(),
    info: z.number().int().nonnegative(),
  }),
  items: z.array(validationItemSchema),
});
export const projectActionSchema = z.object({
  id: uuid,
  type: z.string(),
  occurredAt: z.string().datetime({ offset: true }),
  // Java UUID also accepts seeded identifiers without RFC version/variant bits.
  userId: z.guid(),
  detail: z.string().nullable(),
});
export const projectOverviewSchema = z.object({
  projectId: uuid,
  name: z.string(),
  status: projectStatusSchema,
  pendingItems: z.object({
    count: z.number().int().nonnegative(),
    items: z.array(validationItemSchema),
  }),
  recentActions: z.array(projectActionSchema),
});

export type NodeFieldData = z.infer<typeof nodeFieldDataSchema>;
export type SegmentFieldData = z.infer<typeof segmentFieldDataSchema>;
export type SegmentDesign = z.infer<typeof segmentDesignSchema>;
export type NetworkDesign = z.infer<typeof networkDesignSchema>;
export type ProjectValidation = z.infer<typeof projectValidationSchema>;
export type ValidationItem = z.infer<typeof validationItemSchema>;
export type Nonconformity = z.infer<typeof nonconformitySchema>;
export type DxfPreview = z.infer<typeof dxfPreviewSchema>;

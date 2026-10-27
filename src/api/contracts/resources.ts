import { z } from "zod";
import {
  adoptedParameterSchema,
  nonconformitySchema,
  validationItemSchema,
} from "./design";
import {
  hydraulicNodeResponseSchema,
  projectStatusSchema,
  segmentResponseSchema,
} from "./spring";

/** Spring endpoints added after the CDRE integration, checked at rcecad-back@a0a43b3. */

const uuid = z.string().uuid();
const instant = z.string().datetime({ offset: true });
const finite = z.number().finite();
const lps = finite.nonnegative();
const nullableText = z.string().nullable();

export const authenticatedUserSchema = z.object({
  id: uuid,
  email: z.string().email(),
  corporateName: nullableText,
  cnpj: z.string(),
  active: z.boolean(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  name: nullableText,
});

export const projectStatsSchema = z.object({
  pending: z.number().int().nonnegative(),
  inProgress: z.number().int().nonnegative(),
  validated: z.number().int().nonnegative(),
  exported: z.number().int().nonnegative(),
});

export const nodeTypeSchema = z.enum(["PV", "TIL", "TL", "CP"]);
export const nodeRequestSchema = z.object({
  code: z.string().trim().min(1).max(50),
  type: nodeTypeSchema,
  hasDropTube: z.boolean(),
  x: finite,
  y: finite,
  invertElevation: finite,
  terrainElevation: finite.nullable(),
  angle: finite.nullable(),
});
export const segmentRequestSchema = z.object({
  code: z.string().trim().min(1).max(50),
  upstreamNodeId: uuid,
  downstreamNodeId: uuid,
  upstreamInvert: finite,
  downstreamInvert: finite,
});

export const contributionTypeSchema = z.enum([
  "INDUSTRIAL",
  "COMMERCIAL",
  "INSTITUTIONAL",
  "OTHER",
]);
export const singularContributionRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    type: contributionTypeSchema,
    nodeId: uuid.nullable(),
    segmentId: uuid.nullable(),
    initialLps: lps,
    finalLps: lps,
  })
  .refine((value) => (value.nodeId === null) !== (value.segmentId === null), {
    message: "Informe exatamente um nó ou um trecho.",
    path: ["segmentId"],
  });
export const singularContributionSchema = z.object({
  id: uuid,
  name: z.string(),
  type: contributionTypeSchema,
  nodeId: uuid.nullable(),
  segmentId: uuid.nullable(),
  initialLps: lps,
  finalLps: lps,
  targetCode: z.string(),
});

const severitySchema = z.enum(["CRITICAL", "WARNING", "INFO"]);
export const nonconformityStatusSchema = z.enum([
  "OPEN",
  "ACCEPTED",
  "RESOLVED",
]);
export const trackedNonconformitySchema = z.object({
  id: uuid,
  segmentId: uuid.nullable(),
  segmentCode: nullableText,
  ruleCode: z.string(),
  sourceId: z.string(),
  description: z.string(),
  severity: severitySchema,
  subject: nullableText,
  observedValue: nullableText,
  expectedLimit: nullableText,
  waiverJustification: nullableText,
  status: nonconformityStatusSchema,
  justification: nullableText,
  revision: nullableText,
});
export const nonconformityDecisionRequestSchema = z
  .object({
    status: z.enum(["OPEN", "ACCEPTED"]),
    justification: z.string().trim().max(2000).nullable(),
  })
  .refine((value) => value.status === "OPEN" || Boolean(value.justification), {
    message: "Informe a justificativa para aceitar.",
    path: ["justification"],
  });
export const nonconformityDecisionSchema = z.object({
  id: uuid,
  fromStatus: nonconformityStatusSchema,
  toStatus: nonconformityStatusSchema,
  justification: nullableText,
  userId: z.guid(),
  occurredAt: instant,
});

export const waiverRequestSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("RULE"),
    segmentId: uuid,
    sourceId: z.string().trim().min(1).max(100),
    ruleCode: z.string().trim().min(1).max(100),
    downgradeTo: z.enum(["WARNING", "INFO"]),
    justification: z.string().trim().min(1).max(2000),
  }),
  z.object({
    type: z.literal("PARAMETER"),
    segmentId: uuid,
    parameter: z.enum(["DIAMETER", "SLOPE"]),
    value: finite.positive(),
    justification: z.string().trim().min(1).max(2000),
  }),
]);
export const waiverSchema = z.object({
  id: uuid,
  projectId: uuid,
  segmentId: uuid,
  segmentCode: z.string(),
  type: z.enum(["RULE", "PARAMETER"]),
  sourceId: nullableText,
  ruleCode: nullableText,
  downgradeTo: severitySchema.nullable(),
  parameter: z.enum(["DIAMETER", "SLOPE"]).nullable(),
  value: finite.nullable(),
  justification: z.string(),
  approvedBy: z.guid(),
  approvedAt: instant,
});

const memorialChoiceSchema = z.object({
  diameterMm: z.number().int().positive(),
  slope: finite,
  material: z.string(),
  upstreamInvertM: finite,
  diameterImposed: z.boolean(),
  upstreamDropM: finite,
});
const memorialQuantitySchema = z.object({
  key: z.string(),
  unit: z.string(),
  value: finite,
  formulaId: z.string(),
});
const boundSchema = z.object({
  value: z.unknown(),
  sourceIds: z.array(z.string()),
});
export const calculationMemorialSchema = z.object({
  identification: z.object({
    projectId: uuid.nullable(),
    name: z.string(),
    contractor: nullableText,
    technicalManager: nullableText,
    location: nullableText,
    revision: nullableText,
    horizon: nullableText,
  }),
  rulesetVersion: z.string(),
  generatedAt: instant,
  adoptedParameters: z.array(adoptedParameterSchema),
  formulas: z.array(
    z.object({
      id: z.string(),
      key: z.string(),
      sourceId: z.string(),
      expression: z.string(),
      reference: z.string(),
    }),
  ),
  segments: z.array(
    z.object({
      segmentId: uuid,
      code: z.string(),
      outcome: z.string(),
      choice: memorialChoiceSchema.nullable(),
      limits: z.array(
        z.object({
          key: z.string(),
          unit: z.string(),
          lowerBound: boundSchema.nullable(),
          upperBound: boundSchema.nullable(),
          allowedValues: z.array(z.unknown()).nullable(),
        }),
      ),
      quantities: z.array(memorialQuantitySchema),
      nonconformities: z.array(nonconformitySchema),
      justifications: z.array(z.string()),
      conflicts: z.array(
        z.object({
          subject: z.string(),
          reason: z.string(),
          conflictingSources: z.array(z.string()),
        }),
      ),
      attempts: z.array(
        z.object({
          choice: memorialChoiceSchema,
          quantities: z.array(memorialQuantitySchema),
          nonconformities: z.array(nonconformitySchema),
        }),
      ),
      reason: nullableText,
      blockedByCodes: z.array(z.string()),
    }),
  ),
  nonconformities: z.array(nonconformitySchema),
  justifications: z.array(z.string()),
  appliedContributions: z.array(
    z.object({
      id: uuid,
      name: z.string(),
      type: contributionTypeSchema,
      targetKind: z.string(),
      targetCode: z.string(),
      injectedSegmentCode: z.string(),
      initialLps: finite,
      finalLps: finite,
    }),
  ),
});

export const executiveSummarySchema = z.object({
  project: z.object({
    id: uuid.nullable(),
    name: z.string(),
    contractor: nullableText,
    technicalManager: nullableText,
    revision: nullableText,
    location: nullableText,
    status: projectStatusSchema,
  }),
  rulesetVersionId: z.string(),
  adoptedParameters: z.array(adoptedParameterSchema),
  network: z.object({
    segmentCount: z.number().int().nonnegative(),
    nodeCount: z.number().int().nonnegative(),
    totalLengthM: finite,
  }),
  outcomes: z.object({
    designed: z.number().int().nonnegative(),
    conflicted: z.number().int().nonnegative(),
    infeasible: z.number().int().nonnegative(),
    notEvaluated: z.number().int().nonnegative(),
    verified: z.number().int().nonnegative(),
  }),
  projectNonconformities: z.array(nonconformitySchema),
});

export const designSnapshotSchema = z.object({
  id: uuid,
  revision: nullableText,
  rulesetVersionId: z.string(),
  trigger: z.enum(["VALIDATION", "EXPORT"]),
  contentSha256: z.string(),
  createdAt: instant,
  createdBy: z.guid(),
  exportIds: z.array(uuid),
});
export const designSnapshotDetailSchema = designSnapshotSchema.extend({
  ...calculationMemorialSchema.shape,
  inputs: z
    .object({
      nodes: z.array(hydraulicNodeResponseSchema),
      segments: z.array(segmentResponseSchema),
      contributions: z.array(z.object({ id: uuid, name: z.string() })),
    })
    .nullable(),
});

export const projectExportSchema = z.object({
  id: uuid,
  projectId: uuid,
  format: z.enum(["XLSX", "PDF"]),
  fileName: z.string(),
  revision: nullableText,
  sizeBytes: z.number().int().nonnegative(),
  sha256: z.string(),
  userId: z.guid(),
  exportedAt: instant,
  snapshotId: uuid.nullable(),
});

export const exportBlockedItemsSchema = z.array(validationItemSchema);

export const exportDocuments = [
  "memorial",
  "spreadsheet",
  "technical-report",
  "longitudinal-profiles",
] as const;
export const exportDocumentSchema = z.enum(exportDocuments);

export type AuthenticatedUser = z.infer<typeof authenticatedUserSchema>;
export type ProjectStats = z.infer<typeof projectStatsSchema>;
export type NodeRequest = z.infer<typeof nodeRequestSchema>;
export type SegmentRequest = z.infer<typeof segmentRequestSchema>;
export type SingularContributionRequest = z.infer<
  typeof singularContributionRequestSchema
>;
export type SingularContribution = z.infer<typeof singularContributionSchema>;
export type TrackedNonconformity = z.infer<typeof trackedNonconformitySchema>;
export type NonconformityDecisionRequest = z.infer<
  typeof nonconformityDecisionRequestSchema
>;
export type NonconformityDecision = z.infer<typeof nonconformityDecisionSchema>;
export type WaiverRequest = z.infer<typeof waiverRequestSchema>;
export type Waiver = z.infer<typeof waiverSchema>;
export type CalculationMemorial = z.infer<typeof calculationMemorialSchema>;
export type ExecutiveSummary = z.infer<typeof executiveSummarySchema>;
export type DesignSnapshot = z.infer<typeof designSnapshotSchema>;
export type DesignSnapshotDetail = z.infer<typeof designSnapshotDetailSchema>;
export type ProjectExport = z.infer<typeof projectExportSchema>;
export type ExportDocument = z.infer<typeof exportDocumentSchema>;

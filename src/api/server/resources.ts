import "server-only";

import { z } from "zod";
import { projectActionSchema } from "@/api/contracts/design";
import {
  calculationMemorialSchema,
  designSnapshotDetailSchema,
  designSnapshotSchema,
  type ExportDocument,
  executiveSummarySchema,
  type NodeRequest,
  type NonconformityDecisionRequest,
  nodeRequestSchema,
  nonconformityDecisionRequestSchema,
  nonconformityDecisionSchema,
  nonconformityStatusSchema,
  projectExportSchema,
  type SegmentRequest,
  type SingularContributionRequest,
  segmentRequestSchema,
  singularContributionRequestSchema,
  singularContributionSchema,
  trackedNonconformitySchema,
  type WaiverRequest,
  waiverRequestSchema,
  waiverSchema,
} from "@/api/contracts/resources";
import {
  hydraulicNodeResponseSchema,
  normativeProfileSchema,
  segmentResponseSchema,
} from "@/api/contracts/spring";
import { springFileSchema, springRequestWithRefresh } from "./spring-client";

const child = (id: string, ...parts: string[]) =>
  ["/projects", id, ...parts]
    .map((part, index) => (index ? encodeURIComponent(part) : part))
    .join("/");
const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});
const noContent = z.null();

export const getNormativeProfile = () =>
  springRequestWithRefresh(
    "/normative-profile",
    {},
    { schema: normativeProfileSchema },
  );

export const listProjectActions = (id: string, limit: number) =>
  springRequestWithRefresh(
    `${child(id, "actions")}?limit=${limit}`,
    {},
    { schema: z.array(projectActionSchema) },
  );

export const createNode = (id: string, input: NodeRequest) =>
  springRequestWithRefresh(
    child(id, "nodes"),
    json("POST", nodeRequestSchema.parse(input)),
    { schema: hydraulicNodeResponseSchema },
  );
export const updateNode = (id: string, nodeId: string, input: NodeRequest) =>
  springRequestWithRefresh(
    child(id, "nodes", nodeId),
    json("PUT", nodeRequestSchema.parse(input)),
    { schema: hydraulicNodeResponseSchema },
  );
export const deleteNode = (id: string, nodeId: string) =>
  springRequestWithRefresh(
    child(id, "nodes", nodeId),
    { method: "DELETE" },
    { schema: noContent },
  );

export const createSegment = (id: string, input: SegmentRequest) =>
  springRequestWithRefresh(
    child(id, "segments"),
    json("POST", segmentRequestSchema.parse(input)),
    { schema: segmentResponseSchema },
  );
export const updateSegment = (
  id: string,
  segmentId: string,
  input: SegmentRequest,
) =>
  springRequestWithRefresh(
    child(id, "segments", segmentId),
    json("PUT", segmentRequestSchema.parse(input)),
    { schema: segmentResponseSchema },
  );
export const deleteSegment = (id: string, segmentId: string) =>
  springRequestWithRefresh(
    child(id, "segments", segmentId),
    { method: "DELETE" },
    { schema: noContent },
  );

export const listContributions = (id: string) =>
  springRequestWithRefresh(
    child(id, "singular-contributions"),
    {},
    { schema: z.array(singularContributionSchema) },
  );
export const createContribution = (
  id: string,
  input: SingularContributionRequest,
) =>
  springRequestWithRefresh(
    child(id, "singular-contributions"),
    json("POST", singularContributionRequestSchema.parse(input)),
    { schema: singularContributionSchema },
  );
export const updateContribution = (
  id: string,
  contributionId: string,
  input: SingularContributionRequest,
) =>
  springRequestWithRefresh(
    child(id, "singular-contributions", contributionId),
    json("PUT", singularContributionRequestSchema.parse(input)),
    { schema: singularContributionSchema },
  );
export const deleteContribution = (id: string, contributionId: string) =>
  springRequestWithRefresh(
    child(id, "singular-contributions", contributionId),
    { method: "DELETE" },
    { schema: noContent },
  );

export const listNonconformities = (id: string, status?: string) =>
  springRequestWithRefresh(
    status
      ? `${child(id, "nonconformities")}?status=${nonconformityStatusSchema.parse(status)}`
      : child(id, "nonconformities"),
    {},
    { schema: z.array(trackedNonconformitySchema) },
  );
export const decideNonconformity = (
  id: string,
  nonconformityId: string,
  input: NonconformityDecisionRequest,
) =>
  springRequestWithRefresh(
    child(id, "nonconformities", nonconformityId, "decision"),
    json("POST", nonconformityDecisionRequestSchema.parse(input)),
    { schema: trackedNonconformitySchema },
  );
export const getNonconformityHistory = (id: string, nonconformityId: string) =>
  springRequestWithRefresh(
    child(id, "nonconformities", nonconformityId, "history"),
    {},
    { schema: z.array(nonconformityDecisionSchema) },
  );

export const listWaivers = (id: string) =>
  springRequestWithRefresh(
    child(id, "waivers"),
    {},
    { schema: z.array(waiverSchema) },
  );
export const createWaiver = (id: string, input: WaiverRequest) =>
  springRequestWithRefresh(
    child(id, "waivers"),
    json("POST", waiverRequestSchema.parse(input)),
    { schema: waiverSchema },
  );
export const deleteWaiver = (id: string, waiverId: string) =>
  springRequestWithRefresh(
    child(id, "waivers", waiverId),
    { method: "DELETE" },
    { schema: noContent },
  );

export const getCalculationMemorial = (id: string) =>
  springRequestWithRefresh(
    child(id, "calculation-memorial"),
    {},
    { schema: calculationMemorialSchema },
  );
export const getExecutiveSummary = (id: string) =>
  springRequestWithRefresh(
    child(id, "executive-summary"),
    {},
    { schema: executiveSummarySchema },
  );

export const listDesignSnapshots = (id: string) =>
  springRequestWithRefresh(
    child(id, "design-snapshots"),
    {},
    { schema: z.array(designSnapshotSchema) },
  );
export const getDesignSnapshot = (id: string, snapshotId: string) =>
  springRequestWithRefresh(
    child(id, "design-snapshots", snapshotId),
    {},
    { schema: designSnapshotDetailSchema },
  );

export const listExports = (id: string) =>
  springRequestWithRefresh(
    child(id, "exports"),
    {},
    { schema: z.array(projectExportSchema) },
  );
export const exportDocument = (id: string, document: ExportDocument) =>
  springRequestWithRefresh(
    child(id, "exports", document),
    { method: "POST" },
    { schema: springFileSchema, binary: true, timeoutMs: 120_000 },
  );
export const exportOriginalDxf = (id: string) =>
  springRequestWithRefresh(
    child(id, "export-dxf"),
    {},
    { schema: springFileSchema, binary: true, timeoutMs: 120_000 },
  );

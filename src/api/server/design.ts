import "server-only";

import {
  dxfPreviewSchema,
  type NodeFieldData,
  networkDesignSchema,
  nodeFieldDataSchema,
  projectOverviewSchema,
  projectValidationSchema,
  type SegmentFieldData,
  segmentFieldDataSchema,
} from "@/api/contracts/design";
import {
  hydraulicNodeResponseSchema,
  projectDetailResponseSchema,
  segmentResponseSchema,
} from "@/api/contracts/spring";
import { springRequestWithRefresh } from "./spring-client";

const path = (id: string) => `/projects/${encodeURIComponent(id)}`;
export const getProjectNetwork = (id: string) =>
  springRequestWithRefresh(
    path(id),
    {},
    { schema: projectDetailResponseSchema },
  );
export const getProjectDesign = (id: string) =>
  springRequestWithRefresh(
    `${path(id)}/design`,
    {},
    { schema: networkDesignSchema },
  );
export const validateProject = (id: string) =>
  springRequestWithRefresh(
    `${path(id)}/validation`,
    {},
    { schema: projectValidationSchema },
  );
export const getProjectOverview = (id: string) =>
  springRequestWithRefresh(
    `${path(id)}/overview`,
    {},
    { schema: projectOverviewSchema },
  );
export const previewDxf = (body: Blob, contentType: string) =>
  springRequestWithRefresh(
    "/projects/dxf-preview",
    { method: "POST", headers: { "Content-Type": contentType }, body },
    { schema: dxfPreviewSchema, timeoutMs: 300_000 },
  );
export const updateNodeFieldData = (
  id: string,
  nodeId: string,
  input: NodeFieldData,
) =>
  springRequestWithRefresh(
    `${path(id)}/nodes/${encodeURIComponent(nodeId)}/field-data`,
    { method: "PUT", body: JSON.stringify(nodeFieldDataSchema.parse(input)) },
    { schema: hydraulicNodeResponseSchema },
  );
export const updateSegmentFieldData = (
  id: string,
  segmentId: string,
  input: SegmentFieldData,
) =>
  springRequestWithRefresh(
    `${path(id)}/segments/${encodeURIComponent(segmentId)}/field-data`,
    {
      method: "PUT",
      body: JSON.stringify(segmentFieldDataSchema.parse(input)),
    },
    { schema: segmentResponseSchema },
  );

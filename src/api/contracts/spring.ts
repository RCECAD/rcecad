import { z } from "zod";

/**
 * Spring HTTP contract verified against RCECAD/rcecad-back@2846eb4.
 *
 * Keep these schemas at the boundary: data from Spring is untrusted until it
 * passes one of them, and requests are validated before they leave Next.
 */

const uuidSchema = z.string().uuid();
const instantSchema = z.string().datetime({ offset: true });
const optionalTextSchema = z.string().nullable();

export const projectStatusSchema = z.enum([
  "pending",
  "inProgress",
  "validated",
  "exported",
]);

export const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.string().min(1),
  expiresIn: z.number().int().positive(),
  refreshToken: z.string().min(1),
  refreshExpiresIn: z.number().int().positive(),
});

export const registeredUserResponseSchema = z.object({
  id: uuidSchema,
  email: z.string().email(),
  cnpj: z.string().regex(/^\d{14}$/),
  corporateName: optionalTextSchema,
  roles: z.array(z.string()),
});

export const springErrorSchema = z.object({
  title: z.string().optional(),
  status: z.number().int().optional(),
  details: z.string().optional(),
  developerMessage: z.string().optional(),
  timestamp: z.string().optional(),
  fields: z.string().optional(),
  fieldsMessage: z.string().optional(),
});

export const projectSummaryResponseSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  contractor: optionalTextSchema,
  status: projectStatusSchema,
  location: optionalTextSchema,
  createdAt: instantSchema,
  totalSegments: z.number().int().nonnegative(),
});

export const projectResponseSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  contractor: optionalTextSchema,
  technicalManager: optionalTextSchema,
  location: optionalTextSchema,
  status: projectStatusSchema,
  owner: optionalTextSchema,
  cnpj: z.string().regex(/^\d{14}$/),
  createdAt: instantSchema,
  updatedAt: instantSchema,
});

export const hydraulicNodeResponseSchema = z.object({
  id: uuidSchema,
  projectId: uuidSchema,
  code: z.string().min(1),
  type: z.string().min(1),
  x: z.number().finite(),
  y: z.number().finite(),
  invertElevation: z.number().finite(),
  terrainElevation: z.number().finite().nullable(),
  angle: z.number().finite().nullable(),
});

export const segmentResponseSchema = z.object({
  id: uuidSchema,
  projectId: uuidSchema,
  code: z.string().min(1),
  upstreamNodeId: uuidSchema,
  downstreamNodeId: uuidSchema,
  length: z.number().finite(),
  slope: z.number().finite(),
  upstreamInvert: z.number().finite(),
  downstreamInvert: z.number().finite(),
  pavementType: optionalTextSchema,
  diameter: z.number().finite().nullable(),
  material: optionalTextSchema,
  manning: z.number().finite().nullable(),
});

export const projectDetailResponseSchema = z.object({
  project: projectResponseSchema,
  nodes: z.array(hydraulicNodeResponseSchema),
  segments: z.array(segmentResponseSchema),
});

export function pageResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    content: z.array(itemSchema),
    page: z.number().int().nonnegative(),
    size: z.number().int().positive(),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  });
}

export const projectPageResponseSchema = pageResponseSchema(
  projectSummaryResponseSchema,
);

export const projectParametersSchema = z.object({
  initialPopulation: z.number().int().nonnegative(),
  finalPopulation: z.number().int().nonnegative(),
  returnCoefficient: z.number().positive(),
  perCapitaFlow: z.number().positive(),
  infiltrationRate: z.number().nonnegative(),
  peakDailyFactor: z.number().positive(),
  peakHourlyFactor: z.number().positive(),
  manningCoefficient: z.number().positive(),
});

const optionalRequestTextSchema = z.string().trim().max(200).nullable();

export const createProjectRequestSchema = z.object({
  name: z.string().trim().min(1).max(200),
  contractor: optionalRequestTextSchema,
  technicalManager: optionalRequestTextSchema,
  location: optionalRequestTextSchema,
});

export const updateProjectRequestSchema = createProjectRequestSchema.extend({
  status: projectStatusSchema,
});

export const importDxfRequestSchema = z.object({
  name: z.string().trim().min(1).max(200),
  dxf: z.string().trim().min(1),
});

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export const projectListQuerySchema = z.object({
  page: z.number().int().nonnegative().default(0),
  size: z.number().int().min(1).max(100).default(20),
  status: projectStatusSchema.optional(),
  search: z.string().trim().min(1).optional(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type RegisteredUserResponse = z.infer<
  typeof registeredUserResponseSchema
>;
export type SpringError = z.infer<typeof springErrorSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type ProjectSummaryResponse = z.infer<
  typeof projectSummaryResponseSchema
>;
export type ProjectResponse = z.infer<typeof projectResponseSchema>;
export type ProjectDetailResponse = z.infer<typeof projectDetailResponseSchema>;
export type ProjectPageResponse = z.infer<typeof projectPageResponseSchema>;
export type ProjectParameters = z.infer<typeof projectParametersSchema>;
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;
export type UpdateProjectRequest = z.infer<typeof updateProjectRequestSchema>;
export type ImportDxfRequest = z.infer<typeof importDxfRequestSchema>;
export type ProjectListQuery = z.infer<typeof projectListQuerySchema>;

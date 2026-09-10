import type { z } from "zod";
import { projectParametersSchema } from "@/api/contracts/spring";

/** Parameters accepted by PUT /api/projects/{id}/parameters. */
export const hydraulicsSchema = projectParametersSchema;

export type HydraulicsFormValues = z.infer<typeof hydraulicsSchema>;

import {
  type NetworkDesign,
  networkDesignSchema,
} from "@/api/contracts/design";
import type { CalculationMemorial } from "@/api/contracts/resources";

const statuses: Record<string, string> = {
  DESIGNED: "designed",
  VERIFIED: "verified",
  CONFLICTED: "conflicted",
  INFEASIBLE: "infeasible",
  NOT_EVALUATED: "notEvaluated",
};

/** Reads a stored memorial (calculation-memorial or a design snapshot) with the /design shape. */
export function memorialToDesign(
  memorial: CalculationMemorial,
  projectId: string,
): NetworkDesign {
  const ids = new Map(memorial.segments.map((s) => [s.code, s.segmentId]));
  return networkDesignSchema.parse({
    projectId,
    rulesetVersionId: memorial.rulesetVersion,
    justifications: memorial.justifications,
    adoptedParameters: memorial.adoptedParameters,
    nonconformities: memorial.nonconformities,
    segments: memorial.segments.map((segment) => ({
      status: statuses[segment.outcome] ?? segment.outcome,
      segmentId: segment.segmentId,
      segmentCode: segment.code,
      rulesetVersionId: memorial.rulesetVersion,
      justifications: segment.justifications,
      choice: segment.choice,
      quantities: segment.quantities,
      nonconformities: segment.nonconformities,
      conflicts: segment.conflicts,
      attempts: segment.attempts.map((attempt) => ({
        choice: attempt.choice,
        quantities: attempt.quantities,
        blocking: attempt.nonconformities,
      })),
      reason: segment.reason ?? "",
      blockedBy: segment.blockedByCodes.flatMap((code) => ids.get(code) ?? []),
      blockedByCodes: segment.blockedByCodes,
    })),
  });
}

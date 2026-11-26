import { describe, expect, it } from "vitest";
import type { ValidationItem } from "@/api/contracts/design";
import type { TrackedNonconformity } from "@/api/contracts/resources";
import { overviewAlerts } from "./overview-alerts";

const projectId = "11111111-1111-4111-8111-111111111111";
const segmentId = "22222222-2222-4222-8222-222222222222";
const nonconformityId = "33333333-3333-4333-8333-333333333333";

const pending: ValidationItem = {
  severity: "CRITICAL",
  category: "REQUIRED_DATA",
  step: "CONTRIBUTIONS",
  title: "Missing dry-weather discharge answer",
  message:
    "Segment T-01 does not say whether it receives a dry-weather discharge.",
  suggestedAction:
    "Answer whether the segment receives a dry-weather discharge.",
  target: { type: "SEGMENT", id: segmentId, code: "T-01" },
  finding: null,
};

const warning: TrackedNonconformity = {
  id: nonconformityId,
  segmentId,
  segmentCode: "T-02",
  ruleCode: "VELOCITY_ABOVE_MAXIMUM",
  sourceId: "nbr-9649",
  description: "Velocity above maximum",
  severity: "WARNING",
  subject: "finalVelocity",
  observedValue: "5.2",
  expectedLimit: "<= 5.0",
  waiverJustification: null,
  status: "OPEN",
  justification: null,
  revision: null,
};

describe("overviewAlerts", () => {
  it("merges pending data with open nonconformities, critical first", () => {
    const alerts = overviewAlerts(projectId, [pending], [warning]);

    expect(alerts.map((alert) => alert.severity)).toEqual([
      "CRITICAL",
      "ALERT",
    ]);
    expect(alerts[0]).toMatchObject({
      title: "Contribuição de tempo seco não informada",
      target: "Trecho T-01",
      actionLabel: "Ir para correção",
    });
    expect(alerts[0].href).toContain(`/project/${projectId}/sizing`);
    expect(alerts[1]).toMatchObject({
      target: "Trecho T-02",
      href: `/project/${projectId}/validation#nonconformity-${nonconformityId}`,
      actionLabel: "Ver na validação",
    });
  });

  it("orders by severity regardless of source", () => {
    const [first] = overviewAlerts(
      projectId,
      [{ ...pending, severity: "INFO" }],
      [{ ...warning, severity: "CRITICAL" }],
    );

    expect(first.key).toBe(`nonconformity-${nonconformityId}`);
  });
});

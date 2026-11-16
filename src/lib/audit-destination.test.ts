// @vitest-environment node

import { describe, expect, it } from "vitest";
import type { ProjectAuditItem } from "@/api/contracts/design";
import { auditDestination } from "./audit-destination";

const base: ProjectAuditItem = {
  id: "6a3f7f43-8f6c-4d49-9e0a-2e4c6f1b0b01",
  type: "NETWORK_EDITED",
  occurredAt: "2026-10-21T16:02:17Z",
  userId: "6a3f7f43-8f6c-4d49-9e0a-2e4c6f1b0a01",
  detail: null,
  entityType: "SEGMENT",
  entityId: "6a3f7f43-8f6c-4d49-9e0a-2e4c6f1b0b01",
  operation: "UPDATE",
  area: "PAVING",
  summary: "Pavimentação atualizada",
  entityLabel: "T-01",
  actorLabel: "Ana",
  changes: [],
};

describe("auditDestination", () => {
  it("targets an existing segment in the matching project step", () => {
    expect(auditDestination("project-1", base)).toEqual({
      href: `/project/project-1/paving#segment-${base.entityId}`,
      label: "Ver trecho na pavimentação",
    });
  });

  it("targets a recorded design snapshot in results", () => {
    const item = {
      ...base,
      area: "RESULTS" as const,
      entityType: "DESIGN_SNAPSHOT" as const,
      operation: "CALCULATE" as const,
    };
    expect(auditDestination("project-1", item)).toEqual({
      href: `/project/project-1/results?snapshot=${item.entityId}#snapshot-${item.entityId}`,
      label: "Ver registro nos resultados",
    });
  });

  it("does not link to an element that was deleted", () => {
    expect(
      auditDestination("project-1", { ...base, operation: "DELETE" }),
    ).toBeNull();
  });
});

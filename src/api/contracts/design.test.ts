import { describe, expect, it } from "vitest";
import { projectOverviewSchema } from "./design";

const overview = {
  projectId: "68d5efb4-823a-41d9-b5f5-20fc24877961",
  name: "Projeto didático",
  status: "validated",
  pendingItems: { count: 0, items: [] },
  recentActions: [
    {
      id: "ea61de9d-7a8f-4252-be7e-99775a05addc",
      type: "PARAMETERS_UPDATED",
      occurredAt: "2026-10-21T16:02:17.404859Z",
      userId: "11111111-1111-1111-1111-111111111111",
      detail: null,
    },
  ],
};

describe("project overview contract", () => {
  it("accepts the backend seeded administrator UUID in action history", () => {
    expect(projectOverviewSchema.parse(overview)).toEqual(overview);
  });

  it("still rejects malformed action author identifiers", () => {
    expect(
      projectOverviewSchema.safeParse({
        ...overview,
        recentActions: [{ ...overview.recentActions[0], userId: "invalid" }],
      }).success,
    ).toBe(false);
  });
});
